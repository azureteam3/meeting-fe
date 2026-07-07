import { motion } from "motion/react";
import {
  Video, ArrowRight,
} from "lucide-react";

export function Frame1({ onNext }: { onNext: () => void }) {
  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: "#F7F8FA" }}>
      {/* Top nav */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-black/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect width="10" height="10" fill="#F25022" rx="1" />
              <rect x="12" width="10" height="10" fill="#7FBA00" rx="1" />
              <rect y="12" width="10" height="10" fill="#00A4EF" rx="1" />
              <rect x="12" y="12" width="10" height="10" fill="#FFB900" rx="1" />
            </svg>
            <span className="text-sm font-semibold text-[#111827] tracking-tight">Microsoft 365</span>
          </div>
          <span className="text-black/20 text-sm">|</span>
          <span className="text-sm font-medium text-[#0078D4]">AI Meeting</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-[#6B7280]">
          <button className="hover:text-[#0078D4] transition-colors">제품 소개</button>
          <button className="hover:text-[#0078D4] transition-colors">요금제</button>
          <button className="hover:text-[#0078D4] transition-colors">지원</button>
          <button className="px-4 py-1.5 rounded-full text-[#0078D4] border border-[#0078D4]/30 hover:bg-[#EBF3FB] transition-colors text-sm font-medium">로그인</button>
        </div>
      </header>

      {/* Hero section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #0078D4 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        {/* Blue accent glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-[0.06]" style={{ background: "radial-gradient(ellipse, #0078D4 0%, transparent 70%)" }} />

        <div className="relative z-10 max-w-3xl w-full text-center -translate-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="text-5xl font-bold text-[#111827] leading-[1.15] mb-14 tracking-tight"
          >
            AI 다국어 회의 플랫폼
          </motion.h1>

          {/* CTA */}
          <motion.button
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.12 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNext}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-semibold text-base shadow-lg shadow-[#0078D4]/25 transition-all"
            style={{ background: "linear-gradient(135deg, #0078D4 0%, #005EA8 100%)" }}
          >
            <Video size={18} />
            회의 시작
            <ArrowRight size={16} />
          </motion.button>
        </div>
      </main>
    </div>
  );
}
