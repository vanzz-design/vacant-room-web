import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Room } from '../types/db'

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(false)

  useEffect(() => {
    let active = true

    const load = async () => {
      const { data } = await supabase.from('rooms').select('*').order('id')
      if (active && data) setRooms(data as Room[])
      if (active) setLoading(false)
    }

    const channel = supabase
      .channel('rooms-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, payload => {
        if (payload.eventType === 'DELETE') {
          const old = payload.old as Partial<Room>
          setRooms(prev => prev.filter(r => r.id !== old.id))
        } else {
          const row = payload.new as Room
          setRooms(prev =>
            prev.some(r => r.id === row.id)
              ? prev.map(r => (r.id === row.id ? row : r))
              : [...prev, row].sort((a, b) => a.id.localeCompare(b.id))
          )
        }
      })
      .subscribe(state => {
        setLive(state === 'SUBSCRIBED')
        // re-fetch on (re)connect so no event is missed while offline
        if (state === 'SUBSCRIBED') load()
      })

    return () => { active = false; supabase.removeChannel(channel) }
  }, [])

  return { rooms, loading, live }
}