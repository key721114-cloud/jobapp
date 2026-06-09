import { useState, useEffect } from 'react'

function PartialStar({ fill }) {
  return (
    <span className="relative inline-block leading-none">
      <span className="text-gray-300">★</span>
      <span
        className="absolute inset-0 overflow-hidden text-yellow-400"
        style={{ width: `${Math.min(1, Math.max(0, fill)) * 100}%` }}
      >
        ★
      </span>
    </span>
  )
}

export default function StarRating({ value, onChange, readonly = false, size = 'md' }) {
  const sz = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'
  const [inputVal, setInputVal] = useState(value > 0 ? String(value) : '')

  useEffect(() => {
    setInputVal(value > 0 ? String(value) : '')
  }, [value])

  const commit = (raw) => {
    const num = parseFloat(raw)
    if (isNaN(num)) { setInputVal(value > 0 ? String(value) : ''); return }
    const clamped = Math.min(5, Math.max(0, Math.round(num * 10) / 10))
    onChange?.(clamped)
    setInputVal(clamped > 0 ? String(clamped) : '')
  }

  return (
    <span className={`inline-flex items-center gap-0.5 ${sz}`}>
      {[1, 2, 3, 4, 5].map(n => {
        const fill = Math.min(1, Math.max(0, value - (n - 1)))
        return readonly ? (
          <span key={n} className="leading-none">
            <PartialStar fill={fill} />
          </span>
        ) : (
          <button
            key={n}
            type="button"
            onClick={() => onChange?.(value === n ? 0 : n)}
            className="leading-none hover:scale-110 cursor-pointer transition-transform"
          >
            <PartialStar fill={fill} />
          </button>
        )
      })}
      {readonly ? (
        value > 0 && <span className="ml-1 text-xs font-semibold text-gray-500">{value.toFixed(1)}</span>
      ) : (
        <input
          type="number"
          min={0}
          max={5}
          step={0.1}
          value={inputVal}
          placeholder="0.0"
          onChange={e => setInputVal(e.target.value)}
          onBlur={e => commit(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && commit(e.target.value)}
          className="ml-1 w-12 text-xs font-semibold text-gray-700 border border-gray-300 rounded px-1.5 py-0.5 text-center focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      )}
    </span>
  )
}
