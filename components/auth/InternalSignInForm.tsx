'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
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
  // The Server Action to call (adminSignIn or operatorSignIn)
  actionFn: (input: unknown) => Promise<{ success: boolean; error?: string }>
  // Pre-translated error message string (supplied by the parent Server Component)
  errorMessage: string
  // Where to redirect on success
  redirectTo: string
}

// Shared sign-in form for internal tools (admin, operator) — no signup/forgot links.
export default function InternalSignInForm({ actionFn, errorMessage, redirectTo }: Props) {
  const t = useTranslations('auth.signIn')
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: SignInInput) {
    setServerError(null)
    const result = await actionFn(values)
    if (!result.success) {
      setServerError(errorMessage)
      return
    }
    router.push(redirectTo)
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
    </Form>
  )
}
