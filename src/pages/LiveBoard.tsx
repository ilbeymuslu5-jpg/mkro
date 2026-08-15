import { Link } from 'react-router-dom'
import { Heart, Radio, Sparkles, X } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { CompatRing } from '@/components/CompatRing'
import { PageHeader } from '@/components/PageHeader'
import { SwipeCard } from '@/components/SwipeCard'
import { artist, GENRE_LABEL, track, trackArtistName } from '@/data/catalog'
import { person } from '@/data/people'
import { compatibility } from '@/lib/match'
import { REASON_LABEL, type LiveCandidate } from '@/lib/liveBoard'
import { useAuth, useMe } from '@/state/AuthContext'
import { LIVE_BOARD_INTERVAL_MS, useSocial } from '@/state/SocialContext'

export function LiveBoard() {
  const { nowPlaying } = useAuth()
  const { liveOn, liveBoard, liveExhausted, toggleLiveMatch } = useSocial()

  const seconds = Math.round(LIVE_BOARD_INTERVAL_MS / 1000)

  return (
    <div>
      <PageHeader
        title="Anlık eşleşme"
        subtitle={
          nowPlaying
            ? `${track(nowPlaying.trackId).title} — ${trackArtistName(nowPlaying.trackId)}`
            : 'Şu an bir şey çalmıyor'
        }
        action={
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
        }
      />

      {!nowPlaying ? (
        <Empty
          title="Önce bir şeyler çal"
          body="Spotify’da bir parça başladığında pano onu dinleyenlerle dolmaya başlar."
        />
      ) : !liveOn ? (
        <Empty
          title="Radar kapalı"
          body={`Aç, ${seconds} saniyede bir aynı şarkıdaki biri panoya düşsün. Sağa kaydır beğen, sola kaydır geç.`}
          action={
            <button
              type="button"
              onClick={toggleLiveMatch}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-on-accent transition-transform duration-200 hover:scale-[1.02] active:scale-95"
            >
              <Radio className="size-4" aria-hidden="true" />
              Radarı aç
            </button>
          }
        />
      ) : liveBoard.length === 0 ? (
        <Empty
          title={liveExhausted ? 'Pano boşaldı' : 'Dinleyenler aranıyor…'}
          body={
            liveExhausted
              ? 'Bu şarkı için herkesi gördün. Başka bir şey çalmaya başlayınca pano yeniden dolar.'
              : `Radar açık. ${seconds} saniyede bir yeni biri düşecek.`
          }
        />
      ) : (
        <Deck board={liveBoard} />
      )}

      {liveOn && liveBoard.length > 0 && (
        <p className="mt-5 text-center text-xs text-muted-foreground text-resilient">
          Panoda {liveBoard.length} kişi · {seconds} saniyede bir yenisi düşüyor
        </p>
      )}
    </div>
  )
}

function Deck({ board }: { board: LiveCandidate[] }) {
  const me = useMe()
  const { swipeLive } = useSocial()

  // Oldest card is on top — it has been waiting the longest.
  const [top, ...rest] = board

  return (
    <div className="relative">
      {rest.slice(0, 2).map((entry, index) => (
        <div
          key={entry.personId}
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-72 rounded-2xl border border-border/50 bg-card/60"
          style={{
            transform: `translateY(${(index + 1) * 10}px) scale(${1 - (index + 1) * 0.03})`,
            zIndex: -1,
          }}
        />
      ))}

      <SwipeCard key={top.personId} onSwipe={(direction) => swipeLive(top.personId, direction)}>
        <BoardCard entry={top} me={me} />
      </SwipeCard>

      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => swipeLive(top.personId, 'pass')}
          aria-label={`${person(top.personId).name} kişisini geç`}
          className="grid size-14 place-items-center rounded-full border border-border/70 bg-card text-muted-foreground transition-all duration-200 hover:scale-105 hover:border-destructive/60 hover:text-destructive active:scale-95"
        >
          <X className="size-6" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => swipeLive(top.personId, 'like')}
          aria-label={`${person(top.personId).name} kişisini beğen`}
          className="grid size-16 place-items-center rounded-full bg-accent text-on-accent transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <Heart className="size-7" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function BoardCard({ entry, me }: { entry: LiveCandidate; me: Parameters<typeof compatibility>[0] }) {
  const other = person(entry.personId)
  const match = compatibility(me, other)

  return (
    <article className="animate-rise overflow-hidden rounded-2xl border border-border/70 bg-card select-none">
      <div className="flex items-center gap-2 bg-accent/10 px-5 py-2.5">
        <Radio className="size-3.5 shrink-0 text-accent" aria-hidden="true" />
        <p className="truncate text-xs font-medium tracking-wider text-accent uppercase">
          {REASON_LABEL[entry.reason]}
        </p>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-4">
          <Avatar seed={other.id} name={other.name} size="lg" online={other.online} />

          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl leading-tight text-resilient">{other.name}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground text-resilient">
              {other.age} · {other.city}
            </p>
          </div>

          <CompatRing score={match.score} size={64} />
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-resilient">
          {other.bio}
        </p>
      </div>

      <div className="flex items-start gap-2 border-t border-border/60 px-5 py-3">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
        <p className="text-sm text-accent text-resilient">{match.headline}</p>
      </div>

      <div className="space-y-3 p-5">
        {match.sharedArtistIds.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {match.sharedArtistIds.map((id) => (
              <li key={id}>
                <span className="inline-block max-w-full truncate rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent">
                  {artist(id).name}
                </span>
              </li>
            ))}
          </ul>
        )}

        <ul className="flex flex-wrap gap-1.5">
          {other.genres.map((genre) => (
            <li key={genre}>
              <span className="inline-block rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                {GENRE_LABEL[genre]}
              </span>
            </li>
          ))}
        </ul>

        <Link
          to={`/kisi/${other.id}`}
          className="block rounded-xl border border-border/70 px-4 py-2.5 text-center text-sm font-medium transition-colors duration-200 hover:bg-muted"
        >
          Profilin tamamını gör
        </Link>
      </div>
    </article>
  )
}

function Empty({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-8 text-center">
      <p className="font-display text-lg text-balance">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-balance text-muted-foreground">{body}</p>
      {action}
    </div>
  )
}
