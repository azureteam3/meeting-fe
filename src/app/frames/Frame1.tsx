import { motion } from "motion/react";
import {
  Video, Globe, ArrowRight, Shield, FileText, Sparkles, Wifi,
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

        <div className="relative z-10 max-w-3xl w-full text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EBF3FB] border border-[#0078D4]/20 mb-8"
          >
            <Sparkles size={13} className="text-[#0078D4]" />
            <span className="text-xs font-semibold text-[#0078D4] uppercase tracking-wider">Azure AI · Copilot 기반</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-5xl font-bold text-[#111827] leading-[1.15] mb-4 tracking-tight"
          >
            AI 다국어 회의 플랫폼
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="text-lg text-[#6B7280] leading-relaxed mb-3 max-w-xl mx-auto"
          >
            실시간 AI 번역과 자동 기록으로<br />
            언어 장벽 없는 글로벌 협업을 경험하세요
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="text-sm text-[#6B7280]/70 mb-12"
          >
            한국어 · English · 日本語 · 中文 지원
          </motion.p>

          {/* CTA */}
          <motion.button
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.32 }}
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

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.44 }}
            className="flex flex-wrap justify-center gap-3 mt-12"
          >
            {[
              { icon: Globe, label: "실시간 AI 번역" },
              { icon: FileText, label: "자동 회의록" },
              { icon: Shield, label: "엔터프라이즈 보안" },
              { icon: Sparkles, label: "Copilot AI 어시스턴트" },
              { icon: Wifi, label: "고품질 HD 화상" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-black/[0.07] text-sm text-[#374151] shadow-sm">
                <Icon size={14} className="text-[#0078D4]" />
                {label}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.56 }}
          className="relative z-10 mt-20 w-full max-w-2xl mx-auto grid grid-cols-3 gap-px rounded-2xl overflow-hidden border border-black/[0.07] bg-black/[0.04]"
        >
          {[
            { value: "4개", label: "지원 언어" },
            { value: "99.9%", label: "번역 정확도" },
            { value: "< 300ms", label: "실시간 지연" },
          ].map((s) => (
            <div key={s.value} className="bg-white px-6 py-5 text-center">
              <div className="text-2xl font-bold text-[#0078D4] mb-0.5">{s.value}</div>
              <div className="text-xs text-[#6B7280]">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
