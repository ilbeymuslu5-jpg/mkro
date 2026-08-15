import { useRef } from 'react'
import { Camera, Loader2, Trash2 } from 'lucide-react'
import { Avatar } from './Avatar'
import { useMe } from '@/state/AuthContext'
import { useProfile } from '@/state/ProfileContext'

/** Avatar with an overlaid upload control, plus a remove action once set. */
export function PhotoPicker() {
  const me = useMe()
  const { photo, saving, error, setPhotoFromFile, clearPhoto } = useProfile()
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <Avatar seed="me" name={me.name} size="lg" online photo={photo} />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={saving}
            aria-label={photo ? 'Profil fotoğrafını değiştir' : 'Profil fotoğrafı ekle'}
            className="absolute -right-1 -bottom-1 grid size-8 place-items-center rounded-full bg-accent text-on-accent ring-2 ring-card transition-transform duration-200 hover:scale-110 active:scale-95 disabled:scale-100 disabled:opacity-70"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Camera className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl leading-tight text-resilient">{me.name}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground text-resilient">
            {me.age} · {me.city}
          </p>

          {photo && (
            <button
              type="button"
              onClick={clearPhoto}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-destructive"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Fotoğrafı kaldır
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          // Reset first so picking the same file twice still fires a change.
          event.target.value = ''
          if (file) void setPhotoFromFile(file)
        }}
      />

      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive text-resilient">
          {error}
        </p>
      ) : (
        !photo && (
          <p className="mt-3 text-sm text-muted-foreground text-resilient">
            Fotoğrafın yoksa baş harflerinden bir kapak üretiliyor. Kamera simgesine dokunarak
            kendi fotoğrafını ekleyebilirsin.
          </p>
        )
      )}
    </div>
  )
}
