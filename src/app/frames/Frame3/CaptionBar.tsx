import { useEffect, useRef, useState } from "react";
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
  const [displayedCaption, setDisplayedCaption] = useState(caption);
  const captionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!caption) {
      setDisplayedCaption("");
      return;
    }

    setDisplayedCaption(caption);
  }, [caption]);

  useEffect(() => {
    const captionEl = captionRef.current;

    if (!captionEl) {
      return;
    }

    captionEl.scrollTop = captionEl.scrollHeight;
  }, [displayedCaption]);

  return (
    <div className="flex-none mx-4 mb-3 rounded-2xl bg-white border border-black/[0.07] shadow-sm overflow-hidden">
      <div className="flex items-stretch gap-0 px-4 py-2.5">
        <div className="flex flex-none items-center gap-2 pr-3 border-r border-black/[0.07]">
          <Volume2 size={13} className="text-[#0078D4]" />
          <span className="text-[10px] font-bold text-[#0078D4] uppercase tracking-wider">
            AI 자막
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#0078D4] animate-pulse" />
        </div>

        <div
          ref={captionRef}
          className="flex-1 max-h-16 min-h-6 overflow-y-auto px-3 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <p className="whitespace-pre-wrap break-words text-sm font-medium leading-6 text-[#111827]">
            {displayedCaption}
          </p>
        </div>

        <div className="flex flex-none items-center pl-3 border-l border-black/[0.07]">
          <span className="text-[10px] font-semibold text-[#6B7280] bg-[#F0F2F5] px-2 py-0.5 rounded-full">
            {langLabel[language]}
          </span>
        </div>
      </div>
    </div>
  );
}
