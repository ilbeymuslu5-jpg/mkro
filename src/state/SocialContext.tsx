import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { PEOPLE, person, type Person } from '@/data/people'
import { compatibility, MUTUAL_LIKE_SCORE } from '@/lib/match'
import { tuneInOrder, type LiveListener } from '@/lib/presence'
import { useAuth } from './AuthContext'
import { useProfile } from './ProfileContext'

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

/**
 * How often another listener lands on the board.
 *
 * The first card arrives one full interval in, not immediately, so the count
 * after a minute is exactly six rather than seven.
 */
export const LIVE_BOARD_INTERVAL_MS = 10_000

/** What the free tier gets per day; Platinum lifts both. */
export const FREE_DAILY_SWIPES = 10
export const FREE_UNDOS = 1

const SWIPE_COUNT_KEY = 'makromusic:swipes'
const UNDO_COUNT_KEY = 'makromusic:undos'

interface SwipeRecord {
  personId: string
  direction: 'like' | 'pass'
  /** Whether the like created a match, so undo can take it back too. */
  createdMatch: boolean
  listener: LiveListener
}

interface SocialState {
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
  liveBoard: LiveListener[]
  /** Everyone the current track can still supply, for the exhausted state. */
  liveExhausted: boolean
  /** People who already liked you — liking them back matches instantly. */
  admirers: string[]
  /** Swipes used today. Free accounts are capped; Platinum is not. */
  swipesToday: number
  swipeLimit: number
  undosLeft: number
  canUndo: boolean
  undoLast: () => void
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

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Daily allowances live in storage, not just in memory. Keeping the undo count
 * in memory alone let a reload hand back a spent undo, while the swipe cap
 * survived — two allowances behaving differently for no reason a user could
 * see, and a one-keypress way around the paid one.
 */
function readDailyCount(key: string): number {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return 0
    const parsed = JSON.parse(raw) as { day: string; count: number }
    // A stored count from yesterday is not today's allowance.
    return parsed.day === todayKey() ? parsed.count : 0
  } catch {
    return 0
  }
}

function writeDailyCount(key: string, count: number): void {
  try {
    localStorage.setItem(key, JSON.stringify({ day: todayKey(), count }))
  } catch {
    // Storage disabled — the cap then only holds for this session.
  }
}

const readSwipeCount = () => readDailyCount(SWIPE_COUNT_KEY)
const writeSwipeCount = (count: number) => writeDailyCount(SWIPE_COUNT_KEY, count)
const readUndoCount = () => readDailyCount(UNDO_COUNT_KEY)
const writeUndoCount = (count: number) => writeDailyCount(UNDO_COUNT_KEY, count)

export function SocialProvider({ children }: { children: ReactNode }) {
  const { me, nowPlaying } = useAuth()
  const { plan } = useProfile()

  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({})
  const [matchedIds, setMatchedIds] = useState<string[]>(SEED_MATCHES)
  const [blockedIds, setBlockedIds] = useState<string[]>([])
  const [conversations, setConversations] = useState<Record<string, Conversation>>(SEED_CONVERSATIONS)
  const [celebrating, setCelebrating] = useState<string | null>(null)
  const [liveOn, setLiveOn] = useState(true)
  const [liveBoard, setLiveBoard] = useState<LiveListener[]>([])
  const [liveSeen, setLiveSeen] = useState<string[]>([])
  const [history, setHistory] = useState<SwipeRecord[]>([])
  const [swipesToday, setSwipesToday] = useState<number>(readSwipeCount)
  const [undosUsed, setUndosUsed] = useState<number>(readUndoCount)

  const platinum = plan === 'platinum'
  const swipeLimit = platinum ? Number.POSITIVE_INFINITY : FREE_DAILY_SWIPES
  const undosLeft = platinum ? Number.POSITIVE_INFINITY : Math.max(0, FREE_UNDOS - undosUsed)

  const visiblePeople = useMemo(
    () => PEOPLE.filter((p) => !blockedIds.includes(p.id)),
    [blockedIds],
  )

  const trackId = nowPlaying?.trackId ?? null

  /** People the current track can still supply, in tune-in order. */
  const pending = useMemo(() => {
    if (!trackId) return []
    const onBoard = new Set(liveBoard.map((entry) => entry.personId))
    return tuneInOrder(trackId, visiblePeople).filter(
      (id) => !onBoard.has(id) && !liveSeen.includes(id) && !matchedIds.includes(id),
    )
  }, [trackId, visiblePeople, liveBoard, liveSeen, matchedIds])

  /**
   * People who already liked you. This is not a separate roll of the dice —
   * it is the same rule `like` uses to decide reciprocation, surfaced early.
   * Liking one of them back therefore always matches.
   */
  const admirers = useMemo(() => {
    if (!me) return []
    return visiblePeople
      .filter(
        (p) =>
          !matchedIds.includes(p.id) &&
          verdicts[p.id] !== 'passed' &&
          compatibility(me, p).score >= MUTUAL_LIKE_SCORE,
      )
      .sort((a, b) => compatibility(me, b).score - compatibility(me, a).score)
      .map((p) => p.id)
  }, [me, visiblePeople, matchedIds, verdicts])

  /*
    Read through a ref inside the loop below. Depending on these directly would
    restart the interval on every swipe, dealing the next card instantly instead
    of on the ten-second beat.
  */
  const latest = useRef({ visiblePeople, liveSeen, matchedIds })
  latest.current = { visiblePeople, liveSeen, matchedIds }

  // Deal one person onto the board on every tick while the radar is on.
  useEffect(() => {
    if (!liveOn || !trackId) return

    const deal = () => {
      const { visiblePeople: pool, liveSeen: seen, matchedIds: matched } = latest.current
      setLiveBoard((current) => {
        const onBoard = new Set(current.map((entry) => entry.personId))
        const next = tuneInOrder(trackId, pool).find(
          (id) => !onBoard.has(id) && !seen.includes(id) && !matched.includes(id),
        )
        return next ? [...current, { personId: next, startedAt: Date.now() }] : current
      })
    }

    // No card on tick zero: one interval in means six after a minute, not seven.
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
      if (swipesToday >= swipeLimit) return

      const listener = liveBoard.find((entry) => entry.personId === personId)
      const willMatch =
        direction === 'like' &&
        me !== null &&
        compatibility(me, person(personId)).score >= MUTUAL_LIKE_SCORE

      setLiveBoard((current) => current.filter((entry) => entry.personId !== personId))
      setLiveSeen((current) => (current.includes(personId) ? current : [...current, personId]))
      setHistory((current) => [
        ...current,
        {
          personId,
          direction,
          createdMatch: willMatch,
          listener: listener ?? { personId, startedAt: Date.now() },
        },
      ])
      setSwipesToday((current) => {
        const next = current + 1
        writeSwipeCount(next)
        return next
      })

      if (direction === 'like') like(personId)
      else pass(personId)
    },
    [like, pass, liveBoard, me, swipesToday, swipeLimit],
  )

  /**
   * Puts the last swipe back. It has to unwind everything that swipe did —
   * the verdict, a match it created, the celebration, and the spent allowance —
   * otherwise undo would silently leave a match you never agreed to.
   */
  const undoLast = useCallback(() => {
    if (history.length === 0 || undosLeft <= 0) return

    const last = history[history.length - 1]
    setHistory((current) => current.slice(0, -1))

    setVerdicts((current) => {
      const next = { ...current }
      delete next[last.personId]
      return next
    })

    if (last.createdMatch) {
      setMatchedIds((current) => current.filter((id) => id !== last.personId))
      setConversations((current) => {
        const next = { ...current }
        delete next[last.personId]
        return next
      })
      setCelebrating((current) => (current === last.personId ? null : current))
    }

    setLiveSeen((current) => current.filter((id) => id !== last.personId))
    setLiveBoard((current) =>
      current.some((entry) => entry.personId === last.personId)
        ? current
        : [last.listener, ...current],
    )
    setSwipesToday((current) => {
      const next = Math.max(0, current - 1)
      writeSwipeCount(next)
      return next
    })
    if (!platinum) {
      setUndosUsed((current) => {
        const next = current + 1
        writeUndoCount(next)
        return next
      })
    }
  }, [history, undosLeft, platinum])

  const resetAll = useCallback(() => {
    setVerdicts({})
    setMatchedIds(SEED_MATCHES)
    setBlockedIds([])
    setConversations(SEED_CONVERSATIONS)
    setCelebrating(null)
    setLiveOn(true)
    setLiveBoard([])
    setLiveSeen([])
    setHistory([])
    setUndosUsed(0)
    writeUndoCount(0)
    setSwipesToday(0)
    writeSwipeCount(0)
  }, [])

  const value = useMemo<SocialState>(
    () => ({
      visiblePeople,
      verdicts,
      matchedIds,
      blockedIds,
      conversations,
      celebrating,
      liveOn,
      liveBoard,
      liveExhausted: pending.length === 0,
      admirers,
      swipesToday,
      swipeLimit,
      undosLeft,
      canUndo: history.length > 0 && undosLeft > 0 && swipesToday > 0,
      undoLast,
      like,
      pass,
      block,
      unblock,
      dismissCelebration: () => setCelebrating(null),
      sendMessage,
      toggleLiveMatch,
      swipeLive,
      resetAll,
    }),
    [
      visiblePeople,
      verdicts,
      matchedIds,
      blockedIds,
      conversations,
      celebrating,
      liveOn,
      liveBoard,
      pending,
      admirers,
      swipesToday,
      swipeLimit,
      undosLeft,
      history,
      undoLast,
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
