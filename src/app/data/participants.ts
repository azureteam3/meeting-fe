import type { LangOption, Language, Participant } from "../types";

export const LANG_OPTIONS: LangOption[] = [
  { value: "ko", label: "한국어", native: "Korean", flag: "🇰🇷" },
  { value: "en", label: "영어", native: "English", flag: "🇺🇸" },
  { value: "ja", label: "일본어", native: "Japanese", flag: "🇯🇵" },
  { value: "zh", label: "중국어", native: "Chinese", flag: "🇨🇳" },
];

export const PARTICIPANTS: Participant[] = [
  { id: "p1", name: "김민준", country: "대한민국", flag: "🇰🇷", lang: "ko" as Language, langLabel: "한국어", initials: "김", color: "#0078D4", bg: "#DEEFFE", role: "진행자" },
  { id: "p2", name: "John Miller", country: "United States", flag: "🇺🇸", lang: "en" as Language, langLabel: "English", initials: "JM", color: "#107C10", bg: "#DFF6DD", role: "참석자" },
  { id: "p3", name: "李伟", country: "中国", flag: "🇨🇳", lang: "zh" as Language, langLabel: "中文", initials: "李", color: "#881798", bg: "#F3D6F5", role: "참석자" },
  { id: "p4", name: "田中桜", country: "日本", flag: "🇯🇵", lang: "ja" as Language, langLabel: "日本語", initials: "田", color: "#D13438", bg: "#FDE7E9", role: "참석자" },
];
