import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { Heart, X } from 'lucide-react'

export type SwipeDirection = 'like' | 'pass'

/** Horizontal travel, in px, that commits the swipe on release. */
const COMMIT_PX = 110

/** Below this the gesture is treated as a vertical scroll, not a swipe. */
const AXIS_LOCK_PX = 8

interface SwipeCardProps {
  onSwipe: (direction: SwipeDirection) => void
  children: ReactNode
  /** Set on cards stacked behind the top one. */
  inert?: boolean
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Drag-to-decide card. Right commits a like, left a pass; anything short of
 * the threshold springs back. Vertical drags are handed to the page so the
 * board still scrolls on a phone.
 */
export function SwipeCard({ onSwipe, children, inert }: SwipeCardProps) {
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [exiting, setExiting] = useState<SwipeDirection | null>(null)
  const start = useRef<{ x: number; y: number } | null>(null)
  const axis = useRef<'undecided' | 'horizontal' | 'vertical'>('undecided')

  const commit = (direction: SwipeDirection) => {
    if (prefersReducedMotion()) {
      onSwipe(direction)
      return
    }
    setExiting(direction)
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (inert || exiting) return
    start.current = { x: event.clientX, y: event.clientY }
    axis.current = 'undecided'
    setDragging(true)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!start.current || exiting) return
    const nextDx = event.clientX - start.current.x
    const nextDy = event.clientY - start.current.y

    if (axis.current === 'undecided') {
      if (Math.abs(nextDx) < AXIS_LOCK_PX && Math.abs(nextDy) < AXIS_LOCK_PX) return
      axis.current = Math.abs(nextDx) > Math.abs(nextDy) ? 'horizontal' : 'vertical'
      if (axis.current === 'horizontal') event.currentTarget.setPointerCapture(event.pointerId)
    }

    if (axis.current !== 'horizontal') return
    setDx(nextDx)
  }

  const onPointerUp = () => {
    if (!start.current || exiting) return
    start.current = null
    setDragging(false)

    if (Math.abs(dx) >= COMMIT_PX) {
      commit(dx > 0 ? 'like' : 'pass')
      return
    }
    setDx(0)
  }

  const offscreen = exiting ? (exiting === 'like' ? 1 : -1) * window.innerWidth * 1.2 : dx
  const rotation = offscreen / 22
  const likeOpacity = Math.min(1, Math.max(0, dx / COMMIT_PX))
  const passOpacity = Math.min(1, Math.max(0, -dx / COMMIT_PX))

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onTransitionEnd={() => {
        if (exiting) onSwipe(exiting)
      }}
      style={{
        transform: `translateX(${offscreen}px) rotate(${rotation}deg)`,
        transition: dragging ? 'none' : 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)',
        touchAction: 'pan-y',
      }}
      className={`relative ${inert ? '' : 'cursor-grab active:cursor-grabbing'}`}
    >
      {children}

      {/* Decision overlays — they track the drag so the outcome is never a surprise. */}
      <span
        aria-hidden="true"
        style={{ opacity: likeOpacity }}
        className="pointer-events-none absolute top-5 left-5 flex items-center gap-1.5 rounded-xl border-2 border-accent bg-background/80 px-3 py-1.5 font-display text-accent"
      >
        <Heart className="size-4" />
        BEĞEN
      </span>

      <span
        aria-hidden="true"
        style={{ opacity: passOpacity }}
        className="pointer-events-none absolute top-5 right-5 flex items-center gap-1.5 rounded-xl border-2 border-destructive bg-background/80 px-3 py-1.5 font-display text-destructive"
      >
        <X className="size-4" />
        GEÇ
      </span>
    </div>
  )
}
