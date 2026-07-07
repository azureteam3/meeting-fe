export type Language = "ko" | "en" | "ja" | "zh";
export type Frame = 1 | 2 | 3;
export type Tab = "transcript" | "chat";

export interface TranscriptEntry {
  id: string;
  speakerIdx: number;
  original: string;
  originalLanguage?: Language;
  translations: Record<Language, string>;
  ts: string;
  isFinal?: boolean;
}

export interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

export interface Participant {
  id: string;
  name: string;
  country: string;
  flag: string;
  lang: Language;
  langLabel: string;
  initials: string;
  color: string;
  bg: string;
  role: string;
}

export interface LangOption {
  value: Language;
  label: string;
  native: string;
  flag: string;
}

/* ============================================
 * 백엔드 연동 (REST API / WebSocket) 타입
 * ============================================ */

/** POST /meetings/:id/join 응답 */
export interface JoinMeetingResponse {
  meetingId: string;
  sessionId: string;
  identity: string;
  token: string;
  expiresOn: string;
  participants: Participant[];
  transcripts: TranscriptEntry[];
  chatHistory: ChatMessage[];
}

/** 서버 -> 클라이언트 WebSocket 메시지 */
export type WSIncomingMessage =
  | { type: "caption"; payload: TranscriptEntry }
  | { type: "speaker_change"; payload: { speakerIdx: number } }
  | { type: "participants"; payload: Participant[] }
  | { type: "chat_message"; payload: ChatMessage }
  | { type: "meeting_ended"; payload?: Record<string, never> };

/** 클라이언트 -> 서버 WebSocket 메시지 */
export type WSOutgoingMessage =
  | { type: "join"; payload: { username: string; language: Language } }
  | { type: "toggle_mic"; payload: { on: boolean } }
  | { type: "toggle_video"; payload: { on: boolean } }
  | { type: "leave" };
