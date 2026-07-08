import {
  useCallback,
  useEffect,
  useMemo,
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
import { downloadMinutes } from "../../services/meetingApi";

import { MeetingHeader } from "./MeetingHeader";
import { VideoGrid } from "./VideoGrid";
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

const LANG_COUNTRY: Record<Language, string> = {
  ko: "KR",
  en: "US",
  ja: "JP",
  zh: "CN",
};

const LANG_FLAG: Record<Language, string> = {
  ko: "🇰🇷",
  en: "🇺🇸",
  ja: "🇯🇵",
  zh: "🇨🇳",
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
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);

  const [ending, setEnding] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const {
    call,
    callState,
    localVideoStream,
    remoteParticipants,
    remoteVideoMap,
  } = useAcsCall({
    token,
    username,
    meetingId,
  });

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

  const callConnected =
    callState === "Connected" ||
    callState === "LocalHold" ||
    callState === "RemoteHold";

  const connected = socketConnected && callConnected;

  useEffect(() => {
    setParticipantCount(1 + (remoteParticipants?.length ?? 0));
  }, [remoteParticipants]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsed((current) => current + 1);
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [chatMessages]);

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

  const [downloadingMinutes, setDownloadingMinutes] = useState(false);

  const handleDownloadMinutes = useCallback(async () => {
    if (downloadingMinutes) {
      return;
    }

    setDownloadingMinutes(true);
    setEndError(null);

    try {
      await downloadMinutes(meetingId);
    } catch (error) {
      setEndError(
        error instanceof Error
          ? error.message
          : "회의록 다운로드에 실패했습니다.",
      );
    } finally {
      setDownloadingMinutes(false);
    }
  }, [downloadingMinutes, meetingId]);

  const handleToggleMic = useCallback(async () => {
    if (!call) {
      console.warn("ACS 통화가 아직 연결되지 않았습니다.");
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
      toggleMic(next);
    } catch (error) {
      console.error("마이크 상태 변경에 실패했습니다.", error);
    }
  }, [call, micOn, toggleMic]);

  const handleToggleVideo = useCallback(async () => {
    if (!call) {
      console.warn("ACS 통화가 아직 연결되지 않았습니다.");
      return;
    }

    if (!localVideoStream) {
      console.warn("사용 가능한 로컬 카메라 스트림이 없습니다.");
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
      toggleVideo(next);
    } catch (error) {
      console.error("카메라 상태 변경에 실패했습니다.", error);
    }
  }, [call, localVideoStream, toggleVideo, vidOn]);

  const handleConfirmEnd = useCallback(async () => {
    if (ending) {
      return;
    }

    setEnding(true);
    setEndError(null);

    try {
      if (call) {
        await call.hangUp({
          forEveryone: false,
        });
      }

      await endMeeting();

      setShowEndConfirm(false);
      onEnd();
    } catch (error) {
      console.error("회의 종료에 실패했습니다.", error);

      setEndError(
        "회의 종료에 실패했습니다. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setEnding(false);
    }
  }, [call, endMeeting, ending, onEnd]);

  const displayParticipants = useMemo(() => {
    const others = participants.filter(
      (p) => p.name !== username,
    );

    const me: Participant = {
      id: "local-user",
      name: username,
      country: LANG_COUNTRY[language],
      flag: LANG_FLAG[language],
      lang: language,
      langLabel: LANG_LABEL[language],
      initials: username.trim().charAt(0) || "나",
      color: "#0078D4",
      bg: "#EAF2FF",
      role: "self",
    };

    return [me, ...others];
  }, [participants, username, language]);

  const displayActiveSpeakerIdx = useMemo(() => {
    const serverParticipants = participants.filter(
      (p) => p.name !== username,
    );

    if (activeSpeakerIdx < 0) {
      return -1;
    }

    const activeParticipant = serverParticipants[activeSpeakerIdx];

    if (!activeParticipant) {
      return -1;
    }

    return displayParticipants.findIndex(
      (p) => p.id === activeParticipant.id,
    );
  }, [activeSpeakerIdx, displayParticipants, participants, username]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F7F8FA]">
      <MeetingHeader
        username={username}
        language={language}
        langLabel={LANG_LABEL}
        elapsedLabel={formatTime(elapsed)}
        participantCount={participantCount}
        connected={connected}
        downloadingMinutes={downloadingMinutes}
        onDownloadMinutes={() => {
          void handleDownloadMinutes();
        }}
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
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <VideoGrid
              participants={displayParticipants}
              activeSpeakerIdx={displayActiveSpeakerIdx}
              currentUserName={username}
              currentUserLanguage={language}
              localVideoStream={vidOn ? localVideoStream : null}
              remoteParticipants={remoteParticipants}
              remoteVideoMap={remoteVideoMap}
            />

            {!callConnected && (
              <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-lg bg-black/65 px-3 py-2 text-xs text-white">
                영상회의 연결 중 · {callState}
              </div>
            )}
          </div>

          <CaptionBar
            caption={caption?.original ?? ""}
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
          participants={displayParticipants}
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
