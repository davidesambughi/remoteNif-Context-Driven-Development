import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
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
export default async function OperatorLayout({ children }: Props) {
  const user = await getCurrentUser()

  // Unauthenticated → dedicated operator sign-in
  if (!user) redirect('/operator/signin')

  // Wrong role → homepage (doesn't expose operator route existence)
  if (user.role !== 'operator') redirect('/')

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Single sticky operator header: brand | nav links | email + sign-out */}
      <header className="sticky top-0 z-50 bg-surface border-b border-border-default">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center">
          {/* Brand label — hidden on small screens to make room for nav links */}
          <span className="hidden sm:block font-semibold text-sm text-text-primary flex-none">
            RemoteNIF Operator
          </span>

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
    </div>
  )
}
