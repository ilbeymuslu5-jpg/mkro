import { Link } from 'react-router-dom'
import { CalendarDays, MapPin, Users } from 'lucide-react'
import { Artwork, Avatar } from '@/components/Avatar'
import { PageHeader } from '@/components/PageHeader'
import { artist } from '@/data/catalog'
import { EVENTS, formatEventDate, formatEventTime, type MusicEvent } from '@/data/events'
import { person } from '@/data/people'
import { useSocial } from '@/state/SocialContext'
import { useMe } from '@/state/AuthContext'

/**
 * How high the event's line-up sits in your own top-artist list — 0 is your
 * favourite artist, Infinity means nothing on the bill is yours.
 */
function bestRank(event: MusicEvent, topArtistIds: string[]): number {
  const ranks = event.artistIds
    .map((id) => topArtistIds.indexOf(id))
    .filter((index) => index >= 0)
  return ranks.length === 0 ? Number.POSITIVE_INFINITY : Math.min(...ranks)
}

/**
 * Reserved for your top few artists. A badge that lands on almost every card
 * stops meaning anything, so this deliberately stays rare.
 */
const FEATURED_RANK_LIMIT = 4

export function Events() {
  const me = useMe()
  const sorted = [...EVENTS].sort((a, b) => {
    const byRank = bestRank(a, me.topArtistIds) - bestRank(b, me.topArtistIds)
    if (byRank !== 0) return byRank
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  return (
    <div>
      <PageHeader title="Etkinlikler" subtitle="Zevkine uyan konserler" />

      <ul className="space-y-3">
        {sorted.map((event) => (
          <li key={event.id}>
            <EventCard event={event} topArtistIds={me.topArtistIds} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function EventCard({ event, topArtistIds }: { event: MusicEvent; topArtistIds: string[] }) {
  const { matchedIds } = useSocial()
  const forYou = bestRank(event, topArtistIds) < FEATURED_RANK_LIMIT

  // Only people you have actually matched with can be called "eşleşmen".
  const matchedGoing = event.attendeeIds.filter((id) => matchedIds.includes(id))
  const attendeeLabel =
    matchedGoing.length > 0
      ? `${matchedGoing.length} eşleşmen gidiyor`
      : `${event.attendeeIds.length} kişi gidiyor`

  return (
    <article className="overflow-hidden rounded-2xl border border-border/70 bg-card">
      <div className="flex items-start gap-4 p-4">
        <Artwork seed={event.id} label={event.title} className="size-16" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-display text-lg leading-tight text-resilient">{event.title}</h2>
            {forYou && (
              <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent">
                sana özel
              </span>
            )}
          </div>

          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground text-resilient">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {event.venue}, {event.city}
            </span>
          </p>

          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
            <span>
              {formatEventDate(event.date)} · {formatEventTime(event.date)}
            </span>
          </p>

          <ul className="mt-3 flex flex-wrap gap-1.5">
            {event.artistIds.map((id) => (
              <li key={id}>
                <span
                  className={`inline-block max-w-full truncate rounded-full px-2.5 py-1 text-xs ${
                    topArtistIds.includes(id)
                      ? 'bg-accent/15 text-accent'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {artist(id).name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-muted/30 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Users className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <ul className="flex -space-x-2">
            {event.attendeeIds.map((id) => (
              <li key={id}>
                <Link
                  to={`/kisi/${id}`}
                  aria-label={`${person(id).name} profiline git`}
                  className="inline-flex"
                >
                  <Avatar seed={id} name={person(id).name} size="sm" className="ring-2 ring-card" />
                </Link>
              </li>
            ))}
          </ul>
          <span className="truncate text-xs text-muted-foreground">{attendeeLabel}</span>
        </div>

        <span className="shrink-0 text-sm font-semibold tabular-nums">{event.priceLabel}</span>
      </div>
    </article>
  )
}
