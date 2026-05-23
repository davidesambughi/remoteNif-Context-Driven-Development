import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { AlertTriangle, XCircle } from 'lucide-react'
import { DismissRenewalDialog } from './DismissRenewalDialog'
import type { SelectOrder } from '@/lib/db/schema'

interface RenewalBannerProps {
  order: SelectOrder
  locale: string
}

/**
 * Renewal status banner — shown on the dashboard for Standard/Express customers
 * whose fiscal representation is expiring within 30 days or has already expired.
 *
 * Returns null (renders nothing) when:
 *  - The order is Essential tier (no fiscal rep purchased)
 *  - fiscalRepExpiresAt is null (should not happen for Standard/Express, but guard anyway)
 *  - fiscalRepDismissedAt is set (customer opted out — banner is permanently hidden)
 *  - The expiry is more than 30 days away (no action needed yet)
 *
 * Links to /[locale]/renewal?orderId=... using next-intl <Link> for locale-awareness.
 */
export async function RenewalBanner({ order, locale }: RenewalBannerProps) {
  // Essential tier orders never have fiscal representation
  if (order.tier === 'essential') return null

  // No expiry date means no fiscal rep to renew
  if (!order.fiscalRepExpiresAt) return null

  // Customer explicitly opted out — respect their choice
  if (order.fiscalRepDismissedAt) return null

  const now = new Date()
  const expiresAt = new Date(order.fiscalRepExpiresAt)
  const msPerDay = 1000 * 60 * 60 * 24
  const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / msPerDay)

  // Only show the banner within the 30-day window or if already expired
  if (daysUntilExpiry > 30) return null

  const isExpired = daysUntilExpiry < 0
  const t = await getTranslations('dashboard.renewalBanner')

  // Format the expiry date for the "expired on [date]" copy
  const formattedDate = expiresAt.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Renewal URL — locale-aware via next-intl Link
  const renewalHref = `/renewal?orderId=${order.id}` as const

  if (isExpired) {
    return (
      <div
        role="alert"
        className="rounded-[length:var(--radius-lg)] border border-error bg-error-subtle
          px-[length:var(--space-4)] py-[length:var(--space-4)]
          flex flex-col gap-[length:var(--space-3)]
          sm:flex-row sm:items-start sm:justify-between"
      >
        {/* Icon + message */}
        <div className="flex items-start gap-[length:var(--space-3)]">
          <XCircle className="h-5 w-5 text-error shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-[length:var(--text-sm)] text-error font-[number:var(--font-medium)]">
            {t('expired', { date: formattedDate })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-start gap-[length:var(--space-2)] sm:items-end shrink-0">
          <Link
            href={renewalHref}
            className="text-[length:var(--text-sm)] font-[number:var(--font-semibold)]
              text-error underline underline-offset-2
              hover:opacity-80 transition-[var(--transition-fast)]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error
              focus-visible:ring-offset-1 rounded-[length:var(--radius-sm)]"
          >
            {t('renewLink')}
          </Link>
          <DismissRenewalDialog orderId={order.id} />
        </div>
      </div>
    )
  }

  // Near-expiry state (0–30 days remaining)
  return (
    <div
      role="alert"
      className="rounded-[length:var(--radius-lg)] border border-warning bg-warning-subtle
        px-[length:var(--space-4)] py-[length:var(--space-4)]
        flex flex-col gap-[length:var(--space-3)]
        sm:flex-row sm:items-start sm:justify-between"
    >
      {/* Icon + message */}
      <div className="flex items-start gap-[length:var(--space-3)]">
        <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-[length:var(--text-sm)] text-warning font-[number:var(--font-medium)]">
          {t('nearExpiry', { days: daysUntilExpiry })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-start gap-[length:var(--space-2)] sm:items-end shrink-0">
        <Link
          href={renewalHref}
          className="text-[length:var(--text-sm)] font-[number:var(--font-semibold)]
            text-warning underline underline-offset-2
            hover:opacity-80 transition-[var(--transition-fast)]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning
            focus-visible:ring-offset-1 rounded-[length:var(--radius-sm)]"
        >
          {t('renewLink')}
        </Link>
        <DismissRenewalDialog orderId={order.id} />
      </div>
    </div>
  )
}
