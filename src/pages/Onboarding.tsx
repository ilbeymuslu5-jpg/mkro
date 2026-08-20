import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Check, Loader2 } from 'lucide-react'
import { Wordmark } from '@/components/AppShell'
import { ARTISTS, GENRE_LABEL, TRACKS, type Genre } from '@/data/catalog'
import { useAuth } from '@/state/AuthContext'
import { upsertProfile, updateProfile, syncTaste } from '@/services/db'
import type { SpotifyArtist, SpotifyTrack } from '@/services/spotify'

const MIN_ARTISTS = 5
const CURRENT_YEAR = new Date().getFullYear()

/**
 * Only reached by a manual (email) sign-up with no `profiles` row yet — see
 * AuthContext's `needsOnboarding`. Real Spotify sign-ins skip this entirely,
 * their taste comes from Spotify itself.
 */
export function Onboarding() {
  const { hasRealSession, authMode, authUserId, needsOnboarding, me, refreshManualProfile } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!hasRealSession || authMode !== 'manual') return <Navigate to="/giris" replace />
  if (me) return <Navigate to="/kesfet" replace />
  if (!needsOnboarding) {
    // Session still resolving — RequireAuth-style loading, kept local so this
    // page does not need its own spinner route.
    return (
      <div className="grid min-h-dvh place-items-center px-5">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    )
  }

  const toggleArtist = (id: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    if (!authUserId) return
    const ageNumber = Number(age)
    if (!name.trim()) return setError('Adını yaz.')
    if (!Number.isFinite(ageNumber) || ageNumber < 18 || ageNumber > 99) {
      return setError('Yaş 18 ile 99 arasında olmalı.')
    }
    if (!city.trim()) return setError('Şehrini yaz.')
    if (selected.size < MIN_ARTISTS) return setError(`En az ${MIN_ARTISTS} sanatçı seç.`)

    setError(null)
    setSubmitting(true)
    try {
      const chosen = [...selected].map((id) => ARTISTS.find((a) => a.id === id)!)
      const artists: SpotifyArtist[] = chosen.map((a) => ({
        id: a.id,
        name: a.name,
        genres: a.genres,
        imageUrl: null,
      }))
      const tracks: SpotifyTrack[] = chosen
        .map((a) => TRACKS.find((t) => t.artistId === a.id))
        .filter((t): t is NonNullable<typeof t> => t !== undefined)
        .map((t) => ({
          id: t.id,
          name: t.title,
          artistId: t.artistId,
          artistName: ARTISTS.find((a) => a.id === t.artistId)!.name,
          imageUrl: null,
          durationMs: t.durationSec * 1000,
        }))

      await upsertProfile(authUserId, {
        id: `manual:${authUserId}`,
        displayName: name.trim(),
        email: null,
        country: null,
        product: null,
        imageUrl: null,
      })
      await updateProfile(authUserId, {
        bio: bio.trim(),
        birthYear: CURRENT_YEAR - ageNumber,
        city: city.trim(),
      })
      await syncTaste(authUserId, artists, tracks)
      await refreshManualProfile()
      navigate('/kesfet', { replace: true })
    } catch {
      setError('Kaydedilemedi. Bağlantını kontrol edip tekrar dene.')
      setSubmitting(false)
    }
  }

  const genreOf = (artistId: string): Genre => ARTISTS.find((a) => a.id === artistId)!.genres[0]

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 py-10">
      <div className="text-center">
        <Wordmark />
        <h1 className="mt-6 font-display text-2xl text-balance">Profilini oluştur</h1>
        <p className="mt-2 text-sm text-balance text-muted-foreground">
          Spotify hesabın olmadan da girebilirsin — zevkini kendin seç, eşleştirme motoru buna göre çalışır.
        </p>
      </div>

      <div className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Ad">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="ör. Deniz"
              className="w-full rounded-xl border border-border bg-transparent px-3.5 py-2.5 text-sm outline-none focus-visible:border-accent"
            />
          </Field>
          <Field label="Yaş">
            <input
              type="number"
              min={18}
              max={99}
              value={age}
              onChange={(event) => setAge(event.target.value)}
              placeholder="ör. 27"
              className="w-full rounded-xl border border-border bg-transparent px-3.5 py-2.5 text-sm outline-none focus-visible:border-accent"
            />
          </Field>
        </div>

        <Field label="Şehir">
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="ör. İstanbul"
            className="w-full rounded-xl border border-border bg-transparent px-3.5 py-2.5 text-sm outline-none focus-visible:border-accent"
          />
        </Field>

        <Field label="Bio (opsiyonel)">
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            rows={2}
            placeholder="Kendinden birkaç kelimeyle bahset"
            className="w-full resize-none rounded-xl border border-border bg-transparent px-3.5 py-2.5 text-sm outline-none focus-visible:border-accent"
          />
        </Field>

        <div>
          <p className="text-sm font-medium">
            En sevdiğin sanatçıları seç <span className="text-muted-foreground">(en az {MIN_ARTISTS})</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Bu, başkalarıyla nasıl eşleştiğini belirler — seçtiklerin profilinde ve keşfette görünür.
          </p>

          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ARTISTS.map((a) => {
              const active = selected.has(a.id)
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => toggleArtist(a.id)}
                    aria-pressed={active}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors duration-200 ${
                      active ? 'border-accent bg-accent/10' : 'border-border hover:bg-muted/60'
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-resilient">{a.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {GENRE_LABEL[genreOf(a.id)]}
                      </span>
                    </span>
                    {active && <Check className="size-4 shrink-0 text-accent" aria-hidden="true" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive-bright text-resilient">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3.5 text-sm font-semibold text-on-accent transition-transform duration-200 hover:scale-[1.02] active:scale-95 disabled:scale-100 disabled:opacity-70"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Kaydediliyor…
            </>
          ) : (
            'Profili tamamla'
          )}
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}
