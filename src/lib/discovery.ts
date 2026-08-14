import { TRACKS } from '@/data/catalog'
import { ME, PEOPLE, type Person } from '@/data/people'
import { compatibility } from './match'

export interface PopularTrack {
  trackId: string
  /** Everyone except you who has this track in their top list. */
  listenerIds: string[]
  /** True when it is already in your own top tracks. */
  inYourTop: boolean
}

interface PopularOptions {
  /**
   * A track only one person listens to is not popular, and listing those
   * swamps the grid with dead ends. Two is the floor for "shared".
   */
  minListeners?: number
  limit?: number
}

/**
 * Ranks the catalogue by how many people you could meet through each track.
 * That count is the whole point of the grid, so it drives the order.
 */
export function popularTracks({ minListeners = 2, limit = 12 }: PopularOptions = {}): PopularTrack[] {
  return TRACKS.map((track) => ({
    trackId: track.id,
    listenerIds: PEOPLE.filter((person) => person.topTrackIds.includes(track.id)).map((p) => p.id),
    inYourTop: ME.topTrackIds.includes(track.id),
  }))
    .filter((entry) => entry.listenerIds.length >= minListeners)
    .sort((a, b) => {
      const byListeners = b.listenerIds.length - a.listenerIds.length
      if (byListeners !== 0) return byListeners
      return a.trackId.localeCompare(b.trackId)
    })
    .slice(0, limit)
}

export interface Recommendation {
  trackId: string
  /** People whose taste is closest to yours and who listen to this. */
  fromIds: string[]
  /** Sum of those people's compatibility — higher means a safer bet. */
  weight: number
}

/**
 * Tracks you do not already listen to, surfaced by the people you match with
 * most. A suggestion is only as good as who it came from, so the score is the
 * combined compatibility of its listeners rather than a raw headcount.
 */
export function recommendationsFor(me: Person = ME, pool: Person[] = PEOPLE): Recommendation[] {
  const scoreByPerson = new Map(pool.map((p) => [p.id, compatibility(me, p).score]))
  const byTrack = new Map<string, { fromIds: string[]; weight: number }>()

  for (const person of pool) {
    const score = scoreByPerson.get(person.id) ?? 0
    for (const trackId of person.topTrackIds) {
      if (me.topTrackIds.includes(trackId)) continue
      const entry = byTrack.get(trackId) ?? { fromIds: [], weight: 0 }
      entry.fromIds.push(person.id)
      entry.weight += score
      byTrack.set(trackId, entry)
    }
  }

  return [...byTrack.entries()]
    .map(([trackId, entry]) => ({ trackId, ...entry }))
    .sort((a, b) => b.weight - a.weight || a.trackId.localeCompare(b.trackId))
}
