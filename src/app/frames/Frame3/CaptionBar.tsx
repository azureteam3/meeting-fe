import { AnimatePresence, motion } from "motion/react";
import { Volume2 } from "lucide-react";
import type { Language } from "../../types";

export function CaptionBar({
  caption,
  captionIdx,
  language,
  langLabel,
}: {
  caption: string;
  captionIdx: number;
  language: Language;
  langLabel: Record<Language, string>;
}) {
  return (
    <div className="flex-none mx-4 mb-3 rounded-2xl bg-white border border-black/[0.07] shadow-sm overflow-hidden">
      <div className="flex items-center gap-0 px-4 py-2.5">
        <div className="flex items-center gap-2 flex-none pr-3 border-r border-black/[0.07]">
          <Volume2 size={13} className="text-[#0078D4]" />
          <span className="text-[10px] font-bold text-[#0078D4] uppercase tracking-wider">AI 자막</span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#0078D4] animate-pulse" />
        </div>
        <div className="flex-1 px-3 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={`${captionIdx}-${language}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="text-sm text-[#111827] font-medium truncate"
            >
              {caption}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="flex-none pl-3 border-l border-black/[0.07]">
          <span className="text-[10px] font-semibold text-[#6B7280] bg-[#F0F2F5] px-2 py-0.5 rounded-full">{langLabel[language]}</span>
        </div>
      </div>
    </div>
  );
}
