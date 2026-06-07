import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { generateId } from '../utils/storage'
import TagBadge, { AVAILABLE_TAGS } from '../components/TagBadge'

const EMPTY_FORM = { title: '', situation: '', task: '', action: '', result: '', tags: [] }

function ExperienceModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const toggleTag = (tag) => {
    set('tags', form.tags.includes(tag)
      ? form.tags.filter(t => t !== tag)
      : [...form.tags, tag]
    )
  }

  const valid = form.title && form.situation && form.action && form.result

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-4">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold">{initial ? '경험 수정' : '경험 추가'}</h2>
          <p className="text-sm text-gray-500 mt-0.5">STAR 기법으로 경험을 구체적으로 기록하세요</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">경험 제목 *</label>
            <input
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="예) 팀 프로젝트에서 기술 리더로 성공 납품"
              value={form.title}
              onChange={e => set('title', e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              <span className="text-indigo-600">S</span>ituation — 상황 *
            </label>
            <p className="text-xs text-gray-400 mb-1">어떤 상황이었나요? 배경과 맥락을 설명하세요.</p>
            <textarea
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              placeholder="예) 4인 팀 프로젝트에서 프론트엔드 개발자가 중도 이탈하여..."
              value={form.situation}
              onChange={e => set('situation', e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              <span className="text-indigo-600">T</span>ask — 과제
            </label>
            <p className="text-xs text-gray-400 mb-1">어떤 역할이나 목표를 맡았나요?</p>
            <textarea
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              placeholder="예) 2주 내에 전체 UI를 완성해야 하는 미션을 받았습니다."
              value={form.task}
              onChange={e => set('task', e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              <span className="text-indigo-600">A</span>ction — 행동 *
            </label>
            <p className="text-xs text-gray-400 mb-1">구체적으로 무엇을 했나요? (가장 중요한 부분)</p>
            <textarea
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              placeholder="예) 먼저 팀원들과 역할 재분배 회의를 진행하고..."
              value={form.action}
              onChange={e => set('action', e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              <span className="text-indigo-600">R</span>esult — 결과 *
            </label>
            <p className="text-xs text-gray-400 mb-1">어떤 성과를 얻었나요? 수치로 표현하면 더 좋습니다.</p>
            <textarea
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              placeholder="예) 기간 내 성공적으로 납품하여 A+ 학점, 팀 MVP 선정"
              value={form.result}
              onChange={e => set('result', e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">태그</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {AVAILABLE_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all
                    ${form.tags.includes(tag)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                    }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50">취소</button>
          <button
            disabled={!valid}
            onClick={() => { onSave(form); onClose() }}
            className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Experiences() {
  const [experiences, setExperiences] = useLocalStorage('jah_experiences', [])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [activeTag, setActiveTag] = useState(null)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)

  const filtered = experiences.filter(exp => {
    const matchTag = !activeTag || exp.tags?.includes(activeTag)
    const matchSearch = !search || exp.title.toLowerCase().includes(search.toLowerCase()) ||
      exp.action.toLowerCase().includes(search.toLowerCase())
    return matchTag && matchSearch
  })

  const handleSave = (form) => {
    if (editing) {
      setExperiences(prev => prev.map(e => e.id === editing.id ? { ...editing, ...form, updatedAt: new Date().toISOString() } : e))
    } else {
      setExperiences(prev => [...prev, { ...form, id: generateId(), createdAt: new Date().toISOString() }])
    }
    setEditing(null)
  }

  const handleDelete = (id) => {
    if (confirm('이 경험을 삭제할까요?')) {
      setExperiences(prev => prev.filter(e => e.id !== id))
      if (expanded === id) setExpanded(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">경험 뱅크</h1>
          <p className="text-sm text-gray-500 mt-0.5">총 {experiences.length}개의 경험</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          + 경험 추가
        </button>
      </div>

      {/* 필터 & 검색 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="🔍 경험 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTag(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all
              ${!activeTag ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'}`}
          >
            전체
          </button>
          {AVAILABLE_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all
                ${activeTag === tag ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'}`}
            >
              {tag} ({experiences.filter(e => e.tags?.includes(tag)).length})
            </button>
          ))}
        </div>
      </div>

      {/* 경험 목록 */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-4xl mb-3">💼</p>
          <p className="text-gray-500 font-medium">
            {experiences.length === 0 ? '아직 저장된 경험이 없습니다' : '검색 결과가 없습니다'}
          </p>
          {experiences.length === 0 && (
            <p className="text-sm text-gray-400 mt-1">경험을 추가하면 자소서 생성에 활용할 수 있어요</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(exp => (
            <div key={exp.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(expanded === exp.id ? null : exp.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{exp.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{exp.result}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex flex-wrap gap-1 justify-end">
                      {exp.tags?.slice(0, 2).map(t => <TagBadge key={t} tag={t} />)}
                      {exp.tags?.length > 2 && <span className="text-xs text-gray-400">+{exp.tags.length - 2}</span>}
                    </div>
                    <span className="text-gray-400 text-sm">{expanded === exp.id ? '▲' : '▼'}</span>
                  </div>
                </div>
              </button>

              {expanded === exp.id && (
                <div className="border-t border-gray-100 p-4 space-y-3">
                  {[
                    { key: 'situation', label: 'S — 상황', color: 'text-blue-600' },
                    { key: 'task', label: 'T — 과제', color: 'text-purple-600' },
                    { key: 'action', label: 'A — 행동', color: 'text-orange-600' },
                    { key: 'result', label: 'R — 결과', color: 'text-green-600' },
                  ].map(({ key, label, color }) => (
                    exp[key] && (
                      <div key={key}>
                        <p className={`text-xs font-bold ${color} mb-0.5`}>{label}</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{exp[key]}</p>
                      </div>
                    )
                  ))}
                  {exp.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {exp.tags.map(t => <TagBadge key={t} tag={t} />)}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => { setEditing(exp); setShowModal(true) }}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ExperienceModal
          initial={editing}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
