'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { Globe } from 'lucide-react'
import type { Locale } from '@/i18n/routing'

const LOCALES = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
]

interface LanguageSwitcherProps {
  // 'glass' — used on photo-canvas pages (white text/icon)
  // 'default' — used on app-canvas pages (secondary token colour)
  variant?: 'default' | 'glass'
}

// Globe icon + current locale label. Native <select> is overlaid invisibly so
// the browser handles the dropdown — no custom popover needed.
export function LanguageSwitcher({ variant = 'default' }: LanguageSwitcherProps) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  // Text/icon colour switches with the navbar variant
  const colour =
    variant === 'glass' ? 'text-glass-text' : 'text-text-secondary'

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    // Select options are static and match the Locale union exactly
    router.replace(pathname, { locale: e.target.value as Locale })
  }

  return (
    <div className="relative inline-flex items-center gap-[length:var(--space-1)] cursor-pointer">
      <Globe className={`h-4 w-4 ${colour} pointer-events-none`} />
      <span className={`text-[length:var(--text-sm)] font-[number:var(--font-medium)] ${colour} uppercase pointer-events-none`}>
        {locale}
      </span>
      {/* Transparent native select sits on top — handles dropdown + keyboard nav */}
      <select
        value={locale}
        onChange={handleChange}
        className="absolute inset-0 opacity-0 cursor-pointer w-full"
        aria-label="Select language"
      >
        {LOCALES.map((l) => (
          <option key={l.value} value={l.value}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  )
}
