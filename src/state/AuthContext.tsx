import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Person } from '@/data/people'
import {
  authorize,
  getNowPlaying,
  getTopItems,
  MOCK_ACCOUNTS,
  SpotifyError,
  type NowPlaying,
  type SpotifySession,
  type SpotifyTaste,
} from '@/services/spotify'

const SESSION_KEY = 'makromusic:session'

export type AuthStatus = 'anonymous' | 'authorizing' | 'loading' | 'authenticated' | 'error'

interface AuthState {
  status: AuthStatus
  session: SpotifySession | null
  /** The signed-in user as the rest of the app understands people. */
  me: Person | null
  nowPlaying: NowPlaying | null
  error: string | null
  login: (accountId: string) => Promise<void>
  logout: () => void
  /** Drops the session and every local trace of it. */
  wipeAccount: () => void
}

const AuthContext = createContext<AuthState | null>(null)

function readStored<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage disabled — the session simply does not survive a reload.
  }
}

/** Builds the app-level Person from the Spotify profile plus its taste read. */
function toPerson(session: SpotifySession, taste: SpotifyTaste): Person {
  const account = MOCK_ACCOUNTS.find((candidate) => candidate.id === session.profile.id)
  const persona = account?.persona ?? {
    name: session.profile.displayName,
    age: 27,
    city: 'İstanbul',
    bio: '',
  }

  return {
    id: 'me',
    name: persona.name,
    age: persona.age,
    city: persona.city,
    bio: persona.bio,
    topArtistIds: taste.topArtistIds,
    topTrackIds: taste.topTrackIds,
    genres: taste.genres,
    anthemTrackId: taste.topTrackIds[0],
    online: true,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = useRef(readStored<SpotifySession>(SESSION_KEY))
  const [session, setSession] = useState<SpotifySession | null>(
    stored.current && stored.current.expiresAt > Date.now() ? stored.current : null,
  )
  const [me, setMe] = useState<Person | null>(null)
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null)
  const [status, setStatus] = useState<AuthStatus>(session ? 'loading' : 'anonymous')
  const [error, setError] = useState<string | null>(null)

  // Hydrate taste + now playing whenever a session appears.
  useEffect(() => {
    if (!session) {
      setMe(null)
      setNowPlaying(null)
      return
    }

    let cancelled = false
    setStatus('loading')

    void (async () => {
      try {
        const taste = await getTopItems(session)
        if (cancelled) return
        setMe(toPerson(session, taste))
        setStatus('authenticated')
        setError(null)

        const playing = await getNowPlaying(session)
        if (!cancelled) setNowPlaying(playing)
      } catch (cause) {
        if (cancelled) return
        const message =
          cause instanceof SpotifyError
            ? cause.message
            : 'Spotify verileri alınamadı. Tekrar dene.'
        setError(message)
        setStatus('error')
        if (cause instanceof SpotifyError && cause.status === 401) {
          setSession(null)
          setStatus('anonymous')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [session])

  // Keep "şu an çalan" moving without hammering the endpoint.
  useEffect(() => {
    if (!session || status !== 'authenticated') return
    const id = window.setInterval(() => {
      void getNowPlaying(session)
        .then(setNowPlaying)
        .catch(() => {
          // A failed poll is not worth surfacing; the next tick retries.
        })
    }, 15_000)
    return () => window.clearInterval(id)
  }, [session, status])

  const login = useCallback(async (accountId: string) => {
    setStatus('authorizing')
    setError(null)
    try {
      const next = await authorize(accountId)
      write(SESSION_KEY, next)
      setSession(next)
    } catch (cause) {
      setError(cause instanceof SpotifyError ? cause.message : 'Bağlantı kurulamadı.')
      setStatus('error')
    }
  }, [])

  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch {
      // Nothing to remove if storage is unavailable.
    }
    setSession(null)
    setMe(null)
    setNowPlaying(null)
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

  const value = useMemo<AuthState>(
    () => ({ status, session, me, nowPlaying, error, login, logout: clearSession, wipeAccount }),
    [status, session, me, nowPlaying, error, login, clearSession, wipeAccount],
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
