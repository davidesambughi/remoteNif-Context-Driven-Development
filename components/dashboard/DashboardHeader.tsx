import { getTranslations } from 'next-intl/server'
import { Settings } from 'lucide-react'
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
    /* Glass header — backdrop-blur keeps it readable over any background image */
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/30 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        {/* Brand — locale-aware link back to marketing home */}
        <Link
          href="/"
          className="font-semibold text-sm text-text-primary hover:opacity-80 transition-[var(--transition-base)]"
        >
          {t('appName')}
        </Link>

        {/* Right side: settings link + language switcher + sign out */}
        <div className="flex items-center gap-4">
          {/* Gear icon — icon-only link, aria-label satisfies accessibility requirement */}
          <Link
            href="/settings"
            aria-label={t('nav.accountSettings')}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-[var(--transition-base)]"
          >
            <Settings className="h-5 w-5" />
          </Link>
          <LanguageSwitcher />
          <DashboardSignOutButton />
        </div>
      </div>
    </header>
  )
}
