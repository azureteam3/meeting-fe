import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Video, Globe, ChevronDown, Shield, Clock, CheckCircle2, X,
} from "lucide-react";
import { LANG_OPTIONS } from "../data/participants";
import type { Language } from "../types";

export function Frame2({
  onNext,
  joining = false,
  joinError = null,
}: {
  onNext: (name: string, lang: Language) => void;
  joining?: boolean;
  joinError?: string | null;
}) {
  const [name, setName] = useState("");
  const [lang, setLang] = useState<Language | "">("");
  const [langOpen, setLangOpen] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [langError, setLangError] = useState(false);

  const handleSubmit = () => {
    const ne = !name.trim();
    const le = !lang;
    setNameError(ne);
    setLangError(le);
    if (!ne && !le) onNext(name.trim(), lang as Language);
  };

  const selectedLang = LANG_OPTIONS.find((l) => l.value === lang);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F0F7FF 0%, #F7F8FA 50%, #F0F2F5 100%)" }}>
      <div className="w-full max-w-md mx-4">
        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45 }}
          className="bg-white rounded-3xl shadow-xl shadow-black/[0.08] border border-black/[0.05]"
        >
          {/* Card header */}
          <div className="px-8 pt-8 pb-6 border-b border-black/[0.05]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0078D4, #005EA8)" }}>
                <Video size={18} className="text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#0078D4] uppercase tracking-wider">AI Meeting Platform</div>
                <div className="text-sm font-semibold text-[#111827]">사용자 설정</div>
              </div>
            </div>
            <h2 className="text-xl font-bold text-[#111827] mb-1">회의 입장 정보 입력</h2>
            <p className="text-sm text-[#6B7280]">이름과 참여자 발화 언어를 선택하세요</p>
          </div>

          <div className="px-8 py-6 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-2">
                이름 <span className="text-[#C42B1C]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setNameError(false); }}
                placeholder="회의에서 표시될 이름을 입력하세요"
                className={`w-full px-4 py-3 rounded-xl text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-all ${
                  nameError
                    ? "border-2 border-[#C42B1C] bg-[#FDE7E9]"
                    : "border border-black/[0.1] bg-[#F7F8FA] focus:border-[#0078D4] focus:ring-3 focus:ring-[#0078D4]/10 focus:bg-white"
                }`}
              />
              {nameError && <p className="mt-1.5 text-xs text-[#C42B1C] flex items-center gap-1"><X size={11} /> 이름을 입력해주세요</p>}
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-2">
                참여자 발화 언어 <span className="text-[#C42B1C]">*</span>
              </label>
              <div className="relative">
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm outline-none transition-all text-left ${
                    langError
                      ? "border-2 border-[#C42B1C] bg-[#FDE7E9]"
                      : "border border-black/[0.1] bg-[#F7F8FA] hover:border-[#0078D4]/40 focus:border-[#0078D4] focus:bg-white"
                  }`}
                >
                  {selectedLang ? (
                    <span className="flex items-center gap-2.5">
                      <span className="text-base">{selectedLang.flag}</span>
                      <span className="font-medium text-[#111827]">{selectedLang.label}</span>
                      <span className="text-[#6B7280]">·</span>
                      <span className="text-[#6B7280]">{selectedLang.native}</span>
                    </span>
                  ) : (
                    <span className="text-[#9CA3AF] flex items-center gap-2">
                      <Globe size={15} />
                      발화 언어를 선택하세요
                    </span>
                  )}
                  <ChevronDown size={15} className={`text-[#6B7280] transition-transform ${langOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl border border-black/[0.08] bg-white shadow-lg shadow-black/[0.1] z-50 [scrollbar-width:thin]"
                    >
                      {LANG_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { setLang(opt.value); setLangOpen(false); setLangError(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:bg-[#F7F8FA] ${lang === opt.value ? "bg-[#EBF3FB]" : ""}`}
                        >
                          <span className="text-base">{opt.flag}</span>
                          <span className={`font-medium ${lang === opt.value ? "text-[#0078D4]" : "text-[#111827]"}`}>{opt.label}</span>
                          <span className="text-[#6B7280] text-xs ml-auto">{opt.native}</span>
                          {lang === opt.value && <CheckCircle2 size={14} className="text-[#0078D4]" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {langError && <p className="mt-1.5 text-xs text-[#C42B1C] flex items-center gap-1"><X size={11} /> 발화 언어를 선택해주세요</p>}
            </div>

            {/* Language note */}
            {lang && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-3 rounded-xl bg-[#EBF3FB] border border-[#0078D4]/15"
              >
                <p className="text-xs text-[#0063b1] leading-relaxed">
                  <span className="font-semibold">발화 언어:</span> 회의 중 내 음성은 <span className="font-semibold">{selectedLang?.label}</span>로 인식됩니다.
                </p>
              </motion.div>
            )}

            {/* Server error */}
            {joinError && (
              <div className="p-3 rounded-xl bg-[#FDE7E9] border border-[#C42B1C]/20">
                <p className="text-xs text-[#C42B1C] flex items-center gap-1"><X size={11} /> {joinError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={joining}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] shadow-md shadow-[#0078D4]/20 mt-2 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #0078D4 0%, #005EA8 100%)" }}
            >
              {joining ? "입장하는 중..." : "회의 입장"}
            </button>
          </div>

          <div className="px-8 pb-6">
            <div className="flex items-center justify-center gap-4 text-xs text-[#9CA3AF]">
              <span className="flex items-center gap-1"><Shield size={11} /> 보안 연결</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Clock size={11} /> 즉시 입장</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Globe size={11} /> 4개 언어 지원</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
