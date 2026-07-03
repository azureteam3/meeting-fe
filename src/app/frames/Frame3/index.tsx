import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  ChatMessage,
  Language,
  Participant,
  Tab,
  TranscriptEntry,
} from "../../types";

import { useMeetingConnection } from "../../hooks/useMeetingConnection";
import { useAcsCall } from "../../hooks/useAcsCall";

import { MeetingHeader } from "./MeetingHeader";
import { VideoGrid } from "./VideoGrid";
import { LocalVideo } from "./LocalVideo";
import { CaptionBar } from "./CaptionBar";
import { MeetingControls } from "./MeetingControls";
import { Sidebar } from "./Sidebar";
import { EndMeetingModal } from "./EndMeetingModal";

const LANG_LABEL: Record<Language, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");

  const remainSeconds = (seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${remainSeconds}`;
}

interface Frame3Props {
  meetingId: string;
  sessionId: string;
  identity: string;
  token: string;
  expiresOn: string;

  username: string;
  language: Language;

  initialParticipants: Participant[];
  initialTranscripts: TranscriptEntry[];
  initialChat: ChatMessage[];

  onEnd: () => void;
}

export function Frame3({
  meetingId,
  sessionId,
  identity,
  token,
  expiresOn,
  username,
  language,
  initialParticipants,
  initialTranscripts,
  initialChat,
  onEnd,
}: Frame3Props) {
  const [tab, setTab] = useState<Tab>("transcript");
  const [chatInput, setChatInput] = useState("");

  const [micOn, setMicOn] = useState(true);
  const [vidOn, setVidOn] = useState(true);

  const [elapsed, setElapsed] = useState(0);
  const [showEndConfirm, setShowEndConfirm] =
    useState(false);

  const [ending, setEnding] = useState(false);
  const [endError, setEndError] =
    useState<string | null>(null);

  const chatEndRef =
    useRef<HTMLDivElement | null>(null);

  /*
   * ACS Calling SDK 실제 영상회의 연결
   *
   * token:
   *   백엔드 POST /communication/token 응답값
   *
   * meetingId:
   *   ACS Group Call에 사용할 UUID
   */
  const {
    call,
    callState,
    localVideoStream,
  } = useAcsCall({
    token,
    username,
    meetingId,
  });

  /*
   * 자막, 참가자, AI 채팅용 WebSocket 연결
   */
  const {
    connected: socketConnected,
    participants,
    transcripts,
    caption,
    activeSpeakerIdx,
    chatMessages,
    sendChat,
    toggleMic,
    toggleVideo,
    endMeeting,
  } = useMeetingConnection({
    meetingId,
    sessionId,
    identity,
    token,
    expiresOn,
    username,
    language,
    initialParticipants,
    initialTranscripts,
    initialChat,
    onMeetingEnded: onEnd,
  });

  /*
   * ACS 통화 연결 여부
   */
  const callConnected =
    callState === "Connected" ||
    callState === "LocalHold" ||
    callState === "RemoteHold";

  /*
   * 헤더에는 WebSocket과 ACS 통화가 모두 연결된 경우
   * 정상 연결 상태로 표시
   */
  const connected =
    socketConnected && callConnected;

  /*
   * 회의 시간
   */
  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsed((current) => current + 1);
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  /*
   * 채팅 메시지가 추가되면 하단으로 이동
   */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [chatMessages]);

  /*
   * AI 채팅 전송
   */
  const sendMessage = useCallback(
    (text?: string) => {
      const question = (text ?? chatInput).trim();

      if (!question) {
        return;
      }

      setChatInput("");
      void sendChat(question);
    },
    [chatInput, sendChat],
  );

  /*
   * 실제 ACS 마이크와 서버 상태를 함께 변경
   */
  const handleToggleMic = useCallback(async () => {
    if (!call) {
      console.warn(
        "ACS 통화가 아직 연결되지 않았습니다.",
      );
      return;
    }

    const next = !micOn;

    try {
      if (next) {
        await call.unmute();
      } else {
        await call.mute();
      }

      setMicOn(next);

      /*
       * 이 WebSocket 메시지는 실제 마이크를 제어하는 것이 아니라
       * 백엔드에 현재 UI 상태를 전달하는 용도
       */
      toggleMic(next);
    } catch (error) {
      console.error(
        "마이크 상태 변경에 실패했습니다.",
        error,
      );
    }
  }, [call, micOn, toggleMic]);

  /*
   * 실제 ACS 카메라와 서버 상태를 함께 변경
   */
  const handleToggleVideo =
    useCallback(async () => {
      if (!call) {
        console.warn(
          "ACS 통화가 아직 연결되지 않았습니다.",
        );
        return;
      }

      if (!localVideoStream) {
        console.warn(
          "사용 가능한 로컬 카메라 스트림이 없습니다.",
        );
        return;
      }

      const next = !vidOn;

      try {
        if (next) {
          await call.startVideo(localVideoStream);
        } else {
          await call.stopVideo(localVideoStream);
        }

        setVidOn(next);

        /*
         * 백엔드에는 카메라 UI 상태만 전달
         */
        toggleVideo(next);
      } catch (error) {
        console.error(
          "카메라 상태 변경에 실패했습니다.",
          error,
        );
      }
    }, [
      call,
      localVideoStream,
      toggleVideo,
      vidOn,
    ]);

  /*
   * 전체 회의 종료
   */
  const handleConfirmEnd =
    useCallback(async () => {
      if (ending) {
        return;
      }

      setEnding(true);
      setEndError(null);

      try {
        /*
         * 프론트 ACS 통화 종료
         *
         * 백엔드에서도 hang_up=true를 호출하므로
         * 여기서는 현재 사용자의 통화만 먼저 종료
         */
        if (call) {
          await call.hangUp({
            forEveryone: false,
          });
        }

        await endMeeting();

        setShowEndConfirm(false);
        onEnd();
      } catch (error) {
        console.error(
          "회의 종료에 실패했습니다.",
          error,
        );

        setEndError(
          "회의 종료에 실패했습니다. 잠시 후 다시 시도해주세요.",
        );
      } finally {
        setEnding(false);
      }
    }, [
      call,
      endMeeting,
      ending,
      onEnd,
    ]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F7F8FA]">
      <MeetingHeader
        username={username}
        language={language}
        langLabel={LANG_LABEL}
        elapsedLabel={formatTime(elapsed)}
        participantCount={participants.length}
        connected={connected}
        onEndClick={() => {
          setEndError(null);
          setShowEndConfirm(true);
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        <div
          className="flex min-w-0 flex-col"
          style={{ width: "67%" }}
        >
          {/*
           * 영상 영역
           *
           * 기존 VideoGrid를 유지하면서 로컬 카메라를
           * 우측 하단의 작은 화면으로 표시
           */}
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <VideoGrid
              participants={participants}
              activeSpeakerIdx={activeSpeakerIdx}
              currentUserName={username}
            />

            {vidOn && localVideoStream && (
              <div className="absolute bottom-4 right-4 z-20 h-36 w-52 overflow-hidden rounded-xl border-2 border-white bg-black shadow-lg">
                <LocalVideo
                  stream={localVideoStream}
                />

                <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-[10px] text-white">
                  {username} · 나
                </div>
              </div>
            )}

            {!callConnected && (
              <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-lg bg-black/65 px-3 py-2 text-xs text-white">
                영상회의 연결 중 · {callState}
              </div>
            )}
          </div>

          <CaptionBar
            caption={
              caption?.translations[language] ||
              caption?.original ||
              ""
            }
            captionIdx={transcripts.length}
            language={language}
            langLabel={LANG_LABEL}
          />

          <MeetingControls
            micOn={micOn}
            vidOn={vidOn}
            onToggleMic={() => {
              void handleToggleMic();
            }}
            onToggleVideo={() => {
              void handleToggleVideo();
            }}
          />
        </div>

        <Sidebar
          tab={tab}
          setTab={setTab}
          language={language}
          langLabel={LANG_LABEL}
          transcripts={transcripts}
          participants={participants}
          chatMessages={chatMessages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          sendMessage={sendMessage}
          chatEndRef={chatEndRef}
        />
      </div>

      <EndMeetingModal
        show={showEndConfirm}
        ending={ending}
        onCancel={() => {
          if (!ending) {
            setShowEndConfirm(false);
            setEndError(null);
          }
        }}
        onConfirm={() => {
          void handleConfirmEnd();
        }}
      />

      {endError && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white shadow-lg">
          {endError}
        </div>
      )}
    </div>
  );
}