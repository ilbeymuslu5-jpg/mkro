import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export interface Comment {
  id: string
  authorId: string
  text: string
  sentAt: number
}

export interface Post {
  id: string
  /** 'me' for your own posts, otherwise a Person id. */
  authorId: string
  trackId: string
  text: string
  createdAt: number
  /** Ids of everyone who liked it; 'me' included when you have. */
  likedBy: string[]
  comments: Comment[]
}

interface FeedState {
  posts: Post[]
  createPost: (input: { trackId: string; text: string }) => void
  toggleLike: (postId: string) => void
  addComment: (postId: string, text: string) => void
  deletePost: (postId: string) => void
  resetFeed: () => void
}

const FeedContext = createContext<FeedState | null>(null)

const minutes = (n: number) => Date.now() - n * 60_000

const SEED_POSTS: Post[] = [
  {
    id: 'post-1',
    authorId: 'p-1',
    trackId: 't-12',
    text: 'Bu şarkının 3. dakikasında olan şeyi hâlâ atlatamadım. Kulaklıkla dinleyin, hoparlörle olmuyor.',
    createdAt: minutes(24),
    likedBy: ['p-10', 'p-6'],
    comments: [
      { id: 'c-1', authorId: 'p-10', text: 'Aynen, o geçiş bambaşka.', sentAt: minutes(19) },
    ],
  },
  {
    id: 'post-2',
    authorId: 'p-3',
    trackId: 't-3',
    text: '45’liğini buldum nihayet. Kapak biraz yıpranmış ama plak tertemiz çıktı.',
    createdAt: minutes(96),
    likedBy: ['p-8', 'p-9', 'p-1'],
    comments: [
      { id: 'c-2', authorId: 'p-8', text: 'Nereden buldun? Ben aylardır arıyorum.', sentAt: minutes(80) },
      { id: 'c-3', authorId: 'p-3', text: 'Kadıköy, isim vermeyeyim, stok bitiyor.', sentAt: minutes(76) },
    ],
  },
  {
    id: 'post-3',
    authorId: 'p-6',
    trackId: 't-17',
    text: 'Ders çalışırken açtım, iki saat sonra hâlâ aynı şarkıdayım. Nujabes böyle bir şey.',
    createdAt: minutes(190),
    likedBy: ['p-7'],
    comments: [],
  },
  {
    id: 'post-4',
    authorId: 'p-4',
    trackId: 't-21',
    text: 'Salı akşamı Nardis’te canlı dinledim. Kayıttan çok farklı, daha yavaş çalıyorlar.',
    createdAt: minutes(320),
    likedBy: ['p-7', 'p-2'],
    comments: [
      { id: 'c-4', authorId: 'p-2', text: 'Bir dahakine haber ver, geliyorum.', sentAt: minutes(300) },
    ],
  },
]

export function FeedProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(SEED_POSTS)

  const createPost = useCallback(({ trackId, text }: { trackId: string; text: string }) => {
    const body = text.trim()
    if (!body) return
    setPosts((current) => [
      {
        id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        authorId: 'me',
        trackId,
        text: body,
        createdAt: Date.now(),
        likedBy: [],
        comments: [],
      },
      ...current,
    ])
  }, [])

  const toggleLike = useCallback((postId: string) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              likedBy: post.likedBy.includes('me')
                ? post.likedBy.filter((id) => id !== 'me')
                : [...post.likedBy, 'me'],
            }
          : post,
      ),
    )
  }, [])

  const addComment = useCallback((postId: string, text: string) => {
    const body = text.trim()
    if (!body) return
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [
                ...post.comments,
                {
                  id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                  authorId: 'me',
                  text: body,
                  sentAt: Date.now(),
                },
              ],
            }
          : post,
      ),
    )
  }, [])

  const deletePost = useCallback((postId: string) => {
    setPosts((current) => current.filter((post) => post.id !== postId))
  }, [])

  const value = useMemo<FeedState>(
    () => ({
      posts,
      createPost,
      toggleLike,
      addComment,
      deletePost,
      resetFeed: () => setPosts(SEED_POSTS),
    }),
    [posts, createPost, toggleLike, addComment, deletePost],
  )

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>
}

export function useFeed(): FeedState {
  const context = useContext(FeedContext)
  if (!context) throw new Error('useFeed must be used inside FeedProvider')
  return context
}
