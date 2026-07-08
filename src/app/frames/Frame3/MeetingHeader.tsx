import { Clock, Download, PhoneOff, Users } from "lucide-react";
import type { Language } from "../../types";

type MeetingHeaderProps = {
  username: string;
  language: Language;
  langLabel: Record<Language, string>;
  elapsedLabel: string;
  participantCount: number;
  connected: boolean;
  onDownloadMinutes: () => void;
  downloadingMinutes: boolean;
  onEndClick: () => void;
};

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
}: MeetingHeaderProps) {
  return (
    <header className="z-20 flex flex-none items-center justify-between border-b border-black/[0.07] bg-white px-5 py-2.5 shadow-sm">
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

        <span className="text-xs text-black/15">|</span>

        <div className="flex items-center gap-1.5 rounded-full bg-[#EBF3FB] px-2.5 py-1">
          <div
            className={`h-1.5 w-1.5 rounded-full ${
              connected ? "bg-[#107C10] animate-pulse" : "bg-[#9CA3AF]"
            }`}
          />
          <span className="text-xs font-medium text-[#0063B1]">
            {connected ? "진행 중" : "연결 중..."}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-[#F0F2F5] px-3 py-1.5 text-sm">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0078D4] text-xs font-bold text-white">
            {username[0]?.toUpperCase() ?? "U"}
          </div>
          <span className="text-xs font-medium text-[#374151]">현재 사용자:</span>
          <span className="text-xs font-semibold text-[#111827]">{username}</span>
          <span className="rounded bg-[#EBF3FB] px-1.5 py-0.5 text-[10px] font-semibold text-[#0078D4]">
            {langLabel[language]}
          </span>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-[#F0F2F5] px-3 py-1.5">
          <Clock size={12} className="text-[#6B7280]" />
          <span className="font-mono text-xs text-[#374151]">{elapsedLabel}</span>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-[#F0F2F5] px-3 py-1.5">
          <Users size={12} className="text-[#6B7280]" />
          <span className="text-xs font-medium text-[#374151]">{participantCount}명</span>
        </div>

        <button
          onClick={onDownloadMinutes}
          disabled={downloadingMinutes}
          title="전체 자막으로 회의록(.docx) 생성·다운로드"
          className="flex items-center gap-2 rounded-xl bg-[#EBF3FB] px-3 py-2 text-xs font-semibold text-[#0078D4] transition-all hover:bg-[#D9EDFC] active:scale-95 disabled:opacity-60"
        >
          <Download size={13} />
          {downloadingMinutes ? "생성 중..." : "회의록"}
        </button>

        <button
          onClick={onEndClick}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg, #C42B1C 0%, #A31C0E 100%)" }}
        >
          <PhoneOff size={13} />
          회의 종료
        </button>
      </div>
    </header>
  );
}
