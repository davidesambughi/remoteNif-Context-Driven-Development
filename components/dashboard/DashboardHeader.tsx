import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { DashboardSignOutButton } from './DashboardSignOutButton'

/**
 * Server component — sticky header for the customer dashboard.
 * Brand link returns to marketing home; LanguageSwitcher and sign-out are always visible.
 */
export async function DashboardHeader() {
  const t = await getTranslations('common')

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-border-default">
      <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        {/* Brand — locale-aware link back to marketing home */}
        <Link
          href="/"
          className="font-semibold text-sm text-text-primary hover:opacity-80 transition-[var(--transition-base)]"
        >
          {t('appName')}
        </Link>

        {/* Right side: language switcher + sign out */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <DashboardSignOutButton />
        </div>
      </div>
    </header>
  )
}
