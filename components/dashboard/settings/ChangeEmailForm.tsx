'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { Loader2, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import { changeEmailSchema, type ChangeEmailInput } from '@/lib/validations/settings'
import { changeEmail } from '@/app/actions/settings'

/**
 * Change Email form — verifies current password before updating.
 * Supabase sends a verification link to the new address; old email stays
 * active until the user clicks the link.
 */
export function ChangeEmailForm() {
  const t = useTranslations('settings.changeEmail')
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  // Action-level error (wrong password, email in use) displayed above the submit button
  const [actionError, setActionError] = useState<string | null>(null)

  const form = useForm<ChangeEmailInput>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { newEmail: '', currentPassword: '' },
  })

  function onSubmit(values: ChangeEmailInput) {
    setActionError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await changeEmail(values)

      if (result.success) {
        setSuccess(true)
        form.reset()
        return
      }

      // Map server error keys to the appropriate field or action-level slot
      switch (result.error) {
        case 'settings.changeEmail.errors.incorrectPassword':
          form.setError('currentPassword', { message: t('errors.incorrectPassword') })
          break
        case 'settings.changeEmail.errors.emailInUse':
          form.setError('newEmail', { message: t('errors.emailInUse') })
          break
        default:
          setActionError(t('errors.generic'))
      }
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

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* New email */}
            <FormField
              control={form.control}
              name="newEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[var(--text-primary)]">{t('newEmailLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t('newEmailPlaceholder')}
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Current password — required to verify identity before changing email */}
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[var(--text-primary)]">{t('currentPasswordLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={t('currentPasswordPlaceholder')}
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action-level error (not tied to a specific field) */}
            {actionError && (
              <p className="text-[length:var(--text-sm)] text-[var(--status-error)]">
                {actionError}
              </p>
            )}

            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('submitButton')}
            </Button>

            {/* Inline success message — no toast, quiet confirmation */}
            {success && (
              <p className="flex items-center gap-2 text-[length:var(--text-sm)] text-[var(--status-success)]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {t('successMessage')}
              </p>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
