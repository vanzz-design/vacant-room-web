export interface DonutPart {
  label: string
  value: number
  stroke: string   // e.g. "stroke-brand-500"
  dot: string      // e.g. "bg-brand-500"
}

const R = 40
const C = 2 * Math.PI * R

export default function Donut({ parts, centerLabel }: { parts: DonutPart[]; centerLabel: string }) {
  const total = parts.reduce((a, p) => a + p.value, 0)
  const segments = parts
    .filter(p => p.value > 0)
    .map((p, i, list) => ({
      ...p,
      len: (p.value / total) * C,
      start: list.slice(0, i).reduce((a, q) => a + (q.value / total) * C, 0),
    }))

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 100 100" className="size-36 shrink-0" role="img" aria-label={`${centerLabel}: ${total}`}>
        <circle cx={50} cy={50} r={R} fill="none" strokeWidth={14} className="stroke-gray-200" />
        {segments.map(p => (
          <circle
            key={p.label}
            cx={50} cy={50} r={R} fill="none" strokeWidth={14}
            className={p.stroke}
            strokeDasharray={`${p.len} ${C - p.len}`}
            strokeDashoffset={-p.start}
            transform="rotate(-90 50 50)"
          >
            <title>{`${p.label}: ${p.value}`}</title>
          </circle>
        ))}
        <text x={50} y={49} textAnchor="middle" className="fill-brand-900" fontSize={18} fontWeight={700}>{total}</text>
        <text x={50} y={62} textAnchor="middle" className="fill-gray-500" fontSize={7}>{centerLabel}</text>
      </svg>

      <ul className="space-y-1.5 text-sm">
        {parts.map(p => (
          <li key={p.label} className="flex items-center gap-2">
            <span className={`inline-block size-3 rounded-sm ${p.dot}`} />
            <span>{p.label}</span>
            <b className="ml-auto pl-4 tabular-nums">{p.value}</b>
            <span className="w-12 text-right text-xs text-gray-500 tabular-nums">
              {total ? `${Math.round((p.value / total) * 100)}%` : '—'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}