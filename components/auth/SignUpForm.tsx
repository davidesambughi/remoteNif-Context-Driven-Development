'use client'

import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { signUp } from '@/app/actions/auth'
import { signUpSchema, type SignUpInput } from '@/lib/validations/auth'
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

export default function SignUpForm({ locale }: Props) {
  const t = useTranslations('auth.signUp')
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', language: locale as SignUpInput['language'] },
  })

  async function onSubmit(values: SignUpInput) {
    setServerError(null)
    const result = await signUp(values)
    if (!result.success) {
      // Map known server error keys to translated messages; fall back to raw string
      const messages: Record<string, string> = {
        'auth.signUp.errors.emailInUse': t('errors.emailInUse'),
        'auth.signUp.errors.generic': t('errors.generic'),
      }
      setServerError(messages[result.error] ?? result.error)
      return
    }
    router.push('/dashboard')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-[length:var(--space-4)]">
        {/* Hidden language field — passes locale to the server action */}
        <input type="hidden" {...form.register('language')} value={locale} />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[length:var(--text-sm)] font-[number:var(--font-medium)] text-[var(--text-secondary)]">
                {t('email')}
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
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

        {/* Server-side error (e.g. email already in use) */}
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

      <p className="text-center text-[length:var(--text-sm)] text-[var(--text-secondary)] mt-[length:var(--space-4)]">
        {t('hasAccount')}{' '}
        <Link
          href="/signin"
          className="text-[var(--brand-secondary)] underline-offset-4 hover:underline"
        >
          {t('signInLink')}
        </Link>
      </p>
    </Form>
  )
}
