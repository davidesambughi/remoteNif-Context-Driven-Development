'use client'

import { useRouter } from '@/i18n/navigation'
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
import { Loader2 } from 'lucide-react'
import PasswordInput from '@/components/auth/PasswordInput'

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
    </Form>
  )
}
