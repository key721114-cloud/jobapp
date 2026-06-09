# 취준 도우미 (Job Application Helper)

> **Last Updated:** 2026-06-09 (세션 종료 시 자동 업데이트)
> 이 파일은 세션 종료 시 자동으로 업데이트됩니다.

---

## 프로젝트 개요

취업준비생을 위한 자기소개서 생성 및 지원 관리 웹 애플리케이션.

- **기술 스택:** React 18 + Vite + Tailwind CSS v3 + React Router v6
- **AI:** Claude API (claude-sonnet-4-6) — 자소서 자동 생성
- **백엔드:** Vercel 서버리스 함수 (`api/claude.js`, `api/proxy.js`)
- **데이터:** localStorage (완전 클라이언트, 서버 DB 없음)
- **배포:** GitHub (`key721114-cloud/jobapp`) + Vercel (배포 준비 완료)
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

---

## TODO — 다음 작업 우선순위

### 🔴 High (핵심 기능 보완)
- [ ] **🚀 Vercel 배포 완료** — 코드 준비 완료, 환경변수 설정만 남음
  - [x] `api/claude.js`, `api/proxy.js`, `vercel.json` 생성 완료
  - [x] GitHub push 완료
  - [ ] https://vercel.com → Add New Project → `jobapp` 저장소 연결
  - [ ] Settings → Environment Variables → `ANTHROPIC_API_KEY` = `sk-ant-...` 설정
  - [ ] Redeploy 실행
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

- ~~Claude API를 브라우저에서 직접 호출~~ → **[2026-06-09] 해결:** 서버리스 함수(`api/claude.js`)로 서버사이드 호출로 전환 완료
- ~~API 키가 localStorage에 평문 저장됨~~ → **[2026-06-09] 해결:** 환경변수(`ANTHROPIC_API_KEY`)로 완전 이전, 프론트엔드에서 API 키 제거
- 자소서와 회사의 연결이 `company.name` 문자열 매칭으로 취약함 (향후 ID 기반 연결로 개선 필요)
- **[2026-06-09]** localStorage가 Vite 포트 변경 시 초기화됨 (다른 origin으로 인식 → 5173/5174 포트별 격리)
  - **해결:** `vite.config.js`에 `strictPort: true` 설정으로 포트 고정
- **[2026-06-09]** 브라우저 캐시 삭제 시 localStorage 전체 삭제 (복구 불가)
  - **대책:** JSON 백업 기능 구현 완료 (경험 뱅크), 회사·자소서는 추후 예정
- **[2026-06-12]** Claude API 응답 JSON 파싱 오류 (큰따옴표 포함 자소서에서 발생)
  - **상태:** 3단 방어 로직으로 대부분 해결, 극단적 케이스는 추가 테스트 필요

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
