import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { Check, Clock, Zap, Minus } from 'lucide-react'
import type { Tier } from '@/lib/pricing'
import { CheckoutButton } from './CheckoutButton'

interface FeatureItem {
  label: string
  icon: 'check' | 'clock' | 'zap' | 'disabled'
}

interface TierCardProps {
  name: string
  tierId: Tier
  priceEurCents: number
  subtitle: string
  features: FeatureItem[]
  cta: string
  href: string
  isAuthenticated: boolean
  isFeatured?: boolean
  badge?: string
  ctaVariant: 'default' | 'outline'
}

// Maps the icon variant to the correct Lucide icon and token colour
function FeatureIcon({ icon }: { icon: FeatureItem['icon'] }) {
  switch (icon) {
    case 'check':
      return <Check className="h-4 w-4 text-[var(--status-success)] shrink-0" />
    case 'clock':
      return <Clock className="h-4 w-4 text-[var(--text-secondary)] shrink-0" />
    case 'zap':
      return <Zap className="h-4 w-4 text-[var(--status-success)] shrink-0" />
    case 'disabled':
      return <Minus className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
  }
}

export function TierCard({
  name,
  tierId,
  priceEurCents,
  subtitle,
  features,
  cta,
  href,
  isAuthenticated,
  isFeatured,
  badge,
  ctaVariant,
}: TierCardProps) {
  const priceEur = Math.floor(priceEurCents / 100)

  return (
    <Card
      className={[
        'relative flex flex-col p-[length:var(--space-8)] shadow-[var(--shadow-md)]',
        isFeatured ? 'border-2 border-[var(--brand-secondary)]' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* "Fastest" badge — Express only */}
      {isFeatured && badge && (
        <span
          className="absolute top-[length:var(--space-4)] right-[length:var(--space-4)]
            bg-[var(--brand-secondary)] text-[var(--text-on-accent)]
            text-[length:var(--text-xs)] font-[number:var(--font-semibold)]
            rounded-[length:var(--radius-full)]
            px-[length:var(--space-3)] py-[length:var(--space-1)]"
        >
          {badge}
        </span>
      )}

      {/* Tier name */}
      <p className="text-[length:var(--text-xl)] font-[number:var(--font-bold)] text-[var(--text-primary)]">
        {name}
      </p>

      {/* Price — euro symbol superscript-aligned to top of the number */}
      <div className="mt-[length:var(--space-2)] flex items-start gap-[length:var(--space-1)]">
        <span className="mt-1 text-[length:var(--text-2xl)] font-[number:var(--font-bold)] text-[var(--text-primary)] leading-none">
          €
        </span>
        <span className="text-[length:var(--text-4xl)] font-[number:var(--font-bold)] text-[var(--text-primary)] leading-none">
          {priceEur}
        </span>
      </div>

      {/* One-line subtitle below price */}
      <p className="mt-[length:var(--space-2)] text-[length:var(--text-sm)] text-[var(--text-secondary)]">
        {subtitle}
      </p>

      {/* Divider */}
      <hr className="border-t border-[var(--border-subtle)] my-[length:var(--space-6)]" />

      {/* Feature list */}
      <ul className="flex flex-col gap-[length:var(--space-3)]">
        {features.map((feature) => (
          <li key={feature.label} className="flex items-center gap-[length:var(--space-3)]">
            <FeatureIcon icon={feature.icon} />
            <span
              className={[
                'text-[length:var(--text-sm)]',
                feature.icon === 'disabled'
                  ? 'text-[var(--text-muted)] line-through'
                  : 'text-[var(--text-secondary)]',
              ].join(' ')}
            >
              {feature.label}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA — mt-auto pushes to card bottom regardless of feature list length */}
      <div className="mt-auto pt-[length:var(--space-6)]">
        {isAuthenticated ? (
          <CheckoutButton tier={tierId} cta={cta} ctaVariant={ctaVariant} />
        ) : (
          <Button variant={ctaVariant} size="lg" className="w-full" asChild>
            <Link href={href}>{cta}</Link>
          </Button>
        )}
      </div>
    </Card>
  )
}
