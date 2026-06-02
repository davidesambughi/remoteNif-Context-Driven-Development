import { Suspense } from 'react'
import { redirect } from '@/i18n/navigation'
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
  if (user) redirect({ href: '/dashboard', locale: locale as 'en' | 'fr' | 'es' | 'de' })

  const t = await getTranslations('auth.signUp')

  return (
    <AuthCard title={t('title')}>
      <Suspense fallback={null}>
        <SignUpForm locale={locale} />
      </Suspense>
    </AuthCard>
  )
}
