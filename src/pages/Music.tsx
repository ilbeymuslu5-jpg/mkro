import { Link } from 'react-router-dom'
import { Pause, Play, Users } from 'lucide-react'
import { Avatar, Artwork, CoverTile } from '@/components/Avatar'
import { PageHeader } from '@/components/PageHeader'
import { PlayingBars } from '@/components/TrackRow'
import { formatDuration, track, trackArtistName } from '@/data/catalog'
import { person } from '@/data/people'
import { popularTracks, recommendationsFor } from '@/lib/discovery'
import { usePlayer } from '@/state/PlayerContext'

export function Music() {
  const popular = popularTracks()
  const suggestions = recommendationsFor().slice(0, 6)

  return (
    <div className="space-y-10">
      <PageHeader title="Müzik" subtitle="Şarkı üzerinden tanış" />

      <section>
        <h2 className="font-display text-lg">Popüler şarkılar</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Her kapağın altındaki sayı, o şarkıyı dinleyen kaç kişiyle eşleşebileceğini gösterir.
        </p>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {popular.map((entry) => (
            <li key={entry.trackId}>
              <PopularTile
                trackId={entry.trackId}
                listenerCount={entry.listenerIds.length}
                inYourTop={entry.inYourTop}
              />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-display text-lg">Sana özel öneriler</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Zevkine en yakın kişilerin dinlediği, senin listende olmayan şarkılar.
        </p>

        <ul className="space-y-2">
          {suggestions.map((suggestion) => (
            <li key={suggestion.trackId}>
              <SuggestionRow trackId={suggestion.trackId} fromIds={suggestion.fromIds} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function PopularTile({
  trackId,
  listenerCount,
  inYourTop,
}: {
  trackId: string
  listenerCount: number
  inYourTop: boolean
}) {
  const { trackId: current, isPlaying, play } = usePlayer()
  const item = track(trackId)
  const playingThis = current === trackId && isPlaying

  return (
    <button
      type="button"
      onClick={() => play(trackId)}
      aria-label={`${item.title} — ${trackArtistName(trackId)}, ${listenerCount} kişiyle eşleşebilirsin${
        playingThis ? ', duraklat' : ', çal'
      }`}
      className="group block w-full text-left"
    >
      <span className="relative block">
        <CoverTile seed={trackId} label={item.title} />

        <span
          className={`absolute inset-0 grid place-items-center rounded-xl bg-black/50 transition-opacity duration-200 ${
            playingThis ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus:opacity-100'
          }`}
        >
          {playingThis ? (
            <Pause className="size-7 text-white" aria-hidden="true" />
          ) : (
            <Play className="size-7 text-white" aria-hidden="true" />
          )}
        </span>

        <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          <Users className="size-3" aria-hidden="true" />
          <span className="tabular-nums">{listenerCount}</span>
        </span>

        {inYourTop && (
          <span className="absolute right-2 bottom-2 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-on-accent">
            listende
          </span>
        )}
      </span>

      <span className="mt-2 flex items-start gap-1.5">
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-sm font-medium text-resilient ${
              current === trackId ? 'text-accent' : ''
            }`}
          >
            {item.title}
          </span>
          <span className="block truncate text-xs text-muted-foreground text-resilient">
            {trackArtistName(trackId)}
          </span>
        </span>
        {playingThis && <PlayingBars className="mt-1 shrink-0" />}
      </span>

      <span className="mt-1 block text-xs text-accent">
        {listenerCount} kişiyle eşleşebilirsin
      </span>
    </button>
  )
}

function SuggestionRow({ trackId, fromIds }: { trackId: string; fromIds: string[] }) {
  const { trackId: current, isPlaying, play } = usePlayer()
  const item = track(trackId)
  const playingThis = current === trackId && isPlaying
  const shown = fromIds.slice(0, 3)

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3">
      <button
        type="button"
        onClick={() => play(trackId)}
        aria-label={`${item.title} ${playingThis ? 'duraklat' : 'çal'}`}
        className="relative shrink-0"
      >
        <Artwork seed={trackId} label={item.title} className="size-14" />
        <span
          className={`absolute inset-0 grid place-items-center rounded-lg bg-black/55 transition-opacity duration-200 ${
            playingThis ? 'opacity-100' : 'opacity-0 hover:opacity-100'
          }`}
        >
          {playingThis ? (
            <Pause className="size-5 text-white" aria-hidden="true" />
          ) : (
            <Play className="size-5 text-white" aria-hidden="true" />
          )}
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium text-resilient ${
            current === trackId ? 'text-accent' : ''
          }`}
        >
          {item.title}
        </p>
        <p className="truncate text-xs text-muted-foreground text-resilient">
          {trackArtistName(trackId)} · {formatDuration(item.durationSec)}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <ul className="flex -space-x-2">
            {shown.map((id) => (
              <li key={id}>
                <Link to={`/kisi/${id}`} aria-label={`${person(id).name} profiline git`}>
                  <Avatar seed={id} name={person(id).name} size="sm" className="ring-2 ring-card" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="min-w-0 truncate text-xs text-muted-foreground text-resilient">
            {person(shown[0]).name}
            {fromIds.length > 1 && ` ve ${fromIds.length - 1} kişi daha`} dinliyor
          </p>
        </div>
      </div>
    </div>
  )
}
