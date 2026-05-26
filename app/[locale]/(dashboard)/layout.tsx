import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'

// Dashboard is authenticated — suppress indexing across all child routes.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

interface Props {
  children: React.ReactNode
}

/** Locale type alias — matches next-intl config. */
type Locale = 'en' | 'fr' | 'es' | 'de'

/**
 * Dashboard shell — requires any authenticated user.
 * Redirects to /signin (locale-aware) if unauthenticated.
 * No role restriction: customers, operators, and admins may all view the dashboard.
 */
export default async function DashboardLayout({ children }: Props) {
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()])

  // Unauthenticated → locale-aware sign-in page
  if (!user) redirect({ href: '/signin', locale: locale as Locale })

  return (
    /* Background image covers the full viewport; fixed prevents scroll jitter */
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/images/dashboard-background.png')" }}
    >
      <DashboardHeader />
      <main>{children}</main>
    </div>
  )
}
