import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import type { Language, Participant, TranscriptEntry } from "../../../types";

function getFallbackSpeaker(
  speakerName: string | undefined,
  language: Language,
  langLabel: Record<Language, string>,
): Participant {
  const name = speakerName?.trim() || "알 수 없는 화자";

  return {
    id: `speaker-${name}`,
    name,
    country: "",
    flag: "🎙️",
    lang: language,
    langLabel: langLabel[language],
    initials: name.charAt(0) || "화",
    color: "#6B7280",
    bg: "#F3F4F6",
    role: "participant",
  };
}

export function TranscriptTab({
  language,
  langLabel,
  transcripts,
  participants,
}: {
  language: Language;
  langLabel: Record<Language, string>;
  transcripts: TranscriptEntry[];
  participants: Participant[];
}) {
  const endRef = useRef<HTMLDivElement | null>(null);
  const latestTranscript = transcripts[transcripts.length - 1];

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [
    transcripts.length,
    latestTranscript?.original,
    latestTranscript?.translations[language],
  ]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: "none" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-[#0078D4] animate-pulse" />
        <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">실시간 기록 · {langLabel[language]} 출력</span>
      </div>

      {transcripts.length === 0 && (
        <p className="text-xs text-[#9CA3AF] text-center py-8">아직 기록된 발언이 없습니다.</p>
      )}

      {transcripts.map((entry, i) => {
        const namedSpeaker = entry.speakerName
          ? participants.find((participant) => participant.name === entry.speakerName)
          : undefined;
        const speaker =
          namedSpeaker ??
          (!entry.speakerName ? participants[entry.speakerIdx] : undefined) ??
          getFallbackSpeaker(entry.speakerName, language, langLabel);
        const originalLanguage = entry.originalLanguage ?? speaker.lang;
        const needsTranslation = originalLanguage !== language;
        const translated =
          entry.translations[language]?.trim() ?? "";

        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i, 6) * 0.08, duration: 0.35 }}
            className="rounded-xl border border-black/[0.06] overflow-hidden bg-white shadow-sm"
          >
            {/* Speaker header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-black/[0.05]" style={{ background: `${speaker.bg}80` }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-none" style={{ background: speaker.color }}>
                {speaker.initials[0]}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-[#111827] truncate">{speaker.name}</span>
                <span className="text-[10px] text-[#6B7280] ml-1.5">{speaker.flag}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-none">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/80 text-[#6B7280] font-medium border border-black/[0.06]">{langLabel[originalLanguage]}</span>
                <span className="text-[9px] text-[#9CA3AF]">{entry.ts}</span>
              </div>
            </div>

            {/* Content */}
            <div className="px-3 py-2.5 space-y-2">
              <div>
                <div className="text-[9px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">원문</div>
                <p className="text-xs text-[#9CA3AF] leading-relaxed">{entry.original}</p>
              </div>

              {needsTranslation && (
                <div>
                  <div className="text-[9px] font-semibold text-[#0078D4] uppercase tracking-wider mb-1">번역 ({langLabel[language]})</div>
                  <p className="text-xs text-[#111827] leading-relaxed font-medium">
                    {translated || "번역 대기 중..."}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
