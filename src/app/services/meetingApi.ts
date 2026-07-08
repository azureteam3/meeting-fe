/**
 * 회의 관련 REST API 호출 모음.
 *
 * ENV.useMock === true
 *   → 백엔드 없이 목업 데이터로 동작
 *
 * ENV.useMock === false
 *   → 실제 FastAPI 백엔드 호출
 *
 * 실제 백엔드 엔드포인트
 *   POST   /communication/sessions
 *   POST   /communication/token
 *   POST   /sessions/start
 *   POST   /sessions/stop/{sessionId}
 *   DELETE /communication/sessions/{sessionId}
 */

import { apiClient } from "./apiClient";
import { ENV } from "../config/env";
import { PARTICIPANTS } from "../data/participants";
import { TRANSCRIPTS } from "../data/transcripts";
import { INIT_CHAT, AI_ANSWERS } from "../data/chat";
import type {
  ChatMessage,
  JoinMeetingResponse,
  Language,
} from "../types";

/**
 * POST /communication/sessions 요청
 */
interface CreateSessionRequest {
  participant_id: string;
  participant_kind?: "acs_user" | "phone_number";
}

/**
 * POST /communication/sessions 응답
 */
interface CreateSessionResponse {
  message: string;
  meeting_id: string | null;
  session_id: string;
  status: string | null;
  created_at: string | null;
}

/**
 * POST /communication/token 요청
 */
interface TokenRequest {
  app_user_id: string;
  user_name?: string;
}

/**
 * POST /communication/token 응답
 */
interface TokenResponse {
  identity: string;
  token: string;
  expires_on: string;
}

/**
 * POST /sessions/start 응답
 */
interface StartSessionResponse {
  meeting_id?: string;
  session_id?: string;
  status?: string;
  message?: string;
  [key: string]: unknown;
}

const FALLBACK_ANSWER: Record<Language, string> = {
  ko: "죄송합니다, 해당 질문에 대한 답변을 준비 중입니다. 다른 질문을 입력하거나 위의 빠른 질문을 사용해보세요.",
  en: "I'm preparing an answer for that question. Please try a quick question above or rephrase your query.",
  ja: "その質問への回答を準備中です。上のクイック質問をお試しください。",
  zh: "我正在准备该问题的答案。请尝试上面的快速问题。",
};

/**
 * 생성 도중 오류가 발생한 세션을 정리
 */
async function cleanupCreatedSession(sessionId: string): Promise<void> {
  try {
    await apiClient.delete<void>(
      `/communication/sessions/${sessionId}`,
    );
  } catch (cleanupError) {
    console.error(
      "생성 실패 세션 정리 중 오류가 발생했습니다.",
      cleanupError,
    );
  }
}

/**
 * 회의 입장
 *
 * 처리 순서
 * 1. ACS 사용자 Identity 및 VoIP Token 발급
 * 2. Communication 세션 생성
 * 3. 음성 인식·자막 세션 시작
 *
 * 입력
 *   meetingId: 프론트에서 사용하는 회의 ID
 *   appUserId: 앱 사용자 고유 ID (DB PK 또는 실제 고유 식별자)
 *   username: 사용자 표시 이름
 *   language: 참여자 발화 언어
 */
export async function joinMeeting(
  meetingId: string,
  appUserId: string,
  username: string,
  language: Language,
): Promise<JoinMeetingResponse> {
  if (ENV.useMock) {
    await new Promise((resolve) => setTimeout(resolve, 400));

    return {
      meetingId,
      sessionId: `mock-${meetingId}`,
      identity: "mock-identity",
      token: "mock-token",
      expiresOn: new Date().toISOString(),
      participants: PARTICIPANTS,
      transcripts: TRANSCRIPTS,
      chatHistory: INIT_CHAT[language],
    };
  }

  let createdSessionId: string | null = null;

  try {
    const tokenPayload: TokenRequest = {
      app_user_id: appUserId,
      user_name: username,
    };

    const token = await apiClient.post<TokenResponse>(
      "/communication/token",
      tokenPayload,
    );

    const sessionPayload: CreateSessionRequest = {
      participant_id: token.identity,
      participant_kind: "acs_user",
    };

    const session =
      await apiClient.post<CreateSessionResponse>(
        "/communication/sessions",
        sessionPayload,
      );

    createdSessionId = session.session_id;

    await apiClient.post<StartSessionResponse>(
      "/sessions/start",
      {
        meeting_id: meetingId,
        session_id: session.session_id,
      },
    );

    console.log("회의 입장 API 연결 성공", {
      meetingId,
      sessionId: session.session_id,
      identity: token.identity,
      appUserId,
      username,
      language,
    });

    return {
      meetingId,
      sessionId: session.session_id,
      identity: token.identity,
      token: token.token,
      expiresOn: token.expires_on,
      participants: [],
      transcripts: [],
      chatHistory: INIT_CHAT[language],
    };
  } catch (error) {
    console.error("회의 입장 처리 중 오류가 발생했습니다.", error);

    if (createdSessionId) {
      await cleanupCreatedSession(createdSessionId);
    }

    throw error;
  }
}

/**
 * 회의 나가기
 */
export async function leaveMeeting(
  sessionId: string,
): Promise<void> {
  if (ENV.useMock) {
    return;
  }

  let stopError: unknown = null;

  try {
    await apiClient.post(
      `/sessions/stop/${sessionId}`,
      {},
    );
  } catch (error) {
    stopError = error;

    console.error(
      "자막 세션 중지 중 오류가 발생했습니다.",
      error,
    );
  }

  try {
    await apiClient.delete<void>(
      `/communication/sessions/${sessionId}`,
    );
  } catch (error) {
    console.error(
      "Communication 세션 삭제 중 오류가 발생했습니다.",
      error,
    );

    throw error;
  }

  if (stopError) {
    throw stopError;
  }
}

/**
 * 회의 종료
 */
export async function endMeeting(
  sessionId: string,
): Promise<void> {
  if (ENV.useMock) {
    return;
  }

  let stopError: unknown = null;

  try {
    await apiClient.post(
      `/sessions/stop/${sessionId}`,
      {},
    );
  } catch (error) {
    stopError = error;

    console.error(
      "자막 세션 종료 중 오류가 발생했습니다.",
      error,
    );
  }

  try {
    await apiClient.delete<void>(
      `/communication/sessions/${sessionId}?hang_up=true`,
    );
  } catch (error) {
    console.error(
      "전체 회의 종료 중 오류가 발생했습니다.",
      error,
    );

    throw error;
  }

  if (stopError) {
    throw stopError;
  }
}

/**
 * AI 어시스턴트에게 질문
 */
export async function askAssistant(
  meetingId: string,
  question: string,
  language: Language,
): Promise<ChatMessage> {
  if (ENV.useMock) {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const answer =
      AI_ANSWERS[language][question] ??
      FALLBACK_ANSWER[language];

    return {
      role: "ai",
      text: answer,
    };
  }

  const res = await apiClient.post<{
    queryId: string;
    intent: string;
    answer: string;
  }>(`/agent/sessions/${meetingId}/query`, {
    userId: "web-user",
    message: question,
    responseLanguage: language,
  });

  return { role: "ai", text: res.answer };
}

/**
 * 회의록(.docx) 다운로드
 */
export async function downloadMinutes(meetingId: string): Promise<void> {
  if (ENV.useMock) {
    throw new Error(
      "목업 모드에서는 회의록 다운로드를 쓸 수 없어요. (.env에 VITE_USE_MOCK=false 필요)",
    );
  }

  const res = await fetch(
    `${ENV.apiBaseUrl}/agent/sessions/${meetingId}/minutes/download`,
  );

  if (!res.ok) {
    let message = `회의록 생성에 실패했습니다 (HTTP ${res.status})`;
    try {
      const data = JSON.parse(await res.text()) as { detail?: string };
      if (data.detail === "no_transcript") {
        message = "아직 자막이 없어 회의록을 만들 수 없습니다.";
      } else if (typeof data.detail === "string") {
        message = data.detail;
      }
    } catch {
      // JSON이 아니면 기본 메시지 사용
    }
    throw new Error(message);
  }

  const blob = await res.blob();

  let filename = "회의록.docx";
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (match) {
    try {
      filename = decodeURIComponent(match[1]);
    } catch {
      // 디코드 실패 시 기본값 유지
    }
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
