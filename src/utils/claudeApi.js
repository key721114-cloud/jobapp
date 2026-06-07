function callClaude(apiKey, prompt, maxTokens = 1024, system = null) {
  const body = {
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  }
  if (system) body.system = system

  return fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
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
  // 1순위: Vite 로컬 프록시 (Node.js 서버사이드 → CORS 없음, 브라우저 헤더 사용)
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
    // 로컬 프록시 없으면(빌드 모드 등) 외부 프록시로 fallback
  }

  // 2순위: 외부 CORS 프록시
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
}

export async function extractJobInfo({ apiKey, input }) {
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

  const res = await callClaude(apiKey, prompt, 1024)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || '파싱 실패')
  }

  const text = (await res.json()).content[0].text.trim()
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('응답 파싱 실패')
  return { ...JSON.parse(match[0]), sourceText: rawText }
}

export async function suggestQuestions({ apiKey, company, position, sourceText }) {
  const prompt = `아래 채용공고를 분석해서 이 회사·직무에 맞는 자기소개서 추천 문항 4개를 JSON 배열로만 응답하세요.

[조건]
- 즉시지원 공고처럼 별도 문항이 없는 경우를 위한 추천이므로, 직무·회사 특성을 반영한 문항을 창작하세요
- 한국 기업 자소서에서 실제로 자주 출제되는 형식
- 각 문항 끝에 권장 글자수 표기 (예: ~500자)
- 지원동기, 직무역량, 성장경험, 입사 후 포부 등을 고르게 포함

[채용공고]
회사: ${company}
직무: ${position}
${sourceText ? `\n공고 내용:\n${sourceText.slice(0, 4000)}` : ''}

응답 형식 (JSON 배열만, 다른 텍스트 없이):
["문항1 (~500자)","문항2 (~700자)",...]`

  const res = await callClaude(apiKey, prompt, 1024)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || '추천 실패')
  }

  const text = (await res.json()).content[0].text.trim()
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('응답 파싱 실패')
  return JSON.parse(match[0])
}

export async function generateCoverLetter({ apiKey, company, position, question, experiences, targetLength }) {
  const experienceText = experiences
    .map((exp, i) => `[경험 ${i + 1}] ${exp.title}
- 상황(S): ${exp.situation}
- 과제(T): ${exp.task}
- 행동(A): ${exp.action}
- 결과(R): ${exp.result}`)
    .join('\n\n')

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

  const prompt = `[지원 정보]
- 회사명: ${company}
- 직무: ${position}

[자소서 문항]
${question}

[활용할 경험]
${experienceText}

목표 글자수: ${targetLength}자 내외 (±10% 허용)
자기소개서 답변만 작성하세요 (추가 설명 없이):`

  const response = await callClaude(apiKey, prompt, 4096, system)

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || '생성 실패')
  }

  const data = await response.json()
  return data.content[0].text
}
