# 취준 도우미 (Job Application Helper)

> **Last Updated:** 2026-06-24 (세션 종료 시 자동 업데이트)
> 이 파일은 세션 종료 시 자동으로 업데이트됩니다.

---

## 프로젝트 개요

취업준비생을 위한 자기소개서 생성 및 지원 관리 웹 애플리케이션.

- **기술 스택:** React 18 + Vite + Tailwind CSS v3 + React Router v6
- **AI:** Claude API (claude-sonnet-4-6) — 자소서 자동 생성
- **데이터:** localStorage (서버 없음, 완전 클라이언트)
- **실행:** `npm run dev` → http://localhost:5173

---

## 프로젝트 구조

```
입사지원도우미/
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
│       ├── claudeApi.js             # Claude API fetch 래퍼
│       └── storage.js               # localStorage 키 상수 + generateId
├── .claude/
│   ├── settings.json                # Stop 훅 (CLAUDE.md 자동 업데이트)
│   └── settings.local.json          # 로컬 권한 설정
├── CLAUDE.md                        # 이 파일
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
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
| `jah_api_key` | `string` | Claude API 키 |
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
  - API 키 미설정 시 설정 안내 표시
- **경험 JSON 내보내기/가져오기** (데이터 백업 및 복구 기능)

### `/generate` — 자소서 생성기
- 채용공고 자동완성 (URL/텍스트 → 회사명·직무·문항 자동 추출, 탭 이동 후 복귀 시 상태 유지)
- 즉시지원 공고: **AI 문항 추천** (500·600·700·800·900·1000자 버튼으로 글자수 선택 → 슬라이더 자동 동기화)
- 회사명·직무·문항 입력 (저장된 회사에서 불러오기 가능)
- 글자수 슬라이더 (200~1500자)
- 경험 뱅크에서 소재 다중 선택 (프로필·경력기술서·경험이 모두 프롬프트에 자동 포함)
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
- [x] Claude API 키 localStorage 저장 및 UI 안내
- [x] CLAUDE.md 자동 업데이트 Stop 훅 설정 (권한 추가: `Edit(CLAUDE.md)`)
- [x] **[2026-06-09]** 앱 실행 및 localStorage 데이터 유실 문제 분석 (브라우저 캐시 삭제로 인한 전체 삭제 확인)
- [x] **[2026-06-09]** 경험 뱅크 JSON 내보내기/가져오기 기능 추가 (데이터 백업 & 복구)
- [x] **[2026-06-10]** 경험 뱅크 상단 내 프로필 카드 구현 (기본정보, 학력, 기술스택, 자격증/어학 + 완성도 게이지 + 자동 저장)
- [x] **[2026-06-10]** 자소서 생성 시 프로필 정보 자동 포함 (Claude가 지원자의 학력/기술 스택을 인지하고 더 맥락 있는 글 생성)
- [x] **[2026-06-11]** 경험 카드 AI 피드백 기능 구현 (Claude가 STAR 분석 + 종합 점수 + 완성도 표시)
- [x] **[2026-06-09]** 자소서 AI 판별 검사 기능 (GPT Killer 페르소나 + 7가지 패턴 탐지 + 점수/등급/개선 예시)
- [x] **[2026-06-11]** 채용공고 자동완성 기능 테스트 및 동작 확인 (문항 없는 즉시지원 공고의 AI 문항 추천 기능 정상 작동 검증)
- [x] **[2026-06-12]** 자소서 JSON 파싱 오류 수정 (본문에 큰따옴표 포함 시 발생하는 구조화된 출력 오류 해결)
  - **원인:** 자소서 본문에 큰따옴표(`"`)가 포함되면, Claude의 `quote` 필드가 이스케이프되지 않아 JSON 파싱 실패
  - **해결:** `parseJsonFromText` 헬퍼에 3단 방어 로직 추가
    1. 제어 문자 제거 후 재시도
    2. 이스케이프되지 않은 내부 큰따옴표 수정 후 재시도
    3. 프롬프트 개선: `quote` 필드에서 큰따옴표 사용 금지, 대신 『』 사용 명시
- [x] **[2026-06-13]** 채용공고 자동완성 UX 개선 (연속 작성 가능하도록 상태 관리 최적화)
  - **#1 수정:** 추천 문항 클릭 시 `setExtracted(null)` 초기화 코드 제거
    - **배경:** Q1을 적용해 자소서를 작성하고 돌아와도 채용공고 자동완성 섹션이 초기화되는 문제
    - **결과:** 이제 Q1 적용 후 돌아와도 자동완성 섹션이 그대로 열려있어 Q2, Q3을 연속으로 작성 가능
  - **#2 수정:** 글자수 버튼(500~1000자) 클릭 시 부모의 `targetLength` 즉시 업데이트
    - **배경:** 글자수 버튼 선택 시 부모 컴포넌트의 슬라이더가 동기화되지 않는 문제
    - **결과:** 1000자 버튼 클릭 시 지원정보의 목표 글자수 슬라이더도 1000자로 자동 동기화
- [x] **[2026-06-14]** 자소서 저장 후 확인 패널 기능 완성
  - **변경사항:**
    - `saved` boolean 상태를 `savedId` string 상태로 변경 (저장된 자소서 ID 추적)
    - 저장 버튼 클릭 시 저장된 자소서 ID를 기억하고 버튼 비활성화
    - 저장 확인 패널: 초록색 배경의 성공 알림 표시
  - **기능:**
    - **회사 등록된 경우** → "○○ 상세 페이지" 링크 표시, 클릭 시 해당 회사 페이지로 이동 및 저장된 자소서 목록 확인 가능
    - **회사 미등록인 경우** → "대시보드에서 해당 회사를 추가하면 모아볼 수 있습니다" 안내 메시지 표시
    - `useNavigate` 추가로 회사 상세 페이지로의 네비게이션 구현
- [x] **[2026-06-15]** 자소서 생성 폼 상태 localStorage 유지 개선
  - **변경사항:**
    - 자소서 생성 중인 상태 (`useState` → `useLocalStorage`로 변경)
    - 6개 draft 키 추가: `jah_draft_*` (회사명, 직무, 문항, 목표 글자수, 선택 경험 목록, 본문)
  - **개선 효과:**
    - 경험 뱅크나 대시보드로 이동했다가 돌아와도 작성 중이던 내용 유지
    - 브라우저 탭 전환 후 돌아와도 초기화되지 않음
    - 브라우저 창 닫고 다시 열어도 작성 중인 자소서 복구 가능
- [x] **[2026-06-16]** 자소서 생성 UI 기능 개선
  - **#1 — 자소서 카테고리 표시 기능 추가**
    - 질문 문구를 키워드로 자동 분류하여 컬러 뱃지 표시 (8가지 카테고리)
    - 지원동기(🔵), 협업 경험(🟢), 리더십(🟣), 문제해결(🟠), 입사 포부(🔷), 직무역량(🔴), 성장 경험(🩵), 자기소개(🟡)
    - 카테고리 아래에 질문 원문 한 줄 미리보기 표시
  - **#2 — 채용공고 자동완성 상태 localStorage 유지 개선**
    - `mode`, `input`, `extracted`, `suggestedQs`, `suggestLength`, `pendingRating`을 `jah_draft_af_*` 키로 저장
    - 원본 HTML(`sourceText`)은 용량이 크므로 `useRef`로 세션 내에서만 유지
    - 결과: 채용공고 입력 후 다른 페이지 이동 후 돌아와도 상태 유지 가능
- [x] **[2026-06-17]** 회사 상세 페이지 자소서 목록 질문 펼치기/접기 기능 구현
  - **기능:** 회사 상세 페이지에서 자소서 목록 조회 시 질문이 기본적으로 한 줄(`line-clamp-1`)로 잘려 표시됨
  - **더보기 버튼:** 질문 텍스트 옆에 **더보기** 버튼으로 전체 질문 표시 가능 (상태 반영)
  - **자동 확장:** 자소서 내용(▼) 펼칠 때는 질문도 자동으로 전체 표시되고 **더보기** 버튼 숨김
  - **상태 관리:** `expandedQ` (개별 질문 펼친 상태) 및 `expandedCL` (자소서 펼친 상태) 분리 관리
- [x] **[2026-06-18]** 경력기술서(Career Description) 기능 구현 완성
  - **UI:** `/experiences` 탭 프로필 카드 바로 아래에 **🏢 경력기술서** 섹션 추가
  - **필드:** 회사명(필수), 직위, 직무, 입사일/퇴직일(YYYY-MM), 재직 중 체크박스, 경력사항 자유 기술
  - **정렬:** 입사일 기준 최신순 자동 정렬
  - **AI 연동:** 자소서 생성 시 경력기술서 전체가 프롬프트에 포함 → Claude가 지원자의 실제 직무 이력을 참고해 더 정확한 자소서 생성
  - **데이터:** `jah_careers` localStorage 키 추가 + `CareerDescription` 새 타입 정의
- [x] **[2026-06-09]** 경력기술서 카드 폰트 크기 정렬 (경험 뱅크 카드와 통일)
  - **문제:** 경력기술서 카드의 회사명(제목)과 직위·직무·기간(부제목)이 경험 뱅크 카드와 다른 크기로 표시됨
  - **분석:** 경험 뱅크 카드는 제목이 크기 미지정(기본), 부제목이 `text-sm`
  - **해결:** 경력기술서 카드에서 제목의 `text-sm` 제거, 부제목을 `text-xs` → `text-sm`으로 변경
  - **결과:** 두 카드의 타이포그래피가 이제 동일하게 정렬됨
- [x] **[2026-06-20]** 잡플래닛 평점 소수점 입력 기능 구현 (별 클릭 + 숫자 입력 지원)
  - **새 컴포넌트:** `StarRating.jsx` — 별 클릭(정수) + 숫자 입력란(소수점) 이중 UI 제공
  - **동작 방식:**
    - 별 클릭 → 1~5 정수 입력 (기존 방식)
    - 숫자 입력란 → `3.7`, `4.2` 등 소수점 직접 입력 후 Enter 또는 포커스 아웃으로 저장
    - 범위 검증: 0~5 범위 자동 클램프, 소수점 1자리로 반올림
    - readonly 모드: 표시 전용으로 숫자 텍스트만 표시
  - **적용 범위:** 대시보드(회사 카드 미리보기), CompanyDetail(기본 정보), Generate(채용공고 자동완성 상단)
  - **저장:** `company.jobplanetRating` (소수점 지원)
- [x] **[2026-06-21]** 잡플래닛 평점 소수점 시각화 기능 완성 (별 그라데이션 표현)
  - **기능:** 소수점 입력 시 별이 해당 비율만큼 색칠되는 시각화
  - **구현:**
    - `PartialStar` 컴포넌트 추가: CSS `background-clip: text` + 그라디언트로 구현
    - 각 별마다 `fill = value - (n-1)` (0~1 범위) 계산
    - `linear-gradient(to right, 노란색 {fill*100}%, 회색 {fill*100}%)` 적용
    - 예시: 3.7이면 4번째 별은 70% 노랑 / 30% 회색으로 정확히 렌더링
  - **동작:** 별 클릭은 여전히 정수 단위, 소수점은 숫자 입력란으로만 입력 가능
- [x] **[2026-06-09]** AI 문항 추천 글자수 선택 기능 추가 (즉시지원 공고 전용)
  - 500·600·700·800·900·1000자 버튼 6개 추가
  - 버튼 선택 시 지원정보 목표 글자수 슬라이더 자동 동기화 (`onLengthChange` prop)
  - 생성된 문항 끝에 `(공백 포함 N~M자)` 형식으로 범위 명시
  - 글자수 버튼 변경 시 기존 추천 목록 자동 초기화
- [x] **[2026-06-09]** 잡플래닛 평점 별 시각화 버그 수정 (CSS 브라우저 호환성)
  - **문제:** `background-clip: text` 그라디언트 방식이 일부 브라우저에서 직사각형으로 표시
  - **해결:** 회색 별 위에 노란 별을 `overflow: hidden` + `width: fill%` 클리핑으로 겹치기
  - **결과:** 모든 브라우저에서 별 모양 유지, 3.5이면 4번째 별이 정확히 절반 노랑
- [x] **[2026-06-23]** CLAUDE.md 문서화 정확도 향상 (실제 코드와 일치하도록 수정)
  - **localStorage 키 수정 (6개):** `jah_draft_length`, `jah_draft_exp_ids`, `jah_draft_result`, `jah_draft_af_length`, `jah_draft_af_rating`, `jah_draft_af_input` 실제 코드 키네이밍과 일치
  - **Profile 필드명 수정:** `desiredRole`→`desiredJob`, `isExperienced`→`careerType`, `techStack`→`skills` 등
  - **CareerDescription 필드명 수정:** `position`→`jobTitle`, `role`→`jobFunction`, `isWorking`→`isCurrent`
  - **프로젝트 구조 업데이트:** `ProfileCard.jsx` 컴포넌트 추가
  - **페이지 기능 설명 최신화:** `/generate`, `/company/:id` 페이지 기능 설명 정확화
- [x] **[2026-06-24]** GitHub 저장소 준비 및 커밋 완료
  - **`.gitignore` 업데이트:** `.claude/settings.local.json`, `*.png` (스크린샷) 추가 제외
  - **커밋:** 세션 전체 기능 추가 및 UI 개선 (commit: 1e8ef5a)
  - **파일 변경:** 10개 파일 수정, ProfileCard.jsx 신규 생성
  - **GitHub 연결:** Personal Access Token을 이용한 `git remote add origin` 및 `git push` 방법 안내

---

## TODO — 다음 작업 우선순위

### 🔴 High (핵심 기능 보완)
- [ ] **GitHub 저장소 연결** — Personal Access Token 발급 후 `git push` 완료
  - https://github.com/settings/tokens → Generate new token (classic) → `repo` 권한
  - `git remote add origin https://github.com/[username]/job-app.git && git branch -M main && git push -u origin main`
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
- [ ] 프로필 카드 초기화 버튼 (현재 수정만 가능, 전체 리셋 불가)

### 🟢 Low (추가 기능)
- [ ] 면접 질문 관리 탭 (회사 상세 페이지)
- [ ] 지원 통계 차트 (월별, 업종별)
- [ ] 자소서 템플릿 저장 기능
- [ ] 키워드 분석 (자소서에서 자주 쓴 단어 시각화)
- [ ] PWA 설정 (오프라인 지원)
- [ ] 경력기술서 import/export (경험 뱅크와 동일한 JSON 백업)

---

## 알려진 이슈 🐛

- Claude API를 브라우저에서 직접 호출 (CORS 허용 헤더 `anthropic-dangerous-direct-browser-access` 사용)
- API 키가 localStorage에 평문 저장됨 (로컬 전용 앱이므로 허용)
- 자소서와 회사의 연결이 company.name 문자열 매칭으로 취약함
  - **개선 예정:** [2026-06-14]에 추가 확인 패널에서 연결된 회사를 찾을 때도 문자열 매칭 사용 중 (향후 ID 기반 연결로 개선 필요)
- **[2026-06-09]** localStorage가 Vite 포트 변경 시 초기화됨 (다른 origin으로 인식 → 5173/5174/5175 포트별 격리)
  - **원인:** 브라우저 localStorage는 protocol + domain + **port** 기준으로 격리됨
  - **해결:** DevTools → Application → Local Storage에서 다른 포트의 데이터 확인 후 콘솔로 복구 가능 (위 "localStorage 복구 가이드" 섹션 참고)
- **[2026-06-09]** 브라우저 캐시 삭제 또는 Windows 저장소 관리(Storage Sense) 자동 실행 시 localStorage 전체 삭제
  - **원인:** Edge 설정의 "검색 데이터 삭제", Windows Storage Sense, PC 재부팅 후 프라이버시 정리 등으로 인한 의도하지 않은 데이터 제거
  - **상태:** 복구 불가능 (localStorage는 브라우저 로컬 저장소로 삭제 후 복원 수단 없음)
  - **해결책:** JSON 백업 기능 구현 완료 (경험 뱅크는 [2026-06-09]에 완료, 회사·자소서는 추후 추가 예정)
- **[2026-06-09]** AI 판별 검사 시 UI 상태 관리 최적화 필요 (수정 시 검사 결과 자동 초기화 구현 완료)
- **[2026-06-12]** Claude API 응답 JSON 파싱 오류 시 재시도 로직 추가 (자소서 본문 특수문자 포함 시 발생하던 오류 일부 해결)
  - **증상:** 특정 자소서 내용(특히 큰따옴표 포함)에서 AI 판별 검사 시 파싱 실패로 검사 불가
  - **상태:** 3단 방어 로직으로 대부분 해결, 극단적인 케이스는 추가 테스트 필요
- **[2026-06-22]** ~~잡플래닛 평점 별 시각화에서 `background-clip: text` + 그라디언트 사용 시 일부 브라우저에서 직사각형으로 표시~~
  - **해결:** 회색 별 위에 노란 별을 `width` 클리핑으로 겹치는 방식으로 변경 완료 (브라우저 호환성 100%)
- **[2026-06-24]** GitHub CLI 미설치 — 개발 환경에서 `gh` 명령어 사용 불가
  - **현황:** PowerShell 및 Bash 환경에서 GitHub CLI(gh) 명령어 인식 안 됨
  - **대체방안:** `git remote add origin` + `git push` 직접 사용 (Personal Access Token 인증)
  - **영향도:** 낮음 (CLI 없어도 git 기본 명령어로 충분)

---

## 개발 명령어

```bash
npm run dev      # 개발 서버 (localhost:5173)
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```

---

## localStorage 복구 가이드 (포트 변경 시)

Vite 개발 서버 포트를 변경하면 (`localhost:5173` → `5174` 등) 브라우저가 다른 origin으로 인식해 localStorage가 격리됩니다.
데이터는 여전히 이전 포트에 남아있으므로 아래 방법으로 복구 가능합니다:

### 1. DevTools 확인
```
F12 → Application → Storage → Local Storage
→ 다른 포트 (예: http://localhost:5174) 확인
```

### 2. 콘솔 명령어로 데이터 추출 (이전 포트 탭에서)
```js
const keys = ['jah_experiences', 'jah_companies', 'jah_cover_letters', 'jah_api_key']
keys.forEach(k => {
  const val = localStorage.getItem(k)
  if (val) console.log(`${k}:`, val)
})
```

### 3. 새 포트 탭에서 복구
```js
// 위에서 복사한 JSON을 붙여넣기
localStorage.setItem('jah_experiences', '여기에 JSON 붙여넣기')
localStorage.setItem('jah_companies', '...')
localStorage.setItem('jah_cover_letters', '...')
localStorage.setItem('jah_api_key', '...')
```

### 4. 페이지 새로고침
```
Ctrl+R (또는 Cmd+R)
```
