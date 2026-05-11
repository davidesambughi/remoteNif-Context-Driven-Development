import { getTranslations } from 'next-intl/server'
import { requireAuth } from '@/lib/auth/session'
import AuthCard from '@/components/auth/AuthCard'
import NewPasswordForm from '@/components/auth/NewPasswordForm'

export default async function NewPasswordPage() {
  // Requires a valid session — user must have arrived via the /auth/confirm link
  await requireAuth()

  const t = await getTranslations('auth.newPassword')

  return (
    <AuthCard title={t('title')}>
      <NewPasswordForm />
    </AuthCard>
  )
}
