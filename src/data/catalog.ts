export type Genre =
  | 'indie'
  | 'rock'
  | 'alternatif'
  | 'elektronik'
  | 'hip-hop'
  | 'jazz'
  | 'klasik'
  | 'pop'
  | 'anadolu-rock'
  | 'lo-fi'
  | 'metal'
  | 'r&b'

export const GENRE_LABEL: Record<Genre, string> = {
  indie: 'Indie',
  rock: 'Rock',
  alternatif: 'Alternatif',
  elektronik: 'Elektronik',
  'hip-hop': 'Hip-Hop',
  jazz: 'Jazz',
  klasik: 'Klasik',
  pop: 'Pop',
  'anadolu-rock': 'Anadolu Rock',
  'lo-fi': 'Lo-Fi',
  metal: 'Metal',
  'r&b': 'R&B',
}

export interface Artist {
  id: string
  name: string
  genres: Genre[]
}

export interface Track {
  id: string
  title: string
  artistId: string
  durationSec: number
}

export const ARTISTS: Artist[] = [
  { id: 'a-mfo', name: 'MFÖ', genres: ['anadolu-rock', 'rock'] },
  { id: 'a-baris', name: 'Barış Manço', genres: ['anadolu-rock', 'rock'] },
  { id: 'a-erkin', name: 'Erkin Koray', genres: ['anadolu-rock', 'rock'] },
  { id: 'a-duman', name: 'Duman', genres: ['rock', 'alternatif'] },
  { id: 'a-mor', name: 'mor ve ötesi', genres: ['rock', 'alternatif'] },
  { id: 'a-adamlar', name: 'Adamlar', genres: ['indie', 'alternatif'] },
  { id: 'a-madrigal', name: 'Madrigal', genres: ['indie', 'alternatif'] },
  { id: 'a-gaye', name: 'Gaye Su Akyol', genres: ['indie', 'anadolu-rock'] },
  { id: 'a-altin', name: 'Altın Gün', genres: ['anadolu-rock', 'indie'] },
  { id: 'a-jakuzi', name: 'Jakuzi', genres: ['indie', 'elektronik'] },
  { id: 'a-radiohead', name: 'Radiohead', genres: ['alternatif', 'rock'] },
  { id: 'a-tameimpala', name: 'Tame Impala', genres: ['indie', 'elektronik'] },
  { id: 'a-arctic', name: 'Arctic Monkeys', genres: ['indie', 'rock'] },
  { id: 'a-bonobo', name: 'Bonobo', genres: ['elektronik', 'lo-fi'] },
  { id: 'a-fourtet', name: 'Four Tet', genres: ['elektronik'] },
  { id: 'a-aphex', name: 'Aphex Twin', genres: ['elektronik'] },
  { id: 'a-nujabes', name: 'Nujabes', genres: ['lo-fi', 'hip-hop'] },
  { id: 'a-kendrick', name: 'Kendrick Lamar', genres: ['hip-hop'] },
  { id: 'a-ezhel', name: 'Ezhel', genres: ['hip-hop'] },
  { id: 'a-sagopa', name: 'Sagopa Kajmer', genres: ['hip-hop'] },
  { id: 'a-coltrane', name: 'John Coltrane', genres: ['jazz'] },
  { id: 'a-mingus', name: 'Charles Mingus', genres: ['jazz'] },
  { id: 'a-hindi', name: 'Hindi Zahra', genres: ['jazz', 'r&b'] },
  { id: 'a-erik', name: 'Erik Satie', genres: ['klasik'] },
  { id: 'a-nils', name: 'Nils Frahm', genres: ['klasik', 'elektronik'] },
  { id: 'a-sza', name: 'SZA', genres: ['r&b', 'pop'] },
  { id: 'a-frank', name: 'Frank Ocean', genres: ['r&b', 'alternatif'] },
  { id: 'a-gojira', name: 'Gojira', genres: ['metal'] },
  { id: 'a-tool', name: 'Tool', genres: ['metal', 'alternatif'] },
  { id: 'a-sezen', name: 'Sezen Aksu', genres: ['pop'] },
]

export const TRACKS: Track[] = [
  { id: 't-1', title: 'Ali Desidero', artistId: 'a-mfo', durationSec: 254 },
  { id: 't-2', title: 'Gülpembe', artistId: 'a-baris', durationSec: 268 },
  { id: 't-3', title: 'Estarabim', artistId: 'a-erkin', durationSec: 231 },
  { id: 't-4', title: 'Her Şeyi Yak', artistId: 'a-duman', durationSec: 245 },
  { id: 't-5', title: 'Cambaz', artistId: 'a-mor', durationSec: 222 },
  { id: 't-6', title: 'Nerdesin Aşkım', artistId: 'a-adamlar', durationSec: 287 },
  { id: 't-7', title: 'Yürek', artistId: 'a-madrigal', durationSec: 213 },
  { id: 't-8', title: 'İstikrarlı Hayal Hakikattir', artistId: 'a-gaye', durationSec: 302 },
  { id: 't-9', title: 'Goca Dünya', artistId: 'a-altin', durationSec: 261 },
  { id: 't-10', title: 'Sana Bir Şeyler Olmuş', artistId: 'a-jakuzi', durationSec: 244 },
  { id: 't-11', title: 'Weird Fishes', artistId: 'a-radiohead', durationSec: 318 },
  { id: 't-12', title: 'Let It Happen', artistId: 'a-tameimpala', durationSec: 467 },
  { id: 't-13', title: 'Do I Wanna Know?', artistId: 'a-arctic', durationSec: 272 },
  { id: 't-14', title: 'Kerala', artistId: 'a-bonobo', durationSec: 235 },
  { id: 't-15', title: 'Two Thousand and Seventeen', artistId: 'a-fourtet', durationSec: 292 },
  { id: 't-16', title: 'Xtal', artistId: 'a-aphex', durationSec: 292 },
  { id: 't-17', title: 'Feather', artistId: 'a-nujabes', durationSec: 277 },
  { id: 't-18', title: 'Money Trees', artistId: 'a-kendrick', durationSec: 386 },
  { id: 't-19', title: 'Geceler', artistId: 'a-ezhel', durationSec: 198 },
  { id: 't-20', title: 'Bir Pesimistin Gözyaşları', artistId: 'a-sagopa', durationSec: 341 },
  { id: 't-21', title: 'Naima', artistId: 'a-coltrane', durationSec: 262 },
  { id: 't-22', title: 'Moanin’', artistId: 'a-mingus', durationSec: 596 },
  { id: 't-23', title: 'Beautiful Tango', artistId: 'a-hindi', durationSec: 224 },
  { id: 't-24', title: 'Gymnopédie No. 1', artistId: 'a-erik', durationSec: 208 },
  { id: 't-25', title: 'Says', artistId: 'a-nils', durationSec: 528 },
  { id: 't-26', title: 'Good Days', artistId: 'a-sza', durationSec: 279 },
  { id: 't-27', title: 'Ivy', artistId: 'a-frank', durationSec: 249 },
  { id: 't-28', title: 'Stranded', artistId: 'a-gojira', durationSec: 259 },
  { id: 't-29', title: 'Schism', artistId: 'a-tool', durationSec: 407 },
  { id: 't-30', title: 'Firuze', artistId: 'a-sezen', durationSec: 284 },
]

const ARTIST_BY_ID = new Map(ARTISTS.map((a) => [a.id, a]))
const TRACK_BY_ID = new Map(TRACKS.map((t) => [t.id, t]))

export function artist(id: string): Artist {
  const found = ARTIST_BY_ID.get(id)
  if (!found) throw new Error(`Unknown artist: ${id}`)
  return found
}

export function track(id: string): Track {
  const found = TRACK_BY_ID.get(id)
  if (!found) throw new Error(`Unknown track: ${id}`)
  return found
}

export function trackArtistName(id: string): string {
  return artist(track(id).artistId).name
}

export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
