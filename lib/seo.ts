import { getPathname } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'
import { env } from '@/lib/env'

/**
 * Shape returned by buildAlternates — maps directly to Metadata.alternates
 * as expected by the Next.js Metadata API.
 */
export interface PageAlternates {
  canonical: string
  languages: Record<string, string>
}

/**
 * Build canonical + hreflang alternates for a public page.
 *
 * @param locale - the current page's locale (determines which URL is canonical)
 * @param href   - locale-neutral path, e.g. '/' or '/pricing'
 *
 * Canonical is self-referencing (current locale's own URL) — Google's
 * recommended pattern. x-default points to the default locale (en, no prefix).
 * All four supported locales are always included in the languages map.
 *
 * Example output for buildAlternates('fr', '/pricing'):
 *   canonical: 'https://remotenif.com/fr/pricing'
 *   languages: {
 *     en:        'https://remotenif.com/pricing',
 *     fr:        'https://remotenif.com/fr/pricing',
 *     es:        'https://remotenif.com/es/pricing',
 *     de:        'https://remotenif.com/de/pricing',
 *     'x-default': 'https://remotenif.com/pricing',
 *   }
 */
export function buildAlternates(locale: Locale, href: string): PageAlternates {
  // Strip trailing slash from base URL to avoid double slashes
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  const languages: Record<string, string> = {}

  // One entry per supported locale — getPathname respects the as-needed prefix config:
  //   en → '/pricing'   (no prefix, default locale)
  //   fr → '/fr/pricing'
  for (const l of routing.locales) {
    const path = getPathname({ locale: l, href })
    languages[l] = `${base}${path}`
  }

  // x-default signals the fallback URL for unmatched locales → always English (no prefix)
  const defaultPath = getPathname({ locale: routing.defaultLocale, href })
  languages['x-default'] = `${base}${defaultPath}`

  // Self-referencing canonical for the current locale
  const currentPath = getPathname({ locale, href })
  return {
    canonical: `${base}${currentPath}`,
    languages,
  }
}
