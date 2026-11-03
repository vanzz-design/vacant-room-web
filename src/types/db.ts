export type RoomStatus = 'Vacant' | 'Occupied'

// What the dashboard shows. "Reserved" is worked out from bookings, it is never stored on the room.
export type DisplayStatus = RoomStatus | 'Reserved'

export interface Reservation {
  room_id: string
  start_time: string
  end_time: string
}

export interface Room {
  id: string
  name: string
  building: string | null
  capacity: number | null
  status: RoomStatus
  last_tap_at: string | null
}

export interface Profile {
  id: string
  full_name: string
  student_id: string | null
  role: 'user' | 'admin'
  rfid_uid: string | null
  strike_count: number
  suspended_until: string | null
}

export interface Booking {
  id: string
  room_id: string
  start_time: string
  end_time: string
  status: 'confirmed' | 'checked_in' | 'completed' | 'cancelled'
  cancel_reason: string | null
}