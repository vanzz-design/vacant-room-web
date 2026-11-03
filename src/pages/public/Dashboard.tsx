import { useRooms } from '../../hooks/useRooms'
import { useReservations } from '../../hooks/useReservations'
import RoomCard from '../../components/rooms/RoomCard'
import StatusDot from '../../components/ui/StatusDot'

export default function Dashboard() {
  const { rooms, loading, live } = useRooms()
  const reservations = useReservations(rooms)

  const free = rooms.filter(r => r.status === 'Vacant')
  const reserved = free.filter(r => reservations[r.id]).length
  const vacant = free.length - reserved
  const occupied = rooms.length - free.length

  return (
    <section aria-labelledby="dashboard-title">
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div className="max-w-xl">
          <h1
            id="dashboard-title"
            className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl"
          >
            Find a free room
          </h1>
          <p className="mt-3 max-w-md text-base leading-relaxed text-forest-200">
            Each card changes the moment someone taps their card at the door.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] py-1.5 pl-3 pr-3.5 ring-1 ring-inset ring-white/10 backdrop-blur-md">
            <StatusDot tone="vacant" pulse={false} size="sm" />
            <span className="font-medium tabular-nums text-white">{vacant}</span>
            <span className="text-forest-200">vacant</span>
          </span>

          <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] py-1.5 pl-3 pr-3.5 ring-1 ring-inset ring-white/10 backdrop-blur-md">
            <StatusDot tone="reserved" pulse={false} size="sm" />
            <span className="font-medium tabular-nums text-white">{reserved}</span>
            <span className="text-forest-200">reserved</span>
          </span>

          <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] py-1.5 pl-3 pr-3.5 ring-1 ring-inset ring-white/10 backdrop-blur-md">
            <StatusDot tone="occupied" pulse={false} size="sm" />
            <span className="font-medium tabular-nums text-white">{occupied}</span>
            <span className="text-forest-200">occupied</span>
          </span>

          <span
            role="status"
            className="inline-flex items-center gap-2 rounded-full bg-gold-400/10 py-1.5 pl-3 pr-3.5 text-gold-100 ring-1 ring-inset ring-gold-400/30"
          >
            <StatusDot tone={live ? 'vacant' : 'pending'} pulse={live} />
            {live ? 'Live' : 'Reconnecting'}
          </span>
        </div>
      </header>

      <div className="mt-8">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-3xl bg-white/[0.05] ring-1 ring-inset ring-white/10"
              />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/20 p-10 text-center">
            <p className="font-display text-2xl font-semibold">No rooms yet</p>
            <p className="mt-2 text-forest-200">
              Add a row to the rooms table in Supabase and it will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {rooms.map(room => (
              <RoomCard key={room.id} room={room} reservation={reservations[room.id]} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}