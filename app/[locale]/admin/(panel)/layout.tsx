import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { AdminSignOutButton } from '@/components/admin/AdminSignOutButton'
import { AdminNavLinks } from '@/components/admin/AdminNavLinks'

// Admin panel is an internal tool — suppress indexing across all child routes.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

interface Props {
  children: React.ReactNode
}

/**
 * Admin shell — requires admin role.
 * Redirects to /admin/signin if unauthenticated, to / if wrong role.
 * Single sticky header embeds brand label + tab nav + sign-out inline.
 */
type Locale = 'en' | 'fr' | 'es' | 'de'

export default async function AdminLayout({ children }: Props) {
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()])
  const l = locale as Locale

  // Unauthenticated → dedicated admin sign-in
  if (!user) return redirect({ href: '/admin/signin', locale: l })

  // Wrong role → homepage (doesn't expose admin route existence)
  if (user.role !== 'admin') return redirect({ href: '/', locale: l })

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Single sticky admin header: brand | nav links | email + sign-out */}
      <header className="sticky top-0 z-50 bg-surface border-b border-border-default overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center">
          {/* Brand logo — links back to homepage */}
          <Link href="/" className="flex-none hover:opacity-80 transition-[var(--transition-base)]">
            <img
              src="/images/logo.png"
              alt="RemoteNIF"
              className="h-24 w-auto block [mix-blend-mode:multiply]"
            />
          </Link>

          {/* Tab nav: Orders (and future items) */}
          <AdminNavLinks />

          {/* Right side: email address + sign-out */}
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden sm:block text-sm text-text-muted">{user.email}</span>
            <AdminSignOutButton />
          </div>
        </div>
      </header>

      {/* Page content */}
      <main>{children}</main>

      {/* Decorative logo watermark — fixed, centered, purely visual */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none select-none z-0" aria-hidden="true">
        <Image
          src="/images/logo.png"
          alt=""
          width={480}
          height={160}
          className="opacity-[0.07] [mix-blend-mode:multiply]"
          style={{ height: 'auto' }}
        />
      </div>
    </div>
  )
}
