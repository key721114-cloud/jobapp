import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { generateCoverLetter, extractJobInfo, suggestQuestions, analyzeAiDetection } from '../utils/claudeApi'
import TagBadge from '../components/TagBadge'
import StarRating from '../components/StarRating'
import { generateId } from '../utils/storage'

function cleanCompanyName(name) {
  return name
    .replace(/㈜/g, '')
    .replace(/\(주\)/gi, '')
    .replace(/\(유\)/gi, '')
    .replace(/^주식회사\s*/g, '')
    .replace(/\s*주식회사$/g, '')
    .replace(/^유한회사\s*/g, '')
    .replace(/\s*유한회사$/g, '')
    .trim()
}

function jobplanetUrl(companyName) {
  return `https://www.jobplanet.co.kr/search?query=${encodeURIComponent(cleanCompanyName(companyName))}`
}

function ApiKeyBanner({ apiKey, onChange }) {
  const [show, setShow] = useState(false)
  const [input, setInput] = useState('')

  if (apiKey) return null

  return (
    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
      <p className="text-sm font-semibold text-amber-800">⚠️ Claude API 키가 필요합니다</p>
      <p className="text-xs text-amber-600 mt-1 mb-3">자소서 생성을 위해 Anthropic API 키를 입력하세요</p>
      <div className="flex gap-2">
        <input
          type={show ? 'text' : 'password'}
          className="flex-1 border border-amber-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          placeholder="sk-ant-..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button
          onClick={() => setShow(s => !s)}
          className="px-3 py-1.5 border border-amber-300 rounded-lg text-xs text-amber-700 hover:bg-amber-100"
        >
          {show ? '숨김' : '표시'}
        </button>
        <button
          onClick={() => { if (input) onChange(input) }}
          className="px-4 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700"
        >
          저장
        </button>
      </div>
    </div>
  )
}

const PROXY_FAIL_MSG = '채용포털이 외부 접근을 차단했습니다. 아래 텍스트 모드로 공고 내용을 직접 붙여넣어 주세요.'

function JobAutoFill({ apiKey, onFill, onLengthChange, companies, setCompanies, formRef }) {
  const [mode, setMode] = useLocalStorage('jah_draft_af_mode', 'url')
  const [input, setInput] = useLocalStorage('jah_draft_af_input', '')
  const [extracted, setExtracted] = useLocalStorage('jah_draft_af_extracted', null)
  const [pendingRating, setPendingRating] = useLocalStorage('jah_draft_af_rating', 0)
  const [suggestedQs, setSuggestedQs] = useLocalStorage('jah_draft_af_suggested', [])
  const [suggestLength, setSuggestLength] = useLocalStorage('jah_draft_af_length', 500)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suggesting, setSuggesting] = useState(false)
  const sourceTextRef = useRef(extracted?.sourceText ?? '')

  const isUrl = /^https?:\/\//i.test(input.trim())

  const handleExtract = async () => {
    if (!apiKey) { setError('API 키를 먼저 입력해주세요'); return }
    if (!input.trim()) return
    setLoading(true)
    setError('')
    setExtracted(null)
    setPendingRating(0)
    setSuggestedQs([])
    try {
      const result = await extractJobInfo({ apiKey, input: input.trim() })
      const { sourceText, ...rest } = result
      sourceTextRef.current = sourceText ?? ''
      setExtracted(rest)
      const existing = companies.find(c => c.name === result.company)
      if (existing?.jobplanetRating) setPendingRating(existing.jobplanetRating)
    } catch (e) {
      if (e.message === 'PROXY_FAIL') {
        setError(PROXY_FAIL_MSG)
        setMode('text')
        setInput('')
      } else {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const saveRating = (rating) => {
    setPendingRating(rating)
    if (!extracted?.company) return
    setCompanies(prev => prev.map(c =>
      c.name === extracted.company ? { ...c, jobplanetRating: rating } : c
    ))
  }

  const handleSuggest = async () => {
    setSuggesting(true)
    setSuggestedQs([])
    try {
      const qs = await suggestQuestions({
        apiKey,
        company: extracted.company,
        position: extracted.position,
        sourceText: sourceTextRef.current,
        targetLength: suggestLength,
      })
      setSuggestedQs(qs)
    } catch (e) {
      setError(`추천 실패: ${e.message}`)
    } finally {
      setSuggesting(false)
    }
  }

  const handleApply = (q) => {
    onFill({ company: extracted.company, position: extracted.position, question: q })
    setTimeout(() => formRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-semibold text-indigo-900 text-sm">🔗 채용공고 자동완성</h2>
          <p className="text-xs text-indigo-500 mt-0.5">URL 또는 공고 텍스트를 붙여넣으면 회사명·직무·문항을 자동으로 채웁니다</p>
        </div>
        <div className="flex gap-1 bg-white border border-indigo-200 rounded-lg p-0.5">
          {['url', 'text'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setInput(''); setExtracted(null); setError('') }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors
                ${mode === m ? 'bg-indigo-600 text-white' : 'text-indigo-500 hover:text-indigo-700'}`}
            >
              {m === 'url' ? '🌐 URL' : '📋 텍스트'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        {mode === 'url' ? (
          <input
            className="flex-1 border border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="https://www.wanted.co.kr/wd/... 또는 saramin, jobkorea 링크"
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleExtract()}
          />
        ) : (
          <textarea
            rows={3}
            className="flex-1 border border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            placeholder="채용공고 페이지의 전체 텍스트를 복사해서 붙여넣으세요 (회사명, 직무, 자소서 문항 포함)"
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
          />
        )}
        <button
          onClick={handleExtract}
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 self-start"
        >
          {loading
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : '✨'}
          {loading ? '분석 중...' : '자동완성'}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {extracted && (
        <div className="mt-3 bg-white border border-indigo-200 rounded-xl p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="font-semibold text-gray-800">{extracted.company || '—'}</p>
              <p className="text-sm text-gray-500">{extracted.position || '—'}</p>
            </div>
            <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-medium">추출 완료</span>
          </div>

          {/* 잡플래닛 섹션 */}
          {extracted.company && (
            <div className="flex items-center gap-3 mb-3 p-2.5 bg-blue-50 border border-blue-100 rounded-lg">
              <img
                src="https://www.jobplanet.co.kr/favicon.ico"
                alt="잡플래닛"
                className="w-4 h-4 flex-shrink-0"
                onError={e => { e.target.style.display = 'none' }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-blue-700">잡플래닛 평점</span>
                  <StarRating value={pendingRating} onChange={saveRating} size="sm" />
                  {pendingRating === 0 && (
                    <span className="text-xs text-gray-400">직접 확인 후 입력</span>
                  )}
                </div>
                {companies.find(c => c.name === extracted.company) && pendingRating > 0 && (
                  <p className="text-xs text-blue-500 mt-0.5">회사 정보에 저장됨</p>
                )}
              </div>
              <a
                href={jobplanetUrl(extracted.company)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                바로가기 ↗
              </a>
            </div>
          )}

          {extracted.questions?.length > 0 ? (
            <>
              <p className="text-xs font-semibold text-gray-500 mb-2">자소서 문항 — 클릭하면 바로 적용됩니다</p>
              <div className="space-y-1.5">
                {extracted.questions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleApply(q)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 hover:border-indigo-300 rounded-lg transition-colors"
                  >
                    <span className="text-indigo-400 font-bold mr-1.5">Q{i + 1}.</span>{q}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div>
              <p className="text-xs text-gray-400 mb-2">즉시지원 공고 — 별도 자소서 문항이 없습니다</p>

              {/* 글자수 선택 */}
              <div className="mb-2">
                <p className="text-xs font-medium text-gray-500 mb-1.5">문항 글자수 선택</p>
                <div className="flex gap-1.5 flex-wrap">
                  {[500, 600, 700, 800, 900, 1000].map(len => (
                    <button
                      key={len}
                      onClick={() => { setSuggestLength(len); setSuggestedQs([]); onLengthChange?.(len) }}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all
                        ${suggestLength === len
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'}`}
                    >
                      {len}자
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleApply('')}
                  className="px-2.5 py-1 border border-gray-300 text-gray-600 text-xs rounded-lg hover:bg-gray-50"
                >
                  직접 입력
                </button>
                <button
                  onClick={handleSuggest}
                  disabled={suggesting}
                  className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {suggesting
                    ? <><span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />추천 중...</>
                    : <>✨ AI 문항 추천</>}
                </button>
              </div>

              {suggestedQs.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-indigo-600 mb-1.5">
                    ✨ AI 추천 문항 — 클릭하면 바로 적용됩니다
                  </p>
                  {suggestedQs.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleApply(q)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-400 rounded-lg transition-colors"
                    >
                      <span className="text-indigo-500 font-bold mr-1.5">Q{i + 1}.</span>{q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const VERDICT_CONFIG = {
  safe:       { label: '통과 가능',      bg: 'bg-green-50',  border: 'border-green-300', text: 'text-green-700', bar: 'bg-green-500',  icon: '🛡️' },
  suspicious: { label: '일부 의심 패턴', bg: 'bg-amber-50',  border: 'border-amber-300', text: 'text-amber-700', bar: 'bg-amber-400',  icon: '⚠️' },
  flagged:    { label: 'AI 판별 위험',   bg: 'bg-rose-50',   border: 'border-rose-300',  text: 'text-rose-700',  bar: 'bg-rose-500',   icon: '🚨' },
}
const SEVERITY_COLOR = {
  high:   { badge: 'bg-rose-100 text-rose-700 border-rose-200',   dot: 'bg-rose-500'  },
  medium: { badge: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  low:    { badge: 'bg-gray-100 text-gray-600 border-gray-200',    dot: 'bg-gray-400'  },
}
const SEVERITY_LABEL = { high: '높음', medium: '중간', low: '낮음' }

function AiDetectionPanel({ detection }) {
  const cfg = VERDICT_CONFIG[detection.verdict] ?? VERDICT_CONFIG.suspicious
  return (
    <div className={`mt-4 rounded-xl border ${cfg.border} overflow-hidden`}>
      {/* 헤더 */}
      <div className={`${cfg.bg} px-4 py-3`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">{cfg.icon}</span>
            <span className={`text-sm font-bold ${cfg.text}`}>GPT Killer 판별 결과 — {cfg.label}</span>
          </div>
          <span className={`text-lg font-black ${cfg.text}`}>{detection.score}점</span>
        </div>
        <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${cfg.bar}`}
            style={{ width: `${detection.score}%` }}
          />
        </div>
        <p className={`mt-2 text-xs ${cfg.text} opacity-80`}>{detection.summary}</p>
      </div>

      {/* 패턴 목록 */}
      {detection.patterns?.length > 0 && (
        <div className="divide-y divide-gray-100 bg-white">
          {detection.patterns.map((p, i) => {
            const sc = SEVERITY_COLOR[p.severity] ?? SEVERITY_COLOR.medium
            return (
              <div key={i} className="p-4">
                <div className="flex items-start gap-2 mb-1.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${sc.badge} flex-shrink-0`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                    {SEVERITY_LABEL[p.severity]}
                  </span>
                  <p className="text-xs text-gray-500 leading-relaxed">{p.reason}</p>
                </div>
                {p.quote && (
                  <blockquote className="my-1.5 pl-3 border-l-2 border-gray-300 text-xs text-gray-500 italic">
                    "{p.quote}"
                  </blockquote>
                )}
                {p.suggestion && (
                  <div className="mt-1.5 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <p className="text-xs text-indigo-700 leading-relaxed">
                      <span className="font-semibold">개선 예시 →</span> {p.suggestion}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {detection.patterns?.length === 0 && (
        <div className="bg-white px-4 py-6 text-center">
          <p className="text-sm text-green-600 font-medium">감지된 AI 패턴이 없습니다.</p>
          <p className="text-xs text-gray-400 mt-1">자연스러운 인간적 표현으로 잘 작성되었습니다.</p>
        </div>
      )}
    </div>
  )
}

export default function Generate() {
  const navigate = useNavigate()
  const [experiences] = useLocalStorage('jah_experiences', [])
  const [companies, setCompanies] = useLocalStorage('jah_companies', [])
  const [coverLetters, setCoverLetters] = useLocalStorage('jah_cover_letters', [])
  const [apiKey, setApiKey] = useLocalStorage('jah_api_key', import.meta.env.VITE_DEMO_API_KEY || '')
  const [profile] = useLocalStorage('jah_profile', null)
  const [careers] = useLocalStorage('jah_careers', [])

  const [company, setCompany] = useLocalStorage('jah_draft_company', '')
  const [position, setPosition] = useLocalStorage('jah_draft_position', '')
  const [question, setQuestion] = useLocalStorage('jah_draft_question', '')
  const [targetLength, setTargetLength] = useLocalStorage('jah_draft_length', 500)
  const [selectedExpIds, setSelectedExpIds] = useLocalStorage('jah_draft_exp_ids', [])
  const [result, setResult] = useLocalStorage('jah_draft_result', '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savedId, setSavedId] = useState(null)
  const [detection, setDetection] = useState(null)
  const [detecting, setDetecting] = useState(false)

  const formRef = useRef(null)

  const handleAutoFill = ({ company: c, position: p, question: q }) => {
    if (c) setCompany(c)
    if (p) setPosition(p)
    if (q) setQuestion(q)
  }

  const toggleExp = (id) => {
    setSelectedExpIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const selectedExps = experiences.filter(e => selectedExpIds.includes(e.id))

  const handleGenerate = async () => {
    if (!apiKey) { setError('API 키를 먼저 입력해주세요'); return }
    if (!company || !position || !question) { setError('회사명, 직무, 문항을 모두 입력해주세요'); return }
    if (selectedExpIds.length === 0) { setError('최소 1개의 경험을 선택해주세요'); return }

    setLoading(true)
    setError('')
    setResult('')
    setSavedId(null)
    setDetection(null)

    try {
      const text = await generateCoverLetter({ apiKey, company, position, question, experiences: selectedExps, targetLength, profile, careers })
      setResult(text)
    } catch (e) {
      setError(`생성 실패: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    const id = generateId()
    const cl = {
      id,
      company,
      position,
      question,
      targetLength,
      content: result,
      selectedExperienceIds: selectedExpIds,
      createdAt: new Date().toISOString(),
    }
    setCoverLetters(prev => [...prev, cl])
    setSavedId(id)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
  }

  const handleDetect = async () => {
    if (!result) return
    setDetecting(true)
    setDetection(null)
    try {
      const res = await analyzeAiDetection({ apiKey, text: result })
      setDetection(res)
    } catch (e) {
      setError(`AI 판별 실패: ${e.message}`)
    } finally {
      setDetecting(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">자소서 생성기</h1>
        <p className="text-sm text-gray-500 mt-0.5">경험을 선택하고 Claude AI로 자소서를 생성하세요</p>
      </div>

      <ApiKeyBanner apiKey={apiKey} onChange={setApiKey} />
      <JobAutoFill apiKey={apiKey} onFill={handleAutoFill} onLengthChange={setTargetLength} companies={companies} setCompanies={setCompanies} formRef={formRef} />

      <div ref={formRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 좌측: 입력 */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">📋 지원 정보</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">회사명 *</label>
                <div className="flex gap-2 mt-1">
                  <input
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="예) 카카오"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                  />
                  {companies.length > 0 && (
                    <select
                      className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      onChange={e => {
                        const c = companies.find(c => c.id === e.target.value)
                        if (c) { setCompany(c.name); setPosition(c.position) }
                      }}
                      defaultValue=""
                    >
                      <option value="">불러오기</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">직무 *</label>
                <input
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="예) 프론트엔드 개발"
                  value={position}
                  onChange={e => setPosition(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">자소서 문항 *</label>
                <textarea
                  rows={3}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  placeholder="예) 본인이 경험한 가장 어려운 도전과 극복 과정을 서술하시오."
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  목표 글자수: <span className="text-indigo-600 font-bold">{targetLength}자</span>
                </label>
                <input
                  type="range"
                  min={200}
                  max={1500}
                  step={50}
                  className="mt-1 w-full accent-indigo-600"
                  value={targetLength}
                  onChange={e => setTargetLength(Number(e.target.value))}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>200자</span><span>1500자</span>
                </div>
              </div>
            </div>
          </div>

          {/* 경험 선택 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-1">💼 활용할 경험 선택 *</h2>
            <p className="text-xs text-gray-400 mb-3">선택한 경험을 바탕으로 자소서를 생성합니다</p>

            {experiences.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                저장된 경험이 없습니다. 먼저 경험 뱅크에 경험을 추가하세요.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {experiences.map(exp => {
                  const selected = selectedExpIds.includes(exp.id)
                  return (
                    <button
                      key={exp.id}
                      onClick={() => toggleExp(exp.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all
                        ${selected ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5
                          ${selected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                          {selected && <span className="text-white text-xs leading-none">✓</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{exp.title}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{exp.result}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {exp.tags?.map(t => <TagBadge key={t} tag={t} />)}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || !company || !position || !question || selectedExpIds.length === 0}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                생성 중...
              </>
            ) : '✨ 자소서 생성'}
          </button>
        </div>

        {/* 우측: 결과 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">📄 생성 결과</h2>
            {result && (
              <div className="flex gap-2">
                <span className={`text-xs ${Math.abs(result.length - targetLength) / targetLength > 0.1 ? 'text-orange-500' : 'text-green-600'}`}>
                  {result.length}자 / 목표 {targetLength}자
                </span>
              </div>
            )}
          </div>

          {result ? (
            <>
              <textarea
                className="flex-1 min-h-80 w-full border border-gray-200 rounded-lg p-3 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={result}
                onChange={e => { setResult(e.target.value); setDetection(null) }}
              />
              <div className="mt-3 flex gap-2 flex-wrap">
                <div className="flex-1 text-xs text-gray-400 flex items-center min-w-0">
                  직접 수정 가능합니다
                </div>
                <button
                  onClick={handleDetect}
                  disabled={detecting}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-medium hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {detecting
                    ? <><span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />판별 중...</>
                    : <>🔍 AI 판별 검사{detection ? ` · ${detection.score}점` : ''}</>}
                </button>
                <button onClick={handleCopy} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50">
                  복사
                </button>
                <button
                  onClick={handleSave}
                  disabled={!!savedId}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-60"
                >
                  {savedId ? '저장됨 ✓' : '저장'}
                </button>
              </div>

              {savedId && (() => {
                const linkedCompany = companies.find(c => c.name === company)
                return (
                  <div className="mt-3 flex items-start gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                    <span className="text-green-500 text-lg leading-none mt-0.5">✓</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-green-800">자소서가 저장됐습니다</p>
                      {linkedCompany ? (
                        <p className="text-xs text-green-600 mt-0.5">
                          <button
                            onClick={() => navigate(`/company/${linkedCompany.id}`)}
                            className="underline hover:text-green-800 font-medium"
                          >
                            {linkedCompany.name} 상세 페이지
                          </button>
                          에서 저장된 자소서 전체 목록을 확인할 수 있습니다.
                        </p>
                      ) : (
                        <p className="text-xs text-green-600 mt-0.5">
                          대시보드에서 해당 회사를 추가하면 회사 상세 페이지에서 자소서를 모아볼 수 있습니다.
                        </p>
                      )}
                    </div>
                  </div>
                )
              })()}

              {detection && <AiDetectionPanel detection={detection} />}
            </>
          ) : (
            <div className="flex-1 min-h-80 flex flex-col items-center justify-center text-gray-400">
              <p className="text-4xl mb-3">✍️</p>
              <p className="text-sm">좌측에서 정보를 입력하고</p>
              <p className="text-sm">자소서 생성 버튼을 눌러주세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
