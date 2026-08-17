import { Link } from 'react-router-dom'
import { CalendarDays, Compass, Headphones, MessageCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Wordmark } from '@/components/AppShell'
import { CompatRing } from '@/components/CompatRing'

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Headphones,
    title: 'Müzik uyumu',
    body: 'En çok dinlediğin sanatçılar ve şarkılar karşılaştırılır, uyum yüzdesi çıkar.',
  },
  {
    icon: Compass,
    title: 'Keşfet',
    body: 'Zevkine en yakın kişiler önce gelir. Ortak sanatçıları anında görürsün.',
  },
  {
    icon: MessageCircle,
    title: 'Şarkıyla konuş',
    body: 'Sohbette şarkı gönder. Bazı şeyler cümleyle anlatılmıyor.',
  },
  {
    icon: CalendarDays,
    title: 'Etkinlikler',
    body: 'Dinlediğin sanatçıların konserleri ve oraya giden eşleşmelerin.',
  },
]

export function Welcome() {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-5xl px-5 py-8 md:py-16">
      <header className="flex items-center justify-between">
        <Wordmark />
        <Link
          to="/giris"
          className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-on-accent transition-transform duration-200 hover:scale-[1.03] active:scale-95"
        >
          Başla
        </Link>
      </header>

      <section className="animate-rise py-16 text-center md:py-24">
        <p className="text-xs font-medium tracking-[0.25em] text-accent uppercase">
          müzikle tanış
        </p>
        <h1 className="mx-auto mt-4 max-w-2xl font-display text-4xl leading-tight text-balance sm:text-5xl md:text-6xl">
          Aynı şarkıyı seven biri hep var
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-balance text-muted-foreground">
          makromusic zevkini okur, sana en yakın kulakları bulur. Profil fotoğrafına değil,
          çalma listene bakar.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4">
          <Link
            to="/giris"
            className="rounded-xl bg-accent px-7 py-3.5 text-sm font-semibold text-on-accent transition-transform duration-200 hover:scale-[1.03] active:scale-95"
          >
            Spotify ile bağlan
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CompatRing score={92} size={44} showCaption={false} />
            <span>Şu an %92 uyumlu biri seni bekliyor</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <article key={title} className="rounded-2xl border border-border bg-card p-5">
            <Icon className="size-6 text-accent" aria-hidden="true" />
            <h2 className="mt-3 font-display text-lg text-resilient">{title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-resilient">
              {body}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-16 rounded-2xl border border-border bg-card p-8 text-center md:mt-24">
        <h2 className="font-display text-2xl text-balance">Çalma listen zaten seni anlatıyor</h2>
        <Link
          to="/giris"
          className="mt-6 inline-block rounded-xl bg-accent px-7 py-3.5 text-sm font-semibold text-on-accent transition-transform duration-200 hover:scale-[1.03] active:scale-95"
        >
          Başla
        </Link>
      </section>

      <footer className="mt-12 pb-8 text-center text-xs text-muted-foreground">
        makromusic klonu — eğitim amaçlı demo. Gerçek makromusic ile bağlantısı yoktur.
      </footer>
    </div>
  )
}
