import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ArrowLeft } from 'lucide-react'

import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getCurrentUser } from '@/lib/auth/session'
import { getUserActiveOrder } from '@/lib/db/queries'
import { ChangeEmailForm } from '@/components/dashboard/settings/ChangeEmailForm'
import { ChangePasswordForm } from '@/components/dashboard/settings/ChangePasswordForm'
import { DeleteAccountSection } from '@/components/dashboard/settings/DeleteAccountSection'
import { LanguagePreferenceForm } from '@/components/dashboard/settings/LanguagePreferenceForm'
import { RefreshCw } from 'lucide-react'

interface Props {
  params: Promise<{ locale: Locale }>
}

/**
 * Account Settings page — Server Component.
 * Fetches the current user and their most recent order to pass context
 * (active order flag, fiscal rep expiry) down to the delete section.
 * The DashboardHeader is rendered by the layout — no extra header here.
 *
 * setRequestLocale must be called before any next-intl function — each page
 * runs in its own async context and the layout's call does not propagate here.
 * Without it NextIntlClientProvider cannot serialise the locale to the client,
 * which breaks useLocale() in LanguageSwitcher.
 */
export default async function SettingsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('settings')

  // getCurrentUser() is wrapped in React cache() — this call is free if layout
  // already called it in the same render.
  const user = await getCurrentUser()

  // user is guaranteed non-null here — the dashboard layout redirects to /signin if missing.
  // Fetch most recent order to determine active order and fiscal rep state.
  const order = user ? await getUserActiveOrder(user.id) : null

  // Active order: any order that has not yet reached the final 'delivered' state
  const hasActiveOrder = order !== null && order.status !== 'delivered'

  // Fiscal rep expiry only applies to Standard and Express tiers
  const fiscalRepExpiresAt = order?.fiscalRepExpiresAt ?? null

  // Show the "Renew fiscal representation" recovery link only when:
  //  - The order is Standard or Express (Essential never has fiscal rep)
  //  - The customer previously dismissed the renewal banner
  const showRenewFiscalRepLink =
    order !== null &&
    order.tier !== 'essential' &&
    order.fiscalRepDismissedAt !== null

  return (
    <div className="max-w-xl mx-auto px-[length:var(--space-6)] py-[length:var(--space-12)]">
      {/* Back link — locale-aware, above the page title */}
      <Link
        href="/dashboard"
        className="mb-[length:var(--space-4)] inline-flex items-center gap-1.5 text-[length:var(--text-sm)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-[var(--transition-base)]"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToDashboard')}
      </Link>

      {/* Page heading */}
      <div className="mb-[length:var(--space-8)]">
        <h1 className="text-[length:var(--text-3xl)] font-[number:var(--font-bold)] text-[var(--text-primary)] leading-[var(--leading-tight)]">
          {t('pageTitle')}
        </h1>
      </div>

      {/* Sections stacked vertically */}
      <div className="flex flex-col gap-[length:var(--space-8)]">
        <ChangeEmailForm />
        <ChangePasswordForm />
        <LanguagePreferenceForm />

        {/* Fiscal rep recovery link — only visible after the customer dismissed the banner.
            Gives them a self-serve way to renew if they change their mind. */}
        {showRenewFiscalRepLink && order && (
          <div className="rounded-[length:var(--radius-lg)] border border-[var(--border-default)]
            bg-[var(--bg-surface)] p-[length:var(--space-6)] shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-[length:var(--space-3)]">
              <RefreshCw className="h-5 w-5 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
              <div>
                <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">
                  {t('renewFiscalRep.description')}
                </p>
                <Link
                  href={`/renewal?orderId=${order.id}`}
                  className="text-[length:var(--text-sm)] font-[number:var(--font-medium)]
                    text-[var(--brand-primary)] underline underline-offset-2
                    hover:opacity-80 transition-[var(--transition-fast)]
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-1
                    rounded-[length:var(--radius-sm)]"
                >
                  {t('renewFiscalRep.link')}
                </Link>
              </div>
            </div>
          </div>
        )}

        <DeleteAccountSection
          hasActiveOrder={hasActiveOrder}
          fiscalRepExpiresAt={fiscalRepExpiresAt ? new Date(fiscalRepExpiresAt) : null}
        />
      </div>
    </div>
  )
}
