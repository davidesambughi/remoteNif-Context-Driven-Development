import { getTranslations } from 'next-intl/server'
import AuthCard from '@/components/auth/AuthCard'
import RequestPasswordResetForm from '@/components/auth/RequestPasswordResetForm'

interface Props {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ error?: string }>
}

export default async function ResetPasswordPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { error } = await searchParams
  const t = await getTranslations('auth.resetPassword')

  return (
    <AuthCard title={t('title')}>
      {/* Show banner when /auth/confirm redirects here with ?error=link-invalid */}
      {error === 'link-invalid' && (
        <p className="mb-[length:var(--space-4)] text-[length:var(--text-sm)] text-error">
          {t('errors.linkInvalid')}
        </p>
      )}
      <RequestPasswordResetForm locale={locale} />
    </AuthCard>
  )
}
