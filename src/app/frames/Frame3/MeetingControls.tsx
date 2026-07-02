import {
  Mic, MicOff, Video, VideoOff, ScreenShare, Smile, MoreHorizontal,
} from "lucide-react";

export function MeetingControls({
  micOn,
  vidOn,
  onToggleMic,
  onToggleVideo,
}: {
  micOn: boolean;
  vidOn: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
}) {
  return (
    <div className="flex-none flex items-center justify-center gap-3 px-4 pb-4">
      <button
        onClick={onToggleMic}
        className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${micOn ? "bg-white border border-black/[0.08] hover:bg-[#F0F2F5]" : "bg-[#C42B1C] text-white"}`}
      >
        {micOn ? <Mic size={18} className="text-[#374151]" /> : <MicOff size={18} className="text-white" />}
        <span className={`text-[9px] font-semibold ${micOn ? "text-[#6B7280]" : "text-white"}`}>{micOn ? "음소거" : "음소거됨"}</span>
      </button>
      <button
        onClick={onToggleVideo}
        className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${vidOn ? "bg-white border border-black/[0.08] hover:bg-[#F0F2F5]" : "bg-[#C42B1C] text-white"}`}
      >
        {vidOn ? <Video size={18} className="text-[#374151]" /> : <VideoOff size={18} className="text-white" />}
        <span className={`text-[9px] font-semibold ${vidOn ? "text-[#6B7280]" : "text-white"}`}>{vidOn ? "카메라" : "카메라 끔"}</span>
      </button>
      <button className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-white border border-black/[0.08] hover:bg-[#F0F2F5] transition-all">
        <ScreenShare size={18} className="text-[#374151]" />
        <span className="text-[9px] font-semibold text-[#6B7280]">화면공유</span>
      </button>
      <button className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-white border border-black/[0.08] hover:bg-[#F0F2F5] transition-all">
        <Smile size={18} className="text-[#374151]" />
        <span className="text-[9px] font-semibold text-[#6B7280]">반응</span>
      </button>
      <button className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-white border border-black/[0.08] hover:bg-[#F0F2F5] transition-all">
        <MoreHorizontal size={18} className="text-[#374151]" />
        <span className="text-[9px] font-semibold text-[#6B7280]">더 보기</span>
      </button>
    </div>
  );
}
