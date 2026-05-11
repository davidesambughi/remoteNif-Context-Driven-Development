import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'

// Tell Next.js which locale segments to generate at build time
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

interface Props {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

// Locale layout — validates locale and provides next-intl context.
// <html> and <body> live in app/layout.tsx (Next.js 16 requirement).
export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  // Must be called before any next-intl translation function
  setRequestLocale(locale)

  return (
    // NextIntlClientProvider is required in next-intl v4 for client components using useTranslations
    <NextIntlClientProvider>
      {children}
    </NextIntlClientProvider>
  )
}
