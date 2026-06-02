import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getCurrentUser } from '@/lib/auth/session'
import AuthCard from '@/components/auth/AuthCard'
import SignInForm from '@/components/auth/SignInForm'

interface Props {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ redirectTo?: string; error?: string }>
}

export default async function SignInPage({ params, searchParams }: Props) {
  await params // locale not needed in this page — form is client-side

  // Redirect already-authenticated users to role-appropriate destination
  const user = await getCurrentUser()
  if (user) {
    if (user.role === 'admin') redirect('/admin')
    else if (user.role === 'operator') redirect('/operator')
    else redirect('/dashboard')
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
