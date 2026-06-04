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
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import PasswordInput from '@/components/auth/PasswordInput'

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
              <FormLabel className="text-[length:var(--text-sm)] font-[number:var(--font-medium)] text-text-secondary">
                {t('password')}
              </FormLabel>
              <FormControl>
                {/* Each PasswordInput instance has independent show/hide state */}
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

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[length:var(--text-sm)] font-[number:var(--font-medium)] text-text-secondary">
                {t('confirmPassword')}
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
