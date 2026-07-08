import { VideoTile } from "./VideoTile";
import type { Participant } from "../../types";
import type {
  LocalVideoStream,
  RemoteParticipant,
  RemoteVideoStream,
} from "@azure/communication-calling";
import type { Language } from "../../types";

function getGridClass(count: number) {
  if (count <= 1) return "grid-cols-1 grid-rows-1";
  if (count === 2) return "grid-cols-1 md:grid-cols-2";
  if (count <= 4) return "grid-cols-2";
  if (count <= 9) return "grid-cols-2 md:grid-cols-3";
  return "grid-cols-2 md:grid-cols-3 xl:grid-cols-4";
}

const LANGUAGE_META: Record<
  Language,
  { country: string; flag: string; langLabel: string }
> = {
  ko: { country: "KR", flag: "🇰🇷", langLabel: "한국어" },
  en: { country: "US", flag: "🇺🇸", langLabel: "English" },
  ja: { country: "JP", flag: "🇯🇵", langLabel: "日本語" },
  zh: { country: "CN", flag: "🇨🇳", langLabel: "中文" },
};

interface VideoGridProps {
  participants: Participant[];
  activeSpeakerIdx: number;
  currentUserName: string;
  currentUserLanguage: Language;
  localVideoStream: LocalVideoStream | null;
  remoteVideoMap: Record<string, RemoteVideoStream | null>;
  remoteParticipants: RemoteParticipant[];
}

export function VideoGrid({
  participants,
  activeSpeakerIdx,
  currentUserName,
  currentUserLanguage,
  localVideoStream,
  remoteVideoMap,
  remoteParticipants,
}: VideoGridProps) {
  // 1. 유효한 원격 비디오 스트림만 추출 (key와 stream을 매칭한 객체 배열 생성)
  const validRemoteStreams = Object.entries(remoteVideoMap)
    .filter(([_, stream]) => stream !== null)
    .map(([key, stream]) => ({ key, stream }));

  // 2. 전체 칸의 개수 = 나 자신(1) + 원격 스트림 개수
  const totalTilesCount = 1 + validRemoteStreams.length;
  const gridClass = getGridClass(totalTilesCount);
  const localParticipant =
    participants.find((participant) => participant.role === "self") ??
    participants.find((participant) => participant.name === currentUserName);

  const localLanguage = currentUserLanguage;
  const localLanguageMeta = LANGUAGE_META[localLanguage];
  const localTileParticipant: Participant = {
    ...localParticipant,
    id: "local-user",
    name: currentUserName,
    role: "self",
    country: localLanguageMeta.country,
    flag: localLanguageMeta.flag,
    lang: localLanguage,
    langLabel: localLanguageMeta.langLabel,
    initials:
      localParticipant?.initials ??
      currentUserName.charAt(0) ??
      "나",
    color: localParticipant?.color ?? "#0078D4",
    bg: localParticipant?.bg ?? "#EAF2FF",
  };

  return (
    <div className="h-full min-h-0 w-full p-4 pb-2">
      <div
        className={`grid h-full min-h-0 w-full ${gridClass} ${
          totalTilesCount === 1 ? "" : "auto-rows-fr"
        } gap-3`}
      >
        {/* ■ 1단계: 무조건 내 화면(로컬) 타일을 첫 번째로 생성 */}
        <div className={totalTilesCount === 1 ? "h-full min-h-0" : "min-h-[220px] h-full"}>
          <VideoTile
            participant={localTileParticipant}
            isActive={false}
            isCurrentUser={true}
            currentUserName={currentUserName}
            localVideoStream={localVideoStream}
            remoteVideoStream={null}
          />
        </div>

        {/* ■ 2단계: ACS를 통해 수신된 실시간 원격 비디오 스트림들을 강제로 전부 렌더링 */}
        {validRemoteStreams.map(({ key, stream }) => {
          const remoteParticipant =
            participants.find((participant) => participant.name === key) ??
            participants.find((participant) => participant.id === key);
          const remoteLanguage = remoteParticipant?.lang ?? "ko";
          const remoteLanguageMeta = LANGUAGE_META[remoteLanguage];
          const remoteTileParticipant: Participant = remoteParticipant ?? {
            id: `remote-${key}`,
            name: key, // 스트림 키 값인 이름('이소윤', 'ㅅㅈㅇ')을 그대로 표시
            role: "participant",
            country: remoteLanguageMeta.country,
            flag: remoteLanguageMeta.flag,
            lang: remoteLanguage,
            langLabel: remoteLanguageMeta.langLabel,
            initials: key.charAt(0) || "참",
            color: "#107C41",
            bg: "#F1FBF5",
          };

          return (
            <div key={key} className="min-h-[220px] h-full">
              <VideoTile
                participant={remoteTileParticipant}
                isActive={false}
                isCurrentUser={false}
                currentUserName={currentUserName}
                localVideoStream={null}
                remoteVideoStream={stream} // 수신된 원격 스트림 강제 주입
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
