# 취준 도우미 (Job Application Helper)

> **Last Updated:** 2026-06-28 (session: 6855e2d9)
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
│   ├── claude.js                    # Claude API 프록시 (node:https 사용, ANTHROPIC_API_KEY 환경변수)
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
  id, name, position, status, deadline, notes, createdAt
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
  - 자소서 생성 시 프로필이 프롬프트에 자동 포함
- **경력기술서 카드** (프로필 카드 바로 아래)
  - 회사명 (필수), 직위, 직무 입력
  - 입사일 / 퇴직일 (YYYY-MM 월 단위 선택)
  - "재직 중" 체크박스 (체크 시 퇴직일 비활성화 → "현재"로 표시)
  - 경력사항 자유 기술 (담당 업무, 프로젝트, 수치 성과 등)
  - 입사일 기준 최신순 자동 정렬
  - 자소서 생성 시 경력기술서 전체가 프롬프트에 포함
- STAR 기법 (Situation / Task / Action / Result) 입력
- 8종 태그: 리더십, 문제해결, 협업, 커뮤니케이션, 도전정신, 성장, 전문성, 책임감
- 태그 필터 + 키워드 검색
- 아코디언 펼침/접힘
- **✨ AI 피드백 버튼** (경험 카드 하단)
  - Claude가 STAR 4개 항목을 분석하여 피드백 제공
  - 상태 표시: ✓ good / ⚠ warning / ✗ error
  - 종합 점수(0~100점) 및 완성도 표시
- **경험 JSON 내보내기/가져오기** (데이터 백업 및 복구 기능)

### `/generate` — 자소서 생성기
- 채용공고 자동완성 (URL/텍스트 → 회사명·직무·문항 자동 추출, 탭 이동 후 복귀 시 상태 유지)
- 즉시지원 공고: **AI 문항 추천** (500·600·700·800·900·1000자 버튼으로 글자수 선택 → 슬라이더 자동 동기화)
- 회사명·직무·문항 입력 (저장된 회사에서 불러오기 가능)
- 글자수 슬라이더 (200~1500자)
- 경험 뱅크에서 소재 다중 선택 (프로필·경력기술서·경험이 모두 프롬프트에 자동 포함)
- **🗑️ 초기화 버튼** (페이지 제목 우측) — 전체 폼 상태 + 자동완성 상태 모두 리셋
- **✨ AI 경험 추천** (경험 선택 섹션 우측 상단)
  - 문항 입력 상태에서만 버튼 노출
  - Claude가 문항·회사·직무를 분석해 가장 적합한 경험 추천
  - 추천된 경험은 보라색 배경 + "✨ 추천" 뱃지 + 추천 이유 표시
  - "추천 모두 선택" 버튼으로 한 번에 체크 가능
- **자소서 생성 프롬프트 규칙**
  - 두괄식 + 도입부에 언제(시점)·어디서(조직명)·어떤 역할로 맥락 자동 포함
  - 수치 없는 성과 문장 금지, 추상적 미덕 나열 금지
  - 마지막 문장을 포부가 아닌 역량·사실로 마무리
- **자소서 중복 방지** — 같은 회사에 이미 저장된 자소서(최대 5개)를 프롬프트 컨텍스트로 자동 포함
  - 저장 버튼 클릭 후 다음 문항 생성 시 이미 쓴 소재·수치·사례 자동 회피
  - 회사명(`company` 필드) 기준으로 매칭 → 회사명 일관성 유지 필요
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

- [x] Vite + React + Tailwind 프로젝트 세팅 / React Router v6 / useLocalStorage 훅
- [x] Navbar / StatusBadge / TagBadge / ProfileCard / StarRating 공용 컴포넌트
- [x] Dashboard — 지원 현황 대시보드 (D-day, 필터, 회사 추가)
- [x] Experiences — STAR 기법 경험 뱅크 (CRUD, 태그, 검색, JSON 백업)
- [x] Generate — 자소서 생성기 (Claude API 연동)
- [x] CompanyDetail — 회사 상세 + 단계 트래커
- [x] **[2026-06-10]** 내 프로필 카드 (기본정보·학력·기술스택·자격증/어학 + 완성도 게이지)
- [x] **[2026-06-11]** 경험 카드 AI 피드백 (STAR 분석 + 종합 점수)
- [x] **[2026-06-11]** 자소서 AI 판별 검사 (GPT Killer + 7가지 패턴 + 점수/등급)
- [x] **[2026-06-12]** 자소서 JSON 파싱 오류 수정 (3단 방어 로직)
- [x] **[2026-06-13]** 채용공고 자동완성 UX 개선 (추천 문항 연속 작성, 글자수 슬라이더 동기화)
- [x] **[2026-06-14]** 자소서 저장 후 확인 패널 (회사 상세 페이지 링크 포함)
- [x] **[2026-06-15]** 자소서 생성 폼 상태 localStorage 유지 (`jah_draft_*`)
- [x] **[2026-06-16]** 자소서 카테고리 뱃지(8종) + 채용공고 자동완성 상태 유지
- [x] **[2026-06-17]** 회사 상세 페이지 자소서 목록 질문 더보기/접기
- [x] **[2026-06-18]** 경력기술서 기능 (CRUD + 자소서 프롬프트 포함)
- [x] **[2026-06-20]** 잡플래닛 평점 소수점 입력 + StarRating 컴포넌트
- [x] **[2026-06-22]** AI 문항 추천 글자수 선택 (500~1000자 버튼 6개)
- [x] **[2026-06-24]** 🗑️ 초기화 버튼 / ✨ AI 경험 추천 기능
- [x] **[2026-06-09]** Vercel 배포 완료 (`key721114-cloud/jobapp`, `ANTHROPIC_API_KEY` 환경변수 설정)
- [x] **[2026-06-25]** 로컬 개발 서버 Claude API 프록시 (`vite.config.js` 미들웨어)
- [x] **[2026-06-28]** Node.js 24 undici ByteString 버그 완전 해결
  - `fetch()` → `node:https.request()` 전환 (`api/claude.js`, `vite.config.js`)
  - API 키 `.trim()` 추가 (헤더 개행문자 제거)
  - `Generate.jsx` ByteString 관련 catch 제거
  - 배포: commit `d5d66c2` (Vercel 자동 재배포)
- [x] **[2026-06-28]** 자소서 생성 프롬프트 개선
  - 언제·어디서·역할 맥락 도입부에 자동 포함 규칙 추가
  - 동일 회사 기저장 자소서 컨텍스트 전달로 소재 중복 방지
  - 배포: commit `7cf0b9b`

---

## TODO — 다음 작업 우선순위

### 🔴 High (핵심 기능 보완)
- [ ] **회사/자소서 JSON import/export** — 경험 뱅크는 완료, 회사·자소서 데이터 백업도 추가 필요
- [ ] **회사별 자소서 연결 개선** — 현재 `company.name` 문자열 매칭 → `company.id` 기반으로 변경
- [ ] 자소서 생성 스트리밍 응답 (현재 단일 요청 → 실시간 타이핑 효과)
- [ ] 자소서 버전 관리 (같은 문항 여러 버전 저장 및 비교)

### 🟡 Medium (UX 개선)
- [ ] **경험 활용 트래킹** — 각 경험이 어떤 자소서에서 몇 번 쓰였는지 표시
- [ ] **경험 강점 분포 시각화** — 태그별 경험 수 레이더/막대 차트
- [ ] 자소서 PDF 내보내기
- [ ] 회사 검색/정렬 기능 (대시보드)
- [ ] 모바일 반응형 최적화
- [ ] 다크 모드 지원

### 🟢 Low (추가 기능)
- [ ] 면접 질문 관리 탭 (회사 상세 페이지)
- [ ] 지원 통계 차트 (월별, 업종별)
- [ ] 자소서 템플릿 저장 기능
- [ ] PWA 설정 (오프라인 지원)
- [ ] 경력기술서 import/export

---

## 알려진 이슈 🐛

- 자소서와 회사의 연결이 `company.name` 문자열 매칭으로 취약함 (향후 ID 기반 연결로 개선 필요)
- 브라우저 캐시 삭제 시 localStorage 전체 삭제 (경험 뱅크는 JSON 백업으로 대응, 회사·자소서는 미구현)
- Claude API 응답 JSON 파싱 오류 (큰따옴표 포함 자소서): 3단 방어 로직으로 대부분 해결, 극단적 케이스는 추가 테스트 필요
- AI 경험 추천 이유 텍스트가 길 경우 레이아웃 개선 여지 있음 (기능 정상 작동)

---

## 개발 명령어

```bash
npm run dev      # 개발 서버 (localhost:5173)
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```

---

## Vercel 배포 가이드

### 환경변수 설정
Settings → Environment Variables:
```
ANTHROPIC_API_KEY = sk-ant-...   ← 앞뒤 공백 없이 키 전체 입력
```
Production / Preview / Development 모두 체크 → 변경 후 반드시 **Redeploy**

### API 키 교체 시
1. Vercel 대시보드 → 프로젝트 → Settings → Environment Variables
2. `ANTHROPIC_API_KEY` 값 수정 → Save
3. Deployments → 최신 배포 `⋯` → Redeploy

### 기술 참고
- `api/claude.js`는 `node:https.request()`를 사용 (undici ByteString 버그 우회)
- API 키는 `.trim()` 처리 후 사용 (개행문자 제거)
- `vite.config.js`의 `claudeApiPlugin`도 동일 방식 적용 (로컬 개발용)

---

## localStorage 복구 가이드 (포트 변경 시)

Vite 포트 변경 시(`localhost:5173` → `5174`) 브라우저가 다른 origin으로 인식해 localStorage 격리.

```js
// 이전 포트 탭 DevTools 콘솔에서 데이터 추출
const keys = ['jah_experiences', 'jah_companies', 'jah_cover_letters', 'jah_profile', 'jah_careers']
keys.forEach(k => { const v = localStorage.getItem(k); if (v) console.log(`${k}:`, v) })

// 새 포트 탭에서 복구
localStorage.setItem('jah_experiences', '여기에 JSON 붙여넣기')
```
