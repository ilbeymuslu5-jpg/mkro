import type { Genre } from './catalog'

export interface Person {
  id: string
  name: string
  age: number
  city: string
  bio: string
  /** Ordered best-first — position is weighted in the compatibility score. */
  topArtistIds: string[]
  topTrackIds: string[]
  genres: Genre[]
  /** The track pinned to the profile — makromusic's "şu an çalan" slot. */
  anthemTrackId: string
  online: boolean
}

export const ME: Person = {
  id: 'me',
  name: 'Sen',
  age: 27,
  city: 'İstanbul',
  bio: 'Gece yarısı kulaklık takıp şehirde yürüyen tip. Plak biriktiriyorum.',
  topArtistIds: ['a-radiohead', 'a-adamlar', 'a-tameimpala', 'a-bonobo', 'a-altin'],
  topTrackIds: ['t-11', 't-6', 't-12', 't-14', 't-9'],
  genres: ['indie', 'alternatif', 'elektronik', 'anadolu-rock'],
  anthemTrackId: 't-11',
  online: true,
}

export const PEOPLE: Person[] = [
  {
    id: 'p-1',
    name: 'Deniz Aksoy',
    age: 26,
    city: 'İstanbul',
    bio: 'Kadıköy’de plakçı geziyorum. Konser arkadaşı arıyorum, tercihen ön sıra sevenlerden.',
    topArtistIds: ['a-radiohead', 'a-tameimpala', 'a-arctic', 'a-adamlar', 'a-jakuzi'],
    topTrackIds: ['t-11', 't-12', 't-13', 't-6', 't-10'],
    genres: ['indie', 'alternatif', 'rock'],
    anthemTrackId: 't-12',
    online: true,
  },
  {
    id: 'p-2',
    name: 'Ece Yılmaz',
    age: 24,
    city: 'İzmir',
    bio: 'Sabah kahvesi + Nils Frahm. Akşamları tam tersi.',
    topArtistIds: ['a-nils', 'a-bonobo', 'a-fourtet', 'a-erik', 'a-aphex'],
    topTrackIds: ['t-25', 't-14', 't-15', 't-24', 't-16'],
    genres: ['elektronik', 'klasik', 'lo-fi'],
    anthemTrackId: 't-25',
    online: false,
  },
  {
    id: 'p-3',
    name: 'Kerem Doğan',
    age: 29,
    city: 'Ankara',
    bio: 'Anadolu rock kazısı yapıyorum. 70’ler 45’likleri konusunda konuşabiliriz.',
    topArtistIds: ['a-erkin', 'a-baris', 'a-altin', 'a-gaye', 'a-mfo'],
    topTrackIds: ['t-3', 't-2', 't-9', 't-8', 't-1'],
    genres: ['anadolu-rock', 'rock', 'indie'],
    anthemTrackId: 't-3',
    online: true,
  },
  {
    id: 'p-4',
    name: 'Zeynep Kaya',
    age: 25,
    city: 'İstanbul',
    bio: 'Jazz kulübü müdavimi. Salı akşamları Nardis.',
    topArtistIds: ['a-coltrane', 'a-mingus', 'a-hindi', 'a-frank', 'a-sza'],
    topTrackIds: ['t-21', 't-22', 't-23', 't-27', 't-26'],
    genres: ['jazz', 'r&b'],
    anthemTrackId: 't-21',
    online: false,
  },
  {
    id: 'p-5',
    name: 'Mert Aydın',
    age: 31,
    city: 'İstanbul',
    bio: 'Gitar çalıyorum, grup kuruyorum, bir türlü prova yapamıyoruz.',
    topArtistIds: ['a-duman', 'a-mor', 'a-tool', 'a-gojira', 'a-arctic'],
    topTrackIds: ['t-4', 't-5', 't-29', 't-28', 't-13'],
    genres: ['rock', 'metal', 'alternatif'],
    anthemTrackId: 't-29',
    online: true,
  },
  {
    id: 'p-6',
    name: 'Selin Öztürk',
    age: 23,
    city: 'Eskişehir',
    bio: 'Lo-fi açıp ders çalışıyorum, sonra Nujabes’e ağlıyorum.',
    topArtistIds: ['a-nujabes', 'a-bonobo', 'a-fourtet', 'a-frank', 'a-tameimpala'],
    topTrackIds: ['t-17', 't-14', 't-15', 't-27', 't-12'],
    genres: ['lo-fi', 'hip-hop', 'elektronik'],
    anthemTrackId: 't-17',
    online: true,
  },
  {
    id: 'p-7',
    name: 'Barış Şen',
    age: 28,
    city: 'İstanbul',
    bio: 'Rap dinlerim, bar konuşması yaparım. Punchline tartışması serbest.',
    topArtistIds: ['a-ezhel', 'a-sagopa', 'a-kendrick', 'a-nujabes', 'a-frank'],
    topTrackIds: ['t-19', 't-20', 't-18', 't-17', 't-27'],
    genres: ['hip-hop', 'r&b'],
    anthemTrackId: 't-18',
    online: false,
  },
  {
    id: 'p-8',
    name: 'İlayda Çetin',
    age: 27,
    city: 'İstanbul',
    bio: 'Gaye Su Akyol konserinde tanıştığımız kişi ben olabilirim.',
    topArtistIds: ['a-gaye', 'a-altin', 'a-jakuzi', 'a-madrigal', 'a-adamlar'],
    topTrackIds: ['t-8', 't-9', 't-10', 't-7', 't-6'],
    genres: ['indie', 'anadolu-rock', 'alternatif'],
    anthemTrackId: 't-8',
    online: true,
  },
  {
    id: 'p-9',
    name: 'Can Demir',
    age: 30,
    city: 'Bursa',
    bio: 'Sezen dinlemeyen biriyle anlaşamam, kusura bakma.',
    topArtistIds: ['a-sezen', 'a-mfo', 'a-baris', 'a-madrigal', 'a-duman'],
    topTrackIds: ['t-30', 't-1', 't-2', 't-7', 't-4'],
    genres: ['pop', 'anadolu-rock', 'rock'],
    anthemTrackId: 't-30',
    online: false,
  },
  {
    id: 'p-10',
    name: 'Aslı Korkmaz',
    age: 22,
    city: 'İzmir',
    bio: 'Vinyl > streaming. Tartışmaya açığım ama fikrim değişmez.',
    topArtistIds: ['a-arctic', 'a-tameimpala', 'a-radiohead', 'a-jakuzi', 'a-madrigal'],
    topTrackIds: ['t-13', 't-12', 't-11', 't-10', 't-7'],
    genres: ['indie', 'rock', 'alternatif'],
    anthemTrackId: 't-13',
    online: true,
  },
]

export const PEOPLE_BY_ID = new Map<string, Person>([
  [ME.id, ME],
  ...PEOPLE.map((p) => [p.id, p] as const),
])

export function person(id: string): Person {
  const found = PEOPLE_BY_ID.get(id)
  if (!found) throw new Error(`Unknown person: ${id}`)
  return found
}
