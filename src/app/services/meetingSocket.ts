/**
 * 회의 실시간 통신 WebSocket 클래스
 *
 * 처리 흐름
 * 1. WebSocket 연결
 * 2. join 메시지 전송
 * 3. startMicrophone() 호출
 * 4. 브라우저 마이크 입력 획득
 * 5. Float32 오디오를 16kHz PCM16으로 변환
 * 6. WebSocket binary 메시지로 서버 전송
 * 7. 서버에서 transcript 또는 caption 메시지 수신
 */

import { ENV } from "../config/env";
import { CAPTIONS, ACTIVE_SPEAKERS } from "../data/transcripts";
import { PARTICIPANTS } from "../data/participants";

import type {
  ChatMessage,
  Language,
  Participant,
  TranscriptEntry,
  WSOutgoingMessage,
} from "../types";

export interface MeetingSocketHandlers {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event | Error) => void;

  onCaption?: (entry: TranscriptEntry) => void;
  onTranslationUpdate?: (payload: {
    id: string;
    translated: string;
    translations?: Partial<Record<Language, string>>;
  }) => void;
  onSpeakerChange?: (speakerIdx: number) => void;
  onParticipants?: (participants: Participant[]) => void;
  onChatMessage?: (message: ChatMessage) => void;
  onMeetingEnded?: () => void;

  onMicrophoneStarted?: () => void;
  onMicrophoneStopped?: () => void;
}

interface IncomingWebSocketMessage {
  type: string;
  payload?: unknown;
}

type AudioControlMessage =
  | {
      type: "start_transcription";
      payload: {
        language: Language;
        sampleRate: number;
        format: "pcm_s16le";
        channels: 1;
      };
    }
  | {
      type: "stop_transcription";
    };

type ClientMessage = WSOutgoingMessage | AudioControlMessage;

interface TranscriptPayload {
  id?: string;
  text?: string;
  original?: string;
  translated?: string | null;
  translated_text?: string | null;
  translations?: Partial<Record<Language, string>>;
  language?: Language;
  created_at?: string;
  speaker_id?: string;
  speaker_idx?: number;
  speakerIdx?: number;
  username?: string;
  is_final?: boolean;
}

function toAppLanguage(language?: string | null): Language | undefined {
  if (!language) {
    return undefined;
  }

  if (language === "zh-Hans" || language === "zh-CN") {
    return "zh";
  }

  if (
    language === "ko" ||
    language === "en" ||
    language === "ja" ||
    language === "zh"
  ) {
    return language;
  }

  if (language.startsWith("ko")) {
    return "ko";
  }

  if (language.startsWith("en")) {
    return "en";
  }

  if (language.startsWith("ja")) {
    return "ja";
  }

  if (language.startsWith("zh")) {
    return "zh";
  }

  return undefined;
}

const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_ATTEMPTS = 5;
const MOCK_TICK_MS = 4200;

/**
 * Azure Speech에서 일반적으로 사용하는 입력 샘플레이트입니다.
 */
const TARGET_SAMPLE_RATE = 16000;

/**
 * ScriptProcessorNode 버퍼 크기입니다.
 *
 * 4096이면 48kHz 환경 기준 약 85ms 단위로 콜백됩니다.
 */
const AUDIO_BUFFER_SIZE = 4096;

export class MeetingSocket {
  private ws: WebSocket | null = null;

  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private manuallyClosed = false;

  private mockTimer: ReturnType<typeof setInterval> | null = null;
  private mockIdx = 0;
  private audioChunkCount = 0;
  private mockSpeakerCycle = 0;

  /*
   * 마이크 및 오디오 처리 객체
   */
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private silentGainNode: GainNode | null = null;

  private microphoneStarted = false;
  private transcriptionStarted = false;

  constructor(
    private readonly sessionId: string,
    private readonly username: string,
    private readonly language: Language,
    private readonly handlers: MeetingSocketHandlers,
  ) {}

  /**
   * WebSocket 연결 시작
   */
  connect(): void {
    this.manuallyClosed = false;

    if (ENV.useMock) {
      this.connectMock();
      return;
    }

    if (
      this.ws?.readyState === WebSocket.OPEN ||
      this.ws?.readyState === WebSocket.CONNECTING
    ) {
      console.warn(
        "[MeetingSocket] WebSocket이 이미 연결 중이거나 연결되어 있습니다.",
      );
      return;
    }

    const baseUrl = ENV.wsBaseUrl
      .replace(/\/+$/, "")
      .replace(/\/ws$/, "");

    const query = new URLSearchParams({
      username: this.username,
      language: this.language,
    });

    const url =
      `${baseUrl}/ws/${encodeURIComponent(this.sessionId)}` +
      `?${query.toString()}`;

    console.log("[MeetingSocket] 연결 시도:", url);

    try {
      this.ws = new WebSocket(url);

      /*
       * 서버에서 바이너리 메시지를 돌려줄 경우 ArrayBuffer로 받습니다.
       * 현재 자막 메시지는 JSON 문자열로 처리합니다.
       */
      this.ws.binaryType = "arraybuffer";

      this.registerWebSocketHandlers();
    } catch (error) {
      const normalizedError =
        error instanceof Error
          ? error
          : new Error("WebSocket 생성 중 오류가 발생했습니다.");

      console.error("[MeetingSocket] 연결 생성 실패:", normalizedError);

      this.handlers.onError?.(normalizedError);
      this.scheduleReconnect();
    }
  }

  /**
   * WebSocket 이벤트 등록
   */
  private registerWebSocketHandlers(): void {
    if (!this.ws) {
      return;
    }

    this.ws.onopen = () => {
      console.log("[MeetingSocket] 연결 성공");

      this.reconnectAttempts = 0;
      this.clearReconnectTimer();

      this.sendJson({
        type: "join",
        payload: {
          username: this.username,
          language: this.language,
        },
      });

      this.handlers.onOpen?.();
    };

    this.ws.onmessage = (event: MessageEvent) => {
      this.processMessage(event.data);
    };

    this.ws.onerror = (event: Event) => {
      console.error("[MeetingSocket] 오류 발생:", event);
      this.handlers.onError?.(event);
    };

    this.ws.onclose = (event: CloseEvent) => {
      console.log("[MeetingSocket] 연결 종료", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });

      this.ws = null;
      this.transcriptionStarted = false;

      /*
       * 연결이 끊겼는데 오디오 처리가 계속되는 것을 방지합니다.
       */
      void this.stopMicrophoneResources();

      this.handlers.onClose?.();

      if (!this.manuallyClosed) {
        this.scheduleReconnect();
      }
    };
  }

  /**
   * 서버 메시지 처리
   */
  private processMessage(rawData: unknown): void {
    if (typeof rawData === "string") {
      this.processJsonMessage(rawData);
      return;
    }

    if (rawData instanceof ArrayBuffer) {
      console.log(
        "[MeetingSocket] 서버 바이너리 메시지 수신:",
        rawData.byteLength,
        "bytes",
      );
      return;
    }

    if (rawData instanceof Blob) {
      console.log(
        "[MeetingSocket] 서버 Blob 메시지 수신:",
        rawData.size,
        "bytes",
      );
      return;
    }

    console.warn(
      "[MeetingSocket] 지원하지 않는 메시지 형식:",
      rawData,
    );
  }

  /**
   * JSON 메시지 파싱
   */
  private processJsonMessage(rawData: string): void {
    try {
      const message = JSON.parse(
        rawData,
      ) as IncomingWebSocketMessage;

      this.handleIncoming(message);
    } catch (error) {
      const normalizedError =
        error instanceof Error
          ? error
          : new Error("WebSocket 메시지 파싱에 실패했습니다.");

      console.error(
        "[MeetingSocket] 메시지 파싱 실패:",
        normalizedError,
        rawData,
      );

      this.handlers.onError?.(normalizedError);
    }
  }

  /**
   * 메시지 타입별 처리
   */
  private handleIncoming(
    message: IncomingWebSocketMessage,
  ): void {
    console.log("[MeetingSocket] 메시지 수신:", message);

    switch (message.type) {
      case "caption": {
        this.handleCaptionMessage(message.payload);
        break;
      }

      case "transcript": {
        this.handleTranscriptMessage(message.payload);
        break;
      }

      case "translation_update": {
        this.handleTranslationUpdate(message.payload);
        break;
      }

      case "partial_transcript":
      case "interim_transcript":
      case "recognizing": {
        this.handleTranscriptMessage(message.payload, false);
        break;
      }

      case "final_transcript":
      case "recognized": {
        this.handleTranscriptMessage(message.payload, true);
        break;
      }

      case "speaker_change": {
        const payload = message.payload as
          | {
              speakerIdx?: number;
              speaker_idx?: number;
            }
          | undefined;

        const speakerIdx =
          payload?.speakerIdx ??
          payload?.speaker_idx;

        if (typeof speakerIdx !== "number") {
          console.warn(
            "[MeetingSocket] 잘못된 speaker_change 메시지:",
            message,
          );
          return;
        }

        this.handlers.onSpeakerChange?.(speakerIdx);
        break;
      }

      case "participants": {
        if (!Array.isArray(message.payload)) {
          console.warn(
            "[MeetingSocket] 잘못된 participants 메시지:",
            message,
          );
          return;
        }

        this.handlers.onParticipants?.(
          message.payload as Participant[],
        );
        break;
      }

      case "chat_message": {
        if (!message.payload) {
          console.warn(
            "[MeetingSocket] chat_message payload가 없습니다.",
          );
          return;
        }

        this.handlers.onChatMessage?.(
          message.payload as ChatMessage,
        );
        break;
      }

      case "meeting_ended": {
        this.handlers.onMeetingEnded?.();
        break;
      }

      case "connected": {
        console.log(
          "[MeetingSocket] 서버 연결 확인:",
          message.payload,
        );
        break;
      }

      case "joined": {
        console.log(
          "[MeetingSocket] 회의 참여 확인:",
          message.payload,
        );
        break;
      }

      case "transcription_started": {
        this.transcriptionStarted = true;

        console.log(
          "[MeetingSocket] 서버 음성 인식 시작 확인:",
          message.payload,
        );
        break;
      }

      case "transcription_stopped": {
        this.transcriptionStarted = false;

        console.log(
          "[MeetingSocket] 서버 음성 인식 종료 확인:",
          message.payload,
        );
        break;
      }

      case "error": {
        const errorMessage = this.getServerErrorMessage(
          message.payload,
        );

        const error = new Error(errorMessage);

        console.error("[MeetingSocket] 서버 오류:", error);
        this.handlers.onError?.(error);
        break;
      }

      default: {
        console.warn(
          "[MeetingSocket] 알 수 없는 메시지 타입:",
          message,
        );
      }
    }
  }

  /**
   * caption 메시지 처리
   */
  private handleCaptionMessage(payload: unknown): void {
    if (!payload) {
      console.warn(
        "[MeetingSocket] caption payload가 없습니다.",
      );
      return;
    }

    const caption = payload as Partial<TranscriptEntry>;

    /*
     * 서버 payload가 이미 TranscriptEntry 구조라면 그대로 사용합니다.
     */
    if (
      typeof caption.id === "string" &&
      typeof caption.original === "string" &&
      caption.translations
    ) {
      this.handlers.onCaption?.(
        caption as TranscriptEntry,
      );
      return;
    }

    /*
     * transcript 형식으로 전달될 가능성도 처리합니다.
     */
    this.handleTranscriptMessage(payload);
  }

  /**
   * transcript 메시지를 프론트 TranscriptEntry로 변환
   */
  private handleTranscriptMessage(
  rawPayload: unknown,
  forceFinal?: boolean,
): void {
  const payload = rawPayload as
    | TranscriptPayload
    | string
    | undefined;

  if (typeof payload === "string") {
    const entry = this.createTranscriptEntry({
      text: payload,
      is_final: forceFinal,
    });

    this.handlers.onCaption?.(entry);
    return;
  }

  // 반드시 추가
  if (!payload) {
    console.warn(
      "[MeetingSocket] transcript payload가 없습니다.",
      rawPayload,
    );
    return;
  }

  const text =
    payload.text ??
    payload.original;

  if (!text?.trim()) {
    console.warn(
      "[MeetingSocket] 잘못된 transcript 메시지:",
      rawPayload,
    );
    return;
  }

  const entry = this.createTranscriptEntry({
    ...payload,
    text,
    is_final: forceFinal ?? payload.is_final,
  });

  const speakerIdx =
    payload.speakerIdx ??
    payload.speaker_idx;

  if (typeof speakerIdx === "number") {
    this.handlers.onSpeakerChange?.(speakerIdx);
  }

  this.handlers.onCaption?.(entry);
}


  /**
   * 서버 transcript payload를 TranscriptEntry로 변환
   */
  private createTranscriptEntry(
    payload: TranscriptPayload,
  ): TranscriptEntry {
    const text =
      payload.text ??
      payload.original ??
      "";

    const translatedText =
      payload.translated_text?.trim() ||
      payload.translated?.trim() ||
      "";

    const translations: Record<Language, string> = {
      ko: payload.translations?.ko ?? translatedText,
      en: payload.translations?.en ?? "",
      ja: payload.translations?.ja ?? "",
      zh:
        payload.translations?.zh ??
        (payload.translations as Record<string, string | undefined> | undefined)?.[
          "zh-Hans"
        ] ??
        "",
    };

    return {
      id:
        payload.id ??
        payload.created_at ??
        `transcript-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      speakerIdx:
        payload.speakerIdx ??
        payload.speaker_idx ??
        0,

      ts: payload.created_at
        ? this.formatTimestamp(payload.created_at)
        : new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          }),

      original: text,
      originalLanguage: toAppLanguage(payload.language),
      translations,
      isFinal: payload.is_final,
    };
  }

  private handleTranslationUpdate(payload: unknown): void {
    const data = payload as
      | {
          id?: unknown;
          translated?: unknown;
          translated_text?: unknown;
          translations?: unknown;
        }
      | undefined;

    if (!data || typeof data.id !== "string") {
      console.warn(
        "[MeetingSocket] 잘못된 translation_update 메시지:",
        payload,
      );
      return;
    }

    const translated =
      typeof data.translated === "string"
        ? data.translated
        : typeof data.translated_text === "string"
          ? data.translated_text
          : "";
    const rawTranslations =
      data.translations &&
      typeof data.translations === "object"
        ? (data.translations as Record<string, unknown>)
        : undefined;

    const translations: Partial<Record<Language, string>> = {};

    if (typeof rawTranslations?.ko === "string") {
      translations.ko = rawTranslations.ko;
    }

    if (typeof rawTranslations?.en === "string") {
      translations.en = rawTranslations.en;
    }

    if (typeof rawTranslations?.ja === "string") {
      translations.ja = rawTranslations.ja;
    }

    if (typeof rawTranslations?.zh === "string") {
      translations.zh = rawTranslations.zh;
    } else if (typeof rawTranslations?.["zh-Hans"] === "string") {
      translations.zh = rawTranslations["zh-Hans"];
    }

    this.handlers.onTranslationUpdate?.({
      id: data.id,
      translated,
      translations,
    });
  }

  /**
   * 서버 오류 payload 처리
   */
  private getServerErrorMessage(payload: unknown): string {
    if (typeof payload === "string") {
      return payload;
    }

    if (
      payload &&
      typeof payload === "object"
    ) {
      const record = payload as Record<string, unknown>;

      if (typeof record.message === "string") {
        return record.message;
      }

      if (typeof record.detail === "string") {
        return record.detail;
      }
    }

    return "서버에서 WebSocket 오류를 전달했습니다.";
  }

  /**
   * JSON 메시지 전송
   */
  send(message: WSOutgoingMessage): boolean {
    return this.sendJson(message);
  }

  private sendJson(message: ClientMessage): boolean {
    if (ENV.useMock) {
      return true;
    }

    if (
      !this.ws ||
      this.ws.readyState !== WebSocket.OPEN
    ) {
      console.warn(
        "[MeetingSocket] 연결되지 않아 메시지를 보내지 못했습니다.",
        message,
      );

      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));

      console.log(
        "[MeetingSocket] JSON 메시지 전송:",
        message,
      );

      return true;
    } catch (error) {
      const normalizedError =
        error instanceof Error
          ? error
          : new Error("WebSocket 메시지 전송에 실패했습니다.");

      console.error(
        "[MeetingSocket] 메시지 전송 실패:",
        normalizedError,
      );

      this.handlers.onError?.(normalizedError);
      return false;
    }
  }

  /**
   * 오디오 바이너리 전송
   */
  private sendAudioBuffer(buffer: Int16Array): boolean {
  if (ENV.useMock) {
    return true;
  }

  if (
    !this.ws ||
    this.ws.readyState !== WebSocket.OPEN
  ) {
    console.warn(
      "[MeetingSocket] 오디오 전송 실패: WebSocket 연결 안 됨",
    );
    return false;
  }


  try {
    const audioBuffer = new ArrayBuffer(buffer.byteLength);

    new Uint8Array(audioBuffer).set(
      new Uint8Array(
        buffer.buffer,
        buffer.byteOffset,
        buffer.byteLength,
      ),
    );

    this.ws.send(audioBuffer);

    this.audioChunkCount += 1;
    if (this.audioChunkCount % 20 === 0) {
      console.log(
        "[MeetingSocket] 오디오 전송 중",
        {
          chunkCount: this.audioChunkCount,
          bytes: audioBuffer.byteLength,
        },
      );
    }
    return true;
  } catch (error) {
    const normalizedError =
      error instanceof Error
        ? error
        : new Error("오디오 전송에 실패했습니다.");

    console.error(
      "[MeetingSocket] 오디오 전송 실패:",
      normalizedError,
    );

    this.handlers.onError?.(normalizedError);
    return false;
  }
}

  /**
   * 마이크와 음성 인식 시작
   *
   * 반드시 사용자 클릭 이벤트 안에서 호출하는 것이 안전합니다.
   * 예: 마이크 버튼 클릭
   */
  async startMicrophone(): Promise<boolean> {
    if (ENV.useMock) {
      this.microphoneStarted = true;
      this.handlers.onMicrophoneStarted?.();
      return true;
    }

    if (this.microphoneStarted) {
      console.warn(
        "[MeetingSocket] 마이크가 이미 시작되어 있습니다.",
      );
      return true;
    }

    if (!this.isConnected()) {
      const error = new Error(
        "WebSocket 연결 전에는 마이크를 시작할 수 없습니다.",
      );

      console.error("[MeetingSocket]", error.message);
      this.handlers.onError?.(error);
      return false;
    }

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      const error = new Error(
        "현재 브라우저에서는 마이크 입력을 지원하지 않습니다.",
      );

      this.handlers.onError?.(error);
      return false;
    }

    try {
      console.log("[MeetingSocket] 마이크 권한 요청");

      this.mediaStream =
        await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });

      const audioTracks =
        this.mediaStream.getAudioTracks();

      if (audioTracks.length === 0) {
        throw new Error(
          "사용 가능한 마이크 트랙이 없습니다.",
        );
      }

      console.log("[MeetingSocket] 마이크 권한 획득", {
        label: audioTracks[0].label,
        enabled: audioTracks[0].enabled,
        readyState: audioTracks[0].readyState,
      });

      const AudioContextClass =
        window.AudioContext ??
        (
          window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;

      if (!AudioContextClass) {
        throw new Error(
          "현재 브라우저에서는 AudioContext를 지원하지 않습니다.",
        );
      }

      this.audioContext = new AudioContextClass();

      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      const sourceSampleRate =
        this.audioContext.sampleRate;

      console.log("[MeetingSocket] 오디오 컨텍스트 생성", {
        sourceSampleRate,
        targetSampleRate: TARGET_SAMPLE_RATE,
      });

      this.mediaStreamSource =
        this.audioContext.createMediaStreamSource(
          this.mediaStream,
        );

      /*
       * ScriptProcessorNode는 deprecated 상태지만 별도의
       * AudioWorklet 파일 없이 바로 적용할 수 있어 사용합니다.
       */
      this.processorNode =
        this.audioContext.createScriptProcessor(
          AUDIO_BUFFER_SIZE,
          1,
          1,
        );

      /*
       * processor를 destination에 연결하지 않으면 일부 브라우저에서
       * onaudioprocess가 실행되지 않습니다.
       *
       * 실제 소리는 들리지 않도록 gain을 0으로 설정합니다.
       */
      this.silentGainNode =
        this.audioContext.createGain();

      this.silentGainNode.gain.value = 0;

      this.processorNode.onaudioprocess = (
        event: AudioProcessingEvent,
      ) => {
        if (
          !this.microphoneStarted ||
          !this.isConnected()
        ) {
          return;
        }

        const inputData =
          event.inputBuffer.getChannelData(0);

        const downsampled =
          this.downsampleBuffer(
            inputData,
            sourceSampleRate,
            TARGET_SAMPLE_RATE,
          );

        const pcm16 =
          this.float32ToPcm16(downsampled);

        this.sendAudioBuffer(pcm16);
      };

      this.mediaStreamSource.connect(
        this.processorNode,
      );

      this.processorNode.connect(
        this.silentGainNode,
      );

      this.silentGainNode.connect(
        this.audioContext.destination,
      );

      /*
       * 오디오 콜백에서 전송할 수 있도록 먼저 true로 변경합니다.
       */
      this.microphoneStarted = true;

      const startMessageSent = this.sendJson({
        type: "start_transcription",
        payload: {
          language: this.language,
          sampleRate: TARGET_SAMPLE_RATE,
          format: "pcm_s16le",
          channels: 1,
        },
      });

      if (!startMessageSent) {
        throw new Error(
          "음성 인식 시작 메시지를 보내지 못했습니다.",
        );
      }

      this.transcriptionStarted = true;

      this.sendJson({
        type: "toggle_mic",
        payload: {
          on: true,
        },
      });

      console.log(
        "[MeetingSocket] 마이크 및 자막 기능 시작",
      );

      this.handlers.onMicrophoneStarted?.();

      return true;
    } catch (error) {
      const normalizedError =
        error instanceof Error
          ? error
          : new Error(
              "마이크를 시작하는 중 오류가 발생했습니다.",
            );

      console.error(
        "[MeetingSocket] 마이크 시작 실패:",
        normalizedError,
      );

      await this.stopMicrophoneResources();

      this.handlers.onError?.(normalizedError);
      return false;
    }
  }

  /**
   * 마이크와 음성 인식 종료
   */
  async stopMicrophone(): Promise<boolean> {
    if (ENV.useMock) {
      this.microphoneStarted = false;
      this.handlers.onMicrophoneStopped?.();
      return true;
    }

    if (this.isConnected()) {
      this.sendJson({
        type: "stop_transcription",
      });

      this.sendJson({
        type: "toggle_mic",
        payload: {
          on: false,
        },
      });
    }

    await this.stopMicrophoneResources();

    this.transcriptionStarted = false;

    console.log(
      "[MeetingSocket] 마이크 및 자막 기능 종료",
    );

    this.handlers.onMicrophoneStopped?.();

    return true;
  }

  /**
   * 실제 브라우저 마이크 리소스 정리
   */
  private async stopMicrophoneResources(): Promise<void> {
    this.microphoneStarted = false;

    if (this.processorNode) {
      this.processorNode.onaudioprocess = null;

      try {
        this.processorNode.disconnect();
      } catch {
        // 이미 연결 해제된 경우 무시
      }

      this.processorNode = null;
    }

    if (this.mediaStreamSource) {
      try {
        this.mediaStreamSource.disconnect();
      } catch {
        // 이미 연결 해제된 경우 무시
      }

      this.mediaStreamSource = null;
    }

    if (this.silentGainNode) {
      try {
        this.silentGainNode.disconnect();
      } catch {
        // 이미 연결 해제된 경우 무시
      }

      this.silentGainNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      this.mediaStream = null;
    }

    if (this.audioContext) {
      try {
        if (this.audioContext.state !== "closed") {
          await this.audioContext.close();
        }
      } catch (error) {
        console.warn(
          "[MeetingSocket] AudioContext 종료 실패:",
          error,
        );
      }

      this.audioContext = null;
    }
  }

  /**
   * 원본 샘플레이트를 16kHz로 변환
   */
  private downsampleBuffer(
    inputBuffer: Float32Array,
    inputSampleRate: number,
    outputSampleRate: number,
  ): Float32Array {
    if (outputSampleRate === inputSampleRate) {
      return new Float32Array(inputBuffer);
    }

    if (outputSampleRate > inputSampleRate) {
      console.warn(
        "[MeetingSocket] 업샘플링은 지원하지 않습니다.",
        {
          inputSampleRate,
          outputSampleRate,
        },
      );

      return new Float32Array(inputBuffer);
    }

    const sampleRateRatio =
      inputSampleRate / outputSampleRate;

    const newLength = Math.round(
      inputBuffer.length / sampleRateRatio,
    );

    const result =
      new Float32Array(newLength);

    let resultOffset = 0;
    let inputOffset = 0;

    while (resultOffset < result.length) {
      const nextInputOffset = Math.round(
        (resultOffset + 1) * sampleRateRatio,
      );

      let accumulator = 0;
      let count = 0;

      for (
        let index = inputOffset;
        index < nextInputOffset &&
        index < inputBuffer.length;
        index += 1
      ) {
        accumulator += inputBuffer[index];
        count += 1;
      }

      result[resultOffset] =
        count > 0
          ? accumulator / count
          : 0;

      resultOffset += 1;
      inputOffset = nextInputOffset;
    }

    return result;
  }

  /**
   * Float32 [-1, 1] 데이터를 signed 16-bit PCM으로 변환
   */
  private float32ToPcm16(
    inputBuffer: Float32Array,
  ): Int16Array {
    const output =
      new Int16Array(inputBuffer.length);

    for (
      let index = 0;
      index < inputBuffer.length;
      index += 1
    ) {
      const sample = Math.max(
        -1,
        Math.min(1, inputBuffer[index]),
      );

      output[index] =
        sample < 0
          ? sample * 0x8000
          : sample * 0x7fff;
    }

    return output;
  }

  /**
   * 기존 코드와 호환하기 위한 마이크 토글 메서드
   */
  async setMicrophone(
    on: boolean,
  ): Promise<boolean> {
    if (on) {
      return this.startMicrophone();
    }

    return this.stopMicrophone();
  }

  /**
   * 카메라 상태 전달
   *
   * 실제 카메라 제어는 ACS Calling SDK에서 처리해야 합니다.
   */
  setVideo(on: boolean): boolean {
    return this.sendJson({
      type: "toggle_video",
      payload: {
        on,
      },
    });
  }

  /**
   * 목업 모드 연결
   */
  private connectMock(): void {
    if (this.mockTimer) {
      return;
    }

    console.log("[MeetingSocket] 목업 모드 연결");

    this.handlers.onOpen?.();
    this.handlers.onParticipants?.(PARTICIPANTS);

    this.mockTimer = setInterval(() => {
      const captionLength =
        CAPTIONS.ko.length;

      if (captionLength === 0) {
        return;
      }

      const idx =
        this.mockIdx % captionLength;

      this.mockIdx += 1;

      this.mockSpeakerCycle =
        (this.mockSpeakerCycle + 1) %
        ACTIVE_SPEAKERS.length;

      const speakerIdx =
        ACTIVE_SPEAKERS[
          this.mockSpeakerCycle
        ];

      const entry: TranscriptEntry = {
        id: `mock-${Date.now()}`,
        speakerIdx,
        ts: new Date().toLocaleTimeString(
          "ko-KR",
          {
            hour: "2-digit",
            minute: "2-digit",
          },
        ),
        original: CAPTIONS.ko[idx],
        translations: {
          ko: CAPTIONS.ko[idx],
          en: CAPTIONS.en[idx],
          ja: CAPTIONS.ja[idx],
          zh: CAPTIONS.zh[idx],
        },
        isFinal: true,
      };

      this.handlers.onSpeakerChange?.(
        speakerIdx,
      );

      this.handlers.onCaption?.(entry);
    }, MOCK_TICK_MS);
  }

  /**
   * 재연결 예약
   */
  private scheduleReconnect(): void {
    if (
      this.manuallyClosed ||
      ENV.useMock ||
      this.reconnectTimer
    ) {
      return;
    }

    if (
      this.reconnectAttempts >=
      MAX_RECONNECT_ATTEMPTS
    ) {
      const error = new Error(
        `WebSocket 재연결에 ${MAX_RECONNECT_ATTEMPTS}회 실패했습니다.`,
      );

      console.error(
        "[MeetingSocket]",
        error.message,
      );

      this.handlers.onError?.(error);
      return;
    }

    this.reconnectAttempts += 1;

    console.log(
      `[MeetingSocket] ${RECONNECT_DELAY_MS}ms 후 재연결 시도 ` +
        `(${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`,
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;

      if (!this.manuallyClosed) {
        this.connect();
      }
    }, RECONNECT_DELAY_MS);
  }

  /**
   * 예약된 재연결 제거
   */
  private clearReconnectTimer(): void {
    if (!this.reconnectTimer) {
      return;
    }

    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  /**
   * 연결 종료
   */
  async disconnect(): Promise<void> {
    console.log(
      "[MeetingSocket] 연결 종료 요청",
    );

    this.manuallyClosed = true;

    this.clearReconnectTimer();

    await this.stopMicrophone();

    if (this.mockTimer) {
      clearInterval(this.mockTimer);
      this.mockTimer = null;
    }

    if (
      this.ws &&
      this.ws.readyState === WebSocket.OPEN
    ) {
      this.sendJson({
        type: "leave",
      });
    }

    this.ws?.close(
      1000,
      "Client disconnected",
    );

    this.ws = null;
  }

  /**
   * 현재 WebSocket 연결 여부
   */
  isConnected(): boolean {
    if (ENV.useMock) {
      return this.mockTimer !== null;
    }

    return (
      this.ws?.readyState === WebSocket.OPEN
    );
  }

  /**
   * 현재 마이크 활성화 여부
   */
  isMicrophoneStarted(): boolean {
    return this.microphoneStarted;
  }

  /**
   * 현재 음성 인식 활성화 여부
   */
  isTranscriptionStarted(): boolean {
    return this.transcriptionStarted;
  }

  /**
   * ISO 날짜 문자열을 시:분 형식으로 변환
   */
  private formatTimestamp(
    value: string,
  ): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleTimeString(
      "ko-KR",
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  }
}
