/**
 * Spotify Web API client — real network calls.
 *
 * Sign-in is not done here. Supabase Auth brokers the OAuth2 flow with Spotify
 * as the provider, which is what creates the `auth.users` row that every row
 * level security policy depends on. What comes back from that flow is a
 * `provider_token`, and this module is what spends it.
 *
 * Known limit: a browser cannot refresh a Supabase-brokered Spotify token,
 * because that exchange needs the client secret. Spotify tokens last an hour,
 * so `SpotifyAuthExpired` is thrown on 401 and the UI asks the user to
 * reconnect. Moving the refresh into a Supabase Edge Function holding the
 * secret is the production fix; nothing else in the app changes when it lands.
 */

const API = 'https://api.spotify.com/v1'

/** Scopes requested at sign-in. Kept here so the consent copy cannot drift. */
export const SPOTIFY_SCOPES = [
  'user-read-email',
  'user-read-private',
  'user-top-read',
  'user-read-currently-playing',
  'user-read-playback-state',
]

export interface SpotifyProfile {
  id: string
  displayName: string
  email: string | null
  country: string | null
  product: string | null
  imageUrl: string | null
}

export interface SpotifyArtist {
  id: string
  name: string
  genres: string[]
  imageUrl: string | null
}

export interface SpotifyTrack {
  id: string
  name: string
  artistId: string
  artistName: string
  imageUrl: string | null
  durationMs: number
}

export interface NowPlaying {
  trackId: string
  name: string
  artistName: string
  imageUrl: string | null
  isPlaying: boolean
  progressMs: number
}

export class SpotifyError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

/** Thrown when the provider token is gone or rejected — re-consent required. */
export class SpotifyAuthExpired extends SpotifyError {
  constructor() {
    super('Spotify bağlantısı süresi doldu. Yeniden bağlan.', 401)
  }
}

async function get<T>(path: string, token: string): Promise<T | null> {
  if (!token) throw new SpotifyAuthExpired()

  const response = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (response.status === 401) throw new SpotifyAuthExpired()

  // 204 is Spotify's "nothing to report" — most notably currently-playing.
  if (response.status === 204) return null

  if (response.status === 429) {
    const retry = response.headers.get('Retry-After') ?? '?'
    throw new SpotifyError(`Spotify hız sınırı aşıldı. ${retry} saniye sonra dene.`, 429)
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new SpotifyError(payload.error?.message ?? 'Spotify isteği başarısız.', response.status)
  }

  return (await response.json()) as T
}

/** GET /v1/me */
export async function getProfile(token: string): Promise<SpotifyProfile> {
  const data = await get<{
    id: string
    display_name: string | null
    email?: string
    country?: string
    product?: string
    images?: { url: string }[]
  }>('/me', token)

  if (!data) throw new SpotifyError('Spotify profili alınamadı.', 500)

  return {
    id: data.id,
    displayName: data.display_name ?? data.id,
    email: data.email ?? null,
    country: data.country ?? null,
    product: data.product ?? null,
    imageUrl: data.images?.[0]?.url ?? null,
  }
}

/** GET /v1/me/top/artists */
export async function getTopArtists(token: string, limit = 20): Promise<SpotifyArtist[]> {
  const data = await get<{
    items: { id: string; name: string; genres: string[]; images?: { url: string }[] }[]
  }>(`/me/top/artists?limit=${limit}&time_range=medium_term`, token)

  return (data?.items ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    genres: item.genres ?? [],
    imageUrl: item.images?.[0]?.url ?? null,
  }))
}

/** GET /v1/me/top/tracks */
export async function getTopTracks(token: string, limit = 20): Promise<SpotifyTrack[]> {
  const data = await get<{
    items: {
      id: string
      name: string
      duration_ms: number
      artists: { id: string; name: string }[]
      album?: { images?: { url: string }[] }
    }[]
  }>(`/me/top/tracks?limit=${limit}&time_range=medium_term`, token)

  return (data?.items ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    artistId: item.artists[0]?.id ?? '',
    artistName: item.artists.map((a) => a.name).join(', '),
    imageUrl: item.album?.images?.[0]?.url ?? null,
    durationMs: item.duration_ms,
  }))
}

/**
 * GET /v1/me/player/currently-playing.
 * Resolves to null when nothing is playing, and also when the item is a
 * podcast episode or local file, which arrive without a track object.
 */
export async function getNowPlaying(token: string): Promise<NowPlaying | null> {
  const data = await get<{
    is_playing: boolean
    progress_ms: number | null
    item: {
      id: string
      name: string
      artists: { name: string }[]
      album?: { images?: { url: string }[] }
    } | null
  }>('/me/player/currently-playing', token)

  if (!data?.item) return null

  return {
    trackId: data.item.id,
    name: data.item.name,
    artistName: data.item.artists.map((a) => a.name).join(', '),
    imageUrl: data.item.album?.images?.[0]?.url ?? null,
    isPlaying: data.is_playing,
    progressMs: data.progress_ms ?? 0,
  }
}
