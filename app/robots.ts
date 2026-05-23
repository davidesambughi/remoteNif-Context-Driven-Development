import { MetadataRoute } from 'next'
import { env } from '@/lib/env'

/**
 * Generates the robots.txt file for the application.
 *
 * Rules:
 * 1. Allow public marketing pages (/, /pricing) in all 4 locales.
 * 2. Disallow sensitive/authenticated routes (dashboard, admin, operator, etc.).
 * 3. Explicitly block CCBot and Bytespider due to documented non-compliance with standard crawling practices.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/pricing',
          '/fr/',
          '/fr/pricing',
          '/es/',
          '/es/pricing',
          '/de/',
          '/de/pricing',
        ],
        disallow: [
          '/dashboard',
          '/admin',
          '/operator',
          '/signin',
          '/signup',
          '/reset-password',
          '/new-password',
          '/settings',
          '/renewal',
          '/auth',
          // Prefix variants for major protected routes to be explicit
          '/fr/dashboard',
          '/es/dashboard',
          '/de/dashboard',
          '/fr/admin',
          '/es/admin',
          '/de/admin',
          '/fr/operator',
          '/es/operator',
          '/de/operator',
        ],
      },
      {
        // Block Common Crawl — documented non-compliance with robots.txt in some scenarios
        userAgent: 'CCBot',
        disallow: '/',
      },
      {
        // Block ByteDance crawler — documented non-compliance and aggressive crawling
        userAgent: 'Bytespider',
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
