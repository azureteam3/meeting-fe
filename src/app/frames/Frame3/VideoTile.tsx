import { Mic } from "lucide-react";
import type {
  LocalVideoStream,
  RemoteVideoStream,
} from "@azure/communication-calling";

import { LocalVideo } from "./LocalVideo";
import { RemoteVideo } from "./RemoteVideo";
import type { Participant } from "../../types";

interface VideoTileProps {
  participant: Participant;
  isActive: boolean;
  isCurrentUser: boolean;
  currentUserName: string;
  localVideoStream: LocalVideoStream | null;
  remoteVideoStream: RemoteVideoStream | null;
}

export function VideoTile({
  participant,
  isActive,
  isCurrentUser,
  currentUserName,
  localVideoStream,
  remoteVideoStream,
}: VideoTileProps) {
  const displayName = isCurrentUser
    ? currentUserName
    : participant.name;

  const showLocalVideo =
    isCurrentUser && !!localVideoStream;

  const showRemoteVideo =
    !isCurrentUser && !!remoteVideoStream;

  const showVideo =
    showLocalVideo || showRemoteVideo;

  return (
    <div
      className={`relative flex h-full min-h-[220px] w-full items-center justify-center overflow-hidden rounded-2xl transition-all duration-300 ${
        isActive
          ? "ring-2 ring-[#0078D4] ring-offset-2"
          : ""
      }`}
      style={{
        background: showVideo
          ? "#111827"
          : `linear-gradient(145deg, ${participant.bg} 0%, ${participant.color}18 100%)`,
      }}
    >
      {showLocalVideo ? (
        <>
          <div className="absolute inset-0">
            <LocalVideo stream={localVideoStream} />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
        </>
      ) : showRemoteVideo ? (
        <>
          <div className="absolute inset-0">
            <RemoteVideo stream={remoteVideoStream} />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 px-4 text-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg md:h-24 md:w-24 md:text-3xl"
            style={{
              background: `linear-gradient(135deg, ${participant.color} 0%, ${participant.color}CC 100%)`,
            }}
          >
            {participant.initials?.[0] ?? "U"}
          </div>

          <div className="max-w-[90%] truncate text-sm font-semibold text-[#374151] md:text-base">
            {displayName}
          </div>
        </div>
      )}

      {isActive && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-[#0078D4] opacity-60 animate-pulse" />
      )}

      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-1.5 rounded-lg bg-black/45 px-2.5 py-1.5 backdrop-blur-sm">
          <span className="text-xs">{participant.flag}</span>
          <span className="truncate text-xs font-medium text-white">
            {displayName}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {isActive && (
            <div className="h-2 w-2 rounded-full bg-[#0078D4] animate-pulse" />
          )}

          <div className="rounded-md bg-black/45 p-1.5 backdrop-blur-sm">
            <Mic size={12} className="text-white" />
          </div>
        </div>
      </div>

      {isCurrentUser && (
        <div className="absolute left-3 top-3 rounded-md bg-[#0078D4] px-2 py-1 text-[10px] font-semibold text-white">
          나
        </div>
      )}

      {isActive && (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-md bg-[#C42B1C] px-2 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-[10px] font-bold text-white">
            LIVE
          </span>
        </div>
      )}
    </div>
  );
}