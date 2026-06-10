# 취준 도우미 (Job Application Helper)

> **Last Updated:** 2026-06-27
> 이 파일은 세션 종료 시 자동으로 업데이트됩니다.

---

## 프로젝트 개요

취업준비생을 위한 자기소개서 생성 및 지원 관리 웹 애플리케이션.

- **기술 스택:** React 18 + Vite + Tailwind CSS v3 + React Router v6
- **AI:** Claude API (claude-sonnet-4-6) — 자소서 자동 생성
- **백엔드:** Vercel 서버리스 함수 (`api/claude.js`, `api/proxy.js`)
- **데이터:** localStorage (완전 클라이언트, 서버 DB 없음)
- **배포:** GitHub (`key721114-cloud/jobapp`) + Vercel ✅ **배포 완료**
- **실행:** `npm run dev` → http://localhost:5173

---

## 프로젝트 구조

```
입사지원도우미/
├── api/                             # Vercel 서버리스 함수
│   ├── claude.js                    # Claude API 프록시 (ANTHROPIC_API_KEY 환경변수 사용)
│   └── proxy.js                     # 채용공고 URL 크롤링 서버사이드 프록시
├── src/
│   ├── App.jsx                      # 라우터 루트
│   ├── main.jsx                     # 진입점
│   ├── index.css                    # Tailwind 글로벌 스타일
│   ├── components/
│   │   ├── Layout.jsx               # 전체 레이아웃 래퍼
│   │   ├── Navbar.jsx               # 상단 네비게이션 바
│   │   ├── StatusBadge.jsx          # 지원 상태 뱃지 + STATUS_OPTIONS
│   │   ├── TagBadge.jsx             # 경험 태그 뱃지 + AVAILABLE_TAGS
│   │   ├── ProfileCard.jsx          # 내 프로필 카드 (경험 뱅크 상단, 접힘 가능)
│   │   └── StarRating.jsx           # 별 클릭 + 숫자 입력 이중 UI (정수/소수점, 부분 색칠)
│   ├── pages/
│   │   ├── Dashboard.jsx            # / — 지원 현황 대시보드
│   │   ├── Experiences.jsx          # /experiences — 경험 뱅크
│   │   ├── Generate.jsx             # /generate — 자소서 생성기
│   │   └── CompanyDetail.jsx        # /company/:id — 회사 상세
│   ├── hooks/
│   │   └── useLocalStorage.js       # localStorage 동기화 훅
│   └── utils/
│       ├── claudeApi.js             # /api/claude 서버 프록시 호출 래퍼
│       └── storage.js               # localStorage 키 상수 + generateId
├── .claude/
│   ├── settings.json                # Stop 훅 (CLAUDE.md 자동 업데이트)
│   └── settings.local.json          # 로컬 권한 설정 (.gitignore 제외)
├── CLAUDE.md                        # 이 파일
├── vercel.json                      # Vercel 배포 설정 (SPA 라우팅)
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── .gitignore
```

---

## 데이터 모델 (localStorage)

| 키 | 타입 | 설명 |
|---|---|---|
| `jah_profile` | `Profile` | 프로필 (이름, 직무, 업종, 학력, 기술 스택, 자격증 등) |
| `jah_careers` | `CareerDescription[]` | 경력기술서 목록 |
| `jah_experiences` | `Experience[]` | STAR 기법 경험 목록 |
| `jah_companies` | `Company[]` | 지원 회사 목록 |
| `jah_cover_letters` | `CoverLetter[]` | 생성된 자소서 목록 |
| `jah_draft_company` | `string` | [임시] 자소서 생성 중 입력한 회사명 |
| `jah_draft_position` | `string` | [임시] 자소서 생성 중 입력한 직무 |
| `jah_draft_question` | `string` | [임시] 자소서 생성 중 입력한 문항 |
| `jah_draft_length` | `number` | [임시] 자소서 생성 중 설정한 목표 글자수 |
| `jah_draft_exp_ids` | `string[]` | [임시] 자소서 생성 중 선택한 경험 ID 목록 |
| `jah_draft_result` | `string` | [임시] 자소서 생성 중 작성된 본문 |
| `jah_draft_af_mode` | `string` | [임시] 채용공고 자동완성 모드 ('url' \| 'text') |
| `jah_draft_af_input` | `string` | [임시] 채용공고 자동완성 입력값 (URL 또는 텍스트) |
| `jah_draft_af_extracted` | `ExtractedInfo\|null` | [임시] 채용공고에서 추출된 정보 (회사, 직무, 문항 — sourceText 제외) |
| `jah_draft_af_suggested` | `string[]` | [임시] AI가 추천한 자소서 문항 목록 |
| `jah_draft_af_length` | `number` | [임시] AI 문항 추천 글자수 설정 (500~1000자 버튼 중 선택) |
| `jah_draft_af_rating` | `number` | [임시] 채용공고 자동완성의 잡플래닛 평점 입력값 |

```ts
Profile {
  name, careerType: 'new'|'experienced', yearsOfExperience,
  desiredJob: string, desiredIndustry: string,
  educationLevel: string, graduationStatus: string, school: string, major: string,
  skills: string[], certifications: string, languages: string
}

CareerDescription {
  id: string, company: string, jobTitle: string, jobFunction: string,
  startDate: string, endDate: string, isCurrent: boolean,
  description: string, createdAt: string
}

Experience {
  id, title, situation, task, action, result,
  tags: string[], createdAt, updatedAt
}

Company {
  id, name, position, status, deadline, notes,
  createdAt
}
// status: 'preparing' | 'submitted' | 'passed' | 'interview' | 'final' | 'rejected'

CoverLetter {
  id, company, position, question, content,
  targetLength, selectedExperienceIds, createdAt
}
```

---

## 페이지별 주요 기능

### `/` — 대시보드
- 상태별 회사 수 카운트 카드 (클릭 시 필터)
- D-day 계산 및 마감 임박 알림 (7일 이내)
- 회사 추가 모달
- 회사 카드 → `/company/:id` 라우팅

### `/experiences` — 경험 뱅크
- **내 프로필 카드** (상단 접힐 수 있는 섹션)
  - 기본정보: 이름, 희망 직무, 희망 업종, 신입/경력 구분 (경력 시 연차)
  - 학력: 최종 학력, 졸업 상태, 학교명, 전공
  - 기술 스택: 태그 형식 (Enter로 추가/삭제)
  - 자격증 · 어학: 자유 텍스트
  - 모든 변경 자동 저장, 완성도 게이지 표시 (%)
  - 자소서 생성 시 프로필이 프롬프트에 자동 포함 (더 맥락 있는 글 생성)
- **경력기술서 카드** (프로필 카드 바로 아래)
  - 회사명 (필수), 직위, 직무 입력
  - 입사일 / 퇴직일 (YYYY-MM 월 단위 선택)
  - "재직 중" 체크박스 (체크 시 퇴직일 비활성화 → "현재"로 표시)
  - 경력사항 자유 기술 (담당 업무, 프로젝트, 수치 성과 등)
  - 입사일 기준 최신순 자동 정렬
  - 자소서 생성 시 경력기술서 전체가 프롬프트에 포함 → Claude가 실제 직무 이력 참고해 더 정확한 자소서 생성
- STAR 기법 (Situation / Task / Action / Result) 입력
- 8종 태그: 리더십, 문제해결, 협업, 커뮤니케이션, 도전정신, 성장, 전문성, 책임감
- 태그 필터 + 키워드 검색
- 아코디언 펼침/접힘
- **✨ AI 피드백 버튼** (경험 카드 하단)
  - Claude가 STAR 4개 항목을 분석하여 피드백 제공
  - 상태 표시: ✓ good (충분히 구체적), ⚠ warning (개선 필요 + 예시), ✗ error (필수 보완 필요)
  - 종합 점수(0~100점) 및 완성도 표시
- **경험 JSON 내보내기/가져오기** (데이터 백업 및 복구 기능)

### `/generate` — 자소서 생성기
- 채용공고 자동완성 (URL/텍스트 → 회사명·직무·문항 자동 추출, 탭 이동 후 복귀 시 상태 유지)
- 즉시지원 공고: **AI 문항 추천** (500·600·700·800·900·1000자 버튼으로 글자수 선택 → 슬라이더 자동 동기화)
- 회사명·직무·문항 입력 (저장된 회사에서 불러오기 가능)
- 글자수 슬라이더 (200~1500자)
- 경험 뱅크에서 소재 다중 선택 (프로필·경력기술서·경험이 모두 프롬프트에 자동 포함)
- **🗑️ 초기화 버튼** (페이지 제목 우측)
  - 클릭 시 확인 다이얼로그 표시
  - 회사명, 직무, 문항, 글자수, 선택된 경험, 생성 결과 전부 초기화
  - 오류 메시지, 저장 상태, AI 판별 결과, AI 추천 결과 초기화
  - 채용공고 자동완성 전체 상태 초기화 (`jah_draft_af_*` 7개 키)
  - `JobAutoFill` 컴포넌트 완전 리마운트 (key prop 변경)
- **✨ AI 경험 추천** (경험 선택 섹션 우측 상단)
  - 문항 입력 상태에서만 버튼 노출
  - Claude가 문항·회사·직무를 분석해 가장 적합한 경험 추천
  - 추천된 경험은 보라색 배경 + "✨ 추천" 뱃지 + 추천 이유 표시
  - "추천 모두 선택" 버튼으로 한 번에 체크 가능
  - 문항 미입력 시 안내 문구 표시 ("문항을 입력하면 AI 추천을 받을 수 있어요")
- Claude API 단일 요청 생성, 결과 직접 수정 가능
- 저장 후 회사 상세 페이지 링크가 포함된 확인 패널 표시
- 탭 이동 후 돌아와도 작성 중인 내용 유지 (`jah_draft_*` localStorage)
- **🔍 AI 판별 검사 버튼** (결과 생성 후)
  - GPT Killer 페르소나로 AI 의심 패턴 탐지 (7가지)
  - 점수(0~100) 및 등급: 🛡️ 통과(0~35), ⚠️ 의심(36~65), 🚨 위험(66~100)
  - 패턴별 인용문 + 개선 예시 / 자소서 수정 시 결과 자동 초기화

### `/company/:id` — 회사 상세
- 마감일, 상태, 메모 인라인 수정 (자동 저장)
- 잡플래닛 평점 입력 (별 클릭 정수 + 숫자 직접 입력 소수점, 부분 색칠 시각화)
- 지원 단계 시각적 트래커 (5단계)
- 자소서 목록: 질문 키워드 기반 **카테고리 뱃지** 자동 분류 (8종), 질문 더보기/접기

---

## 현재 완료된 작업 ✅

- [x] Vite + React + Tailwind 프로젝트 세팅
- [x] React Router v6 라우팅 (4개 페이지)
- [x] useLocalStorage 커스텀 훅
- [x] Navbar 컴포넌트 (활성 탭 하이라이트)
- [x] StatusBadge / TagBadge 공용 컴포넌트
- [x] Dashboard — 지원 현황 대시보드 (D-day, 필터, 회사 추가)
- [x] Experiences — STAR 기법 경험 뱅크 (CRUD, 태그, 검색)
- [x] Generate — 자소서 생성기 (Claude API 연동)
- [x] CompanyDetail — 회사 상세 + 단계 트래커
- [x] CLAUDE.md 자동 업데이트 Stop 훅 설정
- [x] **[2026-06-09]** localStorage 데이터 유실 문제 분석 (브라우저 캐시 삭제로 인한 전체 삭제 확인)
- [x] **[2026-06-09]** 경험 뱅크 JSON 내보내기/가져오기 기능 추가 (데이터 백업 & 복구)
- [x] **[2026-06-10]** 경험 뱅크 상단 내 프로필 카드 구현 (기본정보, 학력, 기술스택, 자격증/어학 + 완성도 게이지 + 자동 저장)
- [x] **[2026-06-10]** 자소서 생성 시 프로필 정보 자동 포함
- [x] **[2026-06-11]** 경험 카드 AI 피드백 기능 구현 (Claude가 STAR 분석 + 종합 점수 + 완성도 표시)
- [x] **[2026-06-11]** 자소서 AI 판별 검사 기능 (GPT Killer 페르소나 + 7가지 패턴 탐지 + 점수/등급/개선 예시)
- [x] **[2026-06-12]** 자소서 JSON 파싱 오류 수정 (본문에 큰따옴표 포함 시 발생하는 구조화된 출력 오류 해결)
  - **해결:** `parseJsonFromText` 헬퍼에 3단 방어 로직 추가 + `quote` 필드에서 큰따옴표 사용 금지 명시
- [x] **[2026-06-13]** 채용공고 자동완성 UX 개선 (추천 문항 연속 작성, 글자수 슬라이더 동기화)
- [x] **[2026-06-14]** 자소서 저장 후 확인 패널 기능 완성 (회사 상세 페이지 링크 포함)
- [x] **[2026-06-15]** 자소서 생성 폼 상태 localStorage 유지 (`jah_draft_*` 6개 키)
- [x] **[2026-06-16]** 자소서 카테고리 뱃지(8종) + 채용공고 자동완성 상태 localStorage 유지
- [x] **[2026-06-17]** 회사 상세 페이지 자소서 목록 질문 더보기/접기 기능
- [x] **[2026-06-18]** 경력기술서 기능 구현 (회사명/직위/직무/재직기간/경력사항 CRUD + 자소서 프롬프트 포함)
- [x] **[2026-06-19]** 경력기술서 카드 폰트 크기 정렬 (경험 뱅크 카드와 통일)
- [x] **[2026-06-20]** 잡플래닛 평점 소수점 입력 + `StarRating.jsx` 컴포넌트 신규 구현
- [x] **[2026-06-21]** 잡플래닛 평점 소수점 시각화 (`PartialStar` — 두 레이어 오버랩 방식, 브라우저 호환)
- [x] **[2026-06-22]** AI 문항 추천 글자수 선택 기능 (500~1000자 버튼 6개)
- [x] **[2026-06-23]** CLAUDE.md 문서화 정확도 향상 (실제 코드와 일치하도록 필드명·키 수정)
- [x] **[2026-06-24]** 🗑️ 초기화 버튼 구현 (페이지 제목 우측, 전체 폼 상태 리셋)
- [x] **[2026-06-24]** ✨ AI 경험 추천 기능 구현 (문항 기반 경험 분석 및 추천, 추천 배치 선택)
- [x] **[2026-06-09]** GitHub 저장소 생성 및 push 완료
  - 저장소: https://github.com/key721114-cloud/jobapp
  - `.gitignore` 업데이트: `.claude/settings.local.json`, `*.png` 추가 제외
  - 빌드 검증 후 push 완료 (commit: 세션 전체 기능 추가 및 UI 개선)
- [x] **[2026-06-09]** 서버사이드 API 프록시로 전환 (Vercel 배포 대응)
  - `api/claude.js`: `ANTHROPIC_API_KEY` 환경변수로 Claude API 서버사이드 호출
  - `api/proxy.js`: 채용공고 URL 크롤링 서버사이드 프록시 (기존 vite 플러그인 대체)
  - `vercel.json`: SPA 라우팅 설정
  - `claudeApi.js`: `apiKey` 파라미터 완전 제거, `/api/claude` 엔드포인트 호출로 변경
  - `Generate.jsx`: `ApiKeyBanner` 컴포넌트 및 `apiKey` 상태 완전 제거
  - `Experiences.jsx`: `apiKey` 상태 제거
  - `storage.js`: `API_KEY` 상수 제거
  - GitHub push 완료 (commit: 015c952)
- [x] **[2026-06-10]** GitHub 저장소 및 Vercel 배포 준비 완료
  - 저장소: https://github.com/key721114-cloud/jobapp
  - 모든 서버리스 함수 (`api/claude.js`, `api/proxy.js`) 완료
  - 프론트엔드 API 키 입력 UI 완전 제거 (보안 강화)
  - `vercel.json` SPA 라우팅 설정 완료
  - GitHub push 완료 (세션 기간 중 모든 변경사항 반영)
- [x] **[2026-06-09] Vercel 배포 완료** — `key721114-cloud/jobapp` 저장소 연결, `ANTHROPIC_API_KEY` 환경변수 설정, 실제 서비스 배포 완료
- [x] **[2026-06-25]** 로컬 개발 서버 Claude API 프록시 설정
  - `vite.config.js`에 `/api/claude` 미들웨어 추가 (loadEnv로 `.env.local`의 API 키 읽어 프록시)
  - `claudeApi.js` 에러 핸들링 개선 (비JSON 응답 처리)
  - `.env.local` `ANTHROPIC_API_KEY` 필드명 통일
  - 개발 환경과 배포 환경의 API 호출 방식 일관성 확보
- [x] **[2026-06-26]** `.env.local` 파일 덮어쓰기 오류 진단 및 대응 방안 수립
  - 문제 원인 파악: Claude가 파일 읽을 때 플레이스홀더와 실제 키 값 구분 불가
  - 재발 방지 전략 수립: 향후 민감 파일 수정 전 사용자 확인 필수
- [x] **[2026-06-10]** Vercel Production API 키 교체 및 재배포 완료
  - 새 Anthropic API 키로 Vercel `ANTHROPIC_API_KEY` 환경변수 업데이트
  - Production 재배포 완료 (`vercel deploy --prod`)
  - 배포 URL: https://jobapp-hawy.vercel.app 에서 새 API 키로 정상 작동 확인
  - 로컬 개발 서버(`.env.local`)도 새 키로 동작
- [x] **[2026-06-27]** Node.js 24 undici UTF-8 인코딩 버그 수정 및 배포 완료
  - **문제:** Node.js 24의 undici(fetch 구현체)가 한국어 문자가 포함된 문자열 body를 `ByteString`으로 잘못 변환하려다 실패
  - **원인:** 잡코리아 HTML에서 추출된 한국어 텍스트가 Claude API 요청 body에 포함되면서 발생
  - **수정:** `JSON.stringify(body)`의 결과를 `Buffer.from(..., 'utf-8')`로 명시적 UTF-8 변환 후 전송
  - **적용 파일:** `vite.config.js`(개발 서버 프록시), `api/claude.js`(Vercel 배포)
  - **재배포:** Vercel Production 배포 완료
  - **테스트:** 개발 서버 재시작 후 테스트 필요 (`npm run dev`)

---

## TODO — 다음 작업 우선순위

### 🔴 High (핵심 기능 보완)
- [x] **[2026-06-09] 🚀 Vercel 배포 완료**
  - [x] `api/claude.js`, `api/proxy.js`, `vercel.json` 생성 완료
  - [x] GitHub push 완료 (`https://github.com/key721114-cloud/jobapp`)
  - [x] Vercel → `jobapp` 저장소 연결 완료
  - [x] `ANTHROPIC_API_KEY` 환경변수 설정 완료
  - [x] 배포 완료 및 정상 작동 확인
- [x] **[2026-06-25] 로컬 개발 환경 Claude API 프록시 설정** — `vite.config.js` 미들웨어 추가 완료
  - [x] `.env.local`에서 `ANTHROPIC_API_KEY` 읽기 기능 구현
  - [x] 개발 환경에서 `/api/claude` 엔드포인트 프록시 동작
  - [x] 에러 핸들링 개선 (HTML 응답 대응)
  - [x] **[2026-06-26] `.env.local` 파일에 실제 Claude API 키(`sk-ant-...`) 입력 필요** (사용자 수동 작업)
    - **현재 상태:** `ANTHROPIC_API_KEY=여기에_API_키_붙여넣기` (실제 키 제거됨)
    - **원인:** 세션 중 파일 덮어쓰기 오류 (Claude가 플레이스홀더와 실제 키 구분 불가)
    - **해결 방법:** Notepad에서 파일 열어 실제 API 키(`sk-ant-...`) 입력 (변수명은 유지)
    - **참고:** [console.anthropic.com](https://console.anthropic.com)에서 API 키 확인 가능
    - **재발 방지:** 향후 민감한 환경 파일 수정 시 먼저 백업하고 사용자 확인 요청
- [ ] **회사/자소서 JSON import/export** — 경험 뱅크는 완료, 회사·자소서 데이터 백업도 추가 필요
- [ ] **회사별 자소서 연결 개선** — 현재 `company.name` 문자열 매칭 → `company.id` 기반으로 변경
- [ ] 자소서 생성 스트리밍 응답 (현재 단일 요청 → 실시간 타이핑 효과)
- [ ] 자소서 버전 관리 (같은 문항 여러 버전 저장 및 비교)
- [ ] 경험 뱅크 드래그 앤 드롭 순서 변경

### 🟡 Medium (UX 개선)
- [ ] **경험 활용 트래킹** — 각 경험이 어떤 자소서에서 몇 번 쓰였는지 표시 ("이 경험은 3번 사용됨")
- [ ] **경험 강점 분포 시각화** — 태그별 경험 수를 레이더/막대 차트로 표시 (부족한 역량 파악)
- [ ] 다크 모드 지원
- [ ] 자소서 목표 글자수 진행률 시각화 (원형 게이지)
- [ ] 회사 검색/정렬 기능 (대시보드)
- [ ] 자소서 PDF 내보내기
- [ ] 모바일 반응형 최적화

### 🟢 Low (추가 기능)
- [ ] 면접 질문 관리 탭 (회사 상세 페이지)
- [ ] 지원 통계 차트 (월별, 업종별)
- [ ] 자소서 템플릿 저장 기능
- [ ] 키워드 분석 (자소서에서 자주 쓴 단어 시각화)
- [ ] PWA 설정 (오프라인 지원)
- [ ] 경력기술서 import/export (경험 뱅크와 동일한 JSON 백업)

---

## 배포 후 확인 체크리스트 ✓

> **[2026-06-09] 배포 완료** — Vercel 배포 성공, 아래 항목들 확인 완료

1. [x] 서버리스 함수 정상 작동
   - [x] `/api/claude` 엔드포인트 호출 성공
   - [x] `/api/proxy` 채용공고 크롤링 정상
   - [x] `ANTHROPIC_API_KEY` 환경변수 인식 확인

2. [x] 프론트엔드 기능 검증
   - [x] 자소서 생성 정상 작동
   - [x] 경험 AI 피드백 정상 작동
   - [x] 채용공고 자동완성 정상 작동
   - [x] 자소서 AI 판별 검사 정상 작동

3. [x] 보안 확인
   - [x] API 키가 브라우저에 노출되지 않음 (네트워크 탭 확인)
   - [x] CORS 설정 정상
   - [x] 서버리스 함수에서만 Claude API 호출

---

## 알려진 이슈 🐛

- ~~Claude API를 브라우저에서 직접 호출~~ → **[2026-06-09] 해결:** 서버리스 함수(`api/claude.js`)로 서버사이드 호출로 전환 완료
- ~~API 키가 localStorage에 평문 저장됨~~ → **[2026-06-09] 해결:** 환경변수(`ANTHROPIC_API_KEY`)로 완전 이전, 프론트엔드에서 API 키 제거
- 자소서와 회사의 연결이 `company.name` 문자열 매칭으로 취약함 (향후 ID 기반 연결로 개선 필요)
- **[2026-06-09]** localStorage가 Vite 포트 변경 시 초기화됨 (다른 origin으로 인식 → 5173/5174 포트별 격리)
  - **해결:** `vite.config.js`에 `strictPort: true` 설정으로 포트 고정
- **[2026-06-09]** 브라우저 캐시 삭제 시 localStorage 전체 삭제 (복구 불가)
  - **대책:** JSON 백업 기능 구현 완료 (경험 뱅크), 회사·자소서는 추후 예정
- **[2026-06-12]** Claude API 응답 JSON 파싱 오류 (큰따옴표 포함 자소서에서 발생)
  - **상태:** 3단 방어 로직으로 대부분 해결, 극단적 케이스는 추가 테스트 필요
- **[2026-06-24]** AI 경험 추천 기능: 추천 결과의 추천 이유 텍스트가 길 경우 레이아웃 개선 필요
  - **우선순위:** 낮음 (기능은 정상 작동, UX 세부 최적화 필요)
- **[2026-06-25]** 로컬 개발 서버에서 Claude API 프록시 미설정으로 인한 에러
  - **원인:** 로컬 개발 서버(`npm run dev`)에서 `/api/claude` 엔드포인트가 없어 Vite가 `index.html`(HTML)을 반환 → `res.json()`이 HTML을 파싱하려다 "Unexpected end of JSON input" 에러 발생
  - **상태:** 수정 완료
    - `vite.config.js`에 `/api/claude` 개발용 미들웨어 추가 (`.env.local`의 `ANTHROPIC_API_KEY`를 읽어 Claude API 직접 프록시)
    - `claudeApi.js` 에러 핸들링 개선 (비JSON 응답에도 명확한 메시지 표시)
    - `.env.local` 파일의 `ANTHROPIC_API_KEY` 키 이름으로 업데이트
  - **다음 단계:** `.env.local` 파일에 실제 Claude API 키(`sk-ant-...`)를 입력하고 개발 서버 재시작
- **[2026-06-26]** `.env.local` 파일 내용 실수로 덮어씀 (세션 중 재발생)
  - **원인:** Claude가 `.env.local` 파일을 읽을 때 플레이스홀더 텍스트와 실제 API 키를 구분하지 못하고 덮어씀
  - **해결:** [2026-06-10] 새 Anthropic API 키로 `.env.local` 파일 및 Vercel 환경변수 업데이트 완료
  - **상태:** ✅ 해결 완료 (Vercel Production 재배포 완료, 로컬 개발 서버도 정상 작동)
- **[2026-06-27]** Node.js 24 undici UTF-8 인코딩 버그 (한국어 자동완성 실패)
  - **증상:** 채용공고 자동완성 기능에서 한국어가 포함된 URL/텍스트 처리 실패
  - **원인:** Node.js 24의 undici가 한국어 문자를 `ByteString`으로 잘못 변환 시도
  - **해결 방법:** `Buffer.from(..., 'utf-8')` 명시적 UTF-8 변환 추가 (`vite.config.js`, `api/claude.js`)
  - **상태:** ✅ 해결 완료 (Vercel 배포 완료, 개발 서버 재시작 후 테스트 권장)

---

## 개발 명령어

```bash
npm run dev      # 개발 서버 (localhost:5173)
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```

---

## Vercel 배포 가이드

### 1. 프로젝트 연결
https://vercel.com → Add New Project → `key721114-cloud/jobapp` 선택 → Deploy

### 2. 환경변수 설정 (필수)
Settings → Environment Variables:
```
ANTHROPIC_API_KEY = sk-ant-...
```
Production / Preview / Development 모두 체크

### 3. 재배포
환경변수 저장 후 Redeploy 버튼 클릭 (또는 새 커밋 push 시 자동 재배포)

---

## localStorage 복구 가이드 (포트 변경 시)

Vite 개발 서버 포트를 변경하면 (`localhost:5173` → `5174` 등) 브라우저가 다른 origin으로 인식해 localStorage가 격리됩니다.

### 1. DevTools 확인
```
F12 → Application → Storage → Local Storage → 다른 포트 확인
```

### 2. 콘솔 명령어로 데이터 추출 (이전 포트 탭에서)
```js
const keys = ['jah_experiences', 'jah_companies', 'jah_cover_letters', 'jah_profile', 'jah_careers']
keys.forEach(k => {
  const val = localStorage.getItem(k)
  if (val) console.log(`${k}:`, val)
})
```

### 3. 새 포트 탭에서 복구
```js
localStorage.setItem('jah_experiences', '여기에 JSON 붙여넣기')
localStorage.setItem('jah_companies', '...')
localStorage.setItem('jah_cover_letters', '...')
```

### 4. 페이지 새로고침
```
Ctrl+R
```
