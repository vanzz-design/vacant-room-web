import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useRooms } from '../../hooks/useRooms'
import ConfirmModal from '../../components/booking/ConfirmModal'

// Opening hours and booking length (the database enforces the same rules).
const OPEN_MIN = 7 * 60
const CLOSE_MIN = 21 * 60
const MIN_LENGTH = 30
const MAX_LENGTH = 180
const STEP_SECONDS = 15 * 60   // time pickers move in 15-minute steps

const pad = (n: number) => String(n).padStart(2, '0')
const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const toMinutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
const fromMinutes = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
const clock = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

// First sensible start time for a given day: the next quarter hour if it's today, otherwise 9:00.
function defaultStart(date: string): string {
  if (date !== toDateInput(new Date())) return '09:00'
  const now = new Date()
  const next = Math.ceil((now.getHours() * 60 + now.getMinutes() + 1) / 15) * 15
  return fromMinutes(Math.min(Math.max(next, OPEN_MIN), CLOSE_MIN - MIN_LENGTH))
}
const defaultEnd = (start: string) => fromMinutes(Math.min(toMinutes(start) + 60, CLOSE_MIN))

const DURATIONS = [
  { label: '30 min', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
  { label: '3 hours', minutes: 180 },
]

export default function Book() {
  const { profile } = useAuth()
  const { rooms } = useRooms()
  const navigate = useNavigate()

  const [roomId, setRoomId] = useState('')
  const [date, setDate] = useState(() => toDateInput(new Date()))
  const [startTime, setStartTime] = useState(() => defaultStart(toDateInput(new Date())))
  const [endTime, setEndTime] = useState(() => defaultEnd(defaultStart(toDateInput(new Date()))))
  const [taken, setTaken] = useState<{ start: number; end: number }[]>([])
  const [now, setNow] = useState(() => Date.now())
  const [showModal, setShowModal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (!roomId && rooms.length) setRoomId(rooms[0].id) }, [rooms, roomId])

  // keep "is the start time still in the future?" fresh
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  const at = useCallback((hhmm: string) => new Date(`${date}T${hhmm}:00`), [date])

  const loadTaken = useCallback(async () => {
    if (!roomId) return
    const from = at('00:00')
    const to = new Date(from.getTime() + 24 * 3600 * 1000)
    const { data } = await supabase.rpc('get_room_bookings', {
      p_room: roomId, p_from: from.toISOString(), p_to: to.toISOString(),
    })
    setTaken(((data ?? []) as { start_time: string; end_time: string }[]).map(b => ({
      start: new Date(b.start_time).getTime(), end: new Date(b.end_time).getTime(),
    })).sort((a, b) => a.start - b.start))
  }, [roomId, at])

  useEffect(() => { loadTaken() }, [loadTaken])

  const changeDate = (d: string) => {
    setDate(d)
    const s = defaultStart(d)
    setStartTime(s)
    setEndTime(defaultEnd(s))
  }

  // Moving the start keeps the same length when possible.
  const changeStart = (v: string) => {
    const length = startTime && endTime ? toMinutes(endTime) - toMinutes(startTime) : 60
    setStartTime(v)
    if (v && length >= MIN_LENGTH) setEndTime(fromMinutes(Math.min(toMinutes(v) + length, CLOSE_MIN)))
  }

  const pickDuration = (minutes: number) => {
    if (startTime) setEndTime(fromMinutes(Math.min(toMinutes(startTime) + minutes, CLOSE_MIN)))
  }

  const start = startTime ? at(startTime) : null
  const end = endTime ? at(endTime) : null

  // Tells the person what to fix. An empty string means the booking is allowed.
  const problem = useMemo(() => {
    if (!startTime || !endTime) return 'Choose a start and an end time.'
    const s = toMinutes(startTime)
    const e = toMinutes(endTime)
    if (s < OPEN_MIN || e > CLOSE_MIN) return 'Rooms can be booked between 7:00 AM and 9:00 PM.'
    if (e <= s) return 'The end time must be after the start time.'
    if (e - s < MIN_LENGTH) return 'The shortest booking is 30 minutes.'
    if (e - s > MAX_LENGTH) return 'The longest booking is 3 hours.'
    const st = at(startTime).getTime()
    const en = at(endTime).getTime()
    if (st <= now) return 'The start time must be in the future.'
    const clash = taken.find(t => st < t.end && en > t.start)
    if (clash) return `That overlaps an existing booking (${clock(clash.start)} to ${clock(clash.end)}).`
    return ''
  }, [startTime, endTime, taken, now, at])

  const room = rooms.find(r => r.id === roomId)

  const confirm = async () => {
    if (!start || !end) return
    setBusy(true); setError('')
    const { error } = await supabase.rpc('create_booking', {
      p_room: roomId, p_start: start.toISOString(), p_end: end.toISOString(),
    })
    setBusy(false)
    if (error) { setShowModal(false); setError(error.message); loadTaken(); return }
    navigate('/my-bookings')
  }

  if (profile && !profile.rfid_uid) {
    return (
      <div className="rounded-xl border border-gold-500 bg-gold-100 p-6">
        Register your RFID card UID in your profile before booking.
        <Link to="/my-bookings" className="ml-2 underline">Go to profile</Link>
      </div>
    )
  }

  // Timeline geometry: 7:00 to 21:00 across the full width.
  const span = CLOSE_MIN - OPEN_MIN
  const pos = (minutes: number) => `${((Math.min(Math.max(minutes, OPEN_MIN), CLOSE_MIN) - OPEN_MIN) / span) * 100}%`
  const minutesOfDay = (ms: number) => { const d = new Date(ms); return d.getHours() * 60 + d.getMinutes() }
  const showSelection = startTime && endTime && toMinutes(endTime) > toMinutes(startTime)

  const field = 'rounded border px-3 py-2'
  const label = 'flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500'

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-brand-700">Book a room</h1>

      <div className="space-y-4 rounded-xl bg-white p-4 shadow">
        <div className="flex flex-wrap items-end gap-3">
          <label className={label}>
            Room
            <select value={roomId} onChange={e => setRoomId(e.target.value)} className={`${field} text-base font-normal normal-case tracking-normal text-forest-900`}>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>

          <label className={label}>
            Date
            <input type="date" value={date} min={toDateInput(new Date())} onChange={e => changeDate(e.target.value)}
              className={`${field} text-base font-normal normal-case tracking-normal text-forest-900`} />
          </label>

          <label className={label}>
            Start time
            <input type="time" value={startTime} step={STEP_SECONDS} min="07:00" max="20:30"
              onChange={e => changeStart(e.target.value)}
              className={`${field} text-base font-normal normal-case tracking-normal text-forest-900`} />
          </label>

          <label className={label}>
            End time
            <input type="time" value={endTime} step={STEP_SECONDS} min="07:30" max="21:00"
              onChange={e => setEndTime(e.target.value)}
              className={`${field} text-base font-normal normal-case tracking-normal text-forest-900`} />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-gray-500">Quick length:</span>
          {DURATIONS.map(d => {
            const active = startTime && endTime && toMinutes(endTime) - toMinutes(startTime) === d.minutes
            return (
              <button key={d.minutes} type="button" onClick={() => pickDuration(d.minutes)}
                className={`rounded-full border px-3 py-1 font-semibold transition
                  ${active ? 'border-gold-500 bg-gold-400 text-brand-900' : 'border-brand-500 text-brand-700 hover:bg-brand-50'}`}>
                {d.label}
              </button>
            )
          })}
        </div>

        {/* Day timeline: grey = already booked, green = your choice */}
        <div>
          <div className="relative h-8 overflow-hidden rounded bg-brand-50 ring-1 ring-inset ring-brand-500/20"
            role="img" aria-label="Room schedule for the day">
            {taken.map(t => (
              <div key={t.start} className="absolute inset-y-0 bg-gray-400/70"
                style={{ left: pos(minutesOfDay(t.start)), width: `calc(${pos(minutesOfDay(t.end))} - ${pos(minutesOfDay(t.start))})` }}
                title={`Booked ${clock(t.start)} to ${clock(t.end)}`} />
            ))}
            {showSelection && (
              <div className={`absolute inset-y-1 rounded ${problem ? 'bg-occupied/70' : 'bg-brand-500'}`}
                style={{ left: pos(toMinutes(startTime)), width: `calc(${pos(toMinutes(endTime))} - ${pos(toMinutes(startTime))})` }} />
            )}
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-gray-500">
            {[7, 10, 13, 16, 19, 21].map(h => <span key={h}>{((h + 11) % 12) + 1}{h < 12 ? 'a' : 'p'}</span>)}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {taken.length === 0
              ? 'No bookings for this room on this day yet.'
              : `Already booked: ${taken.map(t => `${clock(t.start)}–${clock(t.end)}`).join(', ')}`}
          </p>
        </div>
      </div>

      {problem && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-occupied">{problem}</p>}
      {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-occupied">{error}</p>}

      <button disabled={Boolean(problem)} onClick={() => setShowModal(true)}
        className="rounded bg-brand-700 px-5 py-2 font-semibold text-white hover:bg-brand-900 disabled:opacity-40">
        Review booking
      </button>

      {showModal && start && end && room && (
        <ConfirmModal roomName={room.name} start={start} end={end} busy={busy}
          onCancel={() => setShowModal(false)} onConfirm={confirm} />
      )}
    </section>
  )
}