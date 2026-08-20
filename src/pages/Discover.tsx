import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Radio, RotateCcw, Sparkles, X } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { CompatRing } from '@/components/CompatRing'
import { PageHeader } from '@/components/PageHeader'
import { SwipeCard, type SwipeDirection } from '@/components/SwipeCard'
import { Switch } from '@/components/Switch'
import { artist, GENRE_LABEL, track, trackArtistName } from '@/data/catalog'
import { person } from '@/data/people'
import { compatibility } from '@/lib/match'
import { listeningSince, type LiveListener } from '@/lib/presence'
import { useAuth, useMe } from '@/state/AuthContext'
import { LIVE_BOARD_INTERVAL_MS, useSocial } from '@/state/SocialContext'
import { discoverCandidates, getTaste, listMatches, swipe, type Candidate } from '@/services/db'

const STEP_SECONDS = Math.round(LIVE_BOARD_INTERVAL_MS / 1000)

export function Discover() {
  const { authMode } = useAuth()

  // A manual (email) account has no live playback to match on — Spotify's
  // Development Mode caps real Spotify sign-ins at 5 accounts, so this is
  // the only door open to everyone else. See RealDeck below.
  if (authMode === 'manual') return <RealDiscover />

  return <LiveDiscover />
}

function LiveDiscover() {
  const { nowPlaying } = useAuth()
  const { liveOn, liveBoard, liveExhausted, toggleLiveMatch, swipesToday, swipeLimit } =
    useSocial()

  const outOfSwipes = swipesToday >= swipeLimit

  return (
    <div>
      <PageHeader
        title="Keşfet"
        subtitle={
          nowPlaying
            ? `${track(nowPlaying.trackId).title} — ${trackArtistName(nowPlaying.trackId)}`
            : 'Şu an bir şey çalmıyor'
        }
        action={
          <Switch checked={liveOn} onChange={toggleLiveMatch} label="Radarı aç kapa" />
        }
      />

      {!nowPlaying ? (
        <Empty
          title="Önce bir şeyler çal"
          body="Aynı şarkıyı dinleyenleri bulabilmek için senin de bir şey dinliyor olman gerek."
        />
      ) : !liveOn ? (
        <Empty
          title="Radar kapalı"
          body={`Aç, ${STEP_SECONDS} saniyede bir aynı şarkıyı dinleyen biri buraya düşsün.`}
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
      ) : outOfSwipes ? (
        <Empty
          title="Bugünlük keşif hakkın doldu"
          body={`Ücretsiz hesap günde ${swipeLimit} kaydırma yapabilir. Yarın sıfırlanır.`}
          action={
            <Link
              to="/platinum"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-on-accent transition-transform duration-200 hover:scale-[1.02] active:scale-95"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              Platinum ile sınırsız kaydır
            </Link>
          }
        />
      ) : liveBoard.length === 0 ? (
        <Waiting exhausted={liveExhausted} trackTitle={track(nowPlaying.trackId).title} />
      ) : (
        <Deck board={liveBoard} />
      )}

      {liveOn && nowPlaying && !outOfSwipes && (
        <Ticker count={liveBoard.length} exhausted={liveExhausted} />
      )}

      {liveOn && nowPlaying && <UndoBar />}

      {liveOn && nowPlaying && Number.isFinite(swipeLimit) && (
        <p className="mt-3 text-center text-sm text-muted-foreground text-resilient">
          Bugün {swipesToday}/{swipeLimit} kaydırma
        </p>
      )}
    </div>
  )
}

/**
 * Real cross-account discovery, backed by `discover_candidates` in Supabase
 * (taste + distance scored server-side — see the migration in
 * supabase/migrations/20250101000003_discovery.sql). Unlike the live radar,
 * this has no 10-second rhythm: it is a plain taste-ranked deck, because a
 * manual account has no now-playing to synchronize on.
 */
function RealDiscover() {
  const { authUserId } = useAuth()
  const [candidates, setCandidates] = useState<Candidate[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [taste, setTaste] = useState<Record<string, { artistNames: string[]; genres: string[] }>>({})
  const [justMatched, setJustMatched] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void discoverCandidates({ maxDistanceKm: null, limit: 20 })
      .then((list) => {
        if (!cancelled) setCandidates(list)
      })
      .catch(() => {
        if (!cancelled) setLoadError('Kişiler yüklenemedi. Bağlantını kontrol edip sayfayı yenile.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const top = candidates?.[0] ?? null

  useEffect(() => {
    if (!top || taste[top.profileId]) return
    let cancelled = false
    void getTaste(top.profileId)
      .then((t) => {
        if (cancelled) return
        setTaste((current) => ({
          ...current,
          [top.profileId]: {
            artistNames: t.artists.map((a) => a.name),
            genres: Array.from(new Set(t.artists.flatMap((a) => a.genres))),
          },
        }))
      })
      .catch(() => {
        // Missing taste for one candidate is not worth failing the whole deck over.
      })
    return () => {
      cancelled = true
    }
  }, [top, taste])

  const handleSwipe = (candidate: Candidate, direction: SwipeDirection) => {
    setCandidates((current) => current?.slice(1) ?? current)
    void (async () => {
      try {
        await swipe(candidate.profileId, direction)
        if (direction !== 'like' || !authUserId) return
        const matches = await listMatches(authUserId)
        if (matches.some((m) => m.otherId === candidate.profileId)) {
          setJustMatched(candidate.displayName)
        }
      } catch {
        // The card is already gone locally; a failed write just means this
        // candidate might resurface if the page reloads, which is harmless.
      }
    })()
  }

  return (
    <div>
      <PageHeader title="Keşfet" subtitle="Zevkine göre sıralanmış kişiler" />

      {justMatched && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-accent/50 bg-accent/10 px-4 py-3">
          <p className="text-sm font-medium text-accent text-resilient">
            🎉 {justMatched} ile eşleştiniz! Sohbetler'den yazabilirsin.
          </p>
          <button
            type="button"
            onClick={() => setJustMatched(null)}
            aria-label="Kapat"
            className="shrink-0 text-accent/70 hover:text-accent"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {loadError ? (
        <Empty title="Bir şeyler ters gitti" body={loadError} />
      ) : candidates === null ? (
        <Empty title="Yükleniyor…" body="Sana uygun kişiler aranıyor." />
      ) : candidates.length === 0 ? (
        <Empty
          title="Şu an için kimse yok"
          body="Henüz zevkine uyan başka bir hesap yok. Daha fazla kişi katıldıkça burası dolacak."
        />
      ) : (
        <RealDeck candidates={candidates} taste={taste} onSwipe={handleSwipe} />
      )}
    </div>
  )
}

function RealDeck({
  candidates,
  taste,
  onSwipe,
}: {
  candidates: Candidate[]
  taste: Record<string, { artistNames: string[]; genres: string[] }>
  onSwipe: (candidate: Candidate, direction: SwipeDirection) => void
}) {
  const [top, ...rest] = candidates

  return (
    <div className="relative">
      {rest.slice(0, 2).map((entry, index) => (
        <div
          key={entry.profileId}
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-72 rounded-2xl border border-border bg-card/60"
          style={{
            transform: `translateY(${(index + 1) * 10}px) scale(${1 - (index + 1) * 0.03})`,
            zIndex: -1,
          }}
        />
      ))}

      <SwipeCard key={top.profileId} onSwipe={(direction) => onSwipe(top, direction)}>
        <CandidateCard candidate={top} taste={taste[top.profileId]} />
      </SwipeCard>

      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => onSwipe(top, 'pass')}
          aria-label={`${top.displayName} kişisini geç`}
          className="grid size-14 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-all duration-200 hover:scale-105 hover:border-destructive/60 hover:text-destructive-bright active:scale-95"
        >
          <X className="size-6" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onSwipe(top, 'like')}
          aria-label={`${top.displayName} kişisini beğen`}
          className="grid size-16 place-items-center rounded-full bg-accent text-on-accent transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <Heart className="size-7" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function CandidateCard({
  candidate,
  taste,
}: {
  candidate: Candidate
  taste?: { artistNames: string[]; genres: string[] }
}) {
  return (
    <article className="animate-rise overflow-hidden rounded-2xl border border-border bg-card select-none">
      <div className="p-5">
        <div className="flex items-center gap-4">
          <Avatar seed={candidate.profileId} name={candidate.displayName} size="lg" />

          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl leading-tight text-resilient">
              {candidate.displayName}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground text-resilient">
              {[
                candidate.birthYear ? new Date().getFullYear() - candidate.birthYear : null,
                candidate.city,
                candidate.distanceKm !== null ? `${candidate.distanceKm} km` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>

          <CompatRing score={candidate.score} size={64} />
        </div>

        {candidate.bio && (
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-resilient">
            {candidate.bio}
          </p>
        )}
      </div>

      <div className="space-y-3 p-5 pt-0">
        {taste && taste.artistNames.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {taste.artistNames.map((name) => (
              <li key={name}>
                <span className="inline-block max-w-full truncate rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent">
                  {name}
                </span>
              </li>
            ))}
          </ul>
        )}

        {taste && taste.genres.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {taste.genres.map((genre) => (
              <li key={genre}>
                <span className="inline-block rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                  {GENRE_LABEL[genre as keyof typeof GENRE_LABEL] ?? genre}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  )
}

/**
 * Counts down to the next listener so the ten-second rhythm is visible rather
 * than something the user has to infer from cards appearing.
 */
function Ticker({ count, exhausted }: { count: number; exhausted: boolean }) {
  const [remaining, setRemaining] = useState(STEP_SECONDS)

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining((value) => (value <= 1 ? STEP_SECONDS : value - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  const pct = ((STEP_SECONDS - remaining) / STEP_SECONDS) * 100

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground text-resilient">
          Sırada {count} kişi
        </span>
        <span className="shrink-0 text-muted-foreground tabular-nums">
          {exhausted ? 'yeni dinleyici bekleniyor' : `sonraki ${remaining} sn`}
        </span>
      </div>

      <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-linear"
          style={{ width: exhausted ? '0%' : `${pct}%` }}
        />
      </div>
    </div>
  )
}

/**
 * Sits outside the deck on purpose. Inside it, the control disappeared the
 * moment the board emptied — which is exactly when a mis-swipe hurts most.
 */
function UndoBar() {
  const { canUndo, undoLast, undosLeft } = useSocial()

  return (
    <div className="mt-4 flex justify-center">
      <button
        type="button"
        onClick={undoLast}
        disabled={!canUndo}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        Son kaydırmayı geri al
        {Number.isFinite(undosLeft) && (
          <span className="tabular-nums">({undosLeft})</span>
        )}
      </button>
    </div>
  )
}

function Deck({ board }: { board: LiveListener[] }) {
  const me = useMe()
  const { swipeLive } = useSocial()

  // Oldest first — whoever started the track earliest is on top.
  const [top, ...rest] = board

  return (
    <div className="relative">
      {rest.slice(0, 2).map((entry, index) => (
        <div
          key={entry.personId}
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-72 rounded-2xl border border-border bg-card/60"
          style={{
            transform: `translateY(${(index + 1) * 10}px) scale(${1 - (index + 1) * 0.03})`,
            zIndex: -1,
          }}
        />
      ))}

      <SwipeCard key={top.personId} onSwipe={(direction) => swipeLive(top.personId, direction)}>
        <ListenerCard entry={top} me={me} />
      </SwipeCard>

      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => swipeLive(top.personId, 'pass')}
          aria-label={`${person(top.personId).name} kişisini geç`}
          className="grid size-14 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-all duration-200 hover:scale-105 hover:border-destructive/60 hover:text-destructive-bright active:scale-95"
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

function ListenerCard({
  entry,
  me,
}: {
  entry: LiveListener
  me: Parameters<typeof compatibility>[0]
}) {
  const other = person(entry.personId)
  const match = compatibility(me, other)

  return (
    <article className="animate-rise overflow-hidden rounded-2xl border border-border bg-card select-none">
      <div className="flex items-center gap-2 bg-accent/10 px-5 py-2.5">
        <Radio className="size-4 shrink-0 text-accent" aria-hidden="true" />
        <p className="truncate text-sm font-medium text-accent text-resilient">
          Aynı şarkıda · {listeningSince(entry.startedAt)}
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

      <div className="flex items-start gap-2 border-t border-border px-5 py-3">
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
          className="block rounded-xl border border-border px-4 py-2.5 text-center text-sm font-medium transition-colors duration-200 hover:bg-muted"
        >
          Profilin tamamını gör
        </Link>
      </div>
    </article>
  )
}

function Waiting({ exhausted, trackTitle }: { exhausted: boolean; trackTitle: string }) {
  return (
    <Empty
      title={exhausted ? 'Şimdilik herkesi gördün' : 'Dinleyenler aranıyor…'}
      body={
        exhausted
          ? `${trackTitle} dinleyen yeni biri çıkınca buraya düşecek. Başka bir şey çalmaya başlarsan pano da değişir.`
          : `Radar açık. ${STEP_SECONDS} saniyede bir aynı şarkıyı dinleyen biri buraya düşecek.`
      }
    />
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
    <div className="rounded-2xl border border-border bg-card p-8 text-center">
      <p className="font-display text-lg text-balance">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-balance text-muted-foreground">{body}</p>
      {action}
    </div>
  )
}
