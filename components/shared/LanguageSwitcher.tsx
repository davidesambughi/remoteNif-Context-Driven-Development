'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { Globe } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import type { Locale } from '@/i18n/routing'

const LOCALES = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
]

interface LanguageSwitcherProps {
  // 'glass' — used on photo-canvas pages (white text/icon)
  // 'default' — used on app-canvas pages (brand-primary colour)
  variant?: 'default' | 'glass'
}

// Globe icon + current locale label as a styled Radix Select trigger.
// SelectTrigger chrome (border, background, chevron) is fully suppressed —
// only the icon + label are visible, matching the original minimal design.
export function LanguageSwitcher({ variant = 'default' }: LanguageSwitcherProps) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const colour =
    variant === 'glass' ? 'text-glass-text' : 'text-brand-primary'

  return (
    <Select
      value={locale}
      onValueChange={(val) => router.replace(pathname, { locale: val as Locale })}
    >
      {/* Trigger — no border, no background, no chevron; just icon + label */}
      <SelectTrigger
        className={[
          'inline-flex items-center gap-[length:var(--space-1)]',
          'h-auto w-auto border-none bg-transparent shadow-none',
          'p-0 focus:ring-0 focus:ring-offset-0 [&>svg:last-child]:hidden',
          colour,
        ].join(' ')}
        aria-label="Select language"
      >
        <Globe className="h-4 w-4 pointer-events-none shrink-0" />
        <span className="text-[length:var(--text-sm)] font-[number:var(--font-medium)] uppercase pointer-events-none">
          {locale}
        </span>
      </SelectTrigger>

      {/* Dropdown panel — rounded, soft shadow, design tokens */}
      <SelectContent
        className={[
          'bg-[var(--bg-elevated)] border border-[var(--border-subtle)]',
          'rounded-[length:var(--radius-xl)] shadow-[var(--shadow-lg)]',
          'min-w-[9rem] overflow-hidden p-[length:var(--space-2)]',
        ].join(' ')}
        align="end"
        sideOffset={8}
      >
        {LOCALES.map((l) => (
          <SelectItem
            key={l.value}
            value={l.value}
            className={[
              'rounded-[length:var(--radius-md)] cursor-pointer',
              'text-[length:var(--text-sm)] font-[number:var(--font-medium)]',
              'text-[var(--text-secondary)] py-[length:var(--space-2)]',
              'focus:bg-[var(--bg-subtle)] focus:text-[var(--text-primary)]',
              'data-[state=checked]:text-[var(--brand-primary)] data-[state=checked]:font-[number:var(--font-semibold)]',
            ].join(' ')}
          >
            {l.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
