import { MetadataRoute } from 'next'
import { env } from '@/lib/env'
import { routing } from '@/i18n/routing'
import { getPathname } from '@/i18n/navigation'

/**
 * Generates the sitemap.xml file for the application.
 *
 * Scope: Public marketing pages only (/, /pricing).
 * Locales: All 4 locales (en, fr, es, de) with full hreflang alternates.
 * lastModified: Uses build timestamp as the site has no CMS.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  const routes = ['/', '/pricing'] as const

  return routes.flatMap((route) =>
    routing.locales.map((locale) => {
      const path = getPathname({ locale, href: route })
      const url = `${baseUrl}${path}`

      return {
        url,
        lastModified: new Date(),
        changeFrequency: route === '/' ? 'weekly' : 'monthly',
        priority: route === '/' ? 1.0 : 0.8,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [
              l,
              `${baseUrl}${getPathname({ locale: l, href: route })}`,
            ])
          ),
        },
      }
    })
  )
}
