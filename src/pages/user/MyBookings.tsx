import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import type { Booking } from '../../types/db'

export default function MyBookings() {
  const { profile, refreshProfile } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [uid, setUid] = useState('')
  const [msg, setMsg] = useState('')

  const load = async () => {
    await supabase.rpc('sweep_no_shows')   // apply any missed check-ins before listing
    const { data } = await supabase.from('bookings').select('*').order('start_time', { ascending: false })
    setBookings((data ?? []) as Booking[])
  }
  useEffect(() => { load() }, [])
  useEffect(() => { setUid(profile?.rfid_uid ?? '') }, [profile])

  const saveCard = async () => {
    const { error } = await supabase.from('profiles').update({ rfid_uid: uid.trim().toUpperCase() || null }).eq('id', profile!.id)
    setMsg(error ? error.message : 'Card saved.')
    refreshProfile()
  }

  const cancel = async (id: string) => {
    await supabase.from('bookings').update({ status: 'cancelled', cancel_reason: 'user' }).eq('id', id)
    load()
  }

  const badge: Record<string, string> = {
    confirmed: 'bg-gold-400 text-brand-900', checked_in: 'bg-brand-500 text-white',
    completed: 'bg-brand-700 text-white', cancelled: 'bg-gray-300 text-gray-700',
  }

  return (
    <section className="space-y-6">
      <div className="rounded-xl bg-white p-4 shadow">
        <h2 className="font-bold text-brand-700">My RFID card</h2>
        <div className="mt-2 flex gap-2">
          <input value={uid} onChange={e => setUid(e.target.value)} placeholder="e.g. A1B2C3D4" className="rounded border px-3 py-2 font-mono" />
          <button onClick={saveCard} className="rounded bg-brand-700 px-4 py-2 text-white">Save</button>
        </div>
        {msg && <p className="mt-1 text-sm">{msg}</p>}
        <p className="mt-2 text-sm">Strikes: <b>{profile?.strike_count ?? 0}</b></p>
      </div>

      <div className="space-y-2">
        {bookings.map(b => (
          <div key={b.id} className="flex items-center gap-3 rounded-lg bg-white p-3 shadow">
            <b>{b.room_id}</b>
            <span className="text-sm">{new Date(b.start_time).toLocaleString()} → {new Date(b.end_time).toLocaleTimeString()}</span>
            <span className={`ml-auto rounded-full px-3 py-1 text-xs font-bold ${badge[b.status]}`}>
              {b.cancel_reason === 'ghost' ? 'AUTO-CANCELED (NO-SHOW)' : b.status.toUpperCase()}
            </span>
            {b.status === 'confirmed' && new Date(b.start_time) > new Date() && (
              <button onClick={() => cancel(b.id)} className="text-sm text-occupied underline">Cancel</button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}