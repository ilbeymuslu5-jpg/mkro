import { Link } from 'react-router-dom'
import { ChevronRight, Radio } from 'lucide-react'
import { track } from '@/data/catalog'
import { useAuth } from '@/state/AuthContext'
import { useSocial } from '@/state/SocialContext'

/**
 * Entry point for the live board. The swiping itself happens on /anlik — one
 * deck per screen, so this never competes with the Keşfet deck below it.
 */
export function LiveMatch() {
  const { nowPlaying } = useAuth()
  const { liveOn, liveBoard, toggleLiveMatch } = useSocial()

  return (
    <section className="overflow-hidden rounded-2xl border border-border/70 bg-card">
      <div className="flex items-center gap-3 p-4">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-full transition-colors duration-200 ${
            liveOn ? 'bg-accent text-on-accent' : 'bg-muted text-muted-foreground'
          }`}
        >
          <Radio className="size-5" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base leading-tight">Anlık eşleşme</h2>
          <p className="mt-0.5 truncate text-xs text-muted-foreground text-resilient">
            {nowPlaying ? `${track(nowPlaying.trackId).title} çalıyor` : 'Şu an bir şey çalmıyor'}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={liveOn}
          onClick={toggleLiveMatch}
          aria-label="Anlık eşleşmeyi aç kapa"
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
            liveOn ? 'bg-accent' : 'bg-muted'
          }`}
        >
          <span
            className={`absolute top-1 left-1 size-5 rounded-full bg-white transition-transform duration-200 ${
              liveOn ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {liveOn && (
        <Link
          to="/anlik"
          className="flex items-center gap-2 border-t border-border/60 bg-accent/5 px-4 py-3 transition-colors duration-200 hover:bg-accent/10"
        >
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-accent text-resilient">
            {liveBoard.length > 0
              ? `Panoda ${liveBoard.length} kişi — kaydırmaya başla`
              : 'Pano dolmayı bekliyor'}
          </p>
          <ChevronRight className="size-4 shrink-0 text-accent" aria-hidden="true" />
        </Link>
      )}
    </section>
  )
}
