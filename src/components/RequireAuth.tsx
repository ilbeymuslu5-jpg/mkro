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
  const { status, me } = useAuth()
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

  if (!me) return <Navigate to="/giris" replace state={{ from: location.pathname }} />

  return <Outlet />
}
