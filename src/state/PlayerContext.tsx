import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { track } from '@/data/catalog'

interface PlayerState {
  trackId: string | null
  isPlaying: boolean
  /** Seconds elapsed in the current track. */
  progress: number
  play: (trackId: string) => void
  toggle: () => void
  stop: () => void
  seek: (seconds: number) => void
}

const PlayerContext = createContext<PlayerState | null>(null)

/**
 * Simulated playback. There are no audio files in this clone, so a timer
 * advances the playhead — enough to drive the mini player, progress bars and
 * "now playing" states throughout the app.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const [trackId, setTrackId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    if (!isPlaying || trackId === null) return

    const duration = track(trackId).durationSec
    const startedAt = performance.now()
    const startProgress = progress
    let cancelled = false

    const tick = (now: number) => {
      if (cancelled) return
      const elapsed = startProgress + (now - startedAt) / 1000
      if (elapsed >= duration) {
        setProgress(0)
        setIsPlaying(false)
        return
      }
      setProgress(elapsed)
      frame.current = requestAnimationFrame(tick)
    }

    frame.current = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    }
    // `progress` is intentionally excluded: it is the seed for this run, and
    // including it would restart the loop on every frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, trackId])

  const value = useMemo<PlayerState>(
    () => ({
      trackId,
      isPlaying,
      progress,
      play: (next: string) => {
        setTrackId((current) => {
          if (current === next) {
            setIsPlaying((playing) => !playing)
            return current
          }
          setProgress(0)
          setIsPlaying(true)
          return next
        })
      },
      toggle: () => setIsPlaying((playing) => (trackId === null ? false : !playing)),
      stop: () => {
        setIsPlaying(false)
        setTrackId(null)
        setProgress(0)
      },
      seek: (seconds: number) => {
        if (trackId === null) return
        setProgress(Math.max(0, Math.min(track(trackId).durationSec - 1, seconds)))
      },
    }),
    [trackId, isPlaying, progress],
  )

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export function usePlayer(): PlayerState {
  const context = useContext(PlayerContext)
  if (!context) throw new Error('usePlayer must be used inside PlayerProvider')
  return context
}
