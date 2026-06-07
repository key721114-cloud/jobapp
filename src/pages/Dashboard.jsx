import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { generateId } from '../utils/storage'
import StatusBadge, { STATUS_OPTIONS } from '../components/StatusBadge'
import StarRating from '../components/StarRating'

function getDday(deadline) {
  if (!deadline) return null
  const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))
  return diff
}

function DdayBadge({ deadline }) {
  const d = getDday(deadline)
  if (d === null) return null
  if (d < 0) return <span className="text-xs text-gray-400">마감</span>
  if (d === 0) return <span className="text-xs font-bold text-red-600">D-day</span>
  return (
    <span className={`text-xs font-semibold ${d <= 3 ? 'text-red-500' : d <= 7 ? 'text-orange-500' : 'text-gray-500'}`}>
      D-{d}
    </span>
  )
}

function AddCompanyModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', position: '', deadline: '', status: 'preparing' })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold mb-4">회사 추가</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">회사명 *</label>
            <input
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="예) 카카오"
              value={form.name}
              onChange={e => set('name', e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">직무 *</label>
            <input
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="예) 프론트엔드 개발"
              value={form.position}
              onChange={e => set('position', e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">마감일</label>
            <input
              type="date"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.deadline}
              onChange={e => set('deadline', e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">상태</label>
            <select
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.status}
              onChange={e => set('status', e.target.value)}
            >
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50">취소</button>
          <button
            onClick={() => {
              if (!form.name || !form.position) return
              onSave({ ...form, id: generateId(), coverLetters: [], createdAt: new Date().toISOString() })
              onClose()
            }}
            className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [companies, setCompanies] = useLocalStorage('jah_companies', [])
  const [experiences] = useLocalStorage('jah_experiences', [])
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  const filtered = filter === 'all' ? companies : companies.filter(c => c.status === filter)
  const counts = STATUS_OPTIONS.reduce((acc, { value }) => {
    acc[value] = companies.filter(c => c.status === value).length
    return acc
  }, {})

  const urgent = companies.filter(c => {
    const d = getDday(c.deadline)
    return d !== null && d >= 0 && d <= 7
  }).sort((a, b) => getDday(a.deadline) - getDday(b.deadline))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">지원 현황 대시보드</h1>
          <p className="text-sm text-gray-500 mt-0.5">총 {companies.length}개 회사 지원 중</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <span>+</span> 회사 추가
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {STATUS_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(filter === value ? 'all' : value)}
            className={`p-3 rounded-xl border text-left transition-all
              ${filter === value ? 'border-indigo-400 bg-indigo-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}
          >
            <div className="text-2xl font-bold text-gray-800">{counts[value] ?? 0}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </button>
        ))}
      </div>

      {/* 마감 임박 알림 */}
      {urgent.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-semibold text-red-700 mb-2">⚠️ 마감 임박</p>
          <div className="flex flex-wrap gap-2">
            {urgent.map(c => (
              <button
                key={c.id}
                onClick={() => navigate(`/company/${c.id}`)}
                className="flex items-center gap-1.5 px-3 py-1 bg-white border border-red-200 rounded-lg text-sm hover:bg-red-50"
              >
                <span className="font-medium">{c.name}</span>
                <DdayBadge deadline={c.deadline} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 빠른 통계 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-xl">💼</div>
          <div>
            <div className="text-sm text-gray-500">저장된 경험</div>
            <div className="text-xl font-bold text-gray-800">{experiences.length}개</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl">✅</div>
          <div>
            <div className="text-sm text-gray-500">서류합격 이상</div>
            <div className="text-xl font-bold text-gray-800">
              {companies.filter(c => ['passed', 'interview', 'final'].includes(c.status)).length}개
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-xl">📅</div>
          <div>
            <div className="text-sm text-gray-500">이번 주 마감</div>
            <div className="text-xl font-bold text-gray-800">{urgent.length}개</div>
          </div>
        </div>
      </div>

      {/* 회사 목록 */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-gray-500 font-medium">아직 지원한 회사가 없습니다</p>
          <p className="text-sm text-gray-400 mt-1">위에서 회사를 추가해보세요</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(company => (
            <button
              key={company.id}
              onClick={() => navigate(`/company/${company.id}`)}
              className="w-full bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-sm transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-700 font-bold text-sm">
                    {company.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{company.name}</div>
                    <div className="text-sm text-gray-500">{company.position}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {company.jobplanetRating > 0 && (
                    <StarRating value={company.jobplanetRating} readonly size="sm" />
                  )}
                  <DdayBadge deadline={company.deadline} />
                  <StatusBadge status={company.status} />
                  <span className="text-gray-400 text-sm">›</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showAdd && (
        <AddCompanyModal
          onClose={() => setShowAdd(false)}
          onSave={c => setCompanies(prev => [...prev, c])}
        />
      )}
    </div>
  )
}
