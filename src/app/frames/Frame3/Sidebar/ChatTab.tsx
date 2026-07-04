import type {
  KeyboardEvent,
  RefObject,
} from "react";

import {
  Bot,
  Send,
  Sparkles,
} from "lucide-react";

import { QUICK_Q } from "../../../data/chat";

import type {
  ChatMessage,
  Language,
} from "../../../types";

const PLACEHOLDER: Record<Language, string> = {
  ko: "질문을 입력하세요...",
  en: "Ask me anything...",
  ja: "質問を入力してください...",
  zh: "输入您的问题...",
};

interface ChatTabProps {
  language: Language;
  langLabel: Record<Language, string>;

  chatMessages: ChatMessage[];

  chatInput: string;
  setChatInput: (value: string) => void;

  sendMessage: (text?: string) => void;

  chatEndRef: RefObject<HTMLDivElement | null>;
}

export function ChatTab({
  language,
  langLabel,
  chatMessages,
  chatInput,
  setChatInput,
  sendMessage,
  chatEndRef,
}: ChatTabProps) {
  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    /**
     * 한글·일본어·중국어 조합 입력 중 Enter가 눌리면
     * 메시지가 중복 전송될 수 있으므로 무시
     */
    if (event.nativeEvent.isComposing) {
      return;
    }

    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    if (!chatInput.trim()) {
      return;
    }

    sendMessage();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Copilot 헤더 */}
      <div className="flex-none px-4 py-3 border-b border-black/[0.05] bg-gradient-to-r from-[#EBF3FB] to-[#F0F2F5]">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, #0078D4, #00B4EF)",
            }}
          >
            <Sparkles
              size={13}
              className="text-white"
            />
          </div>

          <div>
            <div className="text-xs font-bold text-[#111827]">
              Copilot AI
            </div>

            <div className="text-[9px] text-[#0078D4] font-medium">
              {langLabel[language]} 모드 · 회의 맥락 인식
            </div>
          </div>
        </div>
      </div>

      {/* 채팅 메시지 */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{
          scrollbarWidth: "none",
        }}
      >
        {chatMessages.map((message, index) => {
          const isUser = message.role === "user";

          return (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${
                isUser
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              {!isUser && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-none mr-2 mt-0.5"
                  style={{
                    background:
                      "linear-gradient(135deg, #0078D4, #00B4EF)",
                  }}
                >
                  <Sparkles
                    size={11}
                    className="text-white"
                  />
                </div>
              )}

              <div
                className={`
                  max-w-[82%]
                  px-3
                  py-2.5
                  rounded-2xl
                  text-xs
                  leading-relaxed
                  whitespace-pre-line
                  break-words
                  ${
                    isUser
                      ? "bg-[#0078D4] text-white rounded-tr-sm"
                      : "bg-[#F7F8FA] text-[#111827] border border-black/[0.07] rounded-tl-sm"
                  }
                `}
              >
                {message.text}
              </div>
            </div>
          );
        })}

        {/* 새 메시지 도착 시 스크롤 이동 기준 */}
        <div ref={chatEndRef} />
      </div>

      {/* 빠른 질문 */}
      <div className="flex-none px-4 pt-2 pb-2 flex flex-wrap gap-1.5">
        {QUICK_Q[language].map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => sendMessage(question)}
            className="
              text-[10px]
              px-2.5
              py-1
              rounded-full
              border
              border-[#0078D4]/20
              text-[#0078D4]
              bg-[#EBF3FB]
              hover:bg-[#D9EDFC]
              transition-colors
              font-medium
            "
          >
            {question}
          </button>
        ))}
      </div>

      {/* 질문 입력창 */}
      <div className="flex-none px-4 pb-4">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-black/[0.1] bg-[#F7F8FA] focus-within:border-[#0078D4] focus-within:bg-white transition-all">
          <Bot
            size={14}
            className="text-[#6B7280] flex-none"
          />

          <input
            type="text"
            value={chatInput}
            onChange={(event) =>
              setChatInput(event.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDER[language]}
            className="flex-1 min-w-0 bg-transparent text-xs text-[#111827] outline-none placeholder:text-[#9CA3AF]"
          />

          <button
            type="button"
            aria-label="메시지 보내기"
            onClick={() => sendMessage()}
            disabled={!chatInput.trim()}
            className="p-1.5 rounded-lg bg-[#0078D4] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:bg-[#005EA8]"
          >
            <Send size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}