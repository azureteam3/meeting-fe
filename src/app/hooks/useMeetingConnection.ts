
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { MeetingSocket } from "../services/meetingSocket";

import {
  askAssistant,
  endMeeting as endMeetingApi,
  leaveMeeting as leaveMeetingApi,
} from "../services/meetingApi";

import type {
  ChatMessage,
  Language,
  Participant,
  TranscriptEntry,
} from "../types";

interface UseMeetingConnectionParams {
  /**
   * 서비스에서 사용하는 회의방 ID
   *
   * AI 질문 API 등에 사용
   */
  meetingId: string;

  /**
   * POST /communication/sessions에서 생성된 세션 ID
   *
   * WebSocket 연결, 회의 종료, 회의 나가기 API에 사용
   */
  sessionId: string;

  /**
   * ACS Calling SDK 연결 정보
   *
   * 현재 hook에서는 직접 사용하지 않지만
   * 추후 ACS 통화 연결을 위해 유지
   */
  identity: string;
  token: string;
  expiresOn: string;

  username: string;
  language: Language;

  initialParticipants: Participant[];
  initialTranscripts: TranscriptEntry[];
  initialChat: ChatMessage[];

  /**
   * 진행자가 전체 회의를 종료했을 때
   * 현재 회의 화면을 닫기 위한 콜백
   */
  onMeetingEnded?: () => void;
}

export function useMeetingConnection(
  params: UseMeetingConnectionParams,
) {
  const {
    meetingId,
    sessionId,
    username,
    language,
    initialParticipants,
    initialTranscripts,
    initialChat,
  } = params;

  /**
   * WebSocket 연결 상태
   */
  const [connected, setConnected] =
    useState(false);

  /**
   * 마이크 활성화 상태
   */
  const [micOn, setMicOn] =
    useState(false);

  /**
   * 카메라 활성화 상태
   */
  const [videoOn, setVideoOn] =
    useState(false);

  /**
   * 마이크 권한 요청 및 음성 인식 시작 중 여부
   */
  const [micLoading, setMicLoading] =
    useState(false);

  const [participants, setParticipants] =
    useState<Participant[]>(
      initialParticipants,
    );

  const [transcripts, setTranscripts] =
    useState<TranscriptEntry[]>(
      initialTranscripts,
    );

  const [caption, setCaption] =
    useState<TranscriptEntry | null>(
      initialTranscripts[
        initialTranscripts.length - 1
      ] ?? null,
    );

  const [
    activeSpeakerIdx,
    setActiveSpeakerIdx,
  ] = useState(0);

  const [chatMessages, setChatMessages] =
    useState<ChatMessage[]>(
      initialChat,
    );

  /**
   * 현재 사용 중인 WebSocket 객체
   */
  const socketRef =
    useRef<MeetingSocket | null>(null);

  /**
   * 컴포넌트가 언마운트됐는지 확인
   *
   * 비동기 마이크 시작이 끝난 뒤
   * 언마운트된 컴포넌트의 state를 변경하는 것을 방지
   */
  const mountedRef = useRef(true);

  /**
   * onMeetingEnded 함수가 바뀌더라도
   * WebSocket을 다시 연결하지 않도록 ref로 관리
   */
  const onMeetingEndedRef = useRef(
    params.onMeetingEnded,
  );

  useEffect(() => {
    onMeetingEndedRef.current =
      params.onMeetingEnded;
  }, [params.onMeetingEnded]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * TranscriptEntry 추가 또는 갱신
   *
   * 서버가 같은 ID로 중간 자막을 계속 보내는 경우
   * 기존 자막을 갱신합니다.
   *
   * 새로운 ID라면 최종 자막 목록에 추가합니다.
   */
  const applyTranscript = useCallback(
    (entry: TranscriptEntry) => {
      setCaption(entry);

      setTranscripts((previous) => {
        const existingIndex =
          previous.findIndex(
            (item) => item.id === entry.id,
          );

        if (existingIndex < 0) {
          return [
            ...previous,
            entry,
          ];
        }

        const next = [...previous];

        next[existingIndex] = entry;

        return next;
      });
    },
    [],
  );

  /**
   * WebSocket 연결
   *
   * MeetingSocket에는 meetingId가 아닌
   * 백엔드에서 생성된 sessionId를 전달해야 합니다.
   */
  useEffect(() => {
    let disposed = false;

    const socket = new MeetingSocket(
      sessionId,
      username,
      language,
      {
        onOpen: () => {
          if (disposed) {
            return;
          }

          console.log(
            "[useMeetingConnection] WebSocket 연결 성공",
          );

          setConnected(true);

          /**
           * WebSocket 연결 후 자동으로 마이크와
           * 서버 음성 인식을 시작합니다.
           *
           * 브라우저 정책에 따라 사용자 클릭 없이
           * getUserMedia가 제한되는 환경이 있을 수 있습니다.
           * 이 경우 화면의 마이크 버튼을 눌러 다시 시작하면 됩니다.
           */
          setMicLoading(true);

          void socket
            .startMicrophone()
            .then((success) => {
              if (
                disposed ||
                !mountedRef.current
              ) {
                return;
              }

              setMicOn(success);

              if (success) {
                console.log(
                  "[useMeetingConnection] 마이크 및 자동 자막 시작 성공",
                );
              } else {
                console.warn(
                  "[useMeetingConnection] 자동 마이크 시작 실패",
                );
              }
            })
            .catch((error: unknown) => {
              if (
                disposed ||
                !mountedRef.current
              ) {
                return;
              }

              console.error(
                "[useMeetingConnection] 자동 마이크 시작 오류:",
                error,
              );

              setMicOn(false);
            })
            .finally(() => {
              if (
                disposed ||
                !mountedRef.current
              ) {
                return;
              }

              setMicLoading(false);
            });
        },

        onClose: () => {
          if (disposed) {
            return;
          }

          console.log(
            "[useMeetingConnection] WebSocket 연결 종료",
          );

          setConnected(false);
          setMicOn(false);
          setMicLoading(false);
        },

        onError: (error) => {
          console.error(
            "[useMeetingConnection] 회의 WebSocket 오류:",
            error,
          );
        },

        onCaption: (entry) => {
          if (disposed) {
            return;
          }

          console.log(
            "[useMeetingConnection] 자막 수신:",
            entry,
          );

          applyTranscript(entry);
        },

        onSpeakerChange: (
          speakerIdx,
        ) => {
          if (disposed) {
            return;
          }

          setActiveSpeakerIdx(
            speakerIdx,
          );
        },

        onParticipants: (
          participantList,
        ) => {
          if (disposed) {
            return;
          }

          setParticipants(
            participantList,
          );
        },

        onChatMessage: (
          message,
        ) => {
          if (disposed) {
            return;
          }

          setChatMessages(
            (previous) => [
              ...previous,
              message,
            ],
          );
        },

        onMicrophoneStarted: () => {
          if (disposed) {
            return;
          }

          console.log(
            "[useMeetingConnection] 마이크 시작 이벤트 수신",
          );

          setMicOn(true);
          setMicLoading(false);
        },

        onMicrophoneStopped: () => {
          if (disposed) {
            return;
          }

          console.log(
            "[useMeetingConnection] 마이크 종료 이벤트 수신",
          );

          setMicOn(false);
          setMicLoading(false);
        },

        onMeetingEnded: () => {
          if (disposed) {
            return;
          }

          console.warn(
            "[useMeetingConnection] 회의가 진행자에 의해 종료되었습니다.",
          );

          /**
           * 서버 종료 이벤트를 받은 뒤에는
           * 재연결하지 않도록 disconnect()를 호출합니다.
           */
          void socket.disconnect();

          if (
            socketRef.current === socket
          ) {
            socketRef.current = null;
          }

          setConnected(false);
          setMicOn(false);
          setVideoOn(false);

          onMeetingEndedRef.current?.();
        },
      },
    );

    /**
     * connect() 전에 ref에 저장해야
     * 목업 모드의 동기 콜백에서도 접근할 수 있습니다.
     */
    socketRef.current = socket;

    socket.connect();

    return () => {
      disposed = true;

      /**
       * React effect cleanup은 Promise를 반환할 수 없으므로
       * void로 비동기 종료를 실행합니다.
       */
      void socket.disconnect();

      if (
        socketRef.current === socket
      ) {
        socketRef.current = null;
      }
    };
  }, [
    sessionId,
    username,
    language,
    applyTranscript,
  ]);

  /**
   * AI 어시스턴트에게 질문
   *
   * AI 질문 API는 sessionId가 아닌
   * 서비스의 meetingId를 사용합니다.
   */
  const sendChat = useCallback(
    async (
      text: string,
    ): Promise<void> => {
      const question = text.trim();

      if (!question) {
        return;
      }

      const userMessage: ChatMessage = {
        role: "user",
        text: question,
      };

      setChatMessages(
        (previous) => [
          ...previous,
          userMessage,
        ],
      );

      try {
        const answer =
          await askAssistant(
            meetingId,
            question,
            language,
          );

        setChatMessages(
          (previous) => [
            ...previous,
            answer,
          ],
        );
      } catch (error) {
        console.error(
          "[useMeetingConnection] AI 어시스턴트 응답 실패:",
          error,
        );

        const errorMessage: ChatMessage = {
          role: "ai",
          text:
            language === "ko"
              ? "죄송합니다. 서버로부터 응답을 받아오지 못했습니다. 잠시 후 다시 시도해주세요."
              : "Sorry, I couldn't get a response from the server. Please try again shortly.",
        };

        setChatMessages(
          (previous) => [
            ...previous,
            errorMessage,
          ],
        );
      }
    },
    [
      meetingId,
      language,
    ],
  );

  /**
   * 마이크 및 자막 기능 켜기/끄기
   *
   * true:
   * - 브라우저 마이크 권한 요청
   * - 오디오 캡처 시작
   * - WebSocket으로 PCM16 오디오 전송
   * - 서버 음성 인식 시작
   *
   * false:
   * - 서버 음성 인식 종료
   * - 오디오 전송 종료
   * - 마이크 트랙 종료
   */
  const toggleMic = useCallback(
    async (
      on: boolean,
    ): Promise<boolean> => {
      const socket =
        socketRef.current;

      if (!socket) {
        console.warn(
          "[useMeetingConnection] WebSocket이 없어 마이크 상태를 변경하지 못했습니다.",
        );

        return false;
      }

      if (!socket.isConnected()) {
        console.warn(
          "[useMeetingConnection] WebSocket 연결 전에는 마이크를 변경할 수 없습니다.",
        );

        return false;
      }

      if (micLoading) {
        console.warn(
          "[useMeetingConnection] 마이크 상태를 이미 변경하고 있습니다.",
        );

        return false;
      }

      setMicLoading(true);

      try {
        const success =
          await socket.setMicrophone(
            on,
          );

        if (!success) {
          console.error(
            "[useMeetingConnection] 마이크 상태 변경 실패",
            {
              requestedState: on,
            },
          );

          return false;
        }

        setMicOn(on);

        console.log(
          "[useMeetingConnection] 마이크 상태 변경 완료:",
          on,
        );

        return true;
      } catch (error) {
        console.error(
          "[useMeetingConnection] 마이크 상태 변경 오류:",
          error,
        );

        return false;
      } finally {
        if (mountedRef.current) {
          setMicLoading(false);
        }
      }
    },
    [micLoading],
  );

  /**
   * 카메라 상태 전달
   *
   * 실제 영상 제어는 ACS Calling SDK에서 처리해야 합니다.
   * 현재는 서버에 카메라 상태만 전달합니다.
   */
  const toggleVideo = useCallback(
    (on: boolean): boolean => {
      const socket =
        socketRef.current;

      if (!socket) {
        console.warn(
          "[useMeetingConnection] WebSocket이 없어 카메라 상태를 전달하지 못했습니다.",
        );

        return false;
      }

      const success =
        socket.setVideo(on);

      if (success) {
        setVideoOn(on);

        console.log(
          "[useMeetingConnection] 카메라 상태 변경:",
          on,
        );
      }

      return success;
    },
    [],
  );

  /**
   * 현재 WebSocket을 재연결 없이 종료
   */
  const disconnectSocket =
    useCallback(
      async (): Promise<void> => {
        const socket =
          socketRef.current;

        if (!socket) {
          setConnected(false);
          setMicOn(false);
          setVideoOn(false);
          return;
        }

        /**
         * 먼저 ref를 비워 중복 종료 요청을 막습니다.
         */
        socketRef.current = null;

        try {
          await socket.disconnect();
        } catch (error) {
          console.error(
            "[useMeetingConnection] WebSocket 종료 오류:",
            error,
          );
        } finally {
          if (mountedRef.current) {
            setConnected(false);
            setMicOn(false);
            setVideoOn(false);
            setMicLoading(false);
          }
        }
      },
      [],
    );

  /**
   * 진행자가 전체 회의를 종료
   *
   * API에는 meetingId가 아닌 sessionId를 전달합니다.
   */
  const endMeeting = useCallback(
    async (): Promise<void> => {
      /**
       * API를 먼저 호출해야 서버가 다른 참가자에게
       * meeting_ended 이벤트를 보낼 수 있습니다.
       *
       * 기존처럼 socket을 먼저 끊으면
       * 종료 API 실패 시 연결이 이미 끊긴 문제가 생길 수 있습니다.
       */
      await endMeetingApi(
        sessionId,
      );

      await disconnectSocket();
    },
    [
      disconnectSocket,
      sessionId,
    ],
  );

  /**
   * 일반 참가자가 회의에서 나가기
   *
   * API에는 meetingId가 아닌 sessionId를 전달합니다.
   */
  const leave = useCallback(
    async (): Promise<void> => {
      /**
       * 서버 나가기 API를 먼저 호출한 뒤
       * 로컬 WebSocket과 마이크를 정리합니다.
       */
      try {
        await leaveMeetingApi(
          sessionId,
        );
      } finally {
        await disconnectSocket();
      }
    },
    [
      disconnectSocket,
      sessionId,
    ],
  );

  return {
    connected,

    micOn,
    micLoading,
    videoOn,

    participants,
    transcripts,
    caption,
    activeSpeakerIdx,
    chatMessages,

    sendChat,
    toggleMic,
    toggleVideo,
    disconnectSocket,
    endMeeting,
    leave,
  };
}
