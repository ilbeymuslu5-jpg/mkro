import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { GENRE_LABEL, type Genre } from '@/data/catalog'
import type { Person } from '@/data/people'
import { MOCK_ACCOUNTS } from '@/services/spotifyMock'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import {
  getProfile as fetchSpotifyProfile,
  getTopArtists,
  getTopTracks,
  getNowPlaying,
  SpotifyAuthExpired,
  SPOTIFY_SCOPES,
  type SpotifyProfile,
  type NowPlaying as RealNowPlaying,
} from '@/services/spotify'
import { getProfile as getDbProfile, getTaste, type Profile as DbProfile } from '@/services/db'
import type { NowPlaying } from '@/services/spotifyMock'

export type AuthStatus = 'anonymous' | 'authorizing' | 'loading' | 'authenticated' | 'error'
/**
 * Which door the current real session came through. `null` covers both the
 * demo path and the anonymous state — neither has a Supabase session.
 */
export type AuthMode = 'spotify' | 'manual' | null

interface AuthState {
  status: AuthStatus
  /** The signed-in user as the rest of the app understands people. */
  me: Person | null
  /**
   * Drives the swipe deck and live board. Deliberately not the real Spotify
   * now-playing item — that carries a real track id, and every screen that
   * renders a track looks it up in the local catalog by id. Feeding a real id
   * in here would throw the moment a card tried to render it.
   */
  nowPlaying: NowPlaying | null
  error: string | null
  /** True once a real Supabase session exists — separate from `me` being ready. */
  hasRealSession: boolean
  /** Which door the current session came through. */
  authMode: AuthMode
  /** The real Supabase auth uid, for calls into services/db.ts. */
  authUserId: string | null
  /** True for a manual (email) session that has no `profiles` row yet. */
  needsOnboarding: boolean
  /** The actual Spotify account, for display only. Never feeds the match engine. */
  spotifyProfile: SpotifyProfile | null
  /** What is really playing on Spotify right now, for display only. */
  realNowPlaying: RealNowPlaying | null
  login: () => Promise<void>
  /** Demo-mode sign-in, kept for when Supabase is not configured. */
  loginDemo: (accountId: string) => Promise<void>
  /** Creates a real Supabase account with no Spotify Development Mode cap. */
  signUpManual: (email: string, password: string) => Promise<{ error: string | null }>
  signInManual: (email: string, password: string) => Promise<{ error: string | null }>
  /** Re-reads the manual profile after onboarding writes it. */
  refreshManualProfile: () => Promise<void>
  logout: () => void
  /** Drops the session and every local trace of it. */
  wipeAccount: () => void
}

const AuthContext = createContext<AuthState | null>(null)

/**
 * The match engine, the live board and every screen that renders a track or
 * artist all key off the local catalog's ids ('t-11', 'a-radiohead'). A real
 * Spotify user's taste carries real Spotify ids, which none of that code
 * knows how to look up — feeding them in directly throws.
 *
 * Fixing that means re-keying the whole app off ids that live in the
 * database instead, which is the next migration step. Until then, a real
 * sign-in pins the demo taste to one fixed account so the app stays usable;
 * the person's actual identity (name, avatar, and what they are really
 * playing) is still real and shown separately.
 */
const DEMO_TASTE_ACCOUNT = MOCK_ACCOUNTS[0]
const DEMO_SESSION_KEY = 'makromusic:demo_account'

function personFromRealProfile(profile: SpotifyProfile): Person {
  const persona = DEMO_TASTE_ACCOUNT.persona
  return {
    id: 'me',
    name: profile.displayName,
    age: persona.age,
    city: persona.city,
    bio: persona.bio,
    topArtistIds: DEMO_TASTE_ACCOUNT.taste.topArtistIds,
    topTrackIds: DEMO_TASTE_ACCOUNT.taste.topTrackIds,
    genres: DEMO_TASTE_ACCOUNT.taste.genres,
    anthemTrackId: DEMO_TASTE_ACCOUNT.taste.topTrackIds[0],
    online: true,
  }
}

function personFromDemoAccount(accountId: string): Person | null {
  const account = MOCK_ACCOUNTS.find((candidate) => candidate.id === accountId)
  if (!account) return null
  return {
    id: 'me',
    name: account.persona.name,
    age: account.persona.age,
    city: account.persona.city,
    bio: account.persona.bio,
    topArtistIds: account.taste.topArtistIds,
    topTrackIds: account.taste.topTrackIds,
    genres: account.taste.genres,
    anthemTrackId: account.taste.topTrackIds[0],
    online: true,
  }
}

const CURRENT_YEAR = new Date().getFullYear()

/**
 * Builds a Person from a manual (email) account's real `profiles` + taste
 * rows. The ids in those rows are local catalog ids — Onboarding only ever
 * lets a user pick from the catalog — so every screen that looks a track or
 * artist up by id works exactly as it does for the demo accounts.
 */
function personFromManualProfile(
  profile: DbProfile,
  taste: Awaited<ReturnType<typeof getTaste>>,
): Person {
  const genres = Array.from(
    new Set(taste.artists.flatMap((a) => a.genres.filter((g): g is Genre => g in GENRE_LABEL))),
  )
  return {
    id: 'me',
    name: profile.displayName,
    age: profile.birthYear ? CURRENT_YEAR - profile.birthYear : 0,
    city: profile.city ?? '',
    bio: profile.bio,
    topArtistIds: taste.artists.map((a) => a.id),
    topTrackIds: taste.tracks.map((t) => t.id),
    genres,
    anthemTrackId: taste.tracks[0]?.id ?? '',
    online: true,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [me, setMe] = useState<Person | null>(null)
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null)
  const [spotifyProfile, setSpotifyProfile] = useState<SpotifyProfile | null>(null)
  const [realNowPlaying, setRealNowPlaying] = useState<RealNowPlaying | null>(null)
  const [status, setStatus] = useState<AuthStatus>('anonymous')
  const [error, setError] = useState<string | null>(null)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  // Supabase persists a real session on its own; the demo path is handled
  // entirely by this component, so it needs its own storage or a page
  // reload (a full navigation, not a client-side route change) drops it and
  // silently signs the demo user back out.
  const [demoAccountId, setDemoAccountId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(DEMO_SESSION_KEY)
    } catch {
      return null
    }
  })
  // Memoized: this feeds a useEffect dependency array below, and a new
  // object on every render — even with identical contents — retriggered that
  // effect every time, which cascaded into an infinite render loop.
  const demoOverride = useMemo(
    () => (demoAccountId ? personFromDemoAccount(demoAccountId) : null),
    [demoAccountId],
  )

  // Track the real Supabase session for as long as Supabase is configured.
  useEffect(() => {
    if (!supabase) return

    let cancelled = false
    setStatus('loading')

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSession(data.session)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })

    return () => {
      cancelled = true
      subscription.subscription.unsubscribe()
    }
  }, [])

  // Once a real session exists, pull the actual Spotify identity.
  useEffect(() => {
    if (!session) {
      if (demoAccountId) {
        const account = MOCK_ACCOUNTS.find((candidate) => candidate.id === demoAccountId)
        if (account && demoOverride) {
          setMe(demoOverride)
          setStatus('authenticated')
          // Restores the same slot loginDemo fills, so a reload does not
          // leave the deck with no track to match on.
          setNowPlaying((current) =>
            current ?? { trackId: account.nowPlayingTrackId, isPlaying: true, progressMs: 0 },
          )
        }
      } else {
        setMe(null)
        setStatus('anonymous')
      }
      setSpotifyProfile(null)
      setRealNowPlaying(null)
      setNeedsOnboarding(false)
      return
    }

    // Supabase's email/password provider needs none of the Spotify-token
    // machinery below — it reads its own profile out of `profiles` instead.
    if (session.user.app_metadata?.provider !== 'spotify') {
      setSpotifyProfile(null)
      setRealNowPlaying(null)
      let cancelled = false
      setStatus('loading')

      void (async () => {
        try {
          const profile = await getDbProfile(session.user.id)
          if (cancelled) return
          if (!profile) {
            // Signed up, but the onboarding form (name/city/taste) was never
            // submitted — there is no `profiles` row to build a Person from.
            setMe(null)
            setNeedsOnboarding(true)
            setStatus('authenticated')
            setError(null)
            return
          }
          const taste = await getTaste(profile.id)
          if (cancelled) return
          setMe(personFromManualProfile(profile, taste))
          setNeedsOnboarding(false)
          setStatus('authenticated')
          setError(null)
        } catch {
          if (cancelled) return
          setError('Profilin yüklenemedi. Tekrar dene.')
          setStatus('error')
        }
      })()

      return () => {
        cancelled = true
      }
    }

    const token = session.provider_token
    if (!token) {
      // Supabase only hands back provider_token on the redirect right after
      // sign-in — a refreshed page has a session but no token to call Spotify
      // with. Spotify tokens expire in an hour and this app cannot refresh
      // them without a server holding the client secret, so the honest move
      // is to ask for a fresh sign-in rather than pretend to be connected.
      setError('Spotify bağlantısı bu oturumda yenilenemiyor. Yeniden bağlan.')
      setStatus('error')
      return
    }

    let cancelled = false
    setStatus('loading')

    void (async () => {
      try {
        const profile = await fetchSpotifyProfile(token)
        if (cancelled) return
        setSpotifyProfile(profile)
        setMe(personFromRealProfile(profile))
        setNeedsOnboarding(false)
        setStatus('authenticated')
        setError(null)

        const [artists, tracks, playing] = await Promise.all([
          getTopArtists(token),
          getTopTracks(token),
          getNowPlaying(token),
        ])
        if (cancelled) return
        setRealNowPlaying(playing)
        void artists
        void tracks
      } catch (cause) {
        if (cancelled) return
        const message =
          cause instanceof SpotifyAuthExpired
            ? cause.message
            : 'Spotify verileri alınamadı. Tekrar dene.'
        setError(message)
        setStatus('error')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [session, demoOverride])

  // Poll the real now-playing item so the display stays live.
  useEffect(() => {
    if (!session?.provider_token || status !== 'authenticated') return
    const token = session.provider_token
    const id = window.setInterval(() => {
      void getNowPlaying(token)
        .then(setRealNowPlaying)
        .catch(() => {
          // A failed poll is not worth surfacing; the next tick retries.
        })
    }, 15_000)
    return () => window.clearInterval(id)
  }, [session, status])

  // The demo taste still drives the swipe deck — see DEMO_TASTE_ACCOUNT above.
  // Real Spotify sign-ins always pin to DEMO_TASTE_ACCOUNT (there is no other
  // account to pick from); a demo sign-in already set its own nowPlaying in
  // loginDemo, and a manual sign-in has its own real taste and no live
  // playback to fake, so this only covers the real-Spotify-session path.
  useEffect(() => {
    if (status !== 'authenticated' || demoAccountId) return
    if (session?.user.app_metadata?.provider !== 'spotify') return
    setNowPlaying({
      trackId: DEMO_TASTE_ACCOUNT.nowPlayingTrackId,
      isPlaying: true,
      progressMs: Date.now() % (4 * 60 * 1000),
    })
  }, [status, demoAccountId, session])

  const login = useCallback(async () => {
    if (!supabase) {
      setError('Supabase yapılandırılmamış.')
      setStatus('error')
      return
    }
    setStatus('authorizing')
    setError(null)
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'spotify',
      options: {
        scopes: SPOTIFY_SCOPES.join(' '),
        redirectTo: window.location.origin,
      },
    })
    if (oauthError) {
      setError(oauthError.message)
      setStatus('error')
    }
    // On success the browser navigates away to Spotify's consent screen —
    // nothing left to do here.
  }, [])

  const loginDemo = useCallback(async (accountId: string) => {
    setStatus('authorizing')
    setError(null)
    const person = personFromDemoAccount(accountId)
    const account = MOCK_ACCOUNTS.find((candidate) => candidate.id === accountId)
    if (!person || !account) {
      setError('Hesap bulunamadı.')
      setStatus('error')
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
    try {
      localStorage.setItem(DEMO_SESSION_KEY, accountId)
    } catch {
      // Storage disabled — the demo session then only lasts this tab.
    }
    setDemoAccountId(accountId)
    setMe(person)
    setNowPlaying({
      trackId: account.nowPlayingTrackId,
      isPlaying: true,
      progressMs: 0,
    })
    setStatus('authenticated')
  }, [])

  // Unlimited-user alternative to Spotify OAuth — Spotify's Development Mode
  // caps a Client ID at 5 authorized accounts, which login() cannot get past.
  // Email confirmation is off project-wide (see README), so signUp returns an
  // active session immediately instead of requiring a confirmation click.
  const signUpManual = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Supabase yapılandırılmamış.' }
    setStatus('authorizing')
    setError(null)
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) {
      setStatus('anonymous')
      return { error: signUpError.message }
    }
    if (!data.session) {
      setStatus('anonymous')
      return { error: 'Hesap oluşturuldu ama oturum açılamadı. Giriş yapmayı dene.' }
    }
    setSession(data.session)
    return { error: null }
  }, [])

  const signInManual = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Supabase yapılandırılmamış.' }
    setStatus('authorizing')
    setError(null)
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setStatus('anonymous')
      return { error: 'E-posta veya şifre yanlış.' }
    }
    setSession(data.session)
    return { error: null }
  }, [])

  const refreshManualProfile = useCallback(async () => {
    if (!session) return
    try {
      const profile = await getDbProfile(session.user.id)
      if (!profile) {
        setNeedsOnboarding(true)
        return
      }
      const taste = await getTaste(profile.id)
      setMe(personFromManualProfile(profile, taste))
      setNeedsOnboarding(false)
      setStatus('authenticated')
      setError(null)
    } catch {
      setError('Profilin yüklenemedi. Tekrar dene.')
    }
  }, [session])

  const clearSession = useCallback(() => {
    if (supabase) void supabase.auth.signOut()
    try {
      localStorage.removeItem(DEMO_SESSION_KEY)
    } catch {
      // Nothing to remove if storage is unavailable.
    }
    setSession(null)
    setDemoAccountId(null)
    setMe(null)
    setNowPlaying(null)
    setSpotifyProfile(null)
    setRealNowPlaying(null)
    setNeedsOnboarding(false)
    setStatus('anonymous')
    setError(null)
  }, [])

  const wipeAccount = useCallback(() => {
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('makromusic:')) localStorage.removeItem(key)
      }
    } catch {
      // Storage disabled — in-memory state is cleared below regardless.
    }
    clearSession()
  }, [clearSession])

  const authMode: AuthMode = session
    ? session.user.app_metadata?.provider === 'spotify'
      ? 'spotify'
      : 'manual'
    : null

  const value = useMemo<AuthState>(
    () => ({
      status,
      me,
      nowPlaying,
      error,
      hasRealSession: session !== null,
      authMode,
      authUserId: session?.user.id ?? null,
      needsOnboarding,
      spotifyProfile,
      realNowPlaying,
      login,
      loginDemo,
      signUpManual,
      signInManual,
      refreshManualProfile,
      logout: clearSession,
      wipeAccount,
    }),
    [
      status,
      me,
      nowPlaying,
      error,
      session,
      authMode,
      needsOnboarding,
      spotifyProfile,
      realNowPlaying,
      login,
      loginDemo,
      signUpManual,
      signInManual,
      refreshManualProfile,
      clearSession,
      wipeAccount,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

/**
 * The signed-in user, for screens that only render behind the auth guard.
 * Throws rather than returning null so callers never guard twice.
 */
export function useMe(): Person {
  const { me } = useAuth()
  if (!me) throw new Error('useMe called before the Spotify session was ready')
  return me
}

export { isSupabaseConfigured }
