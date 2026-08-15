import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { fileToSquareDataUrl, ImageError } from '@/lib/image'

const STORAGE_KEY = 'makromusic:photo'
const PLAN_KEY = 'makromusic:plan'

export type Plan = 'free' | 'platinum'

interface ProfileState {
  /** Data URL of the uploaded avatar, or null for the generated gradient. */
  photo: string | null
  /** Subscription tier. Mock — no payment is taken. */
  plan: Plan
  subscribe: (plan: Plan) => void
  /** Set while the picked file is being decoded and scaled. */
  saving: boolean
  /** Human-readable reason the last upload failed. */
  error: string | null
  setPhotoFromFile: (file: File) => Promise<void>
  clearPhoto: () => void
}

const ProfileContext = createContext<ProfileState | null>(null)

function readStoredPhoto(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    // Private browsing and blocked storage both throw here; the app still works.
    return null
  }
}

function readStoredPlan(): string | null {
  try {
    return localStorage.getItem(PLAN_KEY)
  } catch {
    return null
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [photo, setPhoto] = useState<string | null>(readStoredPhoto)
  const [plan, setPlan] = useState<Plan>(() => (readStoredPlan() === 'platinum' ? 'platinum' : 'free'))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setPhotoFromFile = useCallback(async (file: File) => {
    setSaving(true)
    setError(null)
    try {
      const dataUrl = await fileToSquareDataUrl(file)
      setPhoto(dataUrl)
      try {
        localStorage.setItem(STORAGE_KEY, dataUrl)
      } catch {
        // Out of quota or storage disabled — keep the photo for this session
        // rather than failing the whole upload.
      }
    } catch (cause) {
      setError(
        cause instanceof ImageError ? cause.message : 'Fotoğraf yüklenemedi. Tekrar dene.',
      )
    } finally {
      setSaving(false)
    }
  }, [])

  const clearPhoto = useCallback(() => {
    setPhoto(null)
    setError(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Nothing to clean up if storage is unavailable.
    }
  }, [])

  const subscribe = useCallback((next: Plan) => {
    setPlan(next)
    try {
      localStorage.setItem(PLAN_KEY, next)
    } catch {
      // Plan still applies for this session if storage is unavailable.
    }
  }, [])

  const value = useMemo<ProfileState>(
    () => ({ photo, plan, saving, error, setPhotoFromFile, clearPhoto, subscribe }),
    [photo, plan, saving, error, setPhotoFromFile, clearPhoto, subscribe],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile(): ProfileState {
  const context = useContext(ProfileContext)
  if (!context) throw new Error('useProfile must be used inside ProfileProvider')
  return context
}
