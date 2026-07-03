/**
 * 환경변수를 한 곳에서 관리합니다.
 * .env 파일의 VITE_API_BASE_URL / VITE_WS_BASE_URL / VITE_USE_MOCK 값을 읽어옵니다.
 */
export const ENV = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api",
  wsBaseUrl: import.meta.env.VITE_WS_BASE_URL ?? "ws://localhost:8000/ws",
  /** true면 목업 데이터로 동작(백엔드 없이 UI 확인용), false면 실제 REST/WebSocket 사용 */
  useMock: (import.meta.env.VITE_USE_MOCK ?? "true") !== "false",
} as const;
