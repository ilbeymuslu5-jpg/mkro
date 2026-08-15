import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Check, Loader2, ShieldCheck } from 'lucide-react'
import { Wordmark } from '@/components/AppShell'
import { MOCK_ACCOUNTS, SPOTIFY_SCOPES } from '@/services/spotifyMock'
import { useAuth } from '@/state/AuthContext'

const SCOPE_LABEL: Record<string, string> = {
  'user-read-email': 'E-posta adresin',
  'user-top-read': 'En çok dinlediğin şarkı ve sanatçılar',
  'user-read-currently-playing': 'Şu an çalan parça',
}

/**
 * Mock OAuth consent screen. The real flow redirects to accounts.spotify.com
 * and comes back with a code; here the same steps — pick an account, review the
 * scopes, approve — happen in place.
 */
export function Login() {
  const { status, error, login, me } = useAuth()
  const [selected, setSelected] = useState(MOCK_ACCOUNTS[0].id)
  const busy = status === 'authorizing' || status === 'loading'

  if (me) return <Navigate to="/kesfet" replace />

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="text-center">
        <Wordmark />
        <h1 className="mt-6 font-display text-2xl text-balance">Spotify hesabınla bağlan</h1>
        <p className="mt-2 text-sm text-balance text-muted-foreground">
          Zevkini okumak için dinleme geçmişine ihtiyacımız var. Şifreni görmüyoruz.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-border/70 bg-card p-5">
        <h2 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Hesap seç
        </h2>

        <ul className="mt-3 space-y-2">
          {MOCK_ACCOUNTS.map((account) => {
            const active = selected === account.id
            return (
              <li key={account.id}>
                <button
                  type="button"
                  onClick={() => setSelected(account.id)}
                  aria-pressed={active}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors duration-200 ${
                    active
                      ? 'border-accent bg-accent/10'
                      : 'border-border/70 hover:bg-muted/60'
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-resilient">
                      {account.profile.displayName}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground text-resilient">
                      {account.persona.city} · {account.profile.product === 'premium' ? 'Premium' : 'Free'}
                    </span>
                  </span>
                  {active && <Check className="size-4 shrink-0 text-accent" aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ul>

        <div className="mt-5 rounded-xl bg-muted/50 p-3">
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
          onClick={() => void login(selected)}
          disabled={busy}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3.5 text-sm font-semibold text-on-accent transition-transform duration-200 hover:scale-[1.02] active:scale-95 disabled:scale-100 disabled:opacity-70"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {status === 'authorizing' ? 'Yetkilendiriliyor…' : 'Veriler alınıyor…'}
            </>
          ) : (
            'İzin ver ve devam et'
          )}
        </button>

        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive text-resilient">
            {error}
          </p>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-balance text-muted-foreground">
        Bu bir demo. Gerçek Spotify’a bağlanmaz, hiçbir veri dışarı gönderilmez.
      </p>
    </div>
  )
}
