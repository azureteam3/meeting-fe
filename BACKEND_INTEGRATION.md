# 백엔드 연동 가이드

프론트엔드는 아래 스펙에 맞춰 REST API + WebSocket을 호출하도록 이미 구현되어 있습니다.
백엔드가 아래 형태로 응답을 주면 별도 프론트 수정 없이 바로 연동됩니다.

## 0. 전환 방법

1. `.env` 파일에서 `VITE_USE_MOCK=false` 로 변경
2. `VITE_API_BASE_URL`, `VITE_WS_BASE_URL` 을 실제 백엔드 주소로 변경
3. 끝. (`VITE_USE_MOCK=true`인 동안은 백엔드 없이 목업 데이터로 UI만 동작합니다)

## 1. 관련 파일 위치

| 역할 | 파일 |
|---|---|
| 환경변수 | `.env`, `.env.example` |
| 환경변수 로더 | `src/app/config/env.ts` |
| REST 공용 fetch 래퍼 | `src/app/services/apiClient.ts` |
| REST API 호출 함수 | `src/app/services/meetingApi.ts` |
| WebSocket 클래스 | `src/app/services/meetingSocket.ts` |
| 화면에서 쓰는 통합 훅 | `src/app/hooks/useMeetingConnection.ts` |
| 회의 메인 화면 (연동 지점) | `src/app/frames/Frame3/index.tsx` |
| 메시지/응답 타입 정의 | `src/app/types.ts` |

## 2. REST API

Base URL: `VITE_API_BASE_URL` (예: `https://api.example.com/api`)

### `POST /meetings/{meetingId}/join`
회의 입장. 이름/언어를 선택한 뒤 "회의 입장" 클릭 시 호출됩니다.

Request body:
```json
{ "username": "김민준", "language": "ko" }
```

Response body:
```json
{
  "meetingId": "demo-meeting",
  "participants": [
    { "id": "p1", "name": "김민준", "country": "대한민국", "flag": "🇰🇷",
      "lang": "ko", "langLabel": "한국어", "initials": "김",
      "color": "#0078D4", "bg": "#DEEFFE", "role": "진행자" }
  ],
  "transcripts": [
    { "id": "t1", "speakerIdx": 0, "ts": "09:01",
      "original": "안녕하세요.",
      "translations": { "ko": "안녕하세요.", "en": "Hello.", "ja": "こんにちは。", "zh": "你好。" } }
  ],
  "chatHistory": [
    { "role": "ai", "text": "안녕하세요! AI 어시스턴트입니다." }
  ]
}
```

### `POST /meetings/{meetingId}/chat`
AI 챗봇에게 질문(요약, 액션아이템, 번역 등)을 보낼 때 호출됩니다.

Request: `{ "question": "회의 요약해줘", "language": "ko" }`
Response: `{ "role": "ai", "text": "..." }`

### `POST /meetings/{meetingId}/leave`
참가자가 이탈할 때 (body 없음, 응답 없음/204)

### `POST /meetings/{meetingId}/end`
진행자가 "회의 종료"를 눌렀을 때 (body 없음, 응답 없음/204)

## 3. WebSocket

URL: `{VITE_WS_BASE_URL}/meetings/{meetingId}?username=xxx&language=ko`

접속 즉시 클라이언트가 아래 메시지를 보냅니다:
```json
{ "type": "join", "payload": { "username": "김민준", "language": "ko" } }
```

### 서버 → 클라이언트

| type | payload | 설명 |
|---|---|---|
| `caption` | `TranscriptEntry` (join 응답의 transcripts 항목과 동일 구조) | 실시간 자막/번역 한 줄 |
| `speaker_change` | `{ "speakerIdx": number }` | 현재 발언자 (participants 배열의 index) |
| `participants` | `Participant[]` | 참가자 목록 갱신(입장/퇴장 등) |
| `chat_message` | `{ "role": "ai", "text": "..." }` | AI가 능동적으로 보내는 메시지(선택) |
| `meeting_ended` | – | 서버 측에서 회의가 종료된 경우 |

### 클라이언트 → 서버

| type | payload |
|---|---|
| `join` | `{ "username": string, "language": "ko"\|"en"\|"ja"\|"zh" }` |
| `toggle_mic` | `{ "on": boolean }` |
| `toggle_video` | `{ "on": boolean }` |
| `leave` | – |

재연결: 클라이언트는 비정상 종료 시 2초 간격으로 최대 5회 자동 재연결을 시도합니다 (`meetingSocket.ts`).

## 4. 아직 포함되지 않은 부분 (별도 작업 필요)

- **실제 화상/음성 스트리밍(WebRTC)**: 지금 만든 것은 자막·번역·채팅·참가자 상태를 위한 시그널링(REST+WS)이고, 캠/마이크 실제 미디어 스트림 송수신(WebRTC/SFU 연동)은 포함되어 있지 않습니다. `MeetingControls.tsx`의 마이크/카메라 토글은 현재 서버로 상태값만 전송합니다.
- 인증/로그인 토큰 처리 (필요 시 `apiClient.ts`의 headers에 `Authorization` 추가)
