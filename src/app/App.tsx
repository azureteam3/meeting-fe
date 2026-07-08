import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Frame1 } from "./frames/Frame1";
import { Frame2 } from "./frames/Frame2";
import { Frame3 } from "./frames/Frame3";
import { joinMeeting } from "./services/meetingApi";
import { ApiError } from "./services/apiClient";
import type { Frame, JoinMeetingResponse, Language } from "./types";

/** URL의 ?room=xxx 쿼리로 회의방을 지정할 수 있습니다. 없으면 기본 데모방을 사용합니다. */
function resolveMeetingId(): string {
  const params =
    new URLSearchParams(window.location.search);

  const room = params.get("room")?.trim();

  return (
    room ||
    "11111111-1111-1111-1111-111111111111"
  );
}

export default function App() {
  const [frame, setFrame] = useState<Frame>(1);
  const [username, setUsername] = useState("");
  const [language, setLanguage] = useState<Language>("ko");
  const [meetingData, setMeetingData] = useState<JoinMeetingResponse | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleJoin = useCallback(async (name: string, lang: Language) => {
    setJoining(true);
    setJoinError(null);
    try {
      const meetingId = resolveMeetingId();
      const appUserId = `web-${name}`;
      const data = await joinMeeting(meetingId, appUserId, name, lang);

      setUsername(name);
      setLanguage(lang);
      setMeetingData(data);
      setFrame(3);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "회의 입장에 실패했습니다. 잠시 후 다시 시도해주세요.";
      setJoinError(message);
      console.error("회의 입장 실패:", err);
    } finally {
      setJoining(false);
    }
  }, []);

  const handleEnd = useCallback(() => {
    setMeetingData(null);
    setFrame(1);
  }, []);

  return (
    <div className="w-full h-screen overflow-hidden bg-[#F7F8FA]">
      <AnimatePresence mode="wait">
        {frame === 1 && (
          <motion.div
            key="f1"
            className="absolute inset-0 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            <Frame1 onNext={() => setFrame(2)} />
          </motion.div>
        )}

        {frame === 2 && (
          <motion.div
            key="f2"
            className="absolute inset-0"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35 }}
          >
            <Frame2 onNext={handleJoin} joining={joining} joinError={joinError} />
          </motion.div>
        )}

        {frame === 3 && meetingData && (
          <motion.div
            key="f3"
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Frame3
              meetingId={meetingData.meetingId}
              sessionId={meetingData.sessionId}
              identity={meetingData.identity}
              token={meetingData.token}
              expiresOn={meetingData.expiresOn}
              username={username}
              language={language}
              initialParticipants={meetingData.participants}
              initialTranscripts={meetingData.transcripts}
              initialChat={meetingData.chatHistory}
              onEnd={handleEnd}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
