import { gradientFor, initials } from '@/lib/visual'

const SIZES = {
  sm: 'size-10 text-xs',
  md: 'size-14 text-sm',
  lg: 'size-20 text-lg',
  xl: 'size-28 text-2xl',
} as const

interface AvatarProps {
  seed: string
  name: string
  size?: keyof typeof SIZES
  online?: boolean
  className?: string
}

export function Avatar({ seed, name, size = 'md', online, className = '' }: AvatarProps) {
  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      <span
        aria-hidden="true"
        style={{ backgroundImage: gradientFor(seed) }}
        className={`${SIZES[size]} grid place-items-center rounded-full font-display tracking-wide text-white ring-1 ring-white/10`}
      >
        {initials(name)}
      </span>
      {online !== undefined && (
        <span
          className={`absolute right-0 bottom-0 size-3 rounded-full ring-2 ring-background ${
            online ? 'bg-accent' : 'bg-muted-foreground'
          }`}
        >
          <span className="sr-only">{online ? 'çevrimiçi' : 'çevrimdışı'}</span>
        </span>
      )}
    </span>
  )
}

/** Square variant used for album art. */
export function Artwork({
  seed,
  label,
  className = 'size-12',
}: {
  seed: string
  label: string
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      style={{ backgroundImage: gradientFor(seed) }}
      className={`${className} grid shrink-0 place-items-center rounded-lg font-display text-xs text-white/90 ring-1 ring-white/10`}
    >
      {initials(label)}
    </span>
  )
}
