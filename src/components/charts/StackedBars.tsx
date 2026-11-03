// Stacked column chart drawn with plain SVG (no chart library needed).
// Class names are written out in full so Tailwind can find them.

export interface BarSeries {
  name: string
  fill: string   // e.g. "fill-brand-500"  (the bar)
  dot: string    // e.g. "bg-brand-500"    (the legend swatch)
}

export interface BarDatum {
  label: string        // x-axis label, e.g. "Nov 3"
  values: number[]     // one number per series, same order as `series`
}

interface Props {
  data: BarDatum[]
  series: BarSeries[]
  height?: number
  ariaLabel: string
}

const W = 640
const PAD = { l: 34, r: 8, t: 10, b: 26 }

export default function StackedBars({ data, series, height = 230, ariaLabel }: Props) {
  const H = height
  const totals = data.map(d => d.values.reduce((a, b) => a + b, 0))
  const rawMax = Math.max(1, ...totals)
  const step = rawMax <= 5 ? 1 : rawMax <= 10 ? 2 : Math.ceil(rawMax / 5)
  const max = Math.ceil(rawMax / step) * step
  const ticks = Array.from({ length: max / step + 1 }, (_, i) => i * step)

  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b
  const slot = innerW / Math.max(1, data.length)
  const barW = Math.max(3, Math.min(30, slot * 0.7))
  const y = (v: number) => PAD.t + innerH - (v / max) * innerH
  const labelEvery = Math.max(1, Math.ceil(data.length / 10))

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} className="w-full">
        {/* grid + y-axis */}
        {ticks.map(t => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className="stroke-gray-200" strokeWidth={1} />
            <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" className="fill-gray-500" fontSize={11}>
              {t}
            </text>
          </g>
        ))}

        {/* bars */}
        {data.map((d, i) => {
          const x = PAD.l + slot * i + (slot - barW) / 2
          let running = 0
          return (
            <g key={d.label + i}>
              {d.values.map((v, j) => {
                if (v <= 0) return null
                const top = y(running + v)
                const h = y(running) - top
                running += v
                return (
                  <rect key={j} x={x} y={top} width={barW} height={h} rx={2} className={series[j].fill}>
                    <title>{`${d.label} · ${series[j].name}: ${v}`}</title>
                  </rect>
                )
              })}
              {i % labelEvery === 0 && (
                <text x={x + barW / 2} y={H - 8} textAnchor="middle" className="fill-gray-500" fontSize={11}>
                  {d.label}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
        {series.map(s => (
          <li key={s.name} className="flex items-center gap-1.5">
            <span className={`inline-block size-2.5 rounded-sm ${s.dot}`} />
            {s.name}
          </li>
        ))}
      </ul>
    </div>
  )
}