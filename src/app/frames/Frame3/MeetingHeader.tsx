import { Clock, Download, PhoneOff, Users } from "lucide-react";
import type { Language } from "../../types";

export function MeetingHeader({
  username,
  language,
  langLabel,
  elapsedLabel,
  participantCount,
  connected,
  onDownloadMinutes,
  downloadingMinutes,
  onEndClick,
}: {
  username: string;
  language: Language;
  langLabel: Record<Language, string>;
  elapsedLabel: string;
  participantCount: number;
  connected: boolean;
  onDownloadMinutes: () => void;
  downloadingMinutes: boolean;
  onEndClick: () => void;
}) {
  return (
    <header className="flex-none flex items-center justify-between px-5 py-2.5 bg-white border-b border-black/[0.07] shadow-sm z-20">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
            <rect width="10" height="10" fill="#F25022" rx="1" />
            <rect x="12" width="10" height="10" fill="#7FBA00" rx="1" />
            <rect y="12" width="10" height="10" fill="#00A4EF" rx="1" />
            <rect x="12" y="12" width="10" height="10" fill="#FFB900" rx="1" />
          </svg>
          <span className="text-xs font-bold text-[#111827]">AI Meeting</span>
        </div>
        <span className="text-black/15 text-xs">|</span>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EBF3FB]">
          <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-[#107C10] animate-pulse" : "bg-[#9CA3AF]"}`} />
          <span className="text-xs font-medium text-[#0063b1]">{connected ? "진행 중" : "연결 중..."}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Current user */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F0F2F5] text-sm">
          <div className="w-6 h-6 rounded-full bg-[#0078D4] flex items-center justify-center text-white text-xs font-bold">
            {username[0]?.toUpperCase() ?? "U"}
          </div>
          <span className="text-xs font-medium text-[#374151]">현재 사용자:</span>
          <span className="text-xs font-semibold text-[#111827]">{username}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EBF3FB] text-[#0078D4] font-semibold">{langLabel[language]}</span>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F0F2F5]">
          <Clock size={12} className="text-[#6B7280]" />
          <span className="text-xs font-mono text-[#374151]">{elapsedLabel}</span>
        </div>

        {/* Participants */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F0F2F5]">
          <Users size={12} className="text-[#6B7280]" />
          <span className="text-xs text-[#374151] font-medium">{participantCount}명</span>
        </div>

        {/* 회의록 다운로드 */}
        <button
          onClick={onDownloadMinutes}
          disabled={downloadingMinutes}
          title="전체 자막으로 회의록(.docx) 생성·다운로드"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#0078D4] bg-[#EBF3FB] transition-all hover:bg-[#D9EDFC] active:scale-95 disabled:opacity-60"
        >
          <Download size={13} />
          {downloadingMinutes ? "생성 중..." : "회의록"}
        </button>

        {/* End meeting */}
        <button
          onClick={onEndClick}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-semibold transition-all hover:opacity-90 active:scale-95 shadow-sm"
          style={{ background: "linear-gradient(135deg, #C42B1C 0%, #A31C0E 100%)" }}
        >
          <PhoneOff size={13} />
          회의 종료
        </button>
      </div>
    </header>
  );
}
