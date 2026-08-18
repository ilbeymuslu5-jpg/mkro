import { Link } from 'react-router-dom'
import { Avatar, Artwork } from '@/components/Avatar'
import { PageHeader } from '@/components/PageHeader'
import { PhotoPicker } from '@/components/PhotoPicker'
import { TrackRow } from '@/components/TrackRow'
import { artist, GENRE_LABEL } from '@/data/catalog'
import { person } from '@/data/people'
import { compatibility } from '@/lib/match'
import { useSocial } from '@/state/SocialContext'
import { useMe } from '@/state/AuthContext'
import { useProfile } from '@/state/ProfileContext'
import { SettingsModal } from '@/components/SettingsModal'
import { useState } from 'react'
import { CalendarDays, Settings, Sparkles } from 'lucide-react'

export function Profile() {
  const me = useMe()
  const { plan } = useProfile()
  const { matchedIds } = useSocial()
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Profil"
        subtitle="Müzik pasaportun"
        action={
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Ayarları aç"
            className="grid size-10 place-items-center rounded-xl border border-border text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
          >
            <Settings className="size-5" aria-hidden="true" />
          </button>
        }
      />

      <section className="rounded-2xl border border-border bg-card p-5">
        <PhotoPicker />

        {plan === 'platinum' && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Platinum üye
          </p>
        )}

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-resilient">{me.bio}</p>

        <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4">
          <Stat label="Eşleşme" value={matchedIds.length} />
          <Stat label="Sanatçı" value={me.topArtistIds.length} />
          <Stat label="Tür" value={me.genres.length} />
        </dl>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg">En çok dinlediğin sanatçılar</h2>
        <ul className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          {me.topArtistIds.map((id, index) => (
            <li key={id} className="w-28 shrink-0">
              <Artwork seed={id} label={artist(id).name} className="size-28" />
              <p className="mt-2 truncate text-sm font-medium text-resilient">{artist(id).name}</p>
              <p className="text-xs text-muted-foreground">#{index + 1}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg">En çok dinlediğin şarkılar</h2>
        <ul className="space-y-0.5">
          {me.topTrackIds.map((id, index) => (
            <li key={id}>
              <TrackRow trackId={id} index={index} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg">Türlerin</h2>
        <ul className="flex flex-wrap gap-1.5">
          {me.genres.map((genre) => (
            <li key={genre}>
              <span className="inline-block rounded-full bg-muted px-3 py-1.5 text-sm">
                {GENRE_LABEL[genre]}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg">Daha fazlası</h2>
        <ul className="space-y-2">
          <li>
            <Link
              to="/etkinlikler"
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition-colors duration-200 hover:bg-muted/60"
            >
              <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              Etkinlikler
            </Link>
          </li>
          <li>
            <Link
              to="/platinum"
              className="flex items-center gap-3 rounded-xl border border-accent/50 bg-accent/5 px-4 py-3 text-sm font-medium text-accent transition-colors duration-200 hover:bg-accent/10"
            >
              <Sparkles className="size-4 shrink-0" aria-hidden="true" />
              {plan === 'platinum' ? 'Paketini yönet' : 'makromusic Platinum'}
            </Link>
          </li>
        </ul>
      </section>

      {matchedIds.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg">Eşleşmelerin</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {matchedIds.map((id) => {
              const other = person(id)
              const match = compatibility(me, other)
              return (
                <li key={id}>
                  <Link
                    to={`/kisi/${id}`}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center transition-colors duration-200 hover:bg-muted/50"
                  >
                    <Avatar seed={id} name={other.name} size="lg" online={other.online} />
                    <span className="w-full truncate text-sm font-medium text-resilient">
                      {other.name}
                    </span>
                    <span className="text-xs font-semibold text-accent tabular-nums">
                      %{match.score} uyum
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <dt className="order-2 text-xs text-muted-foreground">{label}</dt>
      <dd className="font-display text-xl tabular-nums">{value}</dd>
    </div>
  )
}
