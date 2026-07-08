
=======
# AI Meeting Frontend

React + Vite 기반 실시간 다국어 회의 프론트엔드입니다. Azure Communication Services 영상회의, WebSocket 기반 실시간 STT 자막, 다국어 번역 기록, AI 채팅, 회의록 다운로드 기능을 제공합니다.

## 주요 기능

### 1. 회의 시작 화면

- `Frame1`에서 서비스 첫 화면과 회의 시작 CTA를 제공합니다.
- URL query `?room=...` 값으로 회의방 ID를 지정할 수 있습니다.
- `room` 값이 없으면 기본 데모 회의방 ID를 사용합니다.

관련 파일:

- `src/app/App.tsx`
- `src/app/frames/Frame1.tsx`

### 2. 회의 입장 설정

- `Frame2`에서 사용자 이름과 참여자 발화 언어를 입력합니다.
- 지원 언어는 한국어, 영어, 일본어, 중국어입니다.
- 선택 언어는 STT metadata, 실시간 기록 번역 표시, 사용자 언어 배지, 비디오 타일 flag에 사용됩니다.

관련 파일:

- `src/app/frames/Frame2.tsx`
- `src/app/data/participants.ts`
- `src/app/types.ts`

### 3. 백엔드 회의 입장 연동

회의 입장 시 REST API를 순서대로 호출합니다.

```text
1. POST /communication/token
2. POST /communication/sessions
3. POST /sessions/start
4. Frame3 회의 화면 진입
```

성공 시 백엔드에서 받은 ACS identity/token, session_id, meeting_id를 회의 화면으로 전달합니다.

관련 파일:

- `src/app/services/apiClient.ts`
- `src/app/services/meetingApi.ts`
- `src/app/App.tsx`

### 4. ACS 영상회의

- `@azure/communication-calling` SDK로 ACS 통화에 참여합니다.
- `meetingId`를 ACS group call의 `groupId`로 사용합니다.
- 로컬 카메라 스트림과 원격 참가자 비디오 스트림을 `VideoGrid`에 표시합니다.
- 마이크/카메라 on/off 버튼은 ACS call 객체에 직접 반영됩니다.

관련 파일:

- `src/app/hooks/useAcsCall.ts`
- `src/app/frames/Frame3/VideoGrid.tsx`
- `src/app/frames/Frame3/VideoTile.tsx`
- `src/app/frames/Frame3/LocalVideo.tsx`
- `src/app/frames/Frame3/RemoteVideo.tsx`
- `src/app/frames/Frame3/MeetingControls.tsx`

### 5. 실시간 자막 WebSocket

- 백엔드 WebSocket `/ws/{sessionId}`에 연결합니다.
- 연결 query에 `username`, `language`를 포함합니다.
- 연결 성공 후 `join` 메시지를 보내고 브라우저 마이크 입력을 시작합니다.
- 브라우저 마이크 `Float32` 오디오를 16kHz PCM16 mono로 변환해 WebSocket binary로 전송합니다.
- 서버에서 `transcript`, `caption`, `translation_update` 메시지를 받아 화면 상태로 반영합니다.

관련 파일:

- `src/app/services/meetingSocket.ts`
- `src/app/hooks/useMeetingConnection.ts`

### 6. 화면 아래 AI 자막

- 현재 들어오는 자막 원문을 하단 `CaptionBar`에 실시간 스트리밍 형태로 표시합니다.
- 긴 문장은 잘리지 않도록 줄바꿈과 내부 스크롤을 지원합니다.
- `interim` 자막은 하단 AI 자막에만 표시되고, 최종 기록 목록에는 쌓이지 않습니다.

관련 파일:

- `src/app/frames/Frame3/CaptionBar.tsx`
- `src/app/hooks/useMeetingConnection.ts`

### 7. 실시간 기록 탭

- `final` transcript만 오른쪽 실시간 기록 탭에 쌓습니다.
- 원문 언어와 사용자가 선택한 언어가 다르면 번역 영역을 함께 표시합니다.
- 새 기록이나 번역이 도착하면 자동으로 아래로 스크롤합니다.
- `speakerName`, `speakerId`, `originalLanguage`, `translations` 값을 사용해 화자와 번역을 렌더링합니다.

관련 파일:

- `src/app/frames/Frame3/Sidebar/TranscriptTab.tsx`
- `src/app/frames/Frame3/Sidebar/index.tsx`
- `src/app/services/meetingSocket.ts`

### 8. AI 채팅

- 오른쪽 사이드바의 AI 채팅 탭에서 회의 내용 기반 질문을 보낼 수 있습니다.
- 빠른 질문 버튼을 언어별로 제공합니다.
- 실제 백엔드 모드에서는 `/agent/sessions/{meetingId}/query`를 호출합니다.
- 목업 모드에서는 로컬 `data/chat.ts` 응답을 사용합니다.

관련 파일:

- `src/app/frames/Frame3/Sidebar/ChatTab.tsx`
- `src/app/services/meetingApi.ts`
- `src/app/data/chat.ts`

### 9. 회의록 다운로드

- 헤더의 회의록 버튼으로 백엔드 `.docx` 회의록 다운로드 API를 호출합니다.
- 자막이 없는 경우 백엔드의 `no_transcript` 응답을 사용자 메시지로 표시합니다.

관련 파일:

- `src/app/frames/Frame3/MeetingHeader.tsx`
- `src/app/services/meetingApi.ts`
- `src/app/frames/Frame3/index.tsx`

### 10. 회의 종료

- 회의 종료 버튼 클릭 시 확인 모달을 표시합니다.
- 확인하면 ACS call을 hang up하고 백엔드 세션 종료 API를 호출합니다.
- 종료 후 첫 화면으로 돌아갑니다.

관련 파일:

- `src/app/frames/Frame3/EndMeetingModal.tsx`
- `src/app/frames/Frame3/index.tsx`
- `src/app/services/meetingApi.ts`

## 전체 처리 흐름

```text
1. 사용자가 Frame1에서 회의 시작 클릭
2. Frame2에서 이름과 참여자 발화 언어 선택
3. joinMeeting() 실행
   -> /communication/token
   -> /communication/sessions
   -> /sessions/start
4. Frame3 진입
5. useAcsCall()이 ACS group call 연결
6. useMeetingConnection()이 WebSocket /ws/{sessionId} 연결
7. MeetingSocket이 브라우저 마이크 오디오를 PCM16으로 변환해 전송
8. 서버 transcript 수신
   -> interim: CaptionBar에 실시간 표시
   -> final: TranscriptTab 기록에 추가
9. translation_update 수신 시 해당 transcript의 translations 갱신
10. AI 채팅/회의록 다운로드는 meetingId 기준 Agent API 호출
```

## 화면 구조

```text
App
├─ Frame1: 시작 화면
├─ Frame2: 이름/발화 언어 입력
└─ Frame3: 회의 화면
   ├─ MeetingHeader
   ├─ VideoGrid
   │  └─ VideoTile
   │     ├─ LocalVideo
   │     └─ RemoteVideo
   ├─ CaptionBar
   ├─ MeetingControls
   ├─ Sidebar
   │  ├─ TranscriptTab
   │  └─ ChatTab
   └─ EndMeetingModal
```

## API 연동

### REST

| 함수 | Method / Path | 설명 |
| --- | --- | --- |
| `joinMeeting` | `POST /communication/token` | ACS identity/token 발급 |
| `joinMeeting` | `POST /communication/sessions` | ACS 세션 생성 |
| `joinMeeting` | `POST /sessions/start` | STT/자막 세션 등록 |
| `leaveMeeting` | `POST /sessions/stop/{sessionId}` | 자막 세션 중지 |
| `leaveMeeting` | `DELETE /communication/sessions/{sessionId}` | ACS 세션 삭제 |
| `endMeeting` | `DELETE /communication/sessions/{sessionId}?hang_up=true` | 회의 종료 |
| `askAssistant` | `POST /agent/sessions/{meetingId}/query` | AI 채팅 질의 |
| `downloadMinutes` | `GET /agent/sessions/{meetingId}/minutes/download` | 회의록 다운로드 |

### WebSocket

연결 주소:

```text
{VITE_WS_BASE_URL}/ws/{sessionId}?username={username}&language={language}
```

클라이언트 송신 JSON:

```json
{
  "type": "join",
  "payload": {
    "username": "홍길동",
    "language": "ko"
  }
}
```

```json
{
  "type": "start_transcription",
  "payload": {
    "language": "ko",
    "sampleRate": 16000,
    "format": "pcm_s16le",
    "channels": 1
  }
}
```

마이크 오디오는 WebSocket binary로 전송합니다.

서버 수신 메시지:

```json
{
  "type": "transcript",
  "payload": {
    "id": "seg-xxxx",
    "original": "안녕하세요.",
    "language": "ko",
    "username": "홍길동",
    "speaker_id": "unknown",
    "is_final": true
  }
}
```

```json
{
  "type": "translation_update",
  "payload": {
    "id": "seg-xxxx",
    "translated": "안녕하세요.",
    "translations": {
      "ko": "안녕하세요.",
      "en": "Hello.",
      "ja": "こんにちは。",
      "zh": "你好。"
    }
  }
}
```

## 환경 변수

`.env` 또는 `src/.env`에 다음 값을 설정합니다.

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_WS_BASE_URL=ws://127.0.0.1:8000
VITE_USE_MOCK=false
```

기본값:

- `VITE_API_BASE_URL`: `http://127.0.0.1:8000`
- `VITE_WS_BASE_URL`: `ws://127.0.0.1:8000`
- `VITE_USE_MOCK`: `true`

실제 백엔드를 사용할 때는 반드시 `VITE_USE_MOCK=false`로 설정해야 합니다.

## 실행 방법

### 패키지 설치

>>>>>>> feature/dev2
```bash
npm install
```

### 2. 개발 서버 시작
```bash
npm run dev
```

### 3. 프로덕션 빌드

=======
## Docker/Nginx

프로젝트에는 정적 빌드 배포용 파일이 포함되어 있습니다.

- `Dockerfile`
- `nginx.conf`

Vite 빌드 결과물은 `dist/`에 생성됩니다.

## 주요 디렉터리

```text
src/app
├─ App.tsx
├─ config
│  └─ env.ts
├─ data
│  ├─ chat.ts
│  ├─ participants.ts
│  └─ transcripts.ts
├─ frames
│  ├─ Frame1.tsx
│  ├─ Frame2.tsx
│  └─ Frame3
├─ hooks
│  ├─ useAcsCall.ts
│  └─ useMeetingConnection.ts
├─ services
│  ├─ apiClient.ts
│  ├─ meetingApi.ts
│  └─ meetingSocket.ts
└─ types.ts
```

## 개발 메모

- `meetingId`는 회의방 ID이며 AI 채팅/회의록 API에서 사용합니다.
- `sessionId`는 백엔드가 만든 접속 세션 ID이며 WebSocket 연결과 세션 종료에 사용합니다.
- ACS 영상회의는 `meetingId`를 group call `groupId`로 사용합니다.
- 하단 `CaptionBar`는 현재 수신 중인 원문 자막을 표시합니다.
- 오른쪽 `TranscriptTab`은 final transcript만 기록합니다.
- 같은 `room` 값을 반복 사용하면 백엔드 DB에 남은 이전 회의 기록이 AI 요약/회의록에 섞일 수 있습니다.
- 마이크 음성인식은 브라우저 권한이 필요합니다. 자동 시작이 막히면 마이크 버튼으로 다시 시도합니다.
- `VITE_USE_MOCK=true`이면 백엔드 없이 로컬 목업 데이터로 동작하지만 ACS, 회의록 다운로드, 실제 STT는 사용할 수 없습니다.
- ACS 토큰 오류가 나면 `/communication/token` 응답의 `token`이 JWT 형식인지 확인해야 합니다.
