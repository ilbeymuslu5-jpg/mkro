import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { PEOPLE, person, type Person } from '@/data/people'
import { compatibility, MUTUAL_LIKE_SCORE } from '@/lib/match'
import { liveCandidates, type LiveCandidate } from '@/lib/liveBoard'
import { useAuth } from './AuthContext'

export interface Message {
  id: string
  from: 'me' | 'them'
  /** A text message, a shared track, or a track generated for the pair. */
  text?: string
  trackId?: string
  generated?: GeneratedTrack
  sentAt: number
}

export interface GeneratedTrack {
  title: string
  /** The two people's shared ground, shown as the prompt that produced it. */
  basedOn: string
  durationSec: number
  mood: string
}

export interface Conversation {
  personId: string
  messages: Message[]
}

type Verdict = 'liked' | 'passed'

/** How often a new person is loaded onto the live board. */
export const LIVE_BOARD_INTERVAL_MS = 10_000

interface SocialState {
  /** People not yet swiped, best match first, blocked users removed. */
  queue: string[]
  /** Everyone still visible to you. */
  visiblePeople: Person[]
  verdicts: Record<string, Verdict>
  matchedIds: string[]
  blockedIds: string[]
  conversations: Record<string, Conversation>
  celebrating: string | null
  /** True while the board is pulling people in. */
  liveOn: boolean
  /** People loaded onto the board and not yet swiped, oldest first. */
  liveBoard: LiveCandidate[]
  /** Everyone the current track can still supply, for the exhausted state. */
  liveExhausted: boolean
  like: (personId: string) => void
  pass: (personId: string) => void
  block: (personId: string) => void
  unblock: (personId: string) => void
  dismissCelebration: () => void
  sendMessage: (
    personId: string,
    payload: { text?: string; trackId?: string; generated?: GeneratedTrack },
  ) => void
  toggleLiveMatch: () => void
  /** Decide on the top board card. Likes go through the normal match rules. */
  swipeLive: (personId: string, direction: 'like' | 'pass') => void
  resetQueue: () => void
  resetAll: () => void
}

const SocialContext = createContext<SocialState | null>(null)

const SEED_MATCHES = ['p-1', 'p-8']

const SEED_CONVERSATIONS: Record<string, Conversation> = {
  'p-1': {
    personId: 'p-1',
    messages: [
      { id: 'm1', from: 'them', text: 'Weird Fishes senin de bir numaran mı? İnanmıyorum.', sentAt: Date.now() - 5_400_000 },
      { id: 'm2', from: 'me', text: 'O şarkıyla ilgili konuşabilecek birini arıyordum.', sentAt: Date.now() - 5_200_000 },
      { id: 'm3', from: 'them', trackId: 't-12', sentAt: Date.now() - 5_000_000 },
      { id: 'm4', from: 'them', text: 'Bunu da dene, aynı damardan.', sentAt: Date.now() - 4_990_000 },
    ],
  },
  'p-8': {
    personId: 'p-8',
    messages: [
      { id: 'm5', from: 'them', text: 'Cuma Gaye Su Akyol var, gidiyor musun?', sentAt: Date.now() - 900_000 },
    ],
  },
}

export function SocialProvider({ children }: { children: ReactNode }) {
  const { me, nowPlaying } = useAuth()

  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({})
  const [matchedIds, setMatchedIds] = useState<string[]>(SEED_MATCHES)
  const [blockedIds, setBlockedIds] = useState<string[]>([])
  const [conversations, setConversations] = useState<Record<string, Conversation>>(SEED_CONVERSATIONS)
  const [celebrating, setCelebrating] = useState<string | null>(null)
  const [liveOn, setLiveOn] = useState(false)
  const [liveBoard, setLiveBoard] = useState<LiveCandidate[]>([])
  const [liveSeen, setLiveSeen] = useState<string[]>([])

  const visiblePeople = useMemo(
    () => PEOPLE.filter((p) => !blockedIds.includes(p.id)),
    [blockedIds],
  )

  const queue = useMemo(() => {
    if (!me) return []
    return visiblePeople
      .filter((p) => !verdicts[p.id] && !matchedIds.includes(p.id))
      .map((p) => ({ id: p.id, score: compatibility(me, p).score }))
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.id)
  }, [me, visiblePeople, verdicts, matchedIds])

  const trackId = nowPlaying?.trackId ?? null

  /** Candidates for the current track that have not been dealt yet. */
  const pending = useMemo(() => {
    if (!trackId) return []
    const onBoard = new Set(liveBoard.map((entry) => entry.personId))
    return liveCandidates(trackId, visiblePeople).filter(
      (entry) => !onBoard.has(entry.personId) && !liveSeen.includes(entry.personId),
    )
  }, [trackId, visiblePeople, liveBoard, liveSeen])

  /*
    Read through a ref inside the loop below. Depending on these directly would
    restart the interval on every swipe, dealing the next card instantly instead
    of on the ten-second beat.
  */
  const latest = useRef({ visiblePeople, liveSeen })
  latest.current = { visiblePeople, liveSeen }

  // Deal one person onto the board on every tick while the radar is on.
  useEffect(() => {
    if (!liveOn || !trackId) return

    const deal = () => {
      const { visiblePeople: pool, liveSeen: seen } = latest.current
      setLiveBoard((current) => {
        const onBoard = new Set(current.map((entry) => entry.personId))
        const next = liveCandidates(trackId, pool).find(
          (entry) => !onBoard.has(entry.personId) && !seen.includes(entry.personId),
        )
        return next ? [...current, next] : current
      })
    }

    // First card lands immediately; the rest arrive on the interval.
    deal()
    const id = window.setInterval(deal, LIVE_BOARD_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [liveOn, trackId])

  // A new track resets the board — the old cards were about the old song.
  useEffect(() => {
    setLiveBoard([])
    setLiveSeen([])
  }, [trackId])

  const like = useCallback(
    (personId: string) => {
      setVerdicts((current) => ({ ...current, [personId]: 'liked' }))
      if (!me) return
      // High-affinity people like you back — that is the whole promise of the app.
      if (compatibility(me, person(personId)).score < MUTUAL_LIKE_SCORE) return
      setMatchedIds((current) => (current.includes(personId) ? current : [...current, personId]))
      setCelebrating(personId)
    },
    [me],
  )

  const pass = useCallback((personId: string) => {
    setVerdicts((current) => ({ ...current, [personId]: 'passed' }))
  }, [])

  const block = useCallback((personId: string) => {
    setBlockedIds((current) => (current.includes(personId) ? current : [...current, personId]))
    // Blocking ends the relationship: the match, the thread and the swipe verdict.
    setMatchedIds((current) => current.filter((id) => id !== personId))
    setConversations((current) => {
      const next = { ...current }
      delete next[personId]
      return next
    })
    setCelebrating((current) => (current === personId ? null : current))
    setLiveBoard((current) => current.filter((entry) => entry.personId !== personId))
  }, [])

  const unblock = useCallback((personId: string) => {
    setBlockedIds((current) => current.filter((id) => id !== personId))
  }, [])

  const sendMessage = useCallback<SocialState['sendMessage']>((personId, payload) => {
    if (!payload.text?.trim() && !payload.trackId && !payload.generated) return
    setConversations((current) => {
      const existing = current[personId] ?? { personId, messages: [] }
      const message: Message = {
        id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        from: 'me',
        text: payload.text?.trim() || undefined,
        trackId: payload.trackId,
        generated: payload.generated,
        sentAt: Date.now(),
      }
      return { ...current, [personId]: { ...existing, messages: [...existing.messages, message] } }
    })
  }, [])

  const toggleLiveMatch = useCallback(() => {
    setLiveOn((current) => {
      if (current) setLiveBoard([])
      return !current
    })
  }, [])

  const swipeLive = useCallback(
    (personId: string, direction: 'like' | 'pass') => {
      setLiveBoard((current) => current.filter((entry) => entry.personId !== personId))
      setLiveSeen((current) => (current.includes(personId) ? current : [...current, personId]))
      if (direction === 'like') like(personId)
      else pass(personId)
    },
    [like, pass],
  )

  const resetAll = useCallback(() => {
    setVerdicts({})
    setMatchedIds(SEED_MATCHES)
    setBlockedIds([])
    setConversations(SEED_CONVERSATIONS)
    setCelebrating(null)
    setLiveOn(false)
    setLiveBoard([])
    setLiveSeen([])
  }, [])

  const value = useMemo<SocialState>(
    () => ({
      queue,
      visiblePeople,
      verdicts,
      matchedIds,
      blockedIds,
      conversations,
      celebrating,
      liveOn,
      liveBoard,
      liveExhausted: pending.length === 0,
      like,
      pass,
      block,
      unblock,
      dismissCelebration: () => setCelebrating(null),
      sendMessage,
      toggleLiveMatch,
      swipeLive,
      resetQueue: () => setVerdicts({}),
      resetAll,
    }),
    [
      queue,
      visiblePeople,
      verdicts,
      matchedIds,
      blockedIds,
      conversations,
      celebrating,
      liveOn,
      liveBoard,
      pending,
      like,
      pass,
      block,
      unblock,
      sendMessage,
      toggleLiveMatch,
      swipeLive,
      resetAll,
    ],
  )

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>
}

export function useSocial(): SocialState {
  const context = useContext(SocialContext)
  if (!context) throw new Error('useSocial must be used inside SocialProvider')
  return context
}
