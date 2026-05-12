import type { routing } from './routing'
import type en from '../messages/en.json'

// Registers message key shapes and locale type with next-intl v4's type system.
// useTranslations() will now error at compile time for missing or misspelled keys.
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number]
    Messages: typeof en
  }
}
