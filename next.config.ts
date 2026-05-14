import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  // Prevent webpack from trying to bundle pdf-renderer's Node.js-only deps (canvas, etc.)
  serverExternalPackages: ['@react-pdf/renderer'],
}

export default withNextIntl(nextConfig)
