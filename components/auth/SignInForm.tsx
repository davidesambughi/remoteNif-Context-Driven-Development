'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import Link from 'next/link'
import { signIn } from '@/app/actions/auth'
import { signInSchema, type SignInInput } from '@/lib/validations/auth'
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
  redirectTo?: string
  initialError?: string
}

export default function SignInForm({ redirectTo, initialError }: Props) {
  const t = useTranslations('auth.signIn')
  const router = useRouter()

  // Map URL error params (set by auth/confirm redirect) to translated messages
  const knownErrors: Record<string, string> = {
    link_expired: t('errors.linkExpired'),
  }
  const [serverError, setServerError] = useState<string | null>(
    initialError ? (knownErrors[initialError] ?? null) : null
  )

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: SignInInput) {
    setServerError(null)
    const result = await signIn(values)
    if (!result.success) {
      const messages: Record<string, string> = {
        'auth.signIn.errors.invalidCredentials': t('errors.invalidCredentials'),
        'auth.signIn.errors.generic': t('errors.generic'),
      }
      setServerError(messages[result.error] ?? result.error)
      return
    }

    const role = result.data?.role
    if (role === 'admin') {
      router.push('/admin')
    } else if (role === 'operator') {
      router.push('/operator')
    } else {
      // Validate redirectTo is same-origin before using it
      const destination =
        redirectTo && redirectTo.startsWith('/') ? redirectTo : '/dashboard'
      router.push(destination)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-[length:var(--space-4)]">
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
                  autoComplete="current-password"
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

      <div className="text-center mt-[length:var(--space-4)] space-y-[length:var(--space-2)]">
        <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">
          <Link
            href="/reset-password"
            className="text-[var(--brand-secondary)] underline-offset-4 hover:underline"
          >
            {t('forgotPassword')}
          </Link>
        </p>
        <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">
          {t('noAccount')}{' '}
          <Link
            href="/signup"
            className="text-[var(--brand-secondary)] underline-offset-4 hover:underline"
          >
            {t('signUpLink')}
          </Link>
        </p>
      </div>
    </Form>
  )
}
