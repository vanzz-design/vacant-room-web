import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { DisplayStatus, Reservation, Room } from '../../types/db'
import StatusDot from '../ui/StatusDot'

// Every class is written out in full so Tailwind can find it.
// --tint  = colour of the lifted shadow
// --glow  = colour of the cursor-following glow
// --flash = colour of the ring that fires when the status changes
const STATUS: Record<
  DisplayStatus,
  { tone: 'vacant' | 'occupied' | 'reserved'; vars: string; edge: string; pill: string }
> = {
  Vacant: {
    tone: 'vacant',
    vars: '[--tint:rgba(63,210,138,0.45)] [--glow:rgba(63,210,138,0.20)] [--flash:rgba(63,210,138,0.60)]',
    edge: 'via-vacant',
    pill: 'bg-vacant/15 text-vacant-soft ring-vacant/30',
  },
  Reserved: {
    tone: 'reserved',
    vars: '[--tint:rgba(227,182,42,0.45)] [--glow:rgba(227,182,42,0.20)] [--flash:rgba(227,182,42,0.60)]',
    edge: 'via-gold-400',
    pill: 'bg-gold-400/15 text-gold-200 ring-gold-400/30',
  },
  Occupied: {
    tone: 'occupied',
    vars: '[--tint:rgba(229,72,77,0.45)] [--glow:rgba(229,72,77,0.20)] [--flash:rgba(229,72,77,0.60)]',
    edge: 'via-occupied',
    pill: 'bg-occupied/15 text-occupied-soft ring-occupied/30',
  },
}

function lastTap(iso: string | null) {
  if (!iso) return 'No taps recorded yet'

  const d = new Date(iso)
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const today = d.toDateString() === new Date().toDateString()

  return today
    ? `Last tap at ${time}`
    : `Last tap ${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`
}

const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

export default function RoomCard({ room, reservation }: { room: Room; reservation?: Reservation | null }) {
  // A free room with a booking about to start is shown as Reserved.
  const display: DisplayStatus = room.status === 'Vacant' && reservation ? 'Reserved' : room.status
  const s = STATUS[display] ?? STATUS.Vacant

  // Fire a single ring whenever the status changes (a live tap arrived).
  const previous = useRef(display)
  const [flashKey, setFlashKey] = useState(0)

  useEffect(() => {
    if (previous.current !== display) {
      previous.current = display
      setFlashKey(k => k + 1)
    }
  }, [display])

  // Move the glow to the cursor.
  const handlePointerMove = (e: PointerEvent<HTMLElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - box.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - box.top}px`)
  }

  return (
    <article
      onPointerMove={handlePointerMove}
      className={`group relative isolate rounded-3xl p-5 ${s.vars}
        bg-linear-to-b from-white/10 to-white/[0.03] ring-1 ring-inset ring-white/10 backdrop-blur-md
        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.10),0_12px_28px_-18px_rgba(0,0,0,0.75)]
        transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
        hover:-translate-y-1.5
        hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_24px_48px_-16px_var(--tint)]
        motion-reduce:transition-none motion-reduce:hover:translate-y-0`}
    >
      {/* Status-coloured hairline along the top edge */}
      <span
        aria-hidden="true"
        className={`absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent ${s.edge} to-transparent`}
      />

      {/* Glow that appears on hover and follows the cursor */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 rounded-3xl opacity-0 transition-opacity duration-500
          bg-[radial-gradient(280px_circle_at_var(--mx,50%)_var(--my,0%),var(--glow),transparent_70%)]
          group-hover:opacity-100"
      />

      {/* One-off ring when the status flips */}
      {flashKey > 0 && (
        <span
          key={flashKey}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-3xl motion-safe:animate-flash"
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-3xl font-semibold leading-none tracking-tight text-white">
            {room.name}
          </h3>
          <p className="mt-2 text-sm leading-snug text-forest-200">
            {room.building ?? 'Campus building'}
          </p>
        </div>

        <span
          aria-live="polite"
          className={`inline-flex shrink-0 items-center gap-2 rounded-full py-1 pl-2.5 pr-3 text-sm font-semibold tracking-wide ring-1 ${s.pill}`}
        >
          <StatusDot tone={s.tone} />
          {display}
        </span>
      </div>

      <div className="mt-6 flex items-end justify-between gap-3 text-sm">
        <p className="text-forest-300">
          {room.capacity ? `Seats up to ${room.capacity}` : 'Seating not listed'}
        </p>

        <p className="text-right tabular-nums text-forest-200/80">
          {display === 'Reserved' && reservation ? (
            `Booked ${clock(reservation.start_time)}–${clock(reservation.end_time)}`
          ) : room.last_tap_at ? (
            <time dateTime={room.last_tap_at}>{lastTap(room.last_tap_at)}</time>
          ) : (
            lastTap(null)
          )}
        </p>
      </div>
    </article>
  )
}