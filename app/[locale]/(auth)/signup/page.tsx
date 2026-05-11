import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getCurrentUser } from '@/lib/auth/session'
import AuthCard from '@/components/auth/AuthCard'
import SignUpForm from '@/components/auth/SignUpForm'

interface Props {
  params: Promise<{ locale: string }>
}

export default async function SignUpPage({ params }: Props) {
  const { locale } = await params

  // Redirect already-authenticated users
  const user = await getCurrentUser()
  if (user) redirect('/dashboard')

  const t = await getTranslations('auth.signUp')

  return (
    <AuthCard title={t('title')}>
      <SignUpForm locale={locale} />
    </AuthCard>
  )
}
