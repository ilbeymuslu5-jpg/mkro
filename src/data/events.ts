export interface MusicEvent {
  id: string
  title: string
  venue: string
  city: string
  date: string
  /** Artist ids that make this event relevant to a taste profile. */
  artistIds: string[]
  /** Matched people already going — the social hook. */
  attendeeIds: string[]
  priceLabel: string
}

export const EVENTS: MusicEvent[] = [
  {
    id: 'e-1',
    title: 'Gaye Su Akyol',
    venue: 'Zorlu PSM',
    city: 'İstanbul',
    date: '2026-09-12T21:00:00',
    artistIds: ['a-gaye', 'a-altin'],
    attendeeIds: ['p-8', 'p-3'],
    priceLabel: '₺850',
  },
  {
    id: 'e-2',
    title: 'Adamlar',
    venue: 'Dorock XL',
    city: 'İstanbul',
    date: '2026-09-20T22:00:00',
    artistIds: ['a-adamlar', 'a-madrigal'],
    attendeeIds: ['p-1', 'p-10'],
    priceLabel: '₺600',
  },
  {
    id: 'e-3',
    title: 'Bonobo — DJ Set',
    venue: 'Klein Phönix',
    city: 'İstanbul',
    date: '2026-10-04T23:30:00',
    artistIds: ['a-bonobo', 'a-fourtet'],
    attendeeIds: ['p-2', 'p-6'],
    priceLabel: '₺1.200',
  },
  {
    id: 'e-4',
    title: 'Altın Gün',
    venue: 'İzmir Kültürpark',
    city: 'İzmir',
    date: '2026-10-18T21:30:00',
    artistIds: ['a-altin', 'a-erkin'],
    attendeeIds: ['p-10', 'p-2'],
    priceLabel: '₺700',
  },
  {
    id: 'e-5',
    title: 'Jazz Gecesi: Hindi Zahra',
    venue: 'Nardis Jazz Club',
    city: 'İstanbul',
    date: '2026-11-02T21:00:00',
    artistIds: ['a-hindi', 'a-coltrane'],
    attendeeIds: ['p-4'],
    priceLabel: '₺950',
  },
  {
    id: 'e-6',
    title: 'Duman',
    venue: 'Ankara Congresium',
    city: 'Ankara',
    date: '2026-11-15T20:30:00',
    artistIds: ['a-duman', 'a-mor'],
    attendeeIds: ['p-5', 'p-9'],
    priceLabel: '₺780',
  },
]

const DATE_FORMAT = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  weekday: 'short',
})

const TIME_FORMAT = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' })

export function formatEventDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso))
}

export function formatEventTime(iso: string): string {
  return TIME_FORMAT.format(new Date(iso))
}
