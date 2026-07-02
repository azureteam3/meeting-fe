import { Mic } from "lucide-react";
import type { Participant } from "../../types";

export function VideoTile({ participant, isActive, isCurrentUser, currentUserName }: {
  participant: Participant;
  isActive: boolean;
  isCurrentUser: boolean;
  currentUserName: string;
}) {
  const displayName = isCurrentUser ? currentUserName : participant.name;
  return (
    <div className={`relative rounded-2xl overflow-hidden flex items-center justify-center transition-all duration-300 ${isActive ? "ring-2 ring-[#0078D4] ring-offset-2" : ""}`}
      style={{ background: `linear-gradient(145deg, ${participant.bg} 0%, ${participant.color}18 100%)`, aspectRatio: "16/9" }}>
      {/* Avatar */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${participant.color} 0%, ${participant.color}CC 100%)` }}>
          {participant.initials[0]}
        </div>
        <div className="text-xs font-semibold text-[#374151]">{displayName}</div>
      </div>

      {/* Active speaker pulse */}
      {isActive && (
        <div className="absolute inset-0 rounded-2xl border-2 border-[#0078D4] animate-pulse opacity-60 pointer-events-none" />
      )}

      {/* Overlays */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1">
          <span className="text-xs">{participant.flag}</span>
          <span className="text-white text-xs font-medium truncate max-w-[80px]">{displayName}</span>
        </div>
        <div className="flex items-center gap-1">
          {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#0078D4] animate-pulse" />}
          <div className="bg-black/40 backdrop-blur-sm rounded-md p-1">
            <Mic size={10} className="text-white" />
          </div>
        </div>
      </div>

      {/* Current user badge */}
      {isCurrentUser && (
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#0078D4] text-white text-[10px] font-semibold">나</div>
      )}

      {/* LIVE indicator */}
      {isActive && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#C42B1C] rounded-md px-2 py-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-white text-[10px] font-bold">LIVE</span>
        </div>
      )}
    </div>
  );
}
