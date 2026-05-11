import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'fr', 'es', 'de'],
  defaultLocale: 'en',
  // Default locale (en) has no URL prefix: /pricing not /en/pricing
  // Other locales are prefixed: /fr/pricing, /es/pricing, /de/pricing
  localePrefix: 'as-needed',
})

export type Locale = (typeof routing.locales)[number]
