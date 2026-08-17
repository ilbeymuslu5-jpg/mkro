import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import type { ReportReason } from '@/services/db'

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'harassment', label: 'Taciz veya hakaret' },
  { value: 'spam', label: 'Spam veya reklam' },
  { value: 'fake_profile', label: 'Sahte profil' },
  { value: 'inappropriate_content', label: 'Uygunsuz içerik' },
  { value: 'other', label: 'Diğer' },
]

interface ReportDialogProps {
  open: boolean
  personName: string
  onClose: () => void
  onSubmit: (reason: ReportReason, detail: string) => Promise<void>
}

export function ReportDialog({ open, personName, onClose, onSubmit }: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason>('harassment')
  const [detail, setDetail] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) {
      setDetail('')
      setError(null)
      setSent(false)
      setSending(false)
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

  const submit = async () => {
    setSending(true)
    setError(null)
    try {
      await onSubmit(reason, detail.trim())
      setSent(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Şikayet gönderilemedi. Tekrar dene.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-title"
      className="fixed inset-0 z-50 grid place-items-end bg-background/85 backdrop-blur-sm sm:place-items-center sm:p-4"
    >
      <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-border bg-card sm:max-w-md sm:rounded-2xl">
        <header className="flex items-center gap-3 border-b border-border px-5 py-4">
          <h2 id="report-title" className="flex-1 font-display text-lg text-resilient">
            {sent ? 'Şikayetin alındı' : `${personName} kişisini şikayet et`}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="grid size-11 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        {sent ? (
          <div className="p-5">
            <p className="text-sm leading-relaxed text-muted-foreground text-resilient">
              Ekibimiz inceleyecek. Bu kişiyi ayrıca engellemek istersen profilindeki engelle
              düğmesini kullanabilirsin.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-muted px-4 py-3 text-sm font-medium transition-colors duration-200 hover:bg-muted/70"
            >
              Kapat
            </button>
          </div>
        ) : (
          <div className="space-y-5 p-5">
            <fieldset>
              <legend className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Sebep
              </legend>
              <ul className="mt-2 space-y-1.5">
                {REASONS.map((option) => (
                  <li key={option.value}>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors duration-200 ${
                        reason === option.value
                          ? 'border-accent bg-accent/10'
                          : 'border-border hover:bg-muted/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="report-reason"
                        value={option.value}
                        checked={reason === option.value}
                        onChange={() => setReason(option.value)}
                        className="accent-accent"
                      />
                      <span className="text-resilient">{option.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>

            <label className="block">
              <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Ayrıntı (isteğe bağlı)
              </span>
              <textarea
                value={detail}
                onChange={(event) => setDetail(event.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Ne olduğunu kısaca anlat…"
                className="mt-2 w-full resize-none rounded-xl bg-muted px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
              />
            </label>

            {error && (
              <p role="alert" className="flex items-start gap-2 text-sm text-destructive-bright text-resilient">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={() => void submit()}
              disabled={sending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-3 text-sm font-semibold text-on-destructive transition-transform duration-200 hover:scale-[1.02] active:scale-95 disabled:scale-100 disabled:opacity-70"
            >
              {sending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Şikayeti gönder
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
