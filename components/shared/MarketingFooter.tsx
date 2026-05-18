import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { LanguageSwitcher } from './LanguageSwitcher'

// Site footer — brand, copyright, nav links, language switcher
export function MarketingFooter() {
  const t = useTranslations('common')

  return (
    <footer className="bg-surface border-t border-border-subtle px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <p className="text-[length:var(--text-base)] font-[number:var(--font-semibold)] text-text-primary">
          {t('appName')}
        </p>
        <p className="text-[length:var(--text-xs)] text-text-muted mt-1">
          {t('footer.copyright')}
        </p>

        <nav
          className="mt-4 flex flex-wrap gap-x-4 gap-y-2"
          aria-label="Footer navigation"
        >
          <Link
            href="/pricing"
            className="text-[length:var(--text-sm)] text-text-secondary hover:text-text-primary transition-[var(--transition-base)]"
          >
            {t('footer.pricing')}
          </Link>
          <a
            href="#how-it-works"
            className="text-[length:var(--text-sm)] text-text-secondary hover:text-text-primary transition-[var(--transition-base)]"
          >
            {t('footer.process')}
          </a>
          <a
            href="#"
            className="text-[length:var(--text-sm)] text-text-secondary hover:text-text-primary transition-[var(--transition-base)]"
          >
            {t('footer.terms')}
          </a>
          <a
            href="#"
            className="text-[length:var(--text-sm)] text-text-secondary hover:text-text-primary transition-[var(--transition-base)]"
          >
            {t('footer.privacy')}
          </a>
        </nav>

        <div className="mt-4">
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  )
}
