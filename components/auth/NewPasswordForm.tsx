'use client'

import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { updatePassword } from '@/app/actions/auth'
import { updatePasswordSchema, type UpdatePasswordInput } from '@/lib/validations/auth'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function NewPasswordForm() {
  const t = useTranslations('auth.newPassword')
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  async function onSubmit(values: UpdatePasswordInput) {
    setServerError(null)
    const result = await updatePassword(values)
    if (!result.success) {
      setServerError(t('errors.generic'))
      return
    }
    router.push('/dashboard')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-[length:var(--space-4)]">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[length:var(--text-sm)] font-[number:var(--font-medium)] text-[var(--text-secondary)]">
                {t('password')}
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  className="rounded-[length:var(--radius-md)] border-[var(--border-default)] focus:border-[var(--brand-primary)]"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-[length:var(--text-sm)] text-[var(--status-error)]" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[length:var(--text-sm)] font-[number:var(--font-medium)] text-[var(--text-secondary)]">
                {t('confirmPassword')}
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  className="rounded-[length:var(--radius-md)] border-[var(--border-default)] focus:border-[var(--brand-primary)]"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-[length:var(--text-sm)] text-[var(--status-error)]" />
            </FormItem>
          )}
        />

        {serverError && (
          <p className="text-[length:var(--text-sm)] text-[var(--status-error)]">{serverError}</p>
        )}

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full mt-[length:var(--space-6)] bg-[var(--brand-primary)] text-[var(--text-on-accent)] font-[number:var(--font-semibold)]"
        >
          {t('submit')}
        </Button>
      </form>
    </Form>
  )
}
