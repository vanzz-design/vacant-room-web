import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Room } from '../../types/db'
import StackedBars, { type BarSeries } from '../../components/charts/StackedBars'
import Heatmap, { type HeatCell } from '../../components/charts/Heatmap'
import Donut, { type DonutPart } from '../../components/charts/Donut'

interface Util { room_id: string; room_name: string; occupied_hours: number; utilization_pct: number }
interface Leader { user_id: string; full_name: string; student_id: string | null; strikes: number; last_strike: string; suspended_until: string | null }
interface DayStat { day: string; attended: number; no_shows: number; cancelled: number; upcoming: number }
interface PeakRow { dow: number; hr: number; booking_count: number }

type Health = 'Active' | 'Idle' | 'No activity'
function health(lastTap: string | null): { label: Health; color: string; ago: string } {
  if (!lastTap) return { label: 'No activity', color: 'bg-gray-400', ago: 'never' }
  const mins = (Date.now() - new Date(lastTap).getTime()) / 60000
  const ago = mins < 60 ? `${Math.round(mins)} min ago` : mins < 1440 ? `${Math.round(mins / 60)} h ago` : `${Math.round(mins / 1440)} d ago`
  if (mins < 60) return { label: 'Active', color: 'bg-brand-500', ago }
  if (mins < 1440) return { label: 'Idle', color: 'bg-gold-500', ago }
  return { label: 'No activity', color: 'bg-occupied', ago }
}

const BAR_SERIES: BarSeries[] = [
  { name: 'Attended', fill: 'fill-brand-500', dot: 'bg-brand-500' },
  { name: 'Upcoming', fill: 'fill-gold-400', dot: 'bg-gold-400' },
  { name: 'Cancelled', fill: 'fill-gray-400', dot: 'bg-gray-400' },
  { name: 'No-show', fill: 'fill-occupied', dot: 'bg-occupied' },
]

const pct = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)}%` : '—')

export default function Analytics() {
  const [days, setDays] = useState(30)
  const [util, setUtil] = useState<Util[]>([])
  const [stats, setStats] = useState<DayStat[]>([])
  const [peak, setPeak] = useState<PeakRow[]>([])
  const [leaders, setLeaders] = useState<Leader[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // Bookings, utilization, heatmap and leaderboard follow the date range.
  useEffect(() => {
    let active = true
    ;(async () => {
      await supabase.rpc('sweep_no_shows')   // make sure no-shows are up to date
      const [u, s, p, l] = await Promise.all([
        supabase.rpc('admin_room_utilization', { p_days: days }),
        supabase.rpc('admin_booking_stats', { p_days: days }),
        supabase.rpc('admin_peak_hours', { p_days: days }),
        supabase.rpc('admin_noshow_leaderboard', { p_limit: 10 }),
      ])
      if (!active) return
      const failed = [u, s, p, l].find(r => r.error)
      setError(failed?.error ? failed.error.message : '')
      setUtil((u.data ?? []) as Util[])
      setStats((s.data ?? []) as DayStat[])
      setPeak((p.data ?? []) as PeakRow[])
      setLeaders((l.data ?? []) as Leader[])
      setLoading(false)
    })()
    return () => { active = false }
  }, [days])

  // Hardware health refreshes on its own every 30 s.
  useEffect(() => {
    const loadRooms = () =>
      supabase.from('rooms').select('*').order('id').then(({ data }) => setRooms((data ?? []) as Room[]))
    loadRooms()
    const t = setInterval(loadRooms, 30000)
    return () => clearInterval(t)
  }, [])

  const totals = useMemo(() => {
    const attended = stats.reduce((a, d) => a + d.attended, 0)
    const noShows = stats.reduce((a, d) => a + d.no_shows, 0)
    const cancelled = stats.reduce((a, d) => a + d.cancelled, 0)
    const upcoming = stats.reduce((a, d) => a + d.upcoming, 0)
    const avgUtil = util.length ? util.reduce((a, u) => a + Number(u.utilization_pct), 0) / util.length : 0
    return { attended, noShows, cancelled, upcoming, all: attended + noShows + cancelled + upcoming, avgUtil }
  }, [stats, util])

  const barData = useMemo(
    () =>
      stats.map(d => ({
        label: new Date(`${d.day}T00:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        values: [d.attended, d.upcoming, d.cancelled, d.no_shows],
      })),
    [stats]
  )

  const heatCells: HeatCell[] = useMemo(
    () => peak.map(p => ({ dow: p.dow, hr: p.hr, value: p.booking_count })),
    [peak]
  )

  const donutParts: DonutPart[] = [
    { label: 'Attended', value: totals.attended, stroke: 'stroke-brand-500', dot: 'bg-brand-500' },
    { label: 'Upcoming', value: totals.upcoming, stroke: 'stroke-gold-400', dot: 'bg-gold-400' },
    { label: 'Cancelled', value: totals.cancelled, stroke: 'stroke-gray-400', dot: 'bg-gray-400' },
    { label: 'No-show', value: totals.noShows, stroke: 'stroke-occupied', dot: 'bg-occupied' },
  ]

  // Busiest slot, in words, for the heatmap caption
  const busiest = useMemo(() => {
    if (!peak.length) return null
    const top = peak.reduce((a, b) => (b.booking_count > a.booking_count ? b : a))
    const name = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][top.dow]
    const h12 = ((top.hr + 11) % 12) + 1
    return `${name}s at ${h12}:00 ${top.hr < 12 ? 'AM' : 'PM'}`
  }, [peak])

  const card = 'rounded-xl bg-white p-5 shadow border-t-4 border-gold-500'
  const finished = totals.attended + totals.noShows

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-brand-700">Analytics</h1>
        {loading && <span className="text-sm text-gray-500">Loading…</span>}
        <select
          value={days}
          onChange={e => { setLoading(true); setDays(Number(e.target.value)) }}
          aria-label="Date range"
          className="ml-auto rounded border px-2 py-1 text-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {error && (
        <p role="alert" className="rounded bg-red-50 p-3 text-sm text-occupied">
          Could not load analytics: {error}. If this mentions a missing function, run the
          booking_and_analytics.sql script in Supabase, and make sure your profile role is “admin”.
        </p>
      )}

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Bookings', value: String(totals.all), hint: `last ${days} days` },
          { label: 'Attendance rate', value: pct(totals.attended, finished), hint: `${totals.attended} of ${finished} finished` },
          { label: 'No-show rate', value: pct(totals.noShows, finished), hint: `${totals.noShows} no-shows` },
          { label: 'Avg. room utilization', value: `${totals.avgUtil.toFixed(1)}%`, hint: 'of 7 AM–9 PM hours' },
        ].map(k => (
          <div key={k.label} className="rounded-xl bg-white p-4 shadow">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{k.label}</p>
            <p className="mt-1 text-3xl font-bold text-brand-700 tabular-nums">{k.value}</p>
            <p className="text-xs text-gray-500">{k.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bookings per day */}
        <div className={`${card} lg:col-span-2`}>
          <h2 className="mb-3 text-lg font-bold text-brand-700">Bookings per day</h2>
          {stats.length ? (
            <StackedBars data={barData} series={BAR_SERIES} ariaLabel="Bookings per day by outcome" />
          ) : (
            <p className="text-sm text-gray-500">No data yet.</p>
          )}
        </div>

        {/* Utilization */}
        <div className={card}>
          <h2 className="mb-1 text-lg font-bold text-brand-700">Room utilization</h2>
          <p className="mb-3 text-xs text-gray-500">Time a room was actually occupied (from door taps), as a share of open hours.</p>
          <div className="space-y-3">
            {util.map(u => (
              <div key={u.room_id}>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">{u.room_name}</span>
                  <span className="tabular-nums">{Number(u.utilization_pct)}% · {Number(u.occupied_hours)} h</span>
                </div>
                <div className="h-3 overflow-hidden rounded bg-brand-50">
                  <div className="h-full rounded bg-brand-500" style={{ width: `${Math.min(Number(u.utilization_pct), 100)}%` }} />
                </div>
              </div>
            ))}
            {util.length === 0 && <p className="text-sm text-gray-500">No rooms yet.</p>}
          </div>
          {util.length > 1 && (
            <p className="mt-3 text-sm text-brand-700/80">
              Most used: <b>{util[0].room_name}</b> · Least used: <b>{util[util.length - 1].room_name}</b>
            </p>
          )}
        </div>

        {/* Outcomes */}
        <div className={card}>
          <h2 className="mb-3 text-lg font-bold text-brand-700">Booking outcomes</h2>
          <Donut parts={donutParts} centerLabel="bookings" />
        </div>

        {/* Peak hours */}
        <div className={`${card} lg:col-span-2`}>
          <h2 className="mb-1 text-lg font-bold text-brand-700">Peak hours</h2>
          <p className="mb-3 text-xs text-gray-500">
            Booked hours by weekday and time of day.{busiest && <> Busiest: <b>{busiest}</b>.</>}
          </p>
          <Heatmap cells={heatCells} />
        </div>

        {/* No-show leaderboard */}
        <div className={card}>
          <h2 className="mb-3 text-lg font-bold text-brand-700">No-show leaderboard</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-brand-700/70"><th>#</th><th>Student</th><th>Strikes</th><th>Status</th></tr></thead>
            <tbody>
              {leaders.map((l, i) => (
                <tr key={l.user_id} className="border-t">
                  <td className="py-2">{i + 1}</td>
                  <td>{l.full_name}<span className="block text-xs text-gray-500">{l.student_id}</span></td>
                  <td className="font-bold text-occupied">{l.strikes}</td>
                  <td>{l.suspended_until && new Date(l.suspended_until) > new Date()
                    ? <span className="rounded bg-gold-100 px-2 py-0.5 text-xs font-semibold">Suspended</span> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {leaders.length === 0 && <p className="text-sm text-gray-500">No no-shows recorded 🎉</p>}
          <p className="mt-3 text-xs text-gray-500">3 strikes = booking suspended for 7 days.</p>
        </div>

        {/* Hardware health */}
        <div className={card}>
          <h2 className="mb-3 text-lg font-bold text-brand-700">Hardware health</h2>
          <ul className="space-y-2">
            {rooms.map(r => {
              const h = health(r.last_tap_at)
              return (
                <li key={r.id} className="flex items-center gap-3 text-sm">
                  <span className={`h-3 w-3 rounded-full ${h.color}`} />
                  <b>{r.id}</b><span>{h.label}</span>
                  <span className="ml-auto text-gray-500">last log {h.ago}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}