import { AnimatePresence, motion } from "motion/react";
import { PhoneOff } from "lucide-react";

export function EndMeetingModal({
  show,
  ending = false,
  onCancel,
  onConfirm,
}: {
  show: boolean;
  ending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl border border-black/[0.06] p-6 w-80"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#FDE7E9] flex items-center justify-center">
                <PhoneOff size={18} className="text-[#C42B1C]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111827]">회의 종료</h3>
                <p className="text-xs text-[#6B7280]">진행 중인 회의를 종료합니다</p>
              </div>
            </div>
            <p className="text-xs text-[#374151] mb-5 leading-relaxed">
              회의를 종료하면 모든 참가자와의 연결이 끊기고 회의 기록이 저장됩니다.
            </p>
            <div className="flex gap-2">
              <button onClick={onCancel} disabled={ending} className="flex-1 py-2.5 rounded-xl border border-black/[0.1] text-xs font-semibold text-[#374151] hover:bg-[#F0F2F5] transition-colors disabled:opacity-50">
                취소
              </button>
              <button onClick={onConfirm} disabled={ending} className="flex-1 py-2.5 rounded-xl text-white text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-70" style={{ background: "linear-gradient(135deg, #C42B1C, #A31C0E)" }}>
                {ending ? "종료 중..." : "회의 종료"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
