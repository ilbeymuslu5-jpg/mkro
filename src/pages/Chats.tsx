import { Link } from 'react-router-dom'
import { Avatar } from '@/components/Avatar'
import { PageHeader } from '@/components/PageHeader'
import { track, trackArtistName } from '@/data/catalog'
import { ME, person } from '@/data/people'
import { compatibility } from '@/lib/match'
import { useSocial } from '@/state/SocialContext'

const RELATIVE = new Intl.RelativeTimeFormat('tr-TR', { numeric: 'auto' })

function relativeTime(timestamp: number): string {
  const minutes = Math.round((timestamp - Date.now()) / 60_000)
  if (Math.abs(minutes) < 60) return RELATIVE.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return RELATIVE.format(hours, 'hour')
  return RELATIVE.format(Math.round(hours / 24), 'day')
}

export function Chats() {
  const { matchedIds, conversations } = useSocial()

  if (matchedIds.length === 0) {
    return (
      <div>
        <PageHeader title="Sohbetler" />
        <div className="rounded-2xl border border-border/70 bg-card p-8 text-center">
          <p className="font-display text-lg">Henüz eşleşmen yok</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-balance text-muted-foreground">
            Keşfet'te beğendiğin kişi seni de beğenirse sohbet burada başlar.
          </p>
          <Link
            to="/kesfet"
            className="mt-6 inline-block rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition-transform duration-200 hover:scale-[1.02] active:scale-95"
          >
            Keşfetmeye başla
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Sohbetler" subtitle={`${matchedIds.length} eşleşme`} />

      <ul className="space-y-1">
        {matchedIds.map((id) => {
          const other = person(id)
          const messages = conversations[id]?.messages ?? []
          const last = messages[messages.length - 1]
          const score = compatibility(ME, other).score

          return (
            <li key={id}>
              <Link
                to={`/sohbetler/${id}`}
                className="flex items-center gap-3 rounded-2xl p-3 transition-colors duration-200 hover:bg-muted/60"
              >
                <Avatar seed={id} name={other.name} online={other.online} />

                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-resilient">
                      {other.name}
                    </span>
                    {last && (
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {relativeTime(last.sentAt)}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground text-resilient">
                    {last
                      ? last.trackId
                        ? `♪ ${track(last.trackId).title} — ${trackArtistName(last.trackId)}`
                        : last.text
                      : `%${score} uyum · ilk mesajı sen yaz`}
                  </span>
                </span>

                <span className="shrink-0 text-xs font-semibold text-accent tabular-nums">
                  %{score}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
