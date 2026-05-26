'use client'

// Client component — needs GlassDetector which uses usePathname().
// useTranslations works on the client; the 'common' bundle is small.

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { LanguageSwitcher } from './LanguageSwitcher'
import { GlassDetector } from './GlassDetector'

/**
 * Site footer — glass background on homepage, solid on all other pages.
 * Text is always dark regardless of background — the glass surface is light
 * enough that dark text reads well on it.
 */
export function MarketingFooter() {
  const t = useTranslations('common')

  const navLinks = [
    { href: '/pricing',      label: t('footer.pricing') },
    { href: '#how-it-works', label: t('footer.process') },
    { href: '#terms',        label: t('footer.terms')   },
    { href: '#privacy',      label: t('footer.privacy') },
  ]

  return (
    <GlassDetector>
      {(isHome) => (
        <footer
          className={[
            'px-4 py-8',
            isHome
              ? 'bg-glass-navbar-bg backdrop-blur-md'
              : 'bg-surface border-t border-border-subtle',
          ].join(' ')}
        >
          <div className="max-w-7xl mx-auto">
            {/* Brand name — always dark */}
            <p className="text-[length:var(--text-base)] font-[number:var(--font-semibold)] text-text-primary">
              {t('appName')}
            </p>

            {/* Copyright — always dark muted */}
            <p className="text-[length:var(--text-xs)] text-text-muted mt-1">
              {t('footer.copyright')}
            </p>

            {/* Nav links — always dark */}
            <nav
              className="mt-4 flex flex-wrap gap-x-4 gap-y-2"
              aria-label="Footer navigation"
            >
              {navLinks.map(({ href, label }) => (
                <Link
                  key={label}
                  href={href}
                  className="text-[length:var(--text-sm)] text-text-secondary hover:text-text-primary transition-[var(--transition-base)]"
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Language switcher — always default (dark) variant */}
            <div className="mt-4">
              <LanguageSwitcher />
            </div>
          </div>
        </footer>
      )}
    </GlassDetector>
  )
}
