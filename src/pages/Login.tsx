import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Check, Loader2, Mail, Music, ShieldCheck } from 'lucide-react'
import { Wordmark } from '@/components/AppShell'
import { MOCK_ACCOUNTS } from '@/services/spotifyMock'
import { SPOTIFY_SCOPES } from '@/services/spotify'
import { isSupabaseConfigured, useAuth } from '@/state/AuthContext'

const SCOPE_LABEL: Record<string, string> = {
  'user-read-email': 'E-posta adresin',
  'user-read-private': 'Hesap türün (Free / Premium)',
  'user-top-read': 'En çok dinlediğin şarkı ve sanatçılar',
  'user-read-currently-playing': 'Şu an çalan parça',
  'user-read-playback-state': 'Çalma durumun',
}

export function Login() {
  const { status, error, login, loginDemo, me, needsOnboarding } = useAuth()
  const busy = status === 'authorizing' || status === 'loading'

  if (me) return <Navigate to="/kesfet" replace />
  // Signed up but never finished picking a name/taste — send them back to
  // that form instead of showing the login screen a second time.
  if (needsOnboarding) return <Navigate to="/onboarding" replace />

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="text-center">
        <Wordmark />
        <h1 className="mt-6 font-display text-2xl text-balance">Spotify hesabınla bağlan</h1>
        <p className="mt-2 text-sm text-balance text-muted-foreground">
          Zevkini okumak için dinleme geçmişine ihtiyacımız var. Şifreni görmüyoruz.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-5">
        <div className="rounded-xl bg-muted/50 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
            makromusic şunlara erişecek
          </p>
          <ul className="mt-2 space-y-1">
            {SPOTIFY_SCOPES.map((scope) => (
              <li key={scope} className="text-xs text-muted-foreground text-resilient">
                · {SCOPE_LABEL[scope] ?? scope}
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={() => void login()}
          disabled={busy}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3.5 text-sm font-semibold text-on-accent transition-transform duration-200 hover:scale-[1.02] active:scale-95 disabled:scale-100 disabled:opacity-70"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Yönlendiriliyor…
            </>
          ) : (
            <>
              <Music className="size-4" aria-hidden="true" />
              Spotify ile bağlan
            </>
          )}
        </button>

        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive-bright text-resilient">
            {error}
          </p>
        )}

        {isSupabaseConfigured() && <EmailAuth busy={busy} />}

        {!isSupabaseConfigured() && <DemoFallback busy={busy} onSelect={loginDemo} />}
      </div>

      <p className="mt-6 text-center text-xs text-balance text-muted-foreground">
        {isSupabaseConfigured()
          ? 'Spotify’ın kendi onay ekranına yönlendirilirsin. Şifren makromusic’e hiç ulaşmaz.'
          : 'Bu bir demo. Gerçek Spotify’a bağlanmaz, hiçbir veri dışarı gönderilmez.'}
      </p>
    </div>
  )
}

/**
 * Spotify's Development Mode caps a Client ID at 5 authorized accounts — see
 * the README's "Play Store'a giden yol" section. Email/password sign-up has
 * no such cap, so it is the door that lets the app have more than 5 real
 * users. Taste is picked by hand on the onboarding screen instead of read
 * from Spotify.
 */
function EmailAuth({ busy }: { busy: boolean }) {
  const { signUpManual, signInManual } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
      >
        <Mail className="size-4" aria-hidden="true" />
        E-posta ile devam et
      </button>
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLocalError(null)
    setSubmitting(true)
    const result = mode === 'signup' ? await signUpManual(email, password) : await signInManual(email, password)
    setSubmitting(false)
    if (result.error) {
      setLocalError(result.error)
      return
    }
    // A fresh sign-up has no `profiles` row yet — signIn lands straight on
    // /kesfet once AuthContext resolves `me` from the existing one.
    if (mode === 'signup') navigate('/onboarding')
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-3 border-t border-border pt-4">
      <div className="flex gap-1.5 rounded-lg bg-muted/50 p-1">
        {(['signup', 'signin'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setMode(option)
              setLocalError(null)
            }}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors duration-200 ${
              mode === option ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {option === 'signup' ? 'Hesap oluştur' : 'Giriş yap'}
          </button>
        ))}
      </div>

      <input
        type="email"
        required
        autoComplete="email"
        placeholder="e-posta"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="w-full rounded-xl border border-border bg-transparent px-3.5 py-2.5 text-sm outline-none focus-visible:border-accent"
      />
      <input
        type="password"
        required
        minLength={6}
        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        placeholder="şifre (en az 6 karakter)"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="w-full rounded-xl border border-border bg-transparent px-3.5 py-2.5 text-sm outline-none focus-visible:border-accent"
      />

      {localError && (
        <p role="alert" className="text-sm text-destructive-bright text-resilient">
          {localError}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || submitting}
        className="w-full rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-muted disabled:opacity-70"
      >
        {submitting ? 'Bir saniye…' : mode === 'signup' ? 'Hesap oluştur' : 'Giriş yap'}
      </button>
    </form>
  )
}

/**
 * Shown only when Supabase is not configured, so the app stays usable while
 * you set it up. Once VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set,
 * this disappears and the real button above is the only way in.
 */
function DemoFallback({
  busy,
  onSelect,
}: {
  busy: boolean
  onSelect: (accountId: string) => void
}) {
  const [selected, setSelected] = useState(MOCK_ACCOUNTS[0].id)

  return (
    <div className="mt-5 border-t border-border pt-5">
      <p className="mb-3 text-xs text-muted-foreground text-resilient">
        Supabase henüz yapılandırılmadı — demo hesaplardan biriyle deneyebilirsin.
      </p>

      <ul className="space-y-2">
        {MOCK_ACCOUNTS.map((account) => {
          const active = selected === account.id
          return (
            <li key={account.id}>
              <button
                type="button"
                onClick={() => setSelected(account.id)}
                aria-pressed={active}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors duration-200 ${
                  active ? 'border-accent bg-accent/10' : 'border-border hover:bg-muted/60'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-resilient">
                    {account.profile.displayName}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground text-resilient">
                    {account.persona.city}
                  </span>
                </span>
                {active && <Check className="size-4 shrink-0 text-accent" aria-hidden="true" />}
              </button>
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        onClick={() => onSelect(selected)}
        disabled={busy}
        className="mt-3 w-full rounded-xl border border-border px-4 py-3 text-sm font-medium transition-colors duration-200 hover:bg-muted disabled:opacity-70"
      >
        Demo hesapla devam et
      </button>
    </div>
  )
}
