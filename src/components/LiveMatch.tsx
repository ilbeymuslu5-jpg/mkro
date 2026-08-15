import { Link } from 'react-router-dom'
import { Loader2, Radio } from 'lucide-react'
import { Avatar } from './Avatar'
import { CompatRing } from './CompatRing'
import { track, trackArtistName } from '@/data/catalog'
import { person } from '@/data/people'
import { compatibility } from '@/lib/match'
import { useAuth, useMe } from '@/state/AuthContext'
import { useSocial } from '@/state/SocialContext'

/**
 * Finds someone on the exact same track as you right now. "Right now" comes
 * from the Spotify now-playing read, so the toggle is only useful while
 * something is actually playing.
 */
export function LiveMatch() {
  const me = useMe()
  const { nowPlaying } = useAuth()
  const { liveMatch, toggleLiveMatch } = useSocial()
  const on = liveMatch.phase !== 'off'

  return (
    <section className="overflow-hidden rounded-2xl border border-border/70 bg-card">
      <div className="flex items-center gap-3 p-4">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-full transition-colors duration-200 ${
            on ? 'bg-accent text-on-accent' : 'bg-muted text-muted-foreground'
          }`}
        >
          <Radio className="size-5" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base leading-tight">Anlık eşleşme</h2>
          <p className="mt-0.5 truncate text-xs text-muted-foreground text-resilient">
            {nowPlaying
              ? `${track(nowPlaying.trackId).title} çalıyor`
              : 'Şu an bir şey çalmıyor'}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={on}
          onClick={toggleLiveMatch}
          aria-label="Anlık eşleşmeyi aç kapa"
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
            on ? 'bg-accent' : 'bg-muted'
          }`}
        >
          <span
            className={`absolute top-1 left-1 size-5 rounded-full bg-white transition-transform duration-200 ${
              on ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {liveMatch.phase === 'searching' && (
        <div className="flex items-center gap-2 border-t border-border/60 bg-accent/5 px-4 py-3">
          <Loader2 className="size-4 shrink-0 animate-spin text-accent" aria-hidden="true" />
          <p className="text-sm text-accent">Aynı şarkıyı dinleyen biri aranıyor…</p>
        </div>
      )}

      {liveMatch.phase === 'empty' && (
        <div className="border-t border-border/60 px-4 py-3">
          <p className="text-sm text-muted-foreground text-resilient">
            {liveMatch.trackId
              ? `Şu an ${track(liveMatch.trackId).title} dinleyen başka kimse yok. Açık bırak, biri başlarsa haber veririz.`
              : 'Önce Spotify’da bir şeyler çal, sonra tekrar dene.'}
          </p>
        </div>
      )}

      {liveMatch.phase === 'found' && (
        <FoundCard personId={liveMatch.personId} trackId={liveMatch.trackId} me={me} />
      )}
    </section>
  )
}

function FoundCard({
  personId,
  trackId,
  me,
}: {
  personId: string
  trackId: string
  me: Parameters<typeof compatibility>[0]
}) {
  const other = person(personId)
  const score = compatibility(me, other).score

  return (
    <div className="animate-rise border-t border-border/60 bg-accent/5 p-4">
      <p className="text-xs font-medium tracking-wider text-accent uppercase">
        {other.online ? 'şu anda aynı şarkıda' : 'aynı şarkıyı dinliyor'}
      </p>

      <div className="mt-3 flex items-center gap-3">
        <Avatar seed={other.id} name={other.name} online={other.online} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-resilient">{other.name}</p>
          <p className="truncate text-xs text-muted-foreground text-resilient">
            {track(trackId).title} — {trackArtistName(trackId)}
          </p>
        </div>

        <CompatRing score={score} size={52} showCaption={false} />
      </div>

      <Link
        to={`/kisi/${other.id}`}
        className="mt-3 block rounded-xl bg-accent px-4 py-2.5 text-center text-sm font-semibold text-on-accent transition-transform duration-200 hover:scale-[1.02] active:scale-95"
      >
        Profiline bak
      </Link>
    </div>
  )
}
