/**
 * TEMPORARY — mock Spotify client, kept only until the UI is migrated.
 *
 * The real client lives in `spotify.ts` and talks to api.spotify.com. This file
 * still exists because every screen renders through `data/catalog.ts`, which is
 * keyed by local ids ('t-11') rather than Spotify ids. Deleting this before
 * those screens read names and artwork from the database would leave the app
 * unable to render anything.
 *
 * Delete this file once the pages consume `services/db.ts`.
 */
import type { Genre } from '@/data/catalog'

export interface SpotifyProfile {
  id: string
  displayName: string
  email: string
  country: string
  product: 'free' | 'premium'
}

export interface SpotifySession {
  accessToken: string
  /** Epoch millis. The real API issues one-hour tokens. */
  expiresAt: number
  scope: string[]
  profile: SpotifyProfile
}

export interface SpotifyTaste {
  topTrackIds: string[]
  topArtistIds: string[]
  genres: Genre[]
}

export interface NowPlaying {
  trackId: string
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

const SCOPES = ['user-read-email', 'user-top-read', 'user-read-currently-playing']


/** Accounts the mock consent screen can sign in as. */
export interface MockAccount {
  id: string
  profile: SpotifyProfile
  taste: SpotifyTaste
  persona: { name: string; age: number; city: string; bio: string }
  nowPlayingTrackId: string
}

export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    id: 'sp-gece',
    profile: {
      id: 'sp-gece',
      displayName: 'gecekusu',
      email: 'gecekusu@example.com',
      country: 'TR',
      product: 'premium',
    },
    persona: {
      name: 'Sen',
      age: 27,
      city: 'İstanbul',
      bio: 'Gece yarısı kulaklık takıp şehirde yürüyen tip. Plak biriktiriyorum.',
    },
    taste: {
      topArtistIds: ['a-radiohead', 'a-adamlar', 'a-tameimpala', 'a-bonobo', 'a-altin'],
      topTrackIds: ['t-11', 't-6', 't-12', 't-14', 't-9'],
      genres: ['indie', 'alternatif', 'elektronik', 'anadolu-rock'],
    },
    nowPlayingTrackId: 't-11',
  },
  {
    id: 'sp-45lik',
    profile: {
      id: 'sp-45lik',
      displayName: '45lik',
      email: '45lik@example.com',
      country: 'TR',
      product: 'free',
    },
    persona: {
      name: 'Sen',
      age: 31,
      city: 'Ankara',
      bio: '70’ler Anadolu rock kazısı. Plakçı tozu yutmadan gün bitmez.',
    },
    taste: {
      topArtistIds: ['a-erkin', 'a-baris', 'a-mfo', 'a-altin', 'a-gaye'],
      topTrackIds: ['t-3', 't-2', 't-1', 't-9', 't-8'],
      genres: ['anadolu-rock', 'rock', 'indie'],
    },
    nowPlayingTrackId: 't-3',
  },
  {
    id: 'sp-nokta',
    profile: {
      id: 'sp-nokta',
      displayName: 'nokta.vurus',
      email: 'nokta@example.com',
      country: 'TR',
      product: 'premium',
    },
    persona: {
      name: 'Sen',
      age: 24,
      city: 'İzmir',
      bio: 'Rap ve lo-fi arası bir yerdeyim. Punchline tartışmasına her zaman varım.',
    },
    taste: {
      topArtistIds: ['a-kendrick', 'a-ezhel', 'a-nujabes', 'a-frank', 'a-sza'],
      topTrackIds: ['t-18', 't-19', 't-17', 't-27', 't-26'],
      genres: ['hip-hop', 'lo-fi', 'r&b'],
    },
    nowPlayingTrackId: 't-18',
  },
]

const TOKEN_TTL_MS = 60 * 60 * 1000

const latency = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function accountFor(token: string): MockAccount {
  const account = MOCK_ACCOUNTS.find((candidate) => token.endsWith(candidate.id))
  if (!account) throw new SpotifyError('Geçersiz erişim anahtarı.', 401)
  return account
}

function assertLive(session: SpotifySession): void {
  if (session.expiresAt <= Date.now()) {
    throw new SpotifyError('Oturum süresi doldu. Yeniden bağlan.', 401)
  }
}

/**
 * Stands in for the authorization-code redirect. The real flow leaves the page;
 * here the consent screen is rendered in-app and this resolves with the token.
 */
export async function authorize(accountId: string): Promise<SpotifySession> {
  await latency(900)
  const account = MOCK_ACCOUNTS.find((candidate) => candidate.id === accountId)
  if (!account) throw new SpotifyError('Hesap bulunamadı.', 404)

  return {
    accessToken: `mock-token-${account.id}`,
    expiresAt: Date.now() + TOKEN_TTL_MS,
    scope: SCOPES,
    profile: account.profile,
  }
}

/** GET /v1/me */
export async function getProfile(session: SpotifySession): Promise<SpotifyProfile> {
  assertLive(session)
  await latency(220)
  return accountFor(session.accessToken).profile
}

/** GET /v1/me/top/tracks and /v1/me/top/artists, collapsed into one taste read. */
export async function getTopItems(session: SpotifySession): Promise<SpotifyTaste> {
  assertLive(session)
  await latency(420)
  return accountFor(session.accessToken).taste
}

/**
 * GET /v1/me/player/currently-playing.
 * The real endpoint answers 204 with no body when nothing is playing, which is
 * why this resolves to null rather than throwing.
 */
export async function getNowPlaying(session: SpotifySession): Promise<NowPlaying | null> {
  assertLive(session)
  await latency(180)
  const account = accountFor(session.accessToken)

  // Progress advances with wall-clock time so the UI has something live to show.
  const cycleMs = 4 * 60 * 1000
  return {
    trackId: account.nowPlayingTrackId,
    isPlaying: true,
    progressMs: Date.now() % cycleMs,
  }
}

export const SPOTIFY_SCOPES = SCOPES
