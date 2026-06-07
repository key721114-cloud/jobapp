# 취준 도우미 (Job Application Helper)

> **Last Updated:** 2026-06-07
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
│   │   └── TagBadge.jsx             # 경험 태그 뱃지 + AVAILABLE_TAGS
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
| `jah_experiences` | `Experience[]` | STAR 기법 경험 목록 |
| `jah_companies` | `Company[]` | 지원 회사 목록 |
| `jah_cover_letters` | `CoverLetter[]` | 생성된 자소서 목록 |
| `jah_api_key` | `string` | Claude API 키 |

```ts
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
- STAR 기법 (Situation / Task / Action / Result) 입력
- 8종 태그: 리더십, 문제해결, 협업, 커뮤니케이션, 도전정신, 성장, 전문성, 책임감
- 태그 필터 + 키워드 검색
- 아코디언 펼침/접힘

### `/generate` — 자소서 생성기
- 회사명·직무·문항 입력 (저장된 회사에서 불러오기 가능)
- 글자수 슬라이더 (200~1500자)
- 경험 뱅크에서 소재 다중 선택
- Claude API 스트리밍 없이 단일 요청으로 생성
- 결과 직접 수정 가능, 복사·저장 기능
- API 키 미설정 시 안내 배너 표시

### `/company/:id` — 회사 상세
- 마감일, 상태, 메모 인라인 수정 (자동 저장)
- 지원 단계 시각적 트래커 (5단계)
- 해당 회사 자소서 목록 + 내용 펼침/복사

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
- [x] CLAUDE.md 자동 업데이트 Stop 훅 설정

---

## TODO — 다음 작업 우선순위

### 🔴 High (핵심 기능 보완)
- [ ] 자소서 생성 스트리밍 응답 (현재 단일 요청 → 실시간 타이핑 효과)
- [ ] 회사별 자소서 연결 개선 (현재 회사명 문자열 매칭 → company ID 기반)
- [ ] 경험 뱅크 드래그 앤 드롭 순서 변경
- [ ] 자소서 버전 관리 (같은 문항 여러 버전 저장)

### 🟡 Medium (UX 개선)
- [ ] 다크 모드 지원
- [ ] 자소서 목표 글자수 진행률 시각화 (원형 게이지)
- [ ] 회사 검색/정렬 기능 (대시보드)
- [ ] 경험 import/export (JSON 백업)
- [ ] 자소서 PDF 내보내기
- [ ] 모바일 반응형 최적화

### 🟢 Low (추가 기능)
- [ ] 면접 질문 관리 탭 (회사 상세 페이지)
- [ ] 지원 통계 차트 (월별, 업종별)
- [ ] 자소서 템플릿 저장 기능
- [ ] 키워드 분석 (자소서에서 자주 쓴 단어 시각화)
- [ ] PWA 설정 (오프라인 지원)

---

## 알려진 이슈 🐛

- Claude API를 브라우저에서 직접 호출 (CORS 허용 헤더 `anthropic-dangerous-direct-browser-access` 사용)
- API 키가 localStorage에 평문 저장됨 (로컬 전용 앱이므로 허용)
- 자소서와 회사의 연결이 company.name 문자열 매칭으로 취약함

---

## 개발 명령어

```bash
npm run dev      # 개발 서버 (localhost:5173)
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```
