import { Pause, Play, X } from 'lucide-react'
import { Artwork } from './Avatar'
import { formatDuration, track, trackArtistName } from '@/data/catalog'
import { usePlayer } from '@/state/PlayerContext'

export function MiniPlayer() {
  const { trackId, isPlaying, progress, toggle, stop, seek } = usePlayer()
  if (trackId === null) return null

  const item = track(trackId)
  const pct = Math.min(100, (progress / item.durationSec) * 100)

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-16 z-30 px-3 md:bottom-0 md:left-64 md:px-0">
      <div className="pointer-events-auto mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-2xl backdrop-blur md:mb-0 md:max-w-none md:rounded-none md:border-x-0 md:border-b-0">
        <div className="flex items-center gap-3 p-2.5">
          <Artwork seed={trackId} label={item.title} className="size-11" />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-resilient">{item.title}</p>
            <p className="truncate text-xs text-muted-foreground text-resilient">
              {trackArtistName(trackId)}
            </p>
          </div>

          <span className="hidden shrink-0 text-xs tabular-nums text-muted-foreground sm:block">
            {formatDuration(progress)} / {formatDuration(item.durationSec)}
          </span>

          <button
            type="button"
            onClick={toggle}
            aria-label={isPlaying ? 'Duraklat' : 'Çal'}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-on-accent transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            {isPlaying ? (
              <Pause className="size-5" aria-hidden="true" />
            ) : (
              <Play className="size-5" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={stop}
            aria-label="Çaları kapat"
            className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <label className="block px-2.5 pb-2">
          <span className="sr-only">Şarkı konumu</span>
          <input
            type="range"
            min={0}
            max={item.durationSec}
            step={1}
            value={Math.floor(progress)}
            onChange={(event) => seek(Number(event.target.value))}
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-muted accent-accent"
            style={{
              background: `linear-gradient(to right, var(--color-accent) ${pct}%, var(--color-muted) ${pct}%)`,
            }}
          />
        </label>
      </div>
    </div>
  )
}
