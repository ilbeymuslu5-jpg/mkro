import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ME, PEOPLE, person } from '@/data/people'
import { compatibility, MUTUAL_LIKE_SCORE } from '@/lib/match'

export interface Message {
  id: string
  from: 'me' | 'them'
  /** Either a text message or a shared track — never both. */
  text?: string
  trackId?: string
  sentAt: number
}

export interface Conversation {
  personId: string
  messages: Message[]
}

type Verdict = 'liked' | 'passed'

interface SocialState {
  /** People not yet swiped, best match first. */
  queue: string[]
  verdicts: Record<string, Verdict>
  matchedIds: string[]
  conversations: Record<string, Conversation>
  /** Set when a like turns into a mutual match, so the UI can celebrate it. */
  celebrating: string | null
  like: (personId: string) => void
  pass: (personId: string) => void
  dismissCelebration: () => void
  sendMessage: (personId: string, payload: { text?: string; trackId?: string }) => void
  resetQueue: () => void
}

const SocialContext = createContext<SocialState | null>(null)

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
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({})
  const [matchedIds, setMatchedIds] = useState<string[]>(['p-1', 'p-8'])
  const [conversations, setConversations] = useState<Record<string, Conversation>>(SEED_CONVERSATIONS)
  const [celebrating, setCelebrating] = useState<string | null>(null)

  const queue = useMemo(
    () =>
      PEOPLE.filter((p) => !verdicts[p.id] && !matchedIds.includes(p.id))
        .map((p) => ({ id: p.id, score: compatibility(ME, p).score }))
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.id),
    [verdicts, matchedIds],
  )

  const like = useCallback((personId: string) => {
    setVerdicts((current) => ({ ...current, [personId]: 'liked' }))
    // High-affinity people like you back — that is the whole promise of the app.
    const mutual = compatibility(ME, person(personId)).score >= MUTUAL_LIKE_SCORE
    if (!mutual) return
    setMatchedIds((current) => (current.includes(personId) ? current : [...current, personId]))
    setCelebrating(personId)
  }, [])

  const pass = useCallback((personId: string) => {
    setVerdicts((current) => ({ ...current, [personId]: 'passed' }))
  }, [])

  const sendMessage = useCallback(
    (personId: string, payload: { text?: string; trackId?: string }) => {
      if (!payload.text?.trim() && !payload.trackId) return
      setConversations((current) => {
        const existing = current[personId] ?? { personId, messages: [] }
        const message: Message = {
          id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          from: 'me',
          text: payload.text?.trim() || undefined,
          trackId: payload.trackId,
          sentAt: Date.now(),
        }
        return { ...current, [personId]: { ...existing, messages: [...existing.messages, message] } }
      })
    },
    [],
  )

  const value = useMemo<SocialState>(
    () => ({
      queue,
      verdicts,
      matchedIds,
      conversations,
      celebrating,
      like,
      pass,
      dismissCelebration: () => setCelebrating(null),
      sendMessage,
      resetQueue: () => setVerdicts({}),
    }),
    [queue, verdicts, matchedIds, conversations, celebrating, like, pass, sendMessage],
  )

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>
}

export function useSocial(): SocialState {
  const context = useContext(SocialContext)
  if (!context) throw new Error('useSocial must be used inside SocialProvider')
  return context
}
