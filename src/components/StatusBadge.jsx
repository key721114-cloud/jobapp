const STATUS_CONFIG = {
  preparing:  { label: '준비중',   color: 'bg-gray-100 text-gray-600' },
  submitted:  { label: '서류접수', color: 'bg-blue-100 text-blue-700' },
  passed:     { label: '서류합격', color: 'bg-green-100 text-green-700' },
  interview:  { label: '면접',     color: 'bg-yellow-100 text-yellow-700' },
  final:      { label: '최종합격', color: 'bg-indigo-100 text-indigo-700' },
  rejected:   { label: '불합격',   color: 'bg-red-100 text-red-600' },
}

export const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label }))

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.preparing
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}
