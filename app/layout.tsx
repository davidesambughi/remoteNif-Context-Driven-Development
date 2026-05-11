import { Inter, JetBrains_Mono } from 'next/font/google'
import { getLocale } from 'next-intl/server'
import '@/app/globals.css'

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

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
