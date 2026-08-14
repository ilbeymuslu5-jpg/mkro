import { artist, type Genre } from '@/data/catalog'
import type { Person } from '@/data/people'

export interface MatchBreakdown {
  /** 0–100, rounded. */
  score: number
  sharedArtistIds: string[]
  sharedTrackIds: string[]
  sharedGenres: Genre[]
  /** The single most convincing reason these two match, ready to render. */
  headline: string
}

/**
 * Rank-weighted overlap: a shared #1 artist says far more than a shared #5.
 * Weight decays 1, 1/2, 1/3 … so the sum stays bounded and comparable across
 * people with different list lengths.
 */
function rankWeights(ids: string[]): Map<string, number> {
  return new Map(ids.map((id, index) => [id, 1 / (index + 1)]))
}

function weightedOverlap(a: string[], b: string[]): { shared: string[]; ratio: number } {
  const weightsA = rankWeights(a)
  const weightsB = rankWeights(b)
  const shared: string[] = []
  let hit = 0

  for (const [id, weightA] of weightsA) {
    const weightB = weightsB.get(id)
    if (weightB === undefined) continue
    shared.push(id)
    // Geometric mean rewards items ranked highly by *both* sides.
    hit += Math.sqrt(weightA * weightB)
  }

  const total = Math.sqrt(
    [...weightsA.values()].reduce((sum, w) => sum + w, 0) *
      [...weightsB.values()].reduce((sum, w) => sum + w, 0),
  )

  return { shared, ratio: total === 0 ? 0 : hit / total }
}

function jaccard<T>(a: T[], b: T[]): { shared: T[]; ratio: number } {
  const setB = new Set(b)
  const shared = [...new Set(a)].filter((item) => setB.has(item))
  const union = new Set([...a, ...b])
  return { shared, ratio: union.size === 0 ? 0 : shared.length / union.size }
}

/**
 * Blends three signals into the percentage makromusic puts on every profile.
 * Artists dominate, genres broaden, exact track matches are the rare bonus.
 */
export function compatibility(a: Person, b: Person): MatchBreakdown {
  const artists = weightedOverlap(a.topArtistIds, b.topArtistIds)
  const tracks = weightedOverlap(a.topTrackIds, b.topTrackIds)
  const genres = jaccard(a.genres, b.genres)

  const raw = artists.ratio * 0.55 + genres.ratio * 0.27 + tracks.ratio * 0.18

  // Raw overlap rarely exceeds ~0.7 even for near-twins, so it is mapped onto a
  // believable band: no one reads as a 4% match, and a genuinely close taste
  // still has room to land in the 90s.
  const score = Math.round(Math.min(99, 42 + raw * 72))

  return {
    score,
    sharedArtistIds: artists.shared,
    sharedTrackIds: tracks.shared,
    sharedGenres: genres.shared,
    headline: headlineFor(artists.shared, tracks.shared, genres.shared),
  }
}

function headlineFor(
  sharedArtistIds: string[],
  sharedTrackIds: string[],
  sharedGenres: Genre[],
): string {
  if (sharedTrackIds.length > 0) {
    return `Aynı ${sharedTrackIds.length} şarkı ikinizin de en çok dinlediklerinde`
  }
  if (sharedArtistIds.length >= 2) {
    const [first, second] = sharedArtistIds
    return `İkiniz de ${artist(first).name} ve ${artist(second).name} dinliyorsunuz`
  }
  if (sharedArtistIds.length === 1) {
    return `${artist(sharedArtistIds[0]).name} ortak noktanız`
  }
  if (sharedGenres.length > 0) {
    return `Ortak tür: ${sharedGenres.length} tane`
  }
  return 'Zıt kutuplar — belki de tam bu yüzden'
}

/** Green above 70, indigo in the middle, muted below 55. */
export function scoreTone(score: number): 'high' | 'mid' | 'low' {
  if (score >= 70) return 'high'
  if (score >= 55) return 'mid'
  return 'low'
}

/**
 * The score at which someone likes you back. Keep this in the middle of the
 * band the scale actually produces — set it above the top score and no like can
 * ever become a match.
 */
export const MUTUAL_LIKE_SCORE = 55
