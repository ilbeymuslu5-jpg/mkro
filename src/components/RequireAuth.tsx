import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Wordmark } from './AppShell'
import { useAuth } from '@/state/AuthContext'

/**
 * Gate for every screen that reads the signed-in user. It also absorbs the
 * window between a restored session and the taste read finishing, so pages
 * behind it can treat the user as always present.
 */
export function RequireAuth() {
  const { status, me, needsOnboarding } = useAuth()
  const location = useLocation()

  if (status === 'loading' || status === 'authorizing') {
    return (
      <div className="grid min-h-dvh place-items-center px-5">
        <div className="text-center">
          <Wordmark />
          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Spotify verilerin alınıyor…
          </p>
        </div>
      </div>
    )
  }

  // Signed up (real Supabase session) but the profile/taste form was never
  // submitted — there is no `me` to render any of these screens with.
  if (needsOnboarding) return <Navigate to="/onboarding" replace />

  if (!me) return <Navigate to="/giris" replace state={{ from: location.pathname }} />

  return <Outlet />
}
