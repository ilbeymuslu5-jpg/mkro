import { Check, Sparkles, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { useProfile, type Plan } from '@/state/ProfileContext'

interface Tier {
  id: Plan
  name: string
  price: string
  period: string
  blurb: string
  features: { label: string; included: boolean }[]
}

const TIERS: Tier[] = [
  {
    id: 'free',
    name: 'Ücretsiz',
    price: '₺0',
    period: 'sonsuza kadar',
    blurb: 'Tanışmak için yeterli.',
    features: [
      { label: 'Günde 10 keşif', included: true },
      { label: 'Eşleştiklerinle sınırsız sohbet', included: true },
      { label: 'Müzik uyumu skoru', included: true },
      { label: 'Seni kimin beğendiğini gör', included: false },
      { label: 'Sınırsız geri alma', included: false },
      { label: 'Anlık eşleşmede öncelik', included: false },
      { label: 'Profilinde Platinum rozeti', included: false },
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    price: '₺149',
    period: 'ayda',
    blurb: 'Zevkini ciddiye alanlar için.',
    features: [
      { label: 'Sınırsız keşif', included: true },
      { label: 'Eşleştiklerinle sınırsız sohbet', included: true },
      { label: 'Müzik uyumu skoru', included: true },
      { label: 'Seni kimin beğendiğini gör', included: true },
      { label: 'Sınırsız geri alma', included: true },
      { label: 'Anlık eşleşmede öncelik', included: true },
      { label: 'Profilinde Platinum rozeti', included: true },
    ],
  },
]

export function Platinum() {
  const { plan, subscribe } = useProfile()

  return (
    <div>
      <PageHeader title="makromusic Platinum" subtitle="Paketini seç" />

      <div className="grid gap-4 md:grid-cols-2">
        {TIERS.map((tier) => {
          const current = plan === tier.id
          const featured = tier.id === 'platinum'

          return (
            <article
              key={tier.id}
              className={`flex flex-col rounded-2xl border p-5 ${
                featured ? 'border-accent/60 bg-accent/5' : 'border-border bg-card'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="flex items-center gap-1.5 font-display text-lg">
                  {featured && <Sparkles className="size-4 text-accent" aria-hidden="true" />}
                  {tier.name}
                </h2>
                {current && (
                  <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-on-accent">
                    aktif
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-muted-foreground text-resilient">{tier.blurb}</p>

              <p className="mt-4 flex items-baseline gap-1.5">
                <span className="font-display text-3xl tabular-nums">{tier.price}</span>
                <span className="text-sm text-muted-foreground">{tier.period}</span>
              </p>

              <ul className="mt-5 flex-1 space-y-2">
                {tier.features.map((feature) => (
                  <li key={feature.label} className="flex items-start gap-2 text-sm">
                    {feature.included ? (
                      <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                    ) : (
                      <X className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    )}
                    <span
                      className={`text-resilient ${
                        feature.included ? '' : 'text-muted-foreground line-through'
                      }`}
                    >
                      {feature.label}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => subscribe(tier.id)}
                disabled={current}
                className={`mt-6 rounded-xl px-4 py-3 text-sm font-semibold transition-transform duration-200 hover:scale-[1.02] active:scale-95 disabled:scale-100 ${
                  featured
                    ? 'bg-accent text-on-accent disabled:bg-muted disabled:text-muted-foreground'
                    : 'bg-muted text-foreground disabled:text-muted-foreground'
                }`}
              >
                {current
                  ? 'Şu anki paketin'
                  : tier.id === 'platinum'
                    ? 'Platinum’a geç'
                    : 'Ücretsize dön'}
              </button>
            </article>
          )
        })}
      </div>

      <p className="mt-6 rounded-xl bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground text-resilient">
        Bu ekran demo amaçlıdır. Ödeme alınmaz, kart bilgisi istenmez; seçimin yalnızca bu
        tarayıcıda saklanır.
      </p>

      <Link
        to="/profil"
        className="mt-4 block rounded-xl border border-border px-4 py-2.5 text-center text-sm font-medium transition-colors duration-200 hover:bg-muted"
      >
        Profile dön
      </Link>
    </div>
  )
}
