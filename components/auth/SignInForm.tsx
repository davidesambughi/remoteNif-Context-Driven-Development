'use client'

import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
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
import { Loader2 } from 'lucide-react'
import PasswordInput from '@/components/auth/PasswordInput'

interface Props {
  redirectTo?: string
  initialError?: string
}

export default function SignInForm({ redirectTo, initialError }: Props) {
  const t = useTranslations('auth.signIn')
  const router = useRouter()
  const searchParams = useSearchParams()

  // Map URL error params (set by auth/confirm redirect) to translated messages
  const knownErrors: Record<string, string> = {
    link_expired: t('errors.linkExpired'),
  }
  const [serverError, setServerError] = useState<string | null>(
    initialError ? (knownErrors[initialError] ?? null) : null
  )

  const tier = searchParams.get('tier') as SignInInput['tier']

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '', tier },
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

    const { role, checkoutUrl } = result.data

    // Feature 22: If a checkout URL was returned (tier selection pre-signin),
    // redirect to Stripe instead of the dashboard.
    if (checkoutUrl) {
      window.location.href = checkoutUrl
      return
    }

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
        {/* Hidden tier field — captured from URL, used to trigger Stripe redirect post-signin */}
        {tier && <input type="hidden" {...form.register('tier')} value={tier} />}

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

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[length:var(--text-sm)] font-[number:var(--font-medium)] text-text-secondary">
                {t('password')}
              </FormLabel>
              <FormControl>
                <PasswordInput
                  autoComplete="current-password"
                  className="rounded-[length:var(--radius-md)] border-border-default focus:border-brand-primary"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-[length:var(--text-sm)] text-error" />
            </FormItem>
          )}
        />

        {serverError && (
          <p className="text-[length:var(--text-sm)] text-error">{serverError}</p>
        )}

        {/* Show spinner + loading label while the server action is in-flight */}
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full mt-[length:var(--space-6)] bg-brand-primary text-on-accent font-[number:var(--font-semibold)]"
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              {t('submitting')}
            </>
          ) : (
            t('submit')
          )}
        </Button>
      </form>

      <div className="text-center mt-[length:var(--space-4)] space-y-[length:var(--space-2)]">
        <p className="text-[length:var(--text-sm)] text-text-secondary">
          <Link
            href="/reset-password"
            className="text-brand-secondary underline-offset-4 hover:underline"
          >
            {t('forgotPassword')}
          </Link>
        </p>
        <p className="text-[length:var(--text-sm)] text-text-secondary">
          {t('noAccount')}{' '}
          <Link
            href={tier ? `/signup?tier=${tier}` : '/signup'}
            className="text-brand-secondary underline-offset-4 hover:underline"
          >
            {t('signUpLink')}
          </Link>
        </p>
      </div>
    </Form>
  )
}
