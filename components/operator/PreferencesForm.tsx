'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateOperatorPreferences } from '@/app/actions/operator'
import type { OperatorPreferencesData } from '@/lib/db/queries'

interface Props {
  // Initial values fetched server-side — pre-fills the form on load
  initialPreferences: OperatorPreferencesData
}

/**
 * Operator notification preferences form.
 * Toggles for email and SMS channels; phone number field appears when SMS is enabled.
 * Saves via Server Action on submit — success toast or inline error.
 */
export function PreferencesForm({ initialPreferences }: Props) {
  const t = useTranslations('operator.preferences')
  const [isPending, startTransition] = useTransition()

  // Local state for each preference — initialized from server-fetched values
  const [emailEnabled, setEmailEnabled] = useState(initialPreferences.emailNotifications)
  const [smsEnabled, setSmsEnabled] = useState(initialPreferences.smsNotifications)
  const [phoneNumber, setPhoneNumber] = useState(initialPreferences.phoneNumber ?? '')
  const [serverError, setServerError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)

    startTransition(async () => {
      const result = await updateOperatorPreferences({
        emailNotifications: emailEnabled,
        smsNotifications: smsEnabled,
        // Send null when SMS is off — keeps the phone field optional in that state
        phoneNumber: smsEnabled ? phoneNumber.trim() || null : null,
      })

      if (result.success) {
        toast.success(t('saveSuccess'))
      } else {
        setServerError(result.error ?? t('saveError'))
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">

      {/* Email notifications toggle */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-[var(--space-6)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="email-toggle" className="text-[var(--text-primary)] font-medium">
              {t('emailLabel')}
            </Label>
            <p className="text-[var(--text-muted)] text-sm mt-1">
              {t('emailDescription')}
            </p>
          </div>
          <Switch
            id="email-toggle"
            checked={emailEnabled}
            onCheckedChange={setEmailEnabled}
            disabled={isPending}
            aria-label={t('emailLabel')}
          />
        </div>
      </div>

      {/* SMS notifications toggle + conditional phone number field */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-[var(--space-6)] space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="sms-toggle" className="text-[var(--text-primary)] font-medium">
              {t('smsLabel')}
            </Label>
            <p className="text-[var(--text-muted)] text-sm mt-1">
              {t('smsDescription')}
            </p>
          </div>
          <Switch
            id="sms-toggle"
            checked={smsEnabled}
            onCheckedChange={setSmsEnabled}
            disabled={isPending}
            aria-label={t('smsLabel')}
          />
        </div>

        {/* Phone number input — only rendered when SMS is on */}
        {smsEnabled && (
          <div className="space-y-2">
            <Label htmlFor="phone-input" className="text-[var(--text-secondary)] text-sm">
              {t('phoneLabel')}
            </Label>
            <Input
              id="phone-input"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder={t('phonePlaceholder')}
              disabled={isPending}
              autoComplete="tel"
              className="max-w-xs"
            />
          </div>
        )}
      </div>

      {/* Server-level error message — shown below the form, above the button */}
      {serverError && (
        <p className="text-[var(--status-error)] text-sm" role="alert">
          {serverError}
        </p>
      )}

      {/* Save button — disabled while transition is in flight */}
      <Button type="submit" disabled={isPending} aria-busy={isPending}>
        {isPending ? 'Saving…' : t('save')}
      </Button>
    </form>
  )
}
