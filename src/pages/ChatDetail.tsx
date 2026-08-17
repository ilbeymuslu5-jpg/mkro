import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Music, Play, Send, Sparkles, Wand2 } from 'lucide-react'
import { Artwork, Avatar } from '@/components/Avatar'
import { PEOPLE_BY_ID } from '@/data/people'
import { formatDuration, track, trackArtistName } from '@/data/catalog'
import { compatibility } from '@/lib/match'
import { useSocial } from '@/state/SocialContext'
import { usePlayer } from '@/state/PlayerContext'
import { useMe } from '@/state/AuthContext'
import { generateSongFor, type GenerationStage } from '@/services/aiSong'
import type { GeneratedTrack } from '@/state/SocialContext'

const TIME = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' })

export function ChatDetail() {
  const { personId = '' } = useParams()
  const me = useMe()
  const { conversations, sendMessage, matchedIds } = useSocial()
  const [draft, setDraft] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [stage, setStage] = useState<GenerationStage | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const jobRef = useRef<{ cancel: () => void } | null>(null)

  // A job left running after navigation must not drop a track into a closed chat.
  useEffect(() => () => jobRef.current?.cancel(), [])

  const other0 = PEOPLE_BY_ID.get(personId)
  const generate = useCallback(() => {
    if (!other0 || stage !== null) return
    const job = generateSongFor(me, other0, (next) => setStage(next))
    jobRef.current = job
    job.result
      .then((generated: GeneratedTrack) => {
        sendMessage(personId, { generated })
      })
      .catch(() => {
        // Cancelled — nothing to send.
      })
      .finally(() => {
        jobRef.current = null
        setStage(null)
      })
  }, [me, other0, personId, sendMessage, stage])

  const other = PEOPLE_BY_ID.get(personId)
  const messages = conversations[personId]?.messages ?? []

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  if (!other || !matchedIds.includes(other.id)) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card p-8 text-center">
        <p className="font-display text-lg">Bu sohbet açık değil</p>
        <Link
          to="/sohbetler"
          className="mt-4 inline-block rounded-xl bg-muted px-4 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-muted/70"
        >
          Sohbetlere dön
        </Link>
      </div>
    )
  }

  const match = compatibility(me, other)

  /*
    The wrapper fills what `main` leaves over (its padding plus the bottom nav),
    so the composer sits at the bottom of the screen rather than floating
    halfway up a short conversation.
  */
  const submit = () => {
    sendMessage(other.id, { text: draft })
    setDraft('')
  }

  return (
    <div className="flex min-h-[calc(100dvh-11.5rem)] flex-col md:min-h-[calc(100dvh-9.5rem)]">
      <header className="mb-4 flex items-center gap-3 border-b border-border/60 pb-4">
        <Link
          to="/sohbetler"
          aria-label="Sohbetlere dön"
          className="-ml-2 grid size-11 place-items-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>

        <Link to={`/kisi/${other.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar seed={other.id} name={other.name} size="sm" online={other.online} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-resilient">{other.name}</span>
            <span className="block text-xs text-accent tabular-nums">%{match.score} müzik uyumu</span>
          </span>
        </Link>
      </header>

      <div className="flex-1 space-y-3">
        {messages.length === 0 && (
          <p className="mx-auto max-w-sm py-8 text-center text-sm text-balance text-muted-foreground">
            {match.headline}. İlk mesajı sen yaz.
          </p>
        )}

        {messages.map((message) => (
          <Bubble key={message.id} mine={message.from === 'me'}>
            {message.generated ? (
              <GeneratedSong generated={message.generated} />
            ) : message.trackId ? (
              <SharedTrack trackId={message.trackId} />
            ) : (
              <p className="text-sm leading-relaxed text-resilient">{message.text}</p>
            )}
            <time
              dateTime={new Date(message.sentAt).toISOString()}
              className="mt-1 block text-[10px] opacity-60"
            >
              {TIME.format(message.sentAt)}
            </time>
          </Bubble>
        ))}
        <div ref={endRef} />
      </div>

      {pickerOpen && (
        <div className="mt-4 rounded-2xl border border-border/70 bg-card p-3">
          <p className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Şarkı gönder
          </p>
          <ul className="max-h-52 space-y-0.5 overflow-y-auto">
            {me.topTrackIds.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => {
                    sendMessage(other.id, { trackId: id })
                    setPickerOpen(false)
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors duration-200 hover:bg-muted"
                >
                  <Artwork seed={id} label={track(id).title} className="size-9" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-resilient">{track(id).title}</span>
                    <span className="block truncate text-xs text-muted-foreground text-resilient">
                      {trackArtistName(id)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {stage && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-accent/50 bg-accent/5 px-4 py-3">
          <Loader2 className="size-4 shrink-0 animate-spin text-accent" aria-hidden="true" />
          <p className="min-w-0 flex-1 truncate text-sm text-accent text-resilient">{stage}…</p>
          <button
            type="button"
            onClick={() => {
              jobRef.current?.cancel()
              jobRef.current = null
              setStage(null)
            }}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
          >
            İptal
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={generate}
        disabled={stage !== null}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-accent/50 bg-accent/5 px-4 py-3 text-sm font-semibold text-accent transition-colors duration-200 hover:bg-accent/10 disabled:opacity-60"
      >
        <Wand2 className="size-4 shrink-0" aria-hidden="true" />
        Eşleşme için yapay zeka şarkısı üret
      </button>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
        className="sticky bottom-20 mt-3 flex items-center gap-2 rounded-2xl border border-border/70 bg-card p-2 md:bottom-4"
      >
        <button
          type="button"
          onClick={() => setPickerOpen((open) => !open)}
          aria-label="Şarkı gönder"
          aria-expanded={pickerOpen}
          className={`grid size-11 shrink-0 place-items-center rounded-full transition-colors duration-200 ${
            pickerOpen ? 'bg-accent text-on-accent' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Music className="size-5" aria-hidden="true" />
        </button>

        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Bir şeyler yaz…"
          aria-label="Mesaj"
          className="min-h-11 min-w-0 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
        />

        <button
          type="submit"
          disabled={draft.trim().length === 0}
          aria-label="Gönder"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-on-accent transition-all duration-200 hover:scale-105 active:scale-95 disabled:scale-100 disabled:bg-muted disabled:text-muted-foreground"
        >
          <Send className="size-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  )
}

function Bubble({ mine, children }: { mine: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 sm:max-w-[70%] ${
          mine
            ? 'rounded-br-sm bg-accent text-on-accent'
            : 'rounded-bl-sm bg-card text-card-foreground'
        }`}
      >
        {children}
      </div>
    </div>
  )
}

function SharedTrack({ trackId }: { trackId: string }) {
  const { play } = usePlayer()
  const item = track(trackId)

  return (
    <button
      type="button"
      onClick={() => play(trackId)}
      className="flex items-center gap-2.5 text-left"
      aria-label={`${item.title} çal`}
    >
      <Artwork seed={trackId} label={item.title} className="size-10" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-resilient">{item.title}</span>
        <span className="block truncate text-xs opacity-75 text-resilient">
          {trackArtistName(trackId)} · {formatDuration(item.durationSec)}
        </span>
      </span>
      <Play className="size-4 shrink-0 opacity-75" aria-hidden="true" />
    </button>
  )
}

/** A track the generator wrote for this pair — no audio, so it never plays. */
function GeneratedSong({ generated }: { generated: GeneratedTrack }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase opacity-80">
        <Sparkles className="size-3" aria-hidden="true" />
        yapay zeka şarkısı
      </p>
      <p className="mt-1.5 font-display text-base leading-tight text-resilient">
        {generated.title}
      </p>
      <p className="mt-1 text-xs opacity-80 text-resilient">{generated.mood}</p>
      <p className="mt-2 text-xs opacity-70 text-resilient">
        {generated.basedOn} · {formatDuration(generated.durationSec)}
      </p>
    </div>
  )
}
