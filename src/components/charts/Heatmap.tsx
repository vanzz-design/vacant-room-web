// Weekday x hour heatmap. Darker green = more booked hours.

export interface HeatCell { dow: number; hr: number; value: number }

const DAYS = [
  { dow: 1, label: 'Mon' }, { dow: 2, label: 'Tue' }, { dow: 3, label: 'Wed' },
  { dow: 4, label: 'Thu' }, { dow: 5, label: 'Fri' }, { dow: 6, label: 'Sat' },
  { dow: 0, label: 'Sun' },
]
const FIRST_HOUR = 7
const LAST_HOUR = 20   // the 20:00 cell covers 20:00-21:00

const hourLabel = (h: number) => `${((h + 11) % 12) + 1}${h < 12 ? 'a' : 'p'}`

export default function Heatmap({ cells }: { cells: HeatCell[] }) {
  const lookup = new Map(cells.map(c => [`${c.dow}-${c.hr}`, c.value]))
  const max = Math.max(1, ...cells.map(c => c.value))
  const hours = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => FIRST_HOUR + i)

  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[520px] gap-1"
        style={{ gridTemplateColumns: `40px repeat(${hours.length}, minmax(0, 1fr))` }}
        role="table"
        aria-label="Booked hours by weekday and hour"
      >
        <div />
        {hours.map(h => (
          <div key={h} className="text-center text-[10px] text-gray-500">{hourLabel(h)}</div>
        ))}

        {DAYS.map(d => (
          <div key={d.dow} className="contents" role="row">
            <div className="pr-1 text-right text-xs leading-6 text-gray-600">{d.label}</div>
            {hours.map(h => {
              const v = lookup.get(`${d.dow}-${h}`) ?? 0
              return (
                <div
                  key={h}
                  role="cell"
                  title={`${d.label} ${hourLabel(h)}: ${v} booking${v === 1 ? '' : 's'}`}
                  className="h-6 rounded-sm"
                  style={{
                    backgroundColor: v === 0 ? 'rgba(0,0,0,0.05)' : `rgba(31,157,87,${0.2 + 0.8 * (v / max)})`,
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
        <span>Fewer</span>
        {[0.2, 0.4, 0.6, 0.8, 1].map(a => (
          <span key={a} className="inline-block h-3 w-6 rounded-sm" style={{ backgroundColor: `rgba(31,157,87,${a})` }} />
        ))}
        <span>More bookings</span>
      </div>
    </div>
  )
}