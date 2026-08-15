import { artist, track, type Genre } from '@/data/catalog'
import { PEOPLE, type Person } from '@/data/people'

/** Why this person showed up on the board — rendered on their card. */
export type LiveReason = 'same-track' | 'same-artist' | 'same-genre'

export interface LiveCandidate {
  personId: string
  reason: LiveReason
}

export const REASON_LABEL: Record<LiveReason, string> = {
  'same-track': 'şu an aynı şarkıda',
  'same-artist': 'aynı sanatçıyı dinliyor',
  'same-genre': 'aynı türde takılıyor',
}

/**
 * Everyone the board can surface for a track, strongest tie first.
 *
 * Only a couple of people hold any given track in their top list, so an
 * exact-track-only board runs dry after twenty seconds. The weaker tiers keep
 * it filling, and each card states which tier it came from rather than
 * implying they are all on the same song.
 */
export function liveCandidates(trackId: string, pool: Person[] = PEOPLE): LiveCandidate[] {
  const current = track(trackId)
  const artistId = current.artistId
  const genres: Genre[] = artist(artistId).genres

  const sameTrack: LiveCandidate[] = []
  const sameArtist: LiveCandidate[] = []
  const sameGenre: LiveCandidate[] = []

  for (const candidate of pool) {
    if (candidate.topTrackIds.includes(trackId)) {
      sameTrack.push({ personId: candidate.id, reason: 'same-track' })
    } else if (candidate.topArtistIds.includes(artistId)) {
      sameArtist.push({ personId: candidate.id, reason: 'same-artist' })
    } else if (candidate.genres.some((genre) => genres.includes(genre))) {
      sameGenre.push({ personId: candidate.id, reason: 'same-genre' })
    }
  }

  // Online people first inside each tier — they are the plausible "right now".
  const byPresence = (a: LiveCandidate, b: LiveCandidate) =>
    Number(personOnline(b.personId, pool)) - Number(personOnline(a.personId, pool))

  return [
    ...sameTrack.sort(byPresence),
    ...sameArtist.sort(byPresence),
    ...sameGenre.sort(byPresence),
  ]
}

function personOnline(id: string, pool: Person[]): boolean {
  return pool.find((candidate) => candidate.id === id)?.online ?? false
}
