'use client'

import { useState, useTransition } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Loader2, CheckCircle2 } from 'lucide-react'

import { useRouter } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { routing } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { updateLanguagePreference } from '@/app/actions/settings'

/**
 * Language Preference card — lets the user save their current locale to the DB.
 *
 * Initialises from useLocale() (the live URL locale) rather than the DB value.
 * This keeps the select in sync with the LanguageSwitcher in the header:
 * if the user changes language via the navbar, the select here immediately
 * reflects that choice — the Save button then persists it to public.users.language.
 *
 * No react-hook-form needed — single select, no typed input to validate.
 */
export function LanguagePreferenceForm() {
  const t = useTranslations('settings.languagePreference')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // useLocale() returns the active URL locale — always in sync with the navbar switcher
  const activeLocale = useLocale() as Locale

  // Selected locale in the dropdown — starts at the URL locale, not the DB value.
  // If the user changed language via the navbar without saving, this already reflects
  // their choice so they just need to hit "Save preference" to persist it.
  const [selected, setSelected] = useState<Locale>(activeLocale)
  const [success, setSuccess] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Disable save when the dropdown matches what is already active in the browser
  const isUnchanged = selected === activeLocale

  function handleSave() {
    setActionError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await updateLanguagePreference({ language: selected })

      if (result.success) {
        setSuccess(true)
        // Brief pause so the user sees the success message before the page reloads
        await new Promise((resolve) => setTimeout(resolve, 200))
        // Navigate to /settings in the new locale — triggers a full server re-render
        router.push('/settings', { locale: selected })
        return
      }

      setActionError(t('errors.generic'))
    })
  }

  return (
    <Card className="border-[var(--border-default)] shadow-[var(--shadow-md)]">
      <CardHeader>
        <CardTitle className="text-[length:var(--text-xl)] font-[number:var(--font-semibold)] text-[var(--text-primary)]">
          {t('heading')}
        </CardTitle>
        <CardDescription className="text-[var(--text-secondary)]">
          {t('description')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Language select */}
        <div>
          <label
            htmlFor="language-select"
            className="mb-1.5 block text-[length:var(--text-sm)] font-[number:var(--font-medium)] text-[var(--text-primary)]"
          >
            {t('selectLabel')}
          </label>
          <Select
            value={selected}
            onValueChange={(value) => setSelected(value as Locale)}
          >
            <SelectTrigger id="language-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {/* Options are always in their own language — never translated.
                  A German user must be able to find "Deutsch" even when the UI is in English. */}
              {routing.locales.map((locale) => (
                <SelectItem key={locale} value={locale}>
                  {t(`options.${locale}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action-level error */}
        {actionError && (
          <p className="text-[length:var(--text-sm)] text-[var(--status-error)]">
            {actionError}
          </p>
        )}

        {/* Save button — disabled when selection is unchanged or action is in flight */}
        <Button
          type="button"
          onClick={handleSave}
          disabled={isUnchanged || isPending}
          className="w-full sm:w-auto"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('submitButton')}
        </Button>

        {/* Inline success confirmation — disappears naturally when the page reloads */}
        {success && (
          <p className="flex items-center gap-2 text-[length:var(--text-sm)] text-[var(--status-success)]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {t('successMessage')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
