import { getTranslations } from 'next-intl/server'
import { requireRole } from '@/lib/auth/session'
import { getOperatorPreferencesOrDefaults } from '@/lib/db/queries'
import { PreferencesForm } from '@/components/operator/PreferencesForm'

/**
 * Operator preferences page — notification channel toggles (email, SMS).
 * Auth is enforced by the parent (operator) layout AND requireRole here (data fetch needs the user id).
 */
export default async function OperatorPreferencesPage() {
  // requireRole returns the user object — needed to look up their preferences
  const [operator, t] = await Promise.all([
    requireRole('operator'),
    getTranslations('operator.preferences'),
  ])

  // Fetch existing preferences — returns schema defaults if no row exists yet
  const preferences = await getOperatorPreferencesOrDefaults(operator.id)

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
      <h1 className="text-[var(--text-primary)] text-2xl font-bold mb-8">
        {t('title')}
      </h1>

      {/* Client component receives the preferences data as props.
          Translations are NOT passed — PreferencesForm calls useTranslations() internally. */}
      <PreferencesForm initialPreferences={preferences} />
    </div>
  )
}
