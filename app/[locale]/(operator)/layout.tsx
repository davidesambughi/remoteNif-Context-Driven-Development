import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { Toaster } from '@/components/ui/sonner'
import { OperatorSignOutButton } from '@/components/operator/OperatorSignOutButton'
import { OperatorNavLinks } from '@/components/operator/OperatorNavLinks'

// Operator panel is an internal tool — suppress indexing across all child routes.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

interface Props {
  children: React.ReactNode
}

/**
 * Operator shell — requires operator role.
 * Redirects to /operator/signin if unauthenticated, to / if wrong role.
 * Single sticky header embeds brand label + tab nav + sign-out inline.
 */
type Locale = 'en' | 'fr' | 'es' | 'de'

export default async function OperatorLayout({ children }: Props) {
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()])
  const l = locale as Locale

  // Unauthenticated → dedicated operator sign-in
  if (!user) return redirect({ href: '/operator/signin', locale: l })

  // Wrong role → homepage (doesn't expose operator route existence)
  if (user.role !== 'operator') return redirect({ href: '/', locale: l })

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Single sticky operator header: brand | nav links | email + sign-out */}
      <header className="sticky top-0 z-50 bg-surface border-b border-border-default overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center">
          {/* Brand logo — links back to homepage */}
          <Link href="/" className="flex-none hover:opacity-80 transition-[var(--transition-base)]">
            <Image
              src="/images/logo.png"
              alt="RemoteNIF"
              height={96}
              width={288}
              className="h-24 w-auto block [mix-blend-mode:multiply]"
            />
          </Link>

          {/* Tab nav: Queue / Archive / Preferences */}
          <OperatorNavLinks />

          {/* Right side: email address + sign-out */}
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden sm:block text-sm text-text-muted">{user.email}</span>
            <OperatorSignOutButton />
          </div>
        </div>
      </header>

      {/* Page content */}
      <main>{children}</main>

      {/* Sonner toast container — operator-scoped */}
      <Toaster richColors position="bottom-right" />

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
