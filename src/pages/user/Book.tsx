import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useRooms } from '../../hooks/useRooms'
import ConfirmModal from '../../components/booking/ConfirmModal'

const OPEN_HOUR = 7
const CLOSE_HOUR = 21
const HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i)

const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export default function Book() {
  const { profile } = useAuth()
  const { rooms } = useRooms()
  const navigate = useNavigate()

  const [roomId, setRoomId] = useState('')
  const [date, setDate] = useState(toDateInput(new Date()))
  const [duration, setDuration] = useState(1)
  const [startHour, setStartHour] = useState<number | null>(null)
  const [taken, setTaken] = useState<{ start: number; end: number }[]>([])
  const [showModal, setShowModal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (!roomId && rooms.length) setRoomId(rooms[0].id) }, [rooms, roomId])

  const slotStart = useCallback((h: number) => new Date(`${date}T${String(h).padStart(2, '0')}:00:00`), [date])

  const loadTaken = useCallback(async () => {
    if (!roomId) return
    const from = slotStart(0)
    const to = new Date(from.getTime() + 24 * 3600 * 1000)
    const { data } = await supabase.rpc('get_room_bookings', {
      p_room: roomId, p_from: from.toISOString(), p_to: to.toISOString(),
    })
    setTaken((data ?? []).map((b: { start_time: string; end_time: string }) => ({
      start: new Date(b.start_time).getTime(), end: new Date(b.end_time).getTime(),
    })))
  }, [roomId, slotStart])

  useEffect(() => { setStartHour(null); loadTaken() }, [loadTaken, duration])

  const blocked = useMemo(() => {
    const now = Date.now()
    return (h: number) => {
      const s = slotStart(h).getTime()
      const e = s + duration * 3600 * 1000
      if (s < now) return true
      if (h + duration > CLOSE_HOUR) return true
      return taken.some(t => s < t.end && e > t.start)   // overlap test
    }
  }, [taken, duration, slotStart])

  const room = rooms.find(r => r.id === roomId)
  const start = startHour !== null ? slotStart(startHour) : null
  const end = start ? new Date(start.getTime() + duration * 3600 * 1000) : null

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

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-brand-700">Book a room</h1>

      <div className="flex flex-wrap gap-3 rounded-xl bg-white p-4 shadow">
        <select value={roomId} onChange={e => setRoomId(e.target.value)} className="rounded border px-3 py-2">
          {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <input type="date" value={date} min={toDateInput(new Date())} onChange={e => setDate(e.target.value)} className="rounded border px-3 py-2" />
        <select value={duration} onChange={e => setDuration(Number(e.target.value))} className="rounded border px-3 py-2">
          {[1, 2, 3].map(h => <option key={h} value={h}>{h} hour{h > 1 ? 's' : ''}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {HOURS.map(h => {
          const off = blocked(h)
          const selected = startHour === h
          return (
            <button key={h} disabled={off} onClick={() => setStartHour(h)}
              className={`rounded-lg border px-2 py-3 text-sm font-semibold transition
                ${off ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 line-through'
                  : selected ? 'border-gold-500 bg-gold-400 text-brand-900'
                  : 'border-brand-500 bg-white text-brand-700 hover:bg-brand-50'}`}>
              {String(h).padStart(2, '0')}:00
            </button>
          )
        })}
      </div>

      {error && <p className="rounded bg-red-50 p-3 text-sm text-occupied">{error}</p>}

      <button disabled={startHour === null} onClick={() => setShowModal(true)}
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