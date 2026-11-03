import { useEffect, useRef } from 'react'
import { ghostButton, goldButton } from '../ui/styles'

interface Props {
  roomName: string
  start: Date
  end: Date
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}

const timeFmt: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' }

export default function ConfirmModal({ roomName, start, end, busy, onCancel, onConfirm }: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  // Keep the latest callbacks without re-running the open/close effect.
  const cancelRef = useRef(onCancel)
  const busyRef = useRef(busy)
  cancelRef.current = onCancel
  busyRef.current = busy

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    confirmRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busyRef.current) cancelRef.current()
    }
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const hours = Math.round(((end.getTime() - start.getTime()) / 3_600_000) * 10) / 10

  const rows: [string, string][] = [
    ['Room', roomName],
    ['Date', start.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })],
    [
      'Time',
      `${start.toLocaleTimeString([], timeFmt)} to ${end.toLocaleTimeString([], timeFmt)}`,
    ],
    ['Length', `${hours} ${hours === 1 ? 'hour' : 'hours'}`],
  ]

  return (
    <div className="fixed inset-0 z-50 grid place-items-end p-4 sm:place-items-center">
      {/* Blurred backdrop */}
      <div
        aria-hidden="true"
        onClick={() => !busy && onCancel()}
        className="absolute inset-0 bg-forest-950/70 backdrop-blur-sm motion-safe:animate-fade-in"
      />

      {/* Glass panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-warning"
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15
          bg-forest-900/60 p-6 text-white backdrop-blur-2xl backdrop-saturate-150
          shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_40px_100px_-30px_rgba(0,0,0,0.85)]
          motion-safe:animate-modal-in sm:p-7"
      >
        {/* Soft gold light in the corner */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-gold-400/20 blur-3xl"
        />

        <h2 id="confirm-title" className="relative font-display text-3xl font-semibold leading-tight tracking-tight">
          Confirm your reservation
        </h2>

        <dl className="relative mt-5 divide-y divide-white/10 rounded-2xl bg-white/[0.06] ring-1 ring-inset ring-white/10">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-forest-200">{label}</dt>
              <dd className="text-right font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        {/* The rule people must see before they book */}
        <div className="relative mt-5 rounded-2xl border border-gold-400/40 bg-gold-400/10 p-4">
          <div className="flex gap-3">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-gold-300"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3 2.5 20h19L12 3Z" />
              <path d="M12 10v4" />
              <path d="M12 17.2v.01" />
            </svg>
            <div>
              <p id="confirm-warning" className="text-sm font-medium leading-relaxed text-gold-100">
                You must physically tap your RFID card at the room within 15 minutes of your start
                time, or this reservation will be auto-canceled.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-gold-200/80">
                Each missed reservation adds a strike. Three strikes pause your booking for 7 days.
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:flex sm:justify-end">
          <button type="button" onClick={onCancel} disabled={busy} className={ghostButton}>
            Go back
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={goldButton}
          >
            {busy ? 'Booking…' : 'Confirm booking'}
          </button>
        </div>
      </div>
    </div>
  )
}