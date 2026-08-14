import { Link } from 'react-router-dom'
import { Avatar, Artwork } from '@/components/Avatar'
import { PageHeader } from '@/components/PageHeader'
import { PhotoPicker } from '@/components/PhotoPicker'
import { TrackRow } from '@/components/TrackRow'
import { artist, GENRE_LABEL } from '@/data/catalog'
import { ME, person } from '@/data/people'
import { compatibility } from '@/lib/match'
import { useSocial } from '@/state/SocialContext'

export function Profile() {
  const { matchedIds } = useSocial()

  return (
    <div className="space-y-8">
      <PageHeader title="Profil" subtitle="Müzik pasaportun" />

      <section className="rounded-2xl border border-border/70 bg-card p-5">
        <PhotoPicker />

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-resilient">{ME.bio}</p>

        <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-border/60 pt-4">
          <Stat label="Eşleşme" value={matchedIds.length} />
          <Stat label="Sanatçı" value={ME.topArtistIds.length} />
          <Stat label="Tür" value={ME.genres.length} />
        </dl>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg">En çok dinlediğin sanatçılar</h2>
        <ul className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          {ME.topArtistIds.map((id, index) => (
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
          {ME.topTrackIds.map((id, index) => (
            <li key={id}>
              <TrackRow trackId={id} index={index} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg">Türlerin</h2>
        <ul className="flex flex-wrap gap-1.5">
          {ME.genres.map((genre) => (
            <li key={genre}>
              <span className="inline-block rounded-full bg-muted px-3 py-1.5 text-sm">
                {GENRE_LABEL[genre]}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {matchedIds.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg">Eşleşmelerin</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {matchedIds.map((id) => {
              const other = person(id)
              const match = compatibility(ME, other)
              return (
                <li key={id}>
                  <Link
                    to={`/kisi/${id}`}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-border/70 bg-card p-4 text-center transition-colors duration-200 hover:bg-muted/50"
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
