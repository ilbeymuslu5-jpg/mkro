import { Link } from 'react-router-dom'
import { Heart, Lock } from 'lucide-react'
import { Avatar } from './Avatar'
import { person } from '@/data/people'
import { compatibility } from '@/lib/match'
import { useMe } from '@/state/AuthContext'
import { useProfile } from '@/state/ProfileContext'
import { useSocial } from '@/state/SocialContext'

/**
 * Who already liked you. Platinum sees the names; free sees the count behind
 * a blur — the paywall hides identity, never the fact that someone is there.
 */
export function Admirers() {
  const me = useMe()
  const { plan } = useProfile()
  const { admirers, like } = useSocial()

  if (admirers.length === 0) return null

  const locked = plan !== 'platinum'

  return (
    <section>
      <h2 className="mb-1 flex items-center gap-2 font-display text-lg">
        <Heart className="size-4 text-accent" aria-hidden="true" />
        Seni beğenenler
      </h2>
      <p className="mb-3 text-sm text-muted-foreground text-resilient">
        {locked
          ? `${admirers.length} kişi seni beğendi. Kim olduklarını Platinum ile görebilirsin.`
          : 'Beğenirsen anında eşleşirsiniz.'}
      </p>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {admirers.slice(0, 6).map((id) => {
          const other = person(id)
          const score = compatibility(me, other).score

          return (
            <li key={id} className="relative">
              <div
                className={`flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center ${
                  locked ? 'blur-sm select-none' : ''
                }`}
                aria-hidden={locked}
              >
                <Avatar seed={id} name={other.name} size="lg" online={other.online} />
                <span className="w-full truncate text-sm font-medium text-resilient">
                  {other.name}
                </span>
                <span className="text-xs font-semibold text-accent tabular-nums">
                  %{score} uyum
                </span>
              </div>

              {locked ? (
                <span className="absolute inset-0 grid place-items-center">
                  <Lock className="size-6 text-muted-foreground" aria-hidden="true" />
                  <span className="sr-only">Platinum üyelere açık</span>
                </span>
              ) : (
                <div className="mt-2 flex gap-2">
                  <Link
                    to={`/kisi/${id}`}
                    className="min-h-11 flex-1 rounded-xl border border-border px-3 text-center text-xs font-medium leading-[2.75rem] transition-colors duration-200 hover:bg-muted"
                  >
                    Profil
                  </Link>
                  <button
                    type="button"
                    onClick={() => like(id)}
                    aria-label={`${other.name} kişisini beğen`}
                    className="grid min-h-11 flex-1 place-items-center rounded-xl bg-accent text-xs font-semibold text-on-accent transition-transform duration-200 hover:scale-[1.03] active:scale-95"
                  >
                    Beğen
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {locked && (
        <Link
          to="/platinum"
          className="mt-3 block rounded-xl border border-accent/50 bg-accent/5 px-4 py-3 text-center text-sm font-semibold text-accent transition-colors duration-200 hover:bg-accent/10"
        >
          Platinum ile kim olduklarını gör
        </Link>
      )}
    </section>
  )
}
