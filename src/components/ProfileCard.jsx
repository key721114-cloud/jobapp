import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const EMPTY_PROFILE = {
  name: '',
  careerType: 'new',
  yearsOfExperience: '',
  desiredJob: '',
  desiredIndustry: '',
  educationLevel: '',
  school: '',
  major: '',
  graduationStatus: 'graduated',
  skills: [],
  certifications: '',
  languages: '',
}

const CAREER_TYPES = [
  { value: 'new', label: '신입' },
  { value: 'experienced', label: '경력' },
]

const EDU_LEVELS = ['고졸', '전문대졸', '대졸', '대학원(석사)', '대학원(박사)']
const GRAD_STATUSES = [
  { value: 'graduated', label: '졸업' },
  { value: 'enrolled', label: '재학 중' },
  { value: 'expected', label: '졸업예정' },
  { value: 'leave', label: '휴학 중' },
]

function completeness(profile) {
  const fields = [
    profile.name, profile.desiredJob, profile.educationLevel,
    profile.school, profile.major, profile.skills.length > 0,
  ]
  return Math.round((fields.filter(Boolean).length / fields.length) * 100)
}

export default function ProfileCard() {
  const [profile, setProfile] = useLocalStorage('jah_profile', EMPTY_PROFILE)
  const [open, setOpen] = useState(false)
  const [skillInput, setSkillInput] = useState('')

  const set = (k, v) => setProfile(p => ({ ...p, [k]: v }))

  const addSkill = () => {
    const trimmed = skillInput.trim()
    if (!trimmed || profile.skills.includes(trimmed)) return
    set('skills', [...profile.skills, trimmed])
    setSkillInput('')
  }

  const removeSkill = (s) => set('skills', profile.skills.filter(sk => sk !== s))

  const pct = completeness(profile)

  return (
    <div className="bg-white rounded-xl border border-gray-200 mb-5 overflow-hidden">
      <button
        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
              {profile.name ? profile.name[0] : '?'}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">
                {profile.name || '내 프로필'}
                {profile.desiredJob && <span className="ml-2 text-xs text-gray-400 font-normal">· {profile.desiredJob}</span>}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{pct}% 완성</span>
              </div>
            </div>
          </div>
          <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 p-5 space-y-5">
          {/* 기본 정보 */}
          <section>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">기본 정보</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">이름</label>
                <input
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="홍길동"
                  value={profile.name}
                  onChange={e => set('name', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">희망 직무</label>
                <input
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="예) 프론트엔드 개발자"
                  value={profile.desiredJob}
                  onChange={e => set('desiredJob', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">희망 업종</label>
                <input
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="예) IT/스타트업, 금융, 제조"
                  value={profile.desiredIndustry}
                  onChange={e => set('desiredIndustry', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">경력 구분</label>
                <div className="flex gap-2 mt-1">
                  {CAREER_TYPES.map(ct => (
                    <button
                      key={ct.value}
                      type="button"
                      onClick={() => set('careerType', ct.value)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all
                        ${profile.careerType === ct.value
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'}`}
                    >
                      {ct.label}
                    </button>
                  ))}
                </div>
              </div>
              {profile.careerType === 'experienced' && (
                <div>
                  <label className="text-xs font-semibold text-gray-600">경력 연수</label>
                  <input
                    type="number"
                    min={1}
                    max={40}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="예) 3"
                    value={profile.yearsOfExperience}
                    onChange={e => set('yearsOfExperience', e.target.value)}
                  />
                </div>
              )}
            </div>
          </section>

          {/* 학력 */}
          <section>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">학력</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">최종 학력</label>
                <select
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                  value={profile.educationLevel}
                  onChange={e => set('educationLevel', e.target.value)}
                >
                  <option value="">선택</option>
                  {EDU_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">졸업 상태</label>
                <select
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                  value={profile.graduationStatus}
                  onChange={e => set('graduationStatus', e.target.value)}
                >
                  {GRAD_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">학교명</label>
                <input
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="예) 한국대학교"
                  value={profile.school}
                  onChange={e => set('school', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">전공</label>
                <input
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="예) 컴퓨터공학과"
                  value={profile.major}
                  onChange={e => set('major', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* 기술 스택 */}
          <section>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">기술 스택</p>
            <div className="flex gap-2">
              <input
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="예) React, Python, Figma — Enter로 추가"
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                추가
              </button>
            </div>
            {profile.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.skills.map(s => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-medium"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeSkill(s)}
                      className="text-indigo-400 hover:text-indigo-700 leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* 자격증 & 어학 */}
          <section>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">자격증 · 어학</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">자격증</label>
                <textarea
                  rows={2}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  placeholder="예) 정보처리기사, ADsP"
                  value={profile.certifications}
                  onChange={e => set('certifications', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">어학</label>
                <textarea
                  rows={2}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  placeholder="예) TOEIC 900, OPIc IH"
                  value={profile.languages}
                  onChange={e => set('languages', e.target.value)}
                />
              </div>
            </div>
          </section>

          <p className="text-xs text-gray-400 text-right">변경 내용은 자동 저장됩니다</p>
        </div>
      )}
    </div>
  )
}
