import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Reservation, Room } from '../types/db'

// Rooms that have a booking starting soon and nobody checked in yet.
// Refreshes every 30 s, and straight away when any room's status changes
// (for example when the booker taps their card and the room becomes Occupied).
export function useReservations(rooms: Room[]) {
  const [byRoom, setByRoom] = useState<Record<string, Reservation>>({})
  const signature = rooms.map(r => `${r.id}:${r.status}`).join('|')

  useEffect(() => {
    let active = true

    const load = async () => {
      const { data } = await supabase.rpc('get_active_reservations')
      if (!active || !data) return
      const map: Record<string, Reservation> = {}
      for (const r of data as Reservation[]) if (!map[r.room_id]) map[r.room_id] = r
      setByRoom(map)
    }

    load()
    const timer = setInterval(load, 30000)
    return () => { active = false; clearInterval(timer) }
  }, [signature])

  return byRoom
}