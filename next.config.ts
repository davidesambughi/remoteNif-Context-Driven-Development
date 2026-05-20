import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  // Prevent webpack from trying to bundle pdf-renderer's Node.js-only deps (canvas, etc.)
  // Keep heavy Node.js-only packages out of the Turbopack bundle so they run as real Node modules
  serverExternalPackages: ['@react-pdf/renderer', 'pdfjs-dist'],
}

export default withNextIntl(nextConfig)
