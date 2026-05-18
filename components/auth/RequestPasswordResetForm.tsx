'use client'

import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import { requestPasswordReset } from '@/app/actions/auth'
import { requestPasswordResetSchema, type RequestPasswordResetInput } from '@/lib/validations/auth'
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

interface Props {
  locale: string
}

export default function RequestPasswordResetForm({ locale }: Props) {
  const t = useTranslations('auth.resetPassword')
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: { email: '', locale: locale as RequestPasswordResetInput['locale'] },
  })

  async function onSubmit(values: RequestPasswordResetInput) {
    await requestPasswordReset(values)
    // Action always returns success — always show the same message to prevent enumeration
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div>
        <p className="text-[length:var(--text-base)] text-text-primary">
          {t('successMessage')}
        </p>
        <p className="text-center mt-[length:var(--space-4)]">
          <Link
            href="/signin"
            className="text-[length:var(--text-sm)] text-brand-secondary underline-offset-4 hover:underline"
          >
            {t('backToSignIn')}
          </Link>
        </p>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-[length:var(--space-4)]">
        {/* Hidden locale field — used by server action to build the redirectTo URL */}
        <input type="hidden" {...form.register('locale')} value={locale} />

        <p className="text-[length:var(--text-sm)] text-text-secondary mb-[length:var(--space-4)]">
          {t('description')}
        </p>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[length:var(--text-sm)] font-[number:var(--font-medium)] text-text-secondary">
                {t('email')}
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  className="rounded-[length:var(--radius-md)] border-border-default focus:border-brand-primary"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-[length:var(--text-sm)] text-error" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full mt-[length:var(--space-6)] bg-brand-primary text-on-accent font-[number:var(--font-semibold)]"
        >
          {t('submit')}
        </Button>
      </form>

      <p className="text-center text-[length:var(--text-sm)] text-text-secondary mt-[length:var(--space-4)]">
        <Link
          href="/signin"
          className="text-brand-secondary underline-offset-4 hover:underline"
        >
          {t('backToSignIn')}
        </Link>
      </p>
    </Form>
  )
}
