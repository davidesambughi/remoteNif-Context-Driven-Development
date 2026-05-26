import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  // Prevent webpack from trying to bundle pdf-renderer's Node.js-only deps (canvas, etc.)
  // Keep heavy Node.js-only packages out of the Turbopack bundle so they run as real Node modules
  serverExternalPackages: ['@react-pdf/renderer', 'pdfjs-dist'],

  // NOTE: cacheComponents (PPR replacement) is intentionally NOT enabled here.
  // It requires ALL dynamic API calls (cookies, headers, params, getLocale, etc.) to be
  // inside <Suspense> boundaries across the entire tree — including the root layout's
  // <html lang={locale}>. That's a larger migration. Enable it only after auditing
  // every layout and page for dynamic-outside-Suspense violations.

  // Next.js 16 introduced per-segment prefetching which multiplies prefetch requests
  // (one per route segment). prefetchInlining collapses them back to 1 request per link.
  // Fixes the doubled-request latency regression reported in vercel/next.js#85470.
  experimental: {
    prefetchInlining: true,
  },
}

export default withNextIntl(nextConfig)
