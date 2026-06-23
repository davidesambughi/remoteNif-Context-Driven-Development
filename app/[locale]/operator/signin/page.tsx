import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import AuthCard from '@/components/auth/AuthCard'
import InternalSignInForm from '@/components/auth/InternalSignInForm'
import { operatorSignIn } from '@/app/actions/auth'

// Operator sign-in is not under the (operator) layout, so noindex is set here directly.
export const metadata: Metadata = {
  title: 'Operator Sign In',
  robots: { index: false, follow: false },
}

// Operator sign-in — URL: /operator/signin
// This is a dedicated, non-indexed entry point for operations staff.
// It provides a direct channel for internal task management, isolated from the public-facing 
// unified login to ensure operational continuity and separate authentication concerns.
export default async function OperatorSignInPage() {
  const t = await getTranslations('auth.operator.signIn')

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center px-[length:var(--space-4)]">
      <AuthCard title={t('title')}>
        <InternalSignInForm
          actionFn={operatorSignIn}
          errorMessage={t('errors.invalidCredentials')}
          redirectTo="/operator"
        />
      </AuthCard>
    </div>
  )
}
