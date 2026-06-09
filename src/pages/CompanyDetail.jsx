import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { STATUS_OPTIONS } from '../components/StatusBadge'
import StarRating from '../components/StarRating'
import { Link } from 'react-router-dom'

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

function jobplanetUrl(name) {
  return `https://www.jobplanet.co.kr/search?query=${encodeURIComponent(cleanCompanyName(name))}`
}

const CATEGORY_RULES = [
  { pattern: /지원\s*동기|관심\s*갖게|선택한\s*이유|지원하게\s*된|귀사/, label: '지원동기' },
  { pattern: /협업|팀워크|팀\s*프로젝트|갈등|함께|소통|커뮤니케이션/, label: '협업 경험' },
  { pattern: /리더|주도|이끌|팀장/, label: '리더십' },
  { pattern: /문제\s*해결|극복|위기|어려움|도전|실패/, label: '문제해결' },
  { pattern: /성장|배움|학습|발전|깨달/, label: '성장 경험' },
  { pattern: /포부|목표|입사\s*후|비전|이루고자|기여/, label: '입사 포부' },
  { pattern: /역량|강점|전문성|직무\s*경험|보유한/, label: '직무역량' },
  { pattern: /자기\s*소개|본인|가치관|성격|장단점/, label: '자기소개' },
]

function deriveCategory(question) {
  for (const { pattern, label } of CATEGORY_RULES) {
    if (pattern.test(question)) return label
  }
  return question.slice(0, 14) + (question.length > 14 ? '…' : '')
}

const CATEGORY_COLORS = {
  '지원동기':   'bg-blue-50 text-blue-700 border-blue-200',
  '협업 경험':  'bg-green-50 text-green-700 border-green-200',
  '리더십':     'bg-purple-50 text-purple-700 border-purple-200',
  '문제해결':   'bg-orange-50 text-orange-700 border-orange-200',
  '성장 경험':  'bg-teal-50 text-teal-700 border-teal-200',
  '입사 포부':  'bg-indigo-50 text-indigo-700 border-indigo-200',
  '직무역량':   'bg-rose-50 text-rose-700 border-rose-200',
  '자기소개':   'bg-yellow-50 text-yellow-700 border-yellow-200',
}

function CategoryBadge({ question }) {
  const label = deriveCategory(question)
  const color = CATEGORY_COLORS[label] ?? 'bg-gray-100 text-gray-600 border-gray-200'
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      {label}
    </span>
  )
}

function getDday(deadline) {
  if (!deadline) return null
  return Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))
}

export default function CompanyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [companies, setCompanies] = useLocalStorage('jah_companies', [])
  const [coverLetters] = useLocalStorage('jah_cover_letters', [])
  const [expandedCL, setExpandedCL] = useState(null)
  const [expandedQ, setExpandedQ] = useState(null)

  const company = companies.find(c => c.id === id)

  if (!company) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">회사를 찾을 수 없습니다</p>
        <Link to="/" className="text-indigo-600 text-sm mt-2 inline-block hover:underline">← 대시보드로</Link>
      </div>
    )
  }

  const companyCLs = coverLetters.filter(cl => cl.company === company.name)
  const dday = getDday(company.deadline)

  const updateCompany = (fields) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...fields } : c))
  }

  const handleDelete = () => {
    if (confirm(`${company.name} 지원 정보를 삭제할까요?`)) {
      setCompanies(prev => prev.filter(c => c.id !== id))
      navigate('/')
    }
  }

  const STATUS_FLOW = ['preparing', 'submitted', 'passed', 'interview', 'final']
  const currentStep = STATUS_FLOW.indexOf(company.status)

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 font-bold text-xl">
            {company.name[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <p className="text-gray-500">{company.position}</p>
              {company.jobplanetRating > 0 && (
                <StarRating value={company.jobplanetRating} readonly size="sm" />
              )}
              <a
                href={jobplanetUrl(company.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 hover:underline"
              >
                잡플래닛 ↗
              </a>
            </div>
          </div>
        </div>
        <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50">
          삭제
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측 */}
        <div className="space-y-4">
          {/* 기본 정보 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">기본 정보</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">마감일</label>
                <input
                  type="date"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={company.deadline ?? ''}
                  onChange={e => updateCompany({ deadline: e.target.value })}
                />
                {dday !== null && (
                  <p className={`text-xs mt-1 font-semibold
                    ${dday < 0 ? 'text-gray-400' : dday === 0 ? 'text-red-600' : dday <= 3 ? 'text-red-500' : 'text-gray-500'}`}>
                    {dday < 0 ? '마감됨' : dday === 0 ? 'D-day' : `D-${dday}`}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500">상태</label>
                <select
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={company.status}
                  onChange={e => updateCompany({ status: e.target.value })}
                >
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">잡플래닛 평점</label>
                <div className="mt-1.5 flex items-center gap-3">
                  <StarRating
                    value={company.jobplanetRating ?? 0}
                    onChange={v => updateCompany({ jobplanetRating: v })}
                    size="lg"
                  />
                  <a
                    href={jobplanetUrl(company.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-600 text-xs font-medium rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    잡플래닛에서 확인 ↗
                  </a>
                </div>
                <p className="text-xs text-gray-400 mt-1">별을 클릭해 평점을 저장하세요</p>
              </div>

              <div>
                <label className="text-xs text-gray-500">메모</label>
                <textarea
                  rows={3}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  placeholder="메모를 남겨두세요..."
                  value={company.notes ?? ''}
                  onChange={e => updateCompany({ notes: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* 지원 단계 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">지원 단계</h2>
            <div className="space-y-2">
              {STATUS_FLOW.map((s, i) => {
                const cfg = STATUS_OPTIONS.find(o => o.value === s)
                const done = i <= currentStep
                const current = i === currentStep
                return (
                  <button
                    key={s}
                    onClick={() => updateCompany({ status: s })}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                      ${current ? 'bg-indigo-50 border border-indigo-300' : 'hover:bg-gray-50'}`}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0
                      ${done ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                      {done && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className={done ? 'text-gray-800 font-medium' : 'text-gray-400'}>
                      {cfg?.label}
                    </span>
                    {current && <span className="ml-auto text-xs text-indigo-500 font-medium">현재</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 우측: 자소서 목록 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">자소서 ({companyCLs.length}개)</h2>
              <Link
                to="/generate"
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700"
              >
                + 새로 생성
              </Link>
            </div>

            {companyCLs.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p className="text-3xl mb-2">📄</p>
                <p className="text-sm">아직 작성된 자소서가 없습니다</p>
                <Link to="/generate" className="text-xs text-indigo-500 hover:underline mt-1 inline-block">
                  자소서 생성하러 가기 →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {companyCLs.map(cl => (
                  <div key={cl.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      className="w-full p-4 text-left hover:bg-gray-50"
                      onClick={() => setExpandedCL(expandedCL === cl.id ? null : cl.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CategoryBadge question={cl.question} />
                            <span className="text-xs text-gray-400">
                              {cl.content.length}자 · {new Date(cl.createdAt).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                          <p className={`text-xs text-gray-500 ${expandedQ === cl.id || expandedCL === cl.id ? '' : 'line-clamp-1'}`}>
                            {cl.question}
                          </p>
                          {expandedCL !== cl.id && (
                            <button
                              onClick={e => { e.stopPropagation(); setExpandedQ(expandedQ === cl.id ? null : cl.id) }}
                              className="text-xs text-indigo-500 hover:text-indigo-700 mt-0.5"
                            >
                              {expandedQ === cl.id ? '접기' : '더보기'}
                            </button>
                          )}
                        </div>
                        <span className="text-gray-400 text-sm">{expandedCL === cl.id ? '▲' : '▼'}</span>
                      </div>
                    </button>
                    {expandedCL === cl.id && (
                      <div className="border-t border-gray-100 p-4">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{cl.content}</p>
                        <button
                          onClick={() => navigator.clipboard.writeText(cl.content)}
                          className="mt-3 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50"
                        >
                          복사
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
