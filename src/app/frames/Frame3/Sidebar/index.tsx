import type {
  Dispatch,
  RefObject,
  SetStateAction,
} from "react";

import {
  FileText,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { TranscriptTab } from "./TranscriptTab";
import { ChatTab } from "./ChatTab";

import type {
  ChatMessage,
  Language,
  Participant,
  Tab,
  TranscriptEntry,
} from "../../../types";

interface TabItem {
  id: Tab;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  tab: Tab;
  setTab: Dispatch<SetStateAction<Tab>>;

  language: Language;
  langLabel: Record<Language, string>;

  transcripts: TranscriptEntry[];
  participants: Participant[];

  chatMessages: ChatMessage[];
  chatInput: string;
  setChatInput: Dispatch<SetStateAction<string>>;
  sendMessage: (text?: string) => void;

  chatEndRef: RefObject<HTMLDivElement | null>;
}

const TABS: TabItem[] = [
  {
    id: "transcript",
    label: "실시간 기록",
    icon: FileText,
  },
  {
    id: "chat",
    label: "AI 채팅",
    icon: Sparkles,
  },
];

export function Sidebar({
  tab,
  setTab,
  language,
  langLabel,
  transcripts,
  participants,
  chatMessages,
  chatInput,
  setChatInput,
  sendMessage,
  chatEndRef,
}: SidebarProps) {
  return (
    <div
      className="flex-none flex flex-col border-l border-black/[0.07] bg-white"
      style={{ width: "33%" }}
    >
      <div className="flex-none flex border-b border-black/[0.07]">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = tab === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`
                flex-1
                flex
                items-center
                justify-center
                gap-2
                py-3
                text-xs
                font-semibold
                transition-all
                border-b-2
                ${
                  isActive
                    ? "border-[#0078D4] text-[#0078D4] bg-[#EBF3FB]/40"
                    : "border-transparent text-[#6B7280] hover:text-[#374151] hover:bg-[#F7F8FA]"
                }
              `}
            >
              <Icon size={13} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {tab === "transcript" && (
        <TranscriptTab
          language={language}
          langLabel={langLabel}
          transcripts={transcripts}
          participants={participants}
        />
      )}

      {tab === "chat" && (
        <ChatTab
          language={language}
          langLabel={langLabel}
          chatMessages={chatMessages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          sendMessage={sendMessage}
          chatEndRef={chatEndRef}
        />
      )}
    </div>
  );
}