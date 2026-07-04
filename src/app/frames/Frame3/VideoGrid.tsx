import { VideoTile } from "./VideoTile";
import type { Participant } from "../../types";

export function VideoGrid({
  participants,
  activeSpeakerIdx,
  currentUserName,
}: {
  participants: Participant[];
  activeSpeakerIdx: number;
  currentUserName: string;
}) {
  return (
    <div className="flex-1 p-4 pb-2 overflow-hidden">
      <div className="h-full grid grid-cols-2 gap-3">
        {participants.map((p, i) => (
          <VideoTile
            key={p.id}
            participant={p}
            isActive={i === activeSpeakerIdx}
            isCurrentUser={i === 0}
            currentUserName={currentUserName}
          />
        ))}
      </div>
    </div>
  );
}
