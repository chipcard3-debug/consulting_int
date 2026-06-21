# ax-consulting

중소기업 AX 현장 컨설팅 회의록을 1단계 산출물과 예상 결과물 방향으로 정리하는 웹 POC입니다.

## 기능

- 컨설팅 회의록 TXT/MD 입력 또는 붙여넣기
- 1단계 산출물 자동 정리
- 예상 결과물 / 다음 회차 PoC 후보 카드 생성
- Word 형식 다운로드
- Vercel Serverless API 기반 AI 분석 엔드포인트

## 구조

- `index.html` — 메인 웹앱
- `api/ai-analyze.js` — OpenAI Responses API 기반 분석 엔드포인트
- `api/extract-text.js` — 파일 추출 안내 엔드포인트
- `api/health.js` — 배포 상태 확인 엔드포인트
- `assets/hero-ai.jpg` — 히어로 이미지
- `vercel.json` — Vercel 배포 설정

## 환경변수

운영 AI 분석을 사용하려면 Vercel 프로젝트 환경변수에 아래 값을 설정합니다.

```text
OPENAI_API_KEY=<server-side only>
AI_MODEL=gpt-5.5
```

실제 API 키는 저장소에 커밋하지 않습니다.

## 로컬 미리보기

```bash
python3 -m http.server 8787 --bind 127.0.0.1
```

정적 화면 확인용입니다. `/api/*`는 Vercel 배포 또는 별도 서버리스 런타임에서 동작합니다.

## 배포

프로젝트명: `ax-consulting`

```bash
npx vercel@latest deploy --prod --yes
```

## 보안 메모

- `.env`, `.vercel`, `.git`, SSH 키, 토큰, 캐시, 로그 파일은 배포/커밋 대상에서 제외합니다.
- 공개 화면에는 내부 프롬프트 파일명, raw prompt 결과, API 키, 인증정보를 노출하지 않습니다.
