'use client'

// MarketingHeader is a client component because it renders GlassDetector, which
// needs usePathname(). Translations stay here via useTranslations — the message
// payload for 'common' is small and acceptable in the client bundle.

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from './LanguageSwitcher'
import { GlassDetector } from './GlassDetector'

/**
 * Top navigation bar for all marketing pages.
 * GlassDetector provides the isHome boolean — it owns all pathname detection.
 * On homepage (photo canvas): glass background, white text, orange CTA pill.
 * On all other marketing pages: solid surface background, dark text, outline button.
 */
// Subtle dark halo applied to white text on the glass canvas.
// Spreads a soft shadow on all sides to simulate a thin dark border around the letterforms.
const GLASS_TEXT_SHADOW = '0 0 1px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.25)'

export function MarketingHeader() {
  const t = useTranslations('common')

  return (
    <GlassDetector>
      {(isHome) => (
        <header
          className={[
            'sticky top-0 z-50 h-14',
            isHome
              ? 'bg-glass-navbar-bg backdrop-blur-md'
              : 'bg-surface border-b border-border-subtle',
          ].join(' ')}
        >
          {/* px-[length:var(--space-4)] matches the token grid (--space-4 = 1rem = 16px) */}
          <div className="max-w-7xl mx-auto px-[length:var(--space-4)] h-full flex items-center justify-between">

            {/* Brand name — white on glass, dark on solid */}
            <Link
              href="/"
              style={isHome ? { textShadow: GLASS_TEXT_SHADOW } : undefined}
              className={[
                'font-[number:var(--font-semibold)] text-[length:var(--text-base)]',
                'hover:opacity-80 transition-[var(--transition-base)]',
                isHome ? 'text-glass-text' : 'text-text-primary',
              ].join(' ')}
            >
              {t('appName')}
            </Link>

            <div className="flex items-center gap-[length:var(--space-4)]">
              {/* Language switcher — variant controls icon/text colour */}
              <LanguageSwitcher variant={isHome ? 'glass' : 'default'} />

              {/* Sign In — orange pill on glass, outline button on solid */}
              {isHome ? (
                <Link
                  href="/signin"
                  className="bg-brand-primary text-glass-text rounded-full
                    px-[length:var(--space-4)] py-[length:var(--space-2)]
                    text-[length:var(--text-sm)] font-[number:var(--font-semibold)]
                    hover:opacity-90 transition-[var(--transition-base)]"
                >
                  {t('nav.signIn')}
                </Link>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/signin">{t('nav.signIn')}</Link>
                </Button>
              )}
            </div>
          </div>
        </header>
      )}
    </GlassDetector>
  )
}
