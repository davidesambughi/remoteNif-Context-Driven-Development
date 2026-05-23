import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth/session'
import { getRenewalOrderInfo } from '@/lib/db/queries'
import { RenewalCheckoutButton } from '@/components/dashboard/renewal/RenewalCheckoutButton'
import type { Locale } from '@/i18n/routing'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ orderId?: string; canceled?: string }>
}

/**
 * Generates page title from the renewal i18n namespace.
 * Next.js 16: params is a Promise — must be awaited.
 */
export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  // Cast to Locale — the [locale] segment is always validated by next-intl middleware
  const t = await getTranslations({ locale: locale as Locale, namespace: 'renewal' })
  return { title: t('pageTitle') }
}

/**
 * Renewal interstitial page — validates eligibility and renders the checkout card.
 * Server Component: auth + DB checks run on the server, no client JS needed here.
 *
 * The (dashboard) proxy layout already redirects unauthenticated users;
 * the getCurrentUser check here is a defensive server-side guard.
 */
export default async function RenewalPage({ params, searchParams }: Props) {
  // Next.js 16: both params and searchParams are Promises — must await before use.
  const { locale: localeStr } = await params
  const { orderId, canceled } = await searchParams

  // Cast to Locale — the [locale] segment is always validated by next-intl middleware
  const locale = localeStr as Locale

  // Required by next-intl server components before any translation call
  setRequestLocale(locale)

  const t = await getTranslations('renewal')

  // Defensive auth check — proxy should have already redirected, but guard anyway
  const user = await getCurrentUser()
  if (!user) redirect(`/${locale}/signin`)

  // No orderId in the URL → render not-eligible state immediately.
  // Also guard against non-UUID values (e.g. tampered URLs) — Postgres throws if you
  // pass a non-UUID string into a uuid-column WHERE clause.
  const orderIdParsed = z.string().uuid().safeParse(orderId)
  if (!orderId || !orderIdParsed.success) {
    return <NotEligibleCard backLabel={t('backToDashboard')} notEligibleText={t('notEligible')} locale={locale} />
  }

  const order = await getRenewalOrderInfo(orderIdParsed.data, user.id)

  // Order not found, belongs to another user, is Essential-tier, or has no fiscal rep
  if (!order || order.tier === 'essential' || order.fiscalRepExpiresAt === null) {
    return <NotEligibleCard backLabel={t('backToDashboard')} notEligibleText={t('notEligible')} locale={locale} />
  }

  return (
    <RenewalCard
      locale={locale}
      orderId={orderId}
      isCanceled={canceled === 'true'}
      title={t('pageTitle')}
      description={t('pageDescription')}
    />
  )
}

// ---------------------------------------------------------------------------
// Sub-components — Server Components, co-located in this file.
// Both are small enough not to warrant separate files.
// ---------------------------------------------------------------------------

interface NotEligibleCardProps {
  backLabel: string
  notEligibleText: string
  locale: string
}

/**
 * Shown when the order is ineligible for renewal (Essential tier, no fiscal rep,
 * order not found, or no orderId param in the URL).
 */
function NotEligibleCard({ backLabel, notEligibleText, locale }: NotEligibleCardProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-md w-full mx-auto px-4 py-16">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[length:var(--radius-lg)] shadow-[var(--shadow-md)] p-8">
          <p className="text-[length:var(--text-base)] text-[var(--text-secondary)] mb-6">
            {notEligibleText}
          </p>
          <Button variant="ghost" asChild>
            <Link href={`/${locale}/dashboard`}>{backLabel}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

interface RenewalCardProps {
  locale: string
  orderId: string
  isCanceled: boolean
  title: string
  description: string
}

/**
 * Renders the renewal context card with the auto-triggering checkout button.
 * Heading + sub-line follow the spec layout; the button handles all interactive states.
 */
function RenewalCard({ locale, orderId, isCanceled, title, description }: RenewalCardProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-md w-full mx-auto px-4 py-16">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[length:var(--radius-lg)] shadow-[var(--shadow-md)] p-8">
          {/* Heading */}
          <h1 className="text-[length:var(--text-2xl)] font-[number:var(--font-bold)] text-[var(--text-primary)] mb-1">
            {title}
          </h1>

          {/* Sub-line: plan summary + price */}
          <p className="text-[length:var(--text-base)] text-[var(--text-secondary)] mb-8">
            {description}
          </p>

          {/* Client Component — handles loading/error/canceled states and Stripe redirect */}
          <RenewalCheckoutButton
            orderId={orderId}
            locale={locale}
            isCanceled={isCanceled}
          />
        </div>
      </div>
    </div>
  )
}
