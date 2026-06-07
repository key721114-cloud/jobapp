export default function StarRating({ value, onChange, readonly = false, size = 'md' }) {
  const sz = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'

  return (
    <span className={`inline-flex items-center gap-0.5 ${sz}`}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(value === n ? 0 : n)}
          className={`leading-none transition-transform ${readonly ? 'cursor-default' : 'hover:scale-110 cursor-pointer'}`}
        >
          <span className={n <= value ? 'text-yellow-400' : 'text-gray-300'}>★</span>
        </button>
      ))}
      {value > 0 && (
        <span className="ml-1 text-xs font-semibold text-gray-500">{value.toFixed(1)}</span>
      )}
    </span>
  )
}
