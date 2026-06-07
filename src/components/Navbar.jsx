import { Link, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: '대시보드', icon: '📊' },
  { to: '/experiences', label: '경험 뱅크', icon: '💼' },
  { to: '/generate', label: '자소서 생성', icon: '✍️' },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 font-bold text-indigo-600 text-lg">
            <span>🎯</span>
            <span>취준 도우미</span>
          </Link>
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label, icon }) => {
              const active = pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${active
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <span>{icon}</span>
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
