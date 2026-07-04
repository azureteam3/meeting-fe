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
 * POST /communication/token 응답
 */
interface TokenResponse {
  identity: string;
  token: string;
  expires_on: string;
}

/**
 * POST /sessions/start 응답
 *
 * SessionManager.start_session()의 실제 반환 구조가
 * 달라질 수 있어서 선택 필드로 구성
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
 * 1. Communication 세션 생성
 * 2. ACS 사용자 Identity 및 VoIP Token 발급
 * 3. 음성 인식·자막 세션 시작
 *
 * 입력
 *   meetingId: 프론트에서 사용하는 회의 ID
 *   username: 사용자 표시 이름
 *   language: 번역 출력 언어
 */
export async function joinMeeting(
  meetingId: string,
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
    /**
     * 1. 백엔드 Communication 세션 생성
     *
     * POST /communication/sessions
     */
    const session =
      await apiClient.post<CreateSessionResponse>(
        "/communication/sessions",
        {},
      );

    createdSessionId = session.session_id;

    /**
     * 2. ACS Identity 및 VoIP Token 발급
     *
     * POST /communication/token
     */
    const token = await apiClient.post<TokenResponse>(
      "/communication/token",
      {},
    );

    /**
     * 3. 음성 인식·자막 세션 시작
     *
     * POST /sessions/start
     * body:
     * {
     *   meeting_id: string,
     *   session_id: string
     * }
     */
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
      username,
      language,
    });

    /**
     * 참가자·자막 목록 조회 API는 아직 없으므로
     * 실제 연결 시 초기값으로 빈 배열을 반환
     */
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

    /**
     * 세션 생성 이후 Token 발급이나 start 요청에서 실패한 경우
     * 앞에서 만들어진 Communication 세션 제거
     */
    if (createdSessionId) {
      await cleanupCreatedSession(createdSessionId);
    }

    throw error;
  }
}

/**
 * 회의 나가기
 *
 * 주의:
 * meetingId가 아니라 백엔드에서 생성된 sessionId를 전달해야 함
 *
 * 처리 순서
 * 1. 음성 인식·자막 세션 중지
 * 2. Communication 세션 삭제
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
 *
 * 진행자가 전체 회의를 종료할 때 사용
 *
 * 처리 순서
 * 1. 음성 인식·자막 세션 중지
 * 2. ACS 통화 종료 요청
 * 3. Communication 세션 삭제
 *
 * hang_up=true:
 * call_connection_id가 존재하면 전체 통화를 종료
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
 * AI 어시스턴트에게 질문 (에이전트 백엔드 연동)
 *
 * 엔드포인트:
 *   POST /agent/sessions/{meetingId}/query
 *
 * 요청 body:
 * {
 *   userId: string,
 *   message: string,
 *   responseLanguage: Language
 * }
 *
 * 응답:
 * {
 *   queryId: string,
 *   intent: string,
 *   answer: string    // → ChatMessage({ role: "ai", text })로 변환해서 반환
 * }
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

  // 에이전트 백엔드는 요청/응답 형식이 fe의 ChatMessage와 달라서 여기서 변환한다.
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
 *
 * GET /agent/sessions/{meetingId}/minutes/download
 * 백엔드가 '그 시점 전체 자막'으로 회의록을 새로 생성해 Word 파일로 내려준다.
 * (gpt 생성이라 수십 초 걸릴 수 있음)
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

  // 파일명은 응답 헤더(Content-Disposition)에서 추출, 없으면 기본값
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

  // 브라우저 다운로드 트리거
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}