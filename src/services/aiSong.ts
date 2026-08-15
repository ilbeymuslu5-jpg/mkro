/**
 * Mock "generate a song for this match" service.
 *
 * A real implementation would post both taste profiles to a generation API and
 * poll a job id. This simulates the same shape — staged progress then a result
 * — so the UI is built against an async job rather than an instant value.
 */
import { artist, GENRE_LABEL, type Genre } from '@/data/catalog'
import type { Person } from '@/data/people'
import { compatibility } from '@/lib/match'
import type { GeneratedTrack } from '@/state/SocialContext'

export const GENERATION_STAGES = [
  'Ortak zevkiniz okunuyor',
  'Akor ilerleyişi kuruluyor',
  'Vokal hattı yazılıyor',
  'Mix tamamlanıyor',
] as const

export type GenerationStage = (typeof GENERATION_STAGES)[number]

const TITLE_SHAPES = [
  (a: string) => `${a} Kadar Uzak`,
  (a: string) => `${a} ve Gece`,
  (a: string) => `Sen ${a} Dinlerken`,
  (a: string) => `${a}’dan Sonra`,
  (a: string) => `İki Kişilik ${a}`,
]

const MOODS: Record<string, string> = {
  indie: 'dağınık gitarlar, geç saat',
  rock: 'yüksek gain, açık tavan',
  alternatif: 'gergin ama yumuşak',
  elektronik: 'yavaş yükselen pad’ler',
  'hip-hop': 'ağır boom-bap, sıcak bas',
  jazz: 'gevşek swing, oda kaydı',
  klasik: 'tek piyano, az nota',
  pop: 'parlak ama melankolik',
  'anadolu-rock': 'saz ve fuzz birlikte',
  'lo-fi': 'kaset hışırtısı, düşük tempo',
  metal: 'yoğun, tek nefeste',
  'r&b': 'sıcak vokal, geniş alan',
}

/** Deterministic per pair, so regenerating for the same match is stable. */
function hash(seed: string): number {
  let value = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    value ^= seed.charCodeAt(i)
    value = Math.imul(value, 16777619)
  }
  return Math.abs(value)
}

export interface GenerationHandle {
  /** Resolves when the job finishes. */
  result: Promise<GeneratedTrack>
  cancel: () => void
}

/**
 * Starts a generation job, reporting each stage as it begins. The returned
 * handle can be cancelled — leaving a chat mid-job must not land a track in it.
 */
export function generateSongFor(
  me: Person,
  other: Person,
  onStage: (stage: GenerationStage, index: number) => void,
): GenerationHandle {
  let cancelled = false
  const timers: number[] = []

  const result = new Promise<GeneratedTrack>((resolve, reject) => {
    GENERATION_STAGES.forEach((stage, index) => {
      timers.push(
        window.setTimeout(() => {
          if (!cancelled) onStage(stage, index)
        }, index * 750),
      )
    })

    timers.push(
      window.setTimeout(() => {
        if (cancelled) {
          reject(new Error('cancelled'))
          return
        }
        resolve(compose(me, other))
      }, GENERATION_STAGES.length * 750),
    )
  })

  return {
    result,
    cancel: () => {
      cancelled = true
      for (const id of timers) window.clearTimeout(id)
    },
  }
}

function compose(me: Person, other: Person): GeneratedTrack {
  const match = compatibility(me, other)
  const seed = hash([me.id, other.id].sort().join(':'))

  const anchorArtistId = match.sharedArtistIds[0] ?? other.topArtistIds[0]
  const anchorName = artist(anchorArtistId).name
  const title = TITLE_SHAPES[seed % TITLE_SHAPES.length](anchorName)

  const sharedGenre: Genre | undefined = match.sharedGenres[0] ?? other.genres[0]
  const mood = sharedGenre ? (MOODS[sharedGenre] ?? 'ikinizin arası') : 'ikinizin arası'

  const basedOn =
    match.sharedArtistIds.length > 0
      ? `${match.sharedArtistIds
          .slice(0, 2)
          .map((id) => artist(id).name)
          .join(' + ')}${sharedGenre ? ` · ${GENRE_LABEL[sharedGenre]}` : ''}`
      : `${anchorName}${sharedGenre ? ` · ${GENRE_LABEL[sharedGenre]}` : ''}`

  // 2:30–4:10, stable for the pair.
  const durationSec = 150 + (seed % 100)

  return { title, basedOn, durationSec, mood }
}
