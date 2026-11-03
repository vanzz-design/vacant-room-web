type Tone = 'vacant' | 'occupied' | 'reserved' | 'pending'
type Size = 'sm' | 'md' | 'lg'

interface Props {
  tone: Tone
  size?: Size
  /** Turn the ping ring off, for example when the connection is down. */
  pulse?: boolean
}

const TONE: Record<Tone, string> = {
  vacant: 'bg-vacant',
  occupied: 'bg-occupied',
  reserved: 'bg-gold-400',
  pending: 'bg-gold-400',
}

const SIZE: Record<Size, string> = {
  sm: 'size-2',
  md: 'size-2.5',
  lg: 'size-3.5',
}

/**
 * Green = vacant, red = occupied, gold = waiting for the connection.
 * The outer ring uses animate-ping; it is skipped for people who ask
 * their device to reduce motion.
 */
export default function StatusDot({ tone, size = 'md', pulse = true }: Props) {
  return (
    <span className={`relative inline-flex shrink-0 ${SIZE[size]}`} aria-hidden="true">
      {pulse && (
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping ${TONE[tone]}`}
        />
      )}
      <span className={`relative inline-flex h-full w-full rounded-full ${TONE[tone]}`} />
    </span>
  )
}