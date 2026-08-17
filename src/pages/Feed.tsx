import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageSquare, Music2, Send, Trash2 } from 'lucide-react'
import { Artwork, Avatar } from '@/components/Avatar'
import { PageHeader } from '@/components/PageHeader'
import { track, trackArtistName } from '@/data/catalog'
import { PEOPLE_BY_ID } from '@/data/people'
import { useFeed, type Post } from '@/state/FeedContext'
import { useMe } from '@/state/AuthContext'
import { useProfile } from '@/state/ProfileContext'
import { useSocial } from '@/state/SocialContext'
import { usePlayer } from '@/state/PlayerContext'

const RELATIVE = new Intl.RelativeTimeFormat('tr-TR', { numeric: 'auto' })

function relativeTime(timestamp: number): string {
  const minutes = Math.round((timestamp - Date.now()) / 60_000)
  if (Math.abs(minutes) < 60) return RELATIVE.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return RELATIVE.format(hours, 'hour')
  return RELATIVE.format(Math.round(hours / 24), 'day')
}

export function Feed() {
  const { posts } = useFeed()
  const { blockedIds } = useSocial()

  // Blocking someone hides everything they wrote, comments included.
  const visible = posts.filter((post) => !blockedIds.includes(post.authorId))

  return (
    <div>
      <PageHeader title="Sosyal" subtitle="Şarkılar hakkında ne konuşuluyor" />
      <Composer />

      {visible.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-border/70 bg-card p-8 text-center text-sm text-muted-foreground">
          Akış boş. İlk gönderiyi sen yaz.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {visible.map((post) => (
            <li key={post.id}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Composer() {
  const me = useMe()
  const { photo } = useProfile()
  const { createPost } = useFeed()
  const [text, setText] = useState('')
  const [trackId, setTrackId] = useState(me.topTrackIds[0])

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        createPost({ trackId, text })
        setText('')
      }}
      className="rounded-2xl border border-border/70 bg-card p-4"
    >
      <div className="flex gap-3">
        <Avatar seed="me" name={me.name} size="sm" photo={photo} />
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={2}
          placeholder="Bir şarkı hakkında ne düşünüyorsun?"
          aria-label="Gönderi metni"
          className="min-w-0 flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
        <label className="flex min-w-0 flex-1 items-center gap-2">
          <Music2 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Şarkı seç</span>
          <select
            value={trackId}
            onChange={(event) => setTrackId(event.target.value)}
            className="min-h-10 min-w-0 flex-1 rounded-lg bg-muted px-2 py-2 text-xs outline-none"
          >
            {me.topTrackIds.map((id) => (
              <option key={id} value={id}>
                {track(id).title} — {trackArtistName(id)}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={text.trim().length === 0}
          className="min-h-10 shrink-0 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition-transform duration-200 hover:scale-105 active:scale-95 disabled:scale-100 disabled:bg-muted disabled:text-muted-foreground"
        >
          Paylaş
        </button>
      </div>
    </form>
  )
}

function PostCard({ post }: { post: Post }) {
  const me = useMe()
  const { photo } = useProfile()
  const { toggleLike, addComment, deletePost } = useFeed()
  const { play, trackId: playing, isPlaying } = usePlayer()
  const [commentText, setCommentText] = useState('')
  const [showComments, setShowComments] = useState(post.comments.length > 0)

  const mine = post.authorId === 'me'
  const author = mine ? { name: me.name, id: 'me' } : PEOPLE_BY_ID.get(post.authorId)
  if (!author) return null

  const liked = post.likedBy.includes('me')
  const item = track(post.trackId)

  return (
    <article className="rounded-2xl border border-border/70 bg-card p-4">
      <header className="flex items-center gap-3">
        {mine ? (
          <Avatar seed="me" name={me.name} size="sm" photo={photo} />
        ) : (
          <Link to={`/kisi/${post.authorId}`}>
            <Avatar seed={post.authorId} name={author.name} size="sm" />
          </Link>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-resilient">
            {mine ? 'Sen' : author.name}
          </p>
          <time
            dateTime={new Date(post.createdAt).toISOString()}
            className="text-xs text-muted-foreground"
          >
            {relativeTime(post.createdAt)}
          </time>
        </div>

        {mine && (
          <button
            type="button"
            onClick={() => deletePost(post.id)}
            aria-label="Gönderiyi sil"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-destructive-bright"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        )}
      </header>

      <p className="mt-3 text-sm leading-relaxed text-resilient">{post.text}</p>

      <button
        type="button"
        onClick={() => play(post.trackId)}
        className="mt-3 flex w-full items-center gap-3 rounded-xl bg-muted/50 p-2.5 text-left transition-colors duration-200 hover:bg-muted"
        aria-label={`${item.title} çal`}
      >
        <Artwork seed={post.trackId} label={item.title} className="size-11" />
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-sm font-medium text-resilient ${
              playing === post.trackId ? 'text-accent' : ''
            }`}
          >
            {item.title}
          </span>
          <span className="block truncate text-xs text-muted-foreground text-resilient">
            {trackArtistName(post.trackId)}
            {playing === post.trackId && isPlaying ? ' · çalıyor' : ''}
          </span>
        </span>
      </button>

      <div className="mt-3 flex items-center gap-1">
        <button
          type="button"
          onClick={() => toggleLike(post.id)}
          aria-pressed={liked}
          className={`flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors duration-200 ${
            liked ? 'text-accent' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Heart className={`size-4 ${liked ? 'fill-current' : ''}`} aria-hidden="true" />
          <span className="tabular-nums">{post.likedBy.length}</span>
          <span className="sr-only">beğeni</span>
        </button>

        <button
          type="button"
          onClick={() => setShowComments((open) => !open)}
          aria-expanded={showComments}
          className="flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
        >
          <MessageSquare className="size-4" aria-hidden="true" />
          <span className="tabular-nums">{post.comments.length}</span>
          <span className="sr-only">yorum</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-3 border-t border-border/60 pt-3">
          <ul className="space-y-2.5">
            {post.comments.map((comment) => {
              const commenter =
                comment.authorId === 'me' ? { name: 'Sen' } : PEOPLE_BY_ID.get(comment.authorId)
              return (
                <li key={comment.id} className="flex gap-2.5">
                  <Avatar
                    seed={comment.authorId === 'me' ? 'me' : comment.authorId}
                    name={commenter?.name ?? '?'}
                    size="sm"
                    photo={comment.authorId === 'me' ? photo : null}
                  />
                  <div className="min-w-0 flex-1 rounded-xl bg-muted/50 px-3 py-2">
                    <p className="text-xs font-medium text-resilient">{commenter?.name ?? '?'}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-resilient">{comment.text}</p>
                  </div>
                </li>
              )
            })}
          </ul>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              addComment(post.id, commentText)
              setCommentText('')
            }}
            className="mt-3 flex items-center gap-2"
          >
            <input
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Yorum yaz…"
              aria-label="Yorum"
              className="min-h-11 min-w-0 flex-1 rounded-xl bg-muted px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={commentText.trim().length === 0}
              aria-label="Yorumu gönder"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-on-accent transition-transform duration-200 hover:scale-105 active:scale-95 disabled:scale-100 disabled:bg-muted disabled:text-muted-foreground"
            >
              <Send className="size-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      )}
    </article>
  )
}
