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
  // ReactNode so callers can inject colored spans without changing the component internals
  subtitle: React.ReactNode
  features: FeatureItem[]
  cta: string
  href: string
  isAuthenticated: boolean
  isFeatured?: boolean
  badge?: string
  ctaVariant: 'default' | 'outline'
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
  ctaVariant,
}: TierCardProps) {
  const priceEur = Math.floor(priceEurCents / 100)

  return (
    <Card
      className={[
        // Base card: white surface, medium shadow, no extra padding (inner layout handles it)
        'relative flex flex-col bg-surface shadow-[var(--shadow-md)] overflow-hidden',
        // Featured (Express): top accent border for hierarchy without background change
        isFeatured ? 'border-t-4 border-t-brand-primary' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* ── Inner two-column layout ────────────────────────────────────── */}
      {/* Single shared padding on the wrapper; columns use flex-1 equal split.
          No divider line between columns — mockup uses whitespace only.
          On mobile the columns stack vertically. */}
      <div className="flex flex-col sm:flex-row flex-1 p-[length:var(--space-6)] gap-[length:var(--space-6)]">

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
              <Button variant={ctaVariant} size="sm" className="w-full" asChild>
                <Link href={href}>{cta}</Link>
              </Button>
            )}
          </div>

        </div>

        {/* ── RIGHT — feature list ───────────────────────────────────────── */}
        {/* flex-1 + min-w-0 lets the column shrink/grow freely with the card.
            Items top-aligned (no justify-center) to match the mockup.
            text-xs keeps each line short enough to not overflow the narrow column. */}
        <div className="flex flex-col flex-1 min-w-0 gap-[length:var(--space-3)] justify-center">
          {features.map((feature) => (
            <div key={feature.label} className="flex items-start gap-[length:var(--space-2)]">
              <FeatureIcon icon={feature.icon} />
              <span
                className={[
                  'text-[length:var(--text-xs)] leading-[var(--leading-normal)]',
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
