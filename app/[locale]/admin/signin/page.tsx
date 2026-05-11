import { getTranslations } from 'next-intl/server'
import AuthCard from '@/components/auth/AuthCard'
import InternalSignInForm from '@/components/auth/InternalSignInForm'
import { adminSignIn } from '@/app/actions/auth'

// Admin sign-in — URL: /admin/signin
// No shared auth layout — renders its own full-page shell so admin routes can have their own layout later.
export default async function AdminSignInPage() {
  const t = await getTranslations('auth.admin.signIn')

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center px-[length:var(--space-4)]">
      <AuthCard title={t('title')}>
        <InternalSignInForm
          actionFn={adminSignIn}
          errorMessage={t('errors.invalidCredentials')}
          redirectTo="/admin"
        />
      </AuthCard>
    </div>
  )
}
