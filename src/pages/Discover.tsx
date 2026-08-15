import { Link } from 'react-router-dom'
import { Heart, RotateCcw, Sparkles, X } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { CompatRing } from '@/components/CompatRing'
import { TrackRow } from '@/components/TrackRow'
import { PageHeader } from '@/components/PageHeader'
import { artist, GENRE_LABEL } from '@/data/catalog'
import { person } from '@/data/people'
import { compatibility } from '@/lib/match'
import { useSocial } from '@/state/SocialContext'
import { useMe } from '@/state/AuthContext'
import { LiveMatch } from '@/components/LiveMatch'

export function Discover() {
  const me = useMe()
  const { queue, like, pass, resetQueue } = useSocial()

  if (queue.length === 0) return <EmptyQueue onReset={resetQueue} />

  const [currentId, ...rest] = queue
  const current = person(currentId)
  const match = compatibility(me, current)

  return (
    <div>
      <PageHeader
        title="Keşfet"
        subtitle={`${queue.length} kişi müzik zevkinle eşleşiyor`}
      />

      <div className="mb-5">
        <LiveMatch />
      </div>

      <div className="relative">
        {/* Peek at the next two cards so the deck reads as a stack. */}
        {rest.slice(0, 2).map((id, index) => (
          <div
            key={id}
            aria-hidden="true"
            className="absolute inset-x-0 top-0 rounded-2xl border border-border/50 bg-card/60"
            style={{
              height: 320,
              transform: `translateY(${(index + 1) * 10}px) scale(${1 - (index + 1) * 0.03})`,
              zIndex: -1,
            }}
          />
        ))}

        <article
          key={currentId}
          className="animate-rise overflow-hidden rounded-2xl border border-border/70 bg-card"
        >
          <div className="p-5">
            {/* At 375px the bio needs the full width, so it drops below the identity row. */}
            <div className="flex items-center gap-4">
              <Avatar seed={current.id} name={current.name} size="lg" online={current.online} />

              <div className="min-w-0 flex-1">
                <h2 className="font-display text-xl leading-tight text-resilient">
                  {current.name}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground text-resilient">
                  {current.age} · {current.city}
                </p>
              </div>

              <CompatRing score={match.score} size={64} />
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-resilient">
              {current.bio}
            </p>
          </div>

          <div className="flex items-start gap-2 border-t border-border/60 bg-accent/5 px-5 py-3">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
            <p className="text-sm text-accent text-resilient">{match.headline}</p>
          </div>

          <div className="space-y-4 p-5">
            <section>
              <SectionLabel>Ortak sanatçılar</SectionLabel>
              {match.sharedArtistIds.length > 0 ? (
                <ul className="flex flex-wrap gap-1.5">
                  {match.sharedArtistIds.map((id) => (
                    <li key={id}>
                      <Chip>{artist(id).name}</Chip>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Ortak sanatçı yok — keşfedecek çok şey var.
                </p>
              )}
            </section>

            <section>
              <SectionLabel>Türler</SectionLabel>
              <ul className="flex flex-wrap gap-1.5">
                {current.genres.map((genre) => (
                  <li key={genre}>
                    <Chip muted={!match.sharedGenres.includes(genre)}>{GENRE_LABEL[genre]}</Chip>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <SectionLabel>Marş şarkısı</SectionLabel>
              <TrackRow trackId={current.anthemTrackId} />
            </section>

            <Link
              to={`/kisi/${current.id}`}
              className="block rounded-xl border border-border/70 px-4 py-2.5 text-center text-sm font-medium transition-colors duration-200 hover:bg-muted"
            >
              Profilin tamamını gör
            </Link>
          </div>
        </article>
      </div>

      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => pass(currentId)}
          aria-label={`${current.name} kişisini geç`}
          className="grid size-14 place-items-center rounded-full border border-border/70 bg-card text-muted-foreground transition-all duration-200 hover:scale-105 hover:border-destructive/60 hover:text-destructive active:scale-95"
        >
          <X className="size-6" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => like(currentId)}
          aria-label={`${current.name} kişisini beğen`}
          className="grid size-16 place-items-center rounded-full bg-accent text-on-accent transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <Heart className="size-7" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function EmptyQueue({ onReset }: { onReset: () => void }) {
  return (
    <div>
      <PageHeader title="Keşfet" subtitle="Şimdilik bu kadar" />
      <div className="mb-5">
        <LiveMatch />
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-8 text-center">
        <p className="font-display text-lg">Sıradaki herkesi gördün</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-balance text-muted-foreground">
          Yeni kişiler geldiğinde burada olacaklar. Bu arada eşleştiklerinle sohbete başlayabilirsin.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-muted/70"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Baştan başlat
        </button>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
      {children}
    </h3>
  )
}

function Chip({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      className={`inline-block max-w-full truncate rounded-full px-2.5 py-1 text-xs font-medium ${
        muted ? 'bg-muted text-muted-foreground' : 'bg-accent/15 text-accent'
      }`}
    >
      {children}
    </span>
  )
}
