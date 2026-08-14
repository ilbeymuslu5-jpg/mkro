import { Pause, Play } from 'lucide-react'
import { Artwork } from './Avatar'
import { formatDuration, track, trackArtistName } from '@/data/catalog'
import { usePlayer } from '@/state/PlayerContext'

interface TrackRowProps {
  trackId: string
  index?: number
  /** Marks tracks both people listen to. */
  shared?: boolean
}

export function TrackRow({ trackId, index, shared }: TrackRowProps) {
  const { trackId: current, isPlaying, play } = usePlayer()
  const item = track(trackId)
  const active = current === trackId
  const playingThis = active && isPlaying

  return (
    <button
      type="button"
      onClick={() => play(trackId)}
      aria-label={`${item.title} — ${trackArtistName(trackId)}${playingThis ? ', duraklat' : ', çal'}`}
      className={`group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors duration-200 hover:bg-muted/70 ${
        active ? 'bg-muted/50' : ''
      }`}
    >
      {index !== undefined && (
        <span className="w-4 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
          {index + 1}
        </span>
      )}

      <span className="relative">
        <Artwork seed={trackId} label={item.title} className="size-11" />
        <span
          className={`absolute inset-0 grid place-items-center rounded-lg bg-black/55 transition-opacity duration-200 ${
            playingThis ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {playingThis ? (
            <Pause className="size-4 text-white" aria-hidden="true" />
          ) : (
            <Play className="size-4 text-white" aria-hidden="true" />
          )}
        </span>
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-sm font-medium text-resilient ${
            active ? 'text-accent' : ''
          }`}
        >
          {item.title}
        </span>
        <span className="block truncate text-xs text-muted-foreground text-resilient">
          {trackArtistName(trackId)}
        </span>
      </span>

      {shared && (
        <span className="hidden shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent sm:inline">
          ortak
        </span>
      )}

      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {formatDuration(item.durationSec)}
      </span>
    </button>
  )
}

/** Three animated bars — the universal "this is playing" cue. */
export function PlayingBars({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-end gap-0.5 ${className}`} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-0.5 origin-bottom animate-bar rounded-full bg-accent"
          style={{ height: 12, animationDelay: `${i * 140}ms` }}
        />
      ))}
    </span>
  )
}
