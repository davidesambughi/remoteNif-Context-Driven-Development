import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { getLocale } from 'next-intl/server'
import '@/app/globals.css'
import { JsonLd } from '@/components/shared/JsonLd'
import { buildOrganizationSchema, buildWebSiteSchema } from '@/lib/jsonld'
import { env } from '@/lib/env'

// Base metadata — individual pages override title via the template.
// metadataBase is required for absolute OG/canonical URLs.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://remotenif.com'),
  title: {
    template: '%s | RemoteNIF',
    default: 'RemoteNIF — Get Your Portuguese NIF Online',
  },
  description:
    'Fast, transparent, and fully remote Portuguese NIF application. No hidden fees. Choose Essential, Standard, or Express.',
}

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

// Root layout owns <html> and <body> — required by Next.js 16.
// getLocale() reads locale from request context set by the proxy (next-intl middleware).
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()

  // Strip trailing slash so schema URLs are always clean (e.g. "https://remotenif.com")
  const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* ── 20c: Site-wide JSON-LD — Organization + WebSite ── */}
        <JsonLd data={buildOrganizationSchema(baseUrl)} />
        <JsonLd data={buildWebSiteSchema(baseUrl)} />
      </head>
      <body className="bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
