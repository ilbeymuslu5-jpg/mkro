import { Link, useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { ArrowLeft, Flag, Heart, MessageCircle, Sparkles, ShieldOff } from 'lucide-react'
import { Artwork, Avatar } from '@/components/Avatar'
import { CompatRing } from '@/components/CompatRing'
import { TrackRow } from '@/components/TrackRow'
import { artist, GENRE_LABEL } from '@/data/catalog'
import { PEOPLE_BY_ID } from '@/data/people'
import { compatibility } from '@/lib/match'
import { useSocial } from '@/state/SocialContext'
import { useMe } from '@/state/AuthContext'
import { ReportDialog } from '@/components/ReportDialog'
import type { ReportReason } from '@/services/db'
import { isSupabaseConfigured } from '@/lib/supabaseConfig'

export function PersonProfile() {
  const { personId = '' } = useParams()
  const navigate = useNavigate()
  const me = useMe()
  const { matchedIds, like, block, blockedIds } = useSocial()
  const [reporting, setReporting] = useState(false)

  const other = PEOPLE_BY_ID.get(personId)
  if (!other || blockedIds.includes(personId)) return <NotFound />

  const match = compatibility(me, other)
  const isMatched = matchedIds.includes(other.id)
  const sharedArtists = new Set(match.sharedArtistIds)
  const sharedTracks = new Set(match.sharedTrackIds)

  return (
    <div className="space-y-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Geri
      </button>

      <section className="rounded-2xl border border-border bg-card p-5">
        {/* Identity row first, bio at full width below — same reason as Keşfet. */}
        <div className="flex items-center gap-4">
          <Avatar seed={other.id} name={other.name} size="lg" online={other.online} />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl leading-tight text-resilient">{other.name}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground text-resilient">
              {other.age} · {other.city}
            </p>
          </div>
          <CompatRing score={match.score} size={64} />
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-resilient">
          {other.bio}
        </p>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-accent/10 px-3 py-2.5">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
          <p className="text-sm text-accent text-resilient">{match.headline}</p>
        </div>

        <div className="mt-4">
          {isMatched ? (
            <Link
              to={`/sohbetler/${other.id}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent transition-transform duration-200 hover:scale-[1.02] active:scale-95"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              Mesaj gönder
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => like(other.id)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent transition-transform duration-200 hover:scale-[1.02] active:scale-95"
            >
              <Heart className="size-4" aria-hidden="true" />
              Beğen
            </button>
          )}
        </div>

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                block(other.id)
                navigate('/kesfet')
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive-bright"
            >
              <ShieldOff className="size-4" aria-hidden="true" />
              Engelle
            </button>

            <button
              type="button"
              onClick={() => setReporting(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive-bright"
            >
              <Flag className="size-4" aria-hidden="true" />
              Şikayet et
            </button>
          </div>
      </section>

      <ReportDialog
        open={reporting}
        personName={other.name}
        onClose={() => setReporting(false)}
        onSubmit={async (reason: ReportReason, detail: string) => {
          if (!isSupabaseConfigured()) {
            throw new Error('Şikayet kaydı için Supabase yapılandırılmalı.')
          }
          // Loaded on demand so the SDK stays out of the initial bundle.
          const { reportUser } = await import('@/services/db')
          await reportUser({
            reporterId: 'me',
            reportedId: other.id,
            reason,
            detail,
            contextType: 'profile',
          })
        }}
      />

      <section>
        <h2 className="mb-3 font-display text-lg">En çok dinledikleri</h2>
        <ul className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          {other.topArtistIds.map((id) => (
            <li key={id} className="w-28 shrink-0">
              <Artwork seed={id} label={artist(id).name} className="size-28" />
              <p className="mt-2 truncate text-sm font-medium text-resilient">{artist(id).name}</p>
              {sharedArtists.has(id) && <p className="text-xs text-accent">ortak</p>}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg">Şarkıları</h2>
        <ul className="space-y-0.5">
          {other.topTrackIds.map((id, index) => (
            <li key={id}>
              <TrackRow trackId={id} index={index} shared={sharedTracks.has(id)} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg">Türleri</h2>
        <ul className="flex flex-wrap gap-1.5">
          {other.genres.map((genre) => (
            <li key={genre}>
              <span
                className={`inline-block rounded-full px-3 py-1.5 text-sm ${
                  match.sharedGenres.includes(genre)
                    ? 'bg-accent/15 text-accent'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {GENRE_LABEL[genre]}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function NotFound() {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center">
      <p className="font-display text-lg">Bu profil bulunamadı</p>
      <Link
        to="/kesfet"
        className="mt-4 inline-block rounded-xl bg-muted px-4 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-muted/70"
      >
        Keşfet'e dön
      </Link>
    </div>
  )
}
