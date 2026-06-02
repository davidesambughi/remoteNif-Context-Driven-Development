import { Suspense } from 'react'
import { redirect } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'
import { getCurrentUser } from '@/lib/auth/session'
import AuthCard from '@/components/auth/AuthCard'
import SignInForm from '@/components/auth/SignInForm'

interface Props {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ redirectTo?: string; error?: string }>
}

type Locale = 'en' | 'fr' | 'es' | 'de'

export default async function SignInPage({ params, searchParams }: Props) {
  const { locale } = await params

  // Redirect already-authenticated users to role-appropriate destination
  const user = await getCurrentUser()
  if (user) {
    const l = locale as Locale
    if (user.role === 'admin') redirect({ href: '/admin', locale: l })
    else if (user.role === 'operator') redirect({ href: '/operator', locale: l })
    else redirect({ href: '/dashboard', locale: l })
  }

  const { redirectTo, error } = await searchParams
  const t = await getTranslations('auth.signIn')

  return (
    <AuthCard title={t('title')}>
      <Suspense fallback={null}>
        <SignInForm redirectTo={redirectTo} initialError={error} />
      </Suspense>
    </AuthCard>
  )
}
