'use client'

import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
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
import { Loader2 } from 'lucide-react'
import PasswordInput from '@/components/auth/PasswordInput'

interface Props {
  locale: string
}

export default function SignUpForm({ locale }: Props) {
  const t = useTranslations('auth.signUp')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [serverError, setServerError] = useState<string | null>(null)

  const tier = searchParams.get('tier') as SignUpInput['tier']

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { 
      email: '', 
      password: '', 
      language: locale as SignUpInput['language'],
      tier
    },
  })

  async function onSubmit(values: SignUpInput) {
    setServerError(null)
    const result = await signUp(values)
    if (!result.success) {
      // Map known server error keys to translated messages; fall back to raw string
      const messages: Record<string, string> = {
        'auth.signUp.errors.emailInUse': t('errors.emailInUse'),
        'auth.signUp.errors.generic': t('errors.generic'),
        'auth.signUp.errors.emailConfirmationRequired': t('errors.emailConfirmationRequired'),
      }
      setServerError(messages[result.error] ?? result.error)
      return
    }

    // Feature 22: If a checkout URL was returned (tier selection pre-signup),
    // redirect to Stripe instead of the dashboard.
    if (result.data?.checkoutUrl) {
      window.location.href = result.data.checkoutUrl
      return
    }

    router.push('/dashboard')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-[length:var(--space-4)]">
        {/* Hidden language field — passes locale to the server action */}
        <input type="hidden" {...form.register('language')} value={locale} />
        
        {/* Hidden tier field — captured from URL, used to trigger Stripe redirect post-signup */}
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
                  autoComplete="new-password"
                  className="rounded-[length:var(--radius-md)] border-border-default focus:border-brand-primary"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-[length:var(--text-sm)] text-error" />
            </FormItem>
          )}
        />

        {/* Server-side error (e.g. email already in use) */}
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

      <p className="text-center text-[length:var(--text-sm)] text-text-secondary mt-[length:var(--space-4)]">
        {t('hasAccount')}{' '}
        <Link
          href={tier ? `/signin?tier=${tier}` : '/signin'}
          className="text-brand-secondary underline-offset-4 hover:underline"
        >
          {t('signInLink')}
        </Link>
      </p>
    </Form>
  )
}
