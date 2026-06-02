import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { Check, Minus, Wallet, Star, Zap } from 'lucide-react'
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
  // ReactNode so callers can inject colored spans without changing the component internals
  subtitle: React.ReactNode
  features: FeatureItem[]
  cta: string
  href: string
  isAuthenticated: boolean
  isFeatured?: boolean
  badge: string
  ctaVariant: 'default' | 'outline'
}

// Maps tier → badge icon. Wallet = affordable entry, Star = best value, Zap = fast/priority.
function BadgeIcon({ tierId }: { tierId: Tier }) {
  switch (tierId) {
    case 'essential': return <Wallet className="h-3 w-3 shrink-0" />
    case 'standard':  return <Star    className="h-3 w-3 shrink-0" />
    case 'express':   return <Zap     className="h-3 w-3 shrink-0" />
  }
}

// Maps icon variant → Lucide icon + colour token.
// In the new design all positive features (check/clock/zap) use the same success check.
function FeatureIcon({ icon }: { icon: FeatureItem['icon'] }) {
  switch (icon) {
    case 'check':
    case 'clock':
    case 'zap':
      return <Check className="h-[14px] w-[14px] text-success shrink-0" />
    case 'disabled':
      return <Minus className="h-[14px] w-[14px] text-text-muted shrink-0" />
  }
}

/**
 * Two-column tier card — matches the pricing mockup.
 *
 * LEFT  column: remoteNIF label → tier name (serif italic) → price → subtitle → CTA
 * RIGHT column: feature list with icons
 *
 * isFeatured (Express) adds a top brand-primary border for visual distinction
 * without changing the base background, matching the uniform-card mockup style.
 */
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
    // overflow-visible so the badge pill can straddle the top border without clipping
    // backdrop-blur-sm requires a visible background behind the card (the page gradient)
    <Card
      className={[
        'relative flex flex-col bg-[var(--pricing-card-bg)] backdrop-blur-sm',
        'border-[var(--pricing-card-border)] overflow-visible',
        isFeatured ? 'shadow-[var(--pricing-glow)]' : 'shadow-[var(--shadow-md)]',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* ── Badge — sits centred on the top border, half above / half below ── */}
      {/* z-10 keeps it above adjacent card edges in the grid */}
      <div className="absolute -top-[14px] left-1/2 -translate-x-1/2 z-10
        flex items-center gap-[length:var(--space-1)]
        bg-[var(--bg-surface)] border border-[var(--border-default)]
        shadow-[var(--shadow-sm)]
        px-[length:var(--space-3)] py-[length:var(--space-1)]
        rounded-[length:var(--radius-full)]
        text-[length:var(--text-2xs)] font-[number:var(--font-semibold)]
        text-text-secondary tracking-widest uppercase whitespace-nowrap">
        <BadgeIcon tierId={tierId} />
        {badge}
      </div>

      {/* ── Inner two-column layout ────────────────────────────────────── */}
      {/* pt accounts for the badge height so content doesn't sit under it.
          On mobile the columns stack vertically. */}
      <div className="flex flex-col sm:flex-row flex-1
        pt-[length:var(--space-8)] px-[length:var(--space-6)] pb-[length:var(--space-6)]
        gap-[length:var(--space-6)]">

        {/* ── LEFT — brand identity + price + CTA ───────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0">

          {/* Brand label — "remoteNIF" micro-text above the tier name */}
          <p className="text-[length:var(--text-xs)] font-[number:var(--font-medium)] text-text-muted tracking-wide">
            remoteNIF
          </p>

          {/* Tier name — serif italic brand-primary, large */}
          <p className="font-serif italic font-[number:var(--font-bold)]
            text-[length:var(--text-2xl)] text-brand-primary
            leading-[var(--leading-tight)]">
            {name}
          </p>

          {/* Price — euro symbol sits at top-of-number height */}
          <div className="mt-[length:var(--space-4)] flex items-start gap-[length:var(--space-1)]">
            <span className="mt-1 text-[length:var(--text-lg)] font-[number:var(--font-bold)]
              text-text-primary leading-none">
              €
            </span>
            <span className="text-[length:var(--text-4xl)] font-[number:var(--font-bold)]
              text-text-primary leading-none">
              {priceEur}
            </span>
          </div>

          {/* Subtitle — one-line description under the price */}
          <p className="mt-[length:var(--space-2)] text-[length:var(--text-sm)] text-text-secondary
            leading-[var(--leading-normal)]">
            {subtitle}
          </p>

          {/* CTA — pushed to bottom of left column */}
          <div className="mt-auto pt-[length:var(--space-6)]">
            {isAuthenticated ? (
              <CheckoutButton tier={tierId} cta={cta} ctaVariant={ctaVariant} />
            ) : (
              <Button variant={ctaVariant} size="sm" className="w-full rounded-full" asChild>
                <Link href={href}>{cta}</Link>
              </Button>
            )}
          </div>

        </div>

        {/* ── Separator — vertical rule between columns, hidden on mobile stack ── */}
        {/* my insets it from the card's top and bottom padding so it doesn't reach the edges */}
        <div className="hidden sm:block w-px shrink-0 bg-[var(--border-subtle)]
          my-[length:var(--space-4)]" />

        {/* ── RIGHT — feature list ───────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 gap-[length:var(--space-3)] justify-center">
          {features.map((feature) => (
            <div key={feature.label} className="flex items-start gap-[length:var(--space-2)]">
              <FeatureIcon icon={feature.icon} />
              <span
                className={[
                  'text-[length:var(--text-xs)] leading-[var(--leading-normal)] font-[number:var(--font-semibold)]',
                  feature.icon === 'disabled'
                    ? 'text-text-muted line-through'
                    : 'text-text-secondary',
                ].join(' ')}
              >
                {feature.label}
              </span>
            </div>
          ))}
        </div>

      </div>
    </Card>
  )
}
