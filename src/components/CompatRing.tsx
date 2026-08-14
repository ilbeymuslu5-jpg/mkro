import { scoreTone } from '@/lib/match'

const TONE_CLASS = {
  high: 'text-accent',
  mid: 'text-secondary',
  low: 'text-muted-foreground',
} as const

interface CompatRingProps {
  score: number
  size?: number
  /** Hidden on tiny sizes where the caption would be unreadable. */
  showCaption?: boolean
}

export function CompatRing({ score, size = 64, showCaption = true }: CompatRingProps) {
  const stroke = size < 56 ? 4 : 5
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const tone = scoreTone(score)

  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center ${TONE_CLASS[tone]}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Müzik uyumu yüzde ${score}`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          className="stroke-current transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center leading-none">
        <span className="font-display" style={{ fontSize: size * 0.28 }}>
          {score}
        </span>
        {showCaption && (
          <span
            className="mt-0.5 text-muted-foreground uppercase"
            style={{ fontSize: Math.max(7, size * 0.1) }}
          >
            uyum
          </span>
        )}
      </span>
    </span>
  )
}
