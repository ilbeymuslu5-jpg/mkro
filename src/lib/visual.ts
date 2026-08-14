/**
 * Deterministic artwork. The app ships no image assets and makes no network
 * requests for avatars — every cover and profile picture is a gradient derived
 * from the entity's id, so the same person always looks the same.
 */

const PAIRS: [string, string][] = [
  ['#4338CA', '#22C55E'],
  ['#1E1B4B', '#4338CA'],
  ['#7C3AED', '#22D3EE'],
  ['#DB2777', '#4338CA'],
  ['#059669', '#1E1B4B'],
  ['#F59E0B', '#7C3AED'],
  ['#0EA5E9', '#4338CA'],
  ['#E11D48', '#F59E0B'],
]

function hash(seed: string): number {
  let value = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    value ^= seed.charCodeAt(i)
    value = Math.imul(value, 16777619)
  }
  return Math.abs(value)
}

export function gradientFor(seed: string): string {
  const h = hash(seed)
  const [from, to] = PAIRS[h % PAIRS.length]
  const angle = h % 360
  return `linear-gradient(${angle}deg, ${from}, ${to})`
}

/** First letters of the first two words — safe for single-word names too. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}
