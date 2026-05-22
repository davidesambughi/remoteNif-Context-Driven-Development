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

import { changePasswordSchema, type ChangePasswordInput } from '@/lib/validations/settings'
import { changePassword } from '@/app/actions/settings'

/**
 * Change Password form — verifies current password before setting a new one.
 * New password must satisfy the same strength rule as sign-up (8+ chars, upper, lower, digit).
 */
export function ChangePasswordForm() {
  const t = useTranslations('settings.changePassword')
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  function onSubmit(values: ChangePasswordInput) {
    setActionError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await changePassword(values)

      if (result.success) {
        setSuccess(true)
        form.reset()
        return
      }

      // Map server error keys to the appropriate field or action-level slot
      switch (result.error) {
        case 'settings.changePassword.errors.incorrectPassword':
          form.setError('currentPassword', { message: t('errors.incorrectPassword') })
          break
        case 'settings.changePassword.errors.passwordMismatch':
          // Should only reach server in rare race conditions — Zod refine catches this client-side
          form.setError('confirmPassword', { message: t('errors.passwordMismatch') })
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

            {/* Current password — verified server-side via signInWithPassword */}
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[var(--text-primary)]">{t('currentPasswordLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* New password */}
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[var(--text-primary)]">{t('newPasswordLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm new password — Zod refine enforces match before reaching the server */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[var(--text-primary)]">{t('confirmPasswordLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action-level error */}
            {actionError && (
              <p className="text-[length:var(--text-sm)] text-[var(--status-error)]">
                {actionError}
              </p>
            )}

            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('submitButton')}
            </Button>

            {/* Inline success message */}
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
