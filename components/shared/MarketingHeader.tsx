import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { LanguageSwitcher } from './LanguageSwitcher'

// Sticky top bar — brand name left, language switcher + Sign In right
export function MarketingHeader() {
  const t = useTranslations('common')

  return (
    <header className="sticky top-0 z-50 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-[number:var(--font-semibold)] text-[length:var(--text-base)] text-[var(--text-primary)] hover:opacity-80 transition-[var(--transition-base)]"
        >
          {t('appName')}
        </Link>

        <div className="flex items-center gap-[length:var(--space-4)]">
          <LanguageSwitcher />
          <Link
            href="/signin"
            className="text-[length:var(--text-sm)] font-[number:var(--font-medium)] text-[var(--text-primary)]
              border border-[var(--border-default)] rounded-[length:var(--radius-md)]
              px-[length:var(--space-4)] py-[length:var(--space-2)]
              hover:bg-[var(--bg-subtle)] transition-[var(--transition-base)]"
          >
            {t('nav.signIn')}
          </Link>
        </div>
      </div>
    </header>
  )
}
