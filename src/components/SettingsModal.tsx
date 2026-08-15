import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, LogOut, ShieldOff, Trash2, X } from 'lucide-react'
import { Avatar } from './Avatar'
import { person } from '@/data/people'
import { useAuth } from '@/state/AuthContext'
import { useProfile } from '@/state/ProfileContext'
import { useSocial } from '@/state/SocialContext'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { session, logout, wipeAccount } = useAuth()
  const { clearPhoto } = useProfile()
  const { blockedIds, unblock, resetAll } = useSocial()
  const [confirmingWipe, setConfirmingWipe] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) {
      setConfirmingWipe(false)
      return
    }
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const wipe = () => {
    // Clear in-memory state first, then the persisted session and storage keys.
    resetAll()
    clearPhoto()
    wipeAccount()
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className="fixed inset-0 z-50 grid place-items-end bg-background/85 backdrop-blur-sm sm:place-items-center sm:p-4"
    >
      <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-border/70 bg-card sm:max-w-md sm:rounded-2xl">
        <header className="sticky top-0 flex items-center gap-3 border-b border-border/60 bg-card px-5 py-4">
          <h2 id="settings-title" className="flex-1 font-display text-lg">
            Ayarlar
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Ayarları kapat"
            className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        <div className="space-y-6 p-5">
          <section>
            <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Bağlı hesap
            </h3>
            <div className="mt-2 rounded-xl bg-muted/50 p-3">
              <p className="truncate text-sm font-medium text-resilient">
                {session?.profile.displayName ?? '—'}
              </p>
              <p className="truncate text-xs text-muted-foreground text-resilient">
                {session?.profile.email ?? '—'} ·{' '}
                {session?.profile.product === 'premium' ? 'Spotify Premium' : 'Spotify Free'}
              </p>
            </div>
          </section>

          <section>
            <h3 className="flex items-center gap-1.5 text-xs font-medium tracking-wider text-muted-foreground uppercase">
              <ShieldOff className="size-3.5" aria-hidden="true" />
              Engellenen kişiler
            </h3>

            {blockedIds.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground text-resilient">
                Kimseyi engellemedin. Bir profildeki engelle düğmesi kişiyi buraya taşır.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {blockedIds.map((id) => {
                  const blocked = person(id)
                  return (
                    <li
                      key={id}
                      className="flex items-center gap-3 rounded-xl bg-muted/50 p-2.5"
                    >
                      <Avatar seed={id} name={blocked.name} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-sm text-resilient">
                        {blocked.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => unblock(id)}
                        className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-accent transition-colors duration-200 hover:bg-accent/15"
                      >
                        Engeli kaldır
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Hesap
            </h3>

            <button
              type="button"
              onClick={() => {
                logout()
                onClose()
              }}
              className="mt-2 flex w-full items-center gap-2.5 rounded-xl border border-border/70 px-3 py-3 text-sm font-medium transition-colors duration-200 hover:bg-muted"
            >
              <LogOut className="size-4 shrink-0" aria-hidden="true" />
              Spotify bağlantısını kes
            </button>

            {confirmingWipe ? (
              <div className="mt-2 rounded-xl border border-destructive/60 bg-destructive/10 p-3">
                <p className="flex items-start gap-2 text-sm text-resilient">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                  <span>
                    Eşleşmelerin, mesajların, gönderilerin, fotoğrafın ve paketin silinecek. Bu
                    geri alınamaz.
                  </span>
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={wipe}
                    className="flex-1 rounded-lg bg-destructive px-3 py-2 text-sm font-semibold text-on-destructive transition-transform duration-200 hover:scale-[1.02] active:scale-95"
                  >
                    Evet, sil
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingWipe(false)}
                    className="flex-1 rounded-lg bg-muted px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-muted/70"
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingWipe(true)}
                className="mt-2 flex w-full items-center gap-2.5 rounded-xl border border-destructive/50 px-3 py-3 text-sm font-medium text-destructive transition-colors duration-200 hover:bg-destructive/10"
              >
                <Trash2 className="size-4 shrink-0" aria-hidden="true" />
                Hesap verilerimi sil
              </button>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
