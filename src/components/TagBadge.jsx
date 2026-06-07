const TAG_COLORS = {
  '리더십': 'bg-purple-100 text-purple-700',
  '문제해결': 'bg-orange-100 text-orange-700',
  '협업': 'bg-teal-100 text-teal-700',
  '커뮤니케이션': 'bg-sky-100 text-sky-700',
  '도전정신': 'bg-red-100 text-red-700',
  '성장': 'bg-green-100 text-green-700',
  '전문성': 'bg-indigo-100 text-indigo-700',
  '책임감': 'bg-yellow-100 text-yellow-700',
}

export const AVAILABLE_TAGS = Object.keys(TAG_COLORS)

export default function TagBadge({ tag, onClick, removable }) {
  const color = TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-600'
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}
        ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
    >
      {tag}
      {removable && <span className="ml-0.5 text-xs leading-none">×</span>}
    </span>
  )
}
