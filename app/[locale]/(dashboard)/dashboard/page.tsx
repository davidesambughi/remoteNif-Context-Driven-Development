import { getTranslations } from 'next-intl/server'
import { getCurrentUser } from '@/lib/auth/session'
import { redirect } from '@/i18n/navigation'
import { CheckCircle2 } from 'lucide-react'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const [t, user, locale] = await Promise.all([
    getTranslations('dashboard'),
    getCurrentUser(),
    import('next-intl/server').then((m) => m.getLocale()),
  ])

  if (!user) {
    redirect({ href: '/signin', locale: locale as 'en' | 'fr' | 'es' | 'de' })
  }

  const { session_id } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] px-4">
      <div className="max-w-md w-full text-center space-y-[length:var(--space-6)]">
        {session_id && (
          <div className="flex flex-col items-center gap-[length:var(--space-4)] p-[length:var(--space-8)] rounded-[length:var(--radius-xl)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
            <CheckCircle2 className="h-12 w-12 text-[var(--status-success)]" />
            <h1 className="text-[length:var(--text-2xl)] font-[number:var(--font-bold)] text-[var(--text-primary)]">
              {t('checkoutSuccess.title')}
            </h1>
            <p className="text-[length:var(--text-base)] text-[var(--text-secondary)]">
              {t('checkoutSuccess.description')}
            </p>
          </div>
        )}
        {!session_id && (
          <div>
            <h1 className="text-[length:var(--text-2xl)] font-[number:var(--font-bold)] text-[var(--text-primary)]">
              Dashboard
            </h1>
            <p className="text-[length:var(--text-base)] text-[var(--text-secondary)] mt-[length:var(--space-2)]">
              Dashboard content coming soon.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
