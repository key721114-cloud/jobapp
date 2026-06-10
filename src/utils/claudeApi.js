function parseJsonFromText(text) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('응답 파싱 실패')
  let json = match[0]
  try {
    return JSON.parse(json)
  } catch {
    json = json.replace(/[ --]/g, ' ')
    try {
      return JSON.parse(json)
    } catch {
      json = json.replace(/"((?:[^"\\]|\\.)*)"/g, (_, inner) => {
        const fixed = inner.replace(/(?<!\\)"/g, '\\"')
        return `"${fixed}"`
      })
      return JSON.parse(json)
    }
  }
}

async function parseErrorResponse(res) {
  const text = await res.text().catch(() => '')
  try {
    const err = JSON.parse(text)
    return err.error?.message || err.error || `오류 (${res.status})`
  } catch {
    if (res.status === 404 || res.status === 0) return 'Claude API에 연결할 수 없습니다. 개발 서버를 재시작하거나 .env.local에 ANTHROPIC_API_KEY를 설정하세요.'
    return `Claude API 오류 (${res.status})`
  }
}

function callClaude(prompt, maxTokens = 1024, system = null) {
  const body = {
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  }
  if (system) body.system = system

  return fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 12000)
}

async function fetchViaProxy(url) {
  try {
    try {
      const localRes = await fetch(
        `/api/proxy?url=${encodeURIComponent(url)}`,
        { signal: AbortSignal.timeout(12000) }
      )
      if (localRes.ok) {
        const data = await localRes.json()
        if (data?.contents && data.contents.length > 500) return data.contents
      }
    } catch {
      // fallback to external proxies
    }

    const externalProxies = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    ]
    for (const proxy of externalProxies) {
      try {
        const res = await fetch(proxy, { signal: AbortSignal.timeout(8000) })
        if (!res.ok) continue
        const data = await res.json().catch(() => null)
        const html = data?.contents ?? (typeof data === 'string' ? data : null)
        if (html && html.length > 500) return html
      } catch {
        continue
      }
    }
    return null
  } catch {
    return null
  }
}

export async function extractJobInfo({ input }) {
  const isUrl = /^https?:\/\//i.test(input.trim())

  let rawText = input
  if (isUrl) {
    const html = await fetchViaProxy(input.trim())
    if (!html) throw new Error('PROXY_FAIL')
    rawText = stripHtml(html)
  }

  const prompt = `아래 채용공고 내용에서 정보를 추출하여 반드시 JSON 형식으로만 응답하세요.

추출 항목:
- company: 회사명 (string)
- position: 직무명 (string)
- questions: 자기소개서 문항 배열 (string[]) — 지원자가 직접 작성해야 하는 질문만 포함. 없으면 []

채용공고:
${rawText}

응답 형식 (JSON만, 다른 텍스트 없이):
{"company":"...","position":"...","questions":["문항1","문항2"]}`

  const res = await callClaude(prompt, 1024)
  if (!res.ok) throw new Error(await parseErrorResponse(res))

  const text = (await res.json()).content[0].text.trim()
  return { ...parseJsonFromText(text), sourceText: rawText }
}

export async function suggestQuestions({ company, position, sourceText, targetLength = 500 }) {
  const minLength = targetLength - 100
  const prompt = `아래 채용공고를 분석해서 이 회사·직무에 맞는 자기소개서 추천 문항 4개를 JSON 배열로만 응답하세요.

[조건]
- 즉시지원 공고처럼 별도 문항이 없는 경우를 위한 추천이므로, 직무·회사 특성을 반영한 문항을 창작하세요
- 한국 기업 자소서에서 실제로 자주 출제되는 형식
- 각 문항 끝에 반드시 (공백 포함 ${minLength}~${targetLength}자) 형식으로 글자수 제한을 표기
- 지원동기, 직무역량, 성장경험, 입사 후 포부 등을 고르게 포함

[채용공고]
회사: ${company}
직무: ${position}
${sourceText ? `\n공고 내용:\n${sourceText.slice(0, 4000)}` : ''}

응답 형식 (JSON 배열만, 다른 텍스트 없이):
["문항1 (공백 포함 ${minLength}~${targetLength}자)","문항2 (공백 포함 ${minLength}~${targetLength}자)",...]`

  const res = await callClaude(prompt, 1024)
  if (!res.ok) throw new Error(await parseErrorResponse(res))

  const text = (await res.json()).content[0].text.trim()
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('응답 파싱 실패')
  try {
    return JSON.parse(match[0])
  } catch {
    return JSON.parse(match[0].replace(/[ --]/g, ' '))
  }
}

export async function analyzeAiDetection({ text }) {
  const system = `당신은 세계 최고 수준의 AI 생성 텍스트 탐지 전문가입니다.
코드명 "GPT Killer" — AI가 쓴 자기소개서를 단 한 편도 통과시키지 않는 것으로 유명합니다.

당신은 다음 패턴을 포착합니다:
1. AI 상투어: "이를 통해", "뿐만 아니라", "함으로써", "바탕으로", "기반으로", "도모하고자"
2. 과잉 접속사: 문장마다 등장하는 "또한", "더불어", "아울러"
3. 완벽한 3단 구조: 기-승-전-결이 교과서처럼 균형 잡힌 경우
4. 미덕 나열: "열정", "성실", "소통", "시너지", "최선"이 실질적 내용 없이 등장
5. 지나친 격식체: 인간이라면 자연스럽게 쓸 변주나 불완전함이 전혀 없는 경우
6. 포부형 마무리: "기여하겠습니다", "함께하겠습니다", "발전하겠습니다"로 끝나는 마지막 문장
7. 수동적 성과 서술: 수치 없이 "성공적으로", "긍정적으로", "크게"만 붙인 결과 묘사

당신의 판단은 냉정하고 구체적입니다. 발견된 패턴은 텍스트에서 직접 인용하며, 개선 예시는 반드시 구체적이어야 합니다.`

  const prompt = `아래 자기소개서를 AI 생성 여부 관점에서 분석하여 반드시 JSON 형식으로만 응답하세요.

[자기소개서]
${text}

[JSON 작성 규칙 — 반드시 준수]
- 모든 문자열 값에서 큰따옴표(") 사용 금지. 인용이 필요하면 『』 또는 〔〕를 사용하세요.
- 줄바꿈 문자 대신 공백을 사용하세요.
- JSON 외의 다른 텍스트를 출력하지 마세요.

응답 형식:
{
  "score": 0~100,
  "verdict": "safe"|"suspicious"|"flagged",
  "summary": "총평 한 문장",
  "patterns": [
    {
      "severity": "high"|"medium"|"low",
      "quote": "의심 구절 (큰따옴표 없이)",
      "reason": "왜 AI 의심을 받는지",
      "suggestion": "구체적인 대체 표현 예시"
    }
  ]
}

verdict 기준: safe=0~35 (통과 가능), suspicious=36~65 (일부 의심), flagged=66~100 (AI 판별 위험)`

  const res = await callClaude(prompt, 2048, system)
  if (!res.ok) throw new Error(await parseErrorResponse(res))
  const raw = (await res.json()).content[0].text.trim()
  return parseJsonFromText(raw)
}

export async function recommendExperiences({ question, company, position, experiences }) {
  if (!experiences?.length) throw new Error('경험이 없습니다')

  const expList = experiences
    .map((exp, i) => [
      `[${i}] ${exp.title}`,
      `태그: ${exp.tags?.join(', ') || '없음'}`,
      exp.situation ? `S: ${exp.situation.slice(0, 150)}` : null,
      exp.action ? `A: ${exp.action.slice(0, 150)}` : null,
      exp.result ? `R: ${exp.result.slice(0, 100)}` : null,
    ].filter(Boolean).join('\n'))
    .join('\n\n')

  const prompt = `아래 자소서 문항에 가장 적합한 경험들을 추천해주세요.

[지원 정보]
회사: ${company || '미입력'}
직무: ${position || '미입력'}

[자소서 문항]
${question}

[경험 목록]
${expList}

위 경험 목록 중 이 자소서 문항과 관련성 높은 경험들을 선택하고, 추천 이유를 한 줄로 작성하세요.
반드시 JSON 형식으로만 응답하세요. 다른 텍스트는 출력하지 마세요.

응답 형식:
{"recommended":[{"index":0,"reason":"추천 이유"},{"index":2,"reason":"추천 이유"}]}`

  const res = await callClaude(prompt, 1024)
  if (!res.ok) throw new Error(await parseErrorResponse(res))
  const text = (await res.json()).content[0].text.trim()
  return parseJsonFromText(text)
}

export async function analyzeExperience({ exp }) {
  const prompt = `아래 STAR 기법으로 작성된 경험을 분석하여 반드시 JSON 형식으로만 응답하세요.

[경험]
제목: ${exp.title}
S(상황): ${exp.situation || '(미작성)'}
T(과제): ${exp.task || '(미작성)'}
A(행동): ${exp.action || '(미작성)'}
R(결과): ${exp.result || '(미작성)'}

[분석 기준]
- situation: 배경과 맥락이 구체적인가? 독자가 상황을 이해할 수 있는가?
- task: 본인의 역할과 목표가 명확한가?
- action: 구체적인 행동 동사를 썼는가? 추상적 표현("노력했다", "기여했다", "소통했다")은 없는가?
- result: 수치가 포함되어 있는가? 없다면 반드시 warning/error로 처리할 것

각 항목 status 기준:
- "good": 충분히 구체적이고 완성도 높음
- "warning": 아쉬운 부분이 있지만 사용 가능
- "error": 반드시 보완 필요 (미작성, 수치 없는 결과, 지나치게 추상적)

응답 형식 (JSON만, 다른 텍스트 없이):
{
  "score": 0~100,
  "items": [
    {"key":"situation","status":"good"|"warning"|"error","feedback":"한 줄 평가","suggestion":"개선 예시 (good이면 null)"},
    {"key":"task","status":"...","feedback":"...","suggestion":"..."},
    {"key":"action","status":"...","feedback":"...","suggestion":"..."},
    {"key":"result","status":"...","feedback":"...","suggestion":"..."}
  ]
}`

  const res = await callClaude(prompt, 1024)
  if (!res.ok) throw new Error(await parseErrorResponse(res))
  const text = (await res.json()).content[0].text.trim()
  return parseJsonFromText(text)
}

function buildProfileText(profile) {
  if (!profile) return ''
  const lines = []
  if (profile.name) lines.push(`이름: ${profile.name}`)
  if (profile.careerType) {
    const career = profile.careerType === 'new' ? '신입' : `경력 ${profile.yearsOfExperience || ''}년차`
    lines.push(`경력 구분: ${career}`)
  }
  if (profile.desiredJob) lines.push(`희망 직무: ${profile.desiredJob}`)
  if (profile.desiredIndustry) lines.push(`희망 업종: ${profile.desiredIndustry}`)
  if (profile.educationLevel || profile.school || profile.major) {
    const gradLabel = { graduated: '졸업', enrolled: '재학 중', expected: '졸업예정', leave: '휴학 중' }[profile.graduationStatus] || ''
    lines.push(`학력: ${profile.educationLevel || ''} ${profile.school || ''} ${profile.major || ''} ${gradLabel}`.trim())
  }
  if (profile.skills?.length > 0) lines.push(`기술 스택: ${profile.skills.join(', ')}`)
  if (profile.certifications) lines.push(`자격증: ${profile.certifications}`)
  if (profile.languages) lines.push(`어학: ${profile.languages}`)
  return lines.length > 0 ? `[지원자 프로필]\n${lines.join('\n')}` : ''
}

function buildCareerText(careers) {
  if (!careers?.length) return ''
  const lines = careers
    .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))
    .map((c, i) => {
      const period = `${(c.startDate || '').replace('-', '.')} ~ ${c.isCurrent ? '현재' : (c.endDate || '').replace('-', '.')}`
      const header = `[경력 ${i + 1}] ${c.company} / ${c.jobTitle}${c.jobFunction ? ' / ' + c.jobFunction : ''} (${period})`
      return c.description ? `${header}\n${c.description}` : header
    })
    .join('\n\n')
  return `[경력기술서]\n${lines}`
}

export async function generateCoverLetter({ company, position, question, experiences, targetLength, profile, careers, existingCoverLetters = [] }) {
  const experienceText = experiences
    .map((exp, i) => `[경험 ${i + 1}] ${exp.title}
- 상황(S): ${exp.situation}
- 과제(T): ${exp.task}
- 행동(A): ${exp.action}
- 결과(R): ${exp.result}`)
    .join('\n\n')

  const profileText = buildProfileText(profile)
  const careerText = buildCareerText(careers)

  const system = `당신은 취업준비생의 자기소개서 작성을 돕는 전문가입니다.
아래 규칙을 반드시 준수하여 자기소개서를 작성하세요.

[작성 규칙]

1. 문체 기준
- 도입부 없이 상황과 행동으로 바로 시작할 것
  ("저는 평소에~", "어릴 때부터~", "귀사에 지원하게 된 동기는~" 금지)
- 동사는 반드시 구체적으로 쓸 것
  ("노력했습니다", "기여했습니다" 금지 → "도출했습니다", "단축했습니다", "확보했습니다" 등으로 대체)
- 문장마다 "저는"으로 시작하는 것을 반복하지 말 것
- 기승전결이 교과서처럼 완벽한 3단 구성을 지양할 것

2. 내용 기준
- 경험의 배경(언제·어디서·어떤 역할로)을 도입 1~2문장 안에 자연스럽게 포함할 것
  예) "A기관에서 B사업을 담당하던 2023년", "C팀 팀장으로서 3년간"
  독자가 상황을 이해할 수 있는 최소한의 시점·조직·역할 정보는 생략하지 말 것
- 모든 성과 문장에는 반드시 수치를 포함할 것
  수치가 없으면 그 성과 문장은 쓰지 말 것
- 추상적 미덕 나열 금지
  ("소통", "열정", "시너지", "최선을 다해", "성장하겠습니다" 사용 금지)
- 한 문장에 하나의 행동만 담을 것
  접속사로 여러 행동을 나열하지 말 것
- 마지막 문장은 포부가 아닌 사실이나 역량으로 끝낼 것
  ("기여하겠습니다", "함께하겠습니다" 로 끝나는 마무리 금지)

3. 구조 기준
- 경험 뱅크에서 선택한 소재만 사용할 것
  없는 경험이나 수치를 임의로 만들어내지 말 것
- 행동 → 수치 → 의미 순서로 문장을 구성할 것
- 목표 글자수에 맞게 작성하되, 분량을 채우기 위한
  빈 문장(의미 없는 수식어, 중복 표현)은 절대 넣지 말 것

[참고 문체 샘플 - 아래 문장의 어조와 표현 방식을 따를 것]
"산업부의 K-ESG 가이드라인을 분석하여 중소기업 현실에 맞는 24개 평가 지표를 도출했고, 엑셀과 PPT를 활용한 프로토타이핑으로 개발 기간을 4개월 단축시키며 시장 선점의 발판을 마련했습니다."
"다발적 이슈에 대한 유연한 위기 관리로 연간 734회의 집합 교육을 안정적으로 운영하고, 교육 매출 약 18억 원을 달성했습니다.(KPI 125%)"
"3년간 정부 위탁사업을 운영하며 민원 발생 0건이라는 기록을 달성했습니다."`

  const existingClText = existingCoverLetters.length > 0
    ? `[이미 작성 완료된 자소서 — 아래 소재·사례와 중복 금지]\n${
        existingCoverLetters.slice(-5).map((cl) =>
          `▷ 문항: ${cl.question}\n내용: ${cl.content.slice(0, 500)}`
        ).join('\n\n')
      }\n\n위 자소서에서 이미 쓴 경험, 수치, 사례를 이번 답변에 다시 사용하지 마세요. 선택된 경험 소재 안에서 다른 측면이나 다른 에피소드를 발굴하세요.\n`
    : ''

  const prompt = `${profileText ? profileText + '\n\n' : ''}${careerText ? careerText + '\n\n' : ''}${existingClText ? existingClText + '\n' : ''}[지원 정보]
- 회사명: ${company}
- 직무: ${position}

[자소서 문항]
${question}

[활용할 경험]
${experienceText}

목표 글자수: ${targetLength}자 내외 (±10% 허용)
자기소개서 답변만 작성하세요 (추가 설명 없이):`

  const response = await callClaude(prompt, 4096, system)

  if (!response.ok) throw new Error(await parseErrorResponse(response))

  const data = await response.json()
  return data.content[0].text
}
