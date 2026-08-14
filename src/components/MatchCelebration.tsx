import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { Avatar } from './Avatar'
import { CompatRing } from './CompatRing'
import { ME, person } from '@/data/people'
import { compatibility } from '@/lib/match'
import { useSocial } from '@/state/SocialContext'

/** Shown when a like turns mutual — the payoff moment of the whole app. */
export function MatchCelebration() {
  const { celebrating, dismissCelebration } = useSocial()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!celebrating) return
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismissCelebration()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [celebrating, dismissCelebration])

  if (!celebrating) return null

  const other = person(celebrating)
  const match = compatibility(ME, other)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-title"
      className="fixed inset-0 z-50 grid place-items-center bg-background/85 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm animate-rise rounded-2xl border border-border/70 bg-card p-6 text-center shadow-2xl">
        <p className="text-xs font-medium tracking-[0.2em] text-accent uppercase">eşleştiniz</p>
        <h2 id="match-title" className="mt-2 font-display text-2xl text-resilient">
          {other.name}
        </h2>

        <div className="my-6 flex items-center justify-center gap-3">
          <Avatar seed={ME.id} name={ME.name} size="lg" />
          <CompatRing score={match.score} size={72} />
          <Avatar seed={other.id} name={other.name} size="lg" />
        </div>

        <p className="text-sm text-balance text-muted-foreground">{match.headline}</p>

        <div className="mt-6 flex flex-col gap-2">
          <Link
            to={`/sohbetler/${other.id}`}
            onClick={dismissCelebration}
            className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent transition-transform duration-200 hover:scale-[1.02] active:scale-95"
          >
            Mesaj gönder
          </Link>
          <button
            ref={closeRef}
            type="button"
            onClick={dismissCelebration}
            className="rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
          >
            Keşfetmeye devam et
          </button>
        </div>
      </div>
    </div>
  )
}
