import { artist, track } from '@/data/catalog'
import { PEOPLE, type Person } from '@/data/people'

/**
 * Simulated live listening presence.
 *
 * The board's promise is "these people are on your song right now", so
 * membership cannot be derived from someone's all-time top tracks — only two
 * people in the roster hold any given track, and a board built that way runs
 * dry in twenty seconds.
 *
 * Instead this models what a presence feed would return: over time, people
 * tune into the track. Anyone can, the same way anyone can press play. Taste
 * only decides the order — someone who already loves the track is the more
 * plausible next listener than someone who has never touched the genre.
 */

export interface LiveListener {
  personId: string
  /** Epoch ms the simulation says they started this track. */
  startedAt: number
}

/** 3 = the track is theirs, 2 = the artist, 1 = the genre, 0 = a stranger. */
function affinity(person: Person, trackId: string): number {
  const item = track(trackId)
  if (person.topTrackIds.includes(trackId)) return 3
  if (person.topArtistIds.includes(item.artistId)) return 2
  const genres = artist(item.artistId).genres
  if (person.genres.some((genre) => genres.includes(genre))) return 1
  return 0
}

function hash(seed: string): number {
  let value = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    value ^= seed.charCodeAt(i)
    value = Math.imul(value, 16777619)
  }
  return Math.abs(value)
}

/**
 * The order people tune into a track. Deterministic per track, so leaving the
 * screen and coming back does not reshuffle who is "already listening".
 *
 * Online people come first inside an affinity band: someone with the app open
 * is the believable next listener.
 */
export function tuneInOrder(trackId: string, pool: Person[] = PEOPLE): string[] {
  return [...pool]
    .sort((a, b) => {
      const byAffinity = affinity(b, trackId) - affinity(a, trackId)
      if (byAffinity !== 0) return byAffinity
      const byPresence = Number(b.online) - Number(a.online)
      if (byPresence !== 0) return byPresence
      return hash(trackId + a.id) - hash(trackId + b.id)
    })
    .map((person) => person.id)
}

/** "az önce" / "2 dk önce" for the listening-since line on a card. */
export function listeningSince(startedAt: number, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - startedAt) / 1000))
  if (seconds < 45) return 'az önce başladı'
  const minutes = Math.round(seconds / 60)
  return `${minutes} dk önce başladı`
}
