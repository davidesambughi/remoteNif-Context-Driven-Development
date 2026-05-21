import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { AdminSignOutButton } from '@/components/admin/AdminSignOutButton'
import { AdminNavLinks } from '@/components/admin/AdminNavLinks'

interface Props {
  children: React.ReactNode
}

/**
 * Admin shell — requires admin role.
 * Redirects to /admin/signin if unauthenticated, to / if wrong role.
 * Single sticky header embeds brand label + tab nav + sign-out inline.
 */
export default async function AdminLayout({ children }: Props) {
  const user = await getCurrentUser()

  // Unauthenticated → dedicated admin sign-in
  if (!user) redirect('/admin/signin')

  // Wrong role → homepage (doesn't expose admin route existence)
  if (user.role !== 'admin') redirect('/')

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Single sticky admin header: brand | nav links | email + sign-out */}
      <header className="sticky top-0 z-50 bg-surface border-b border-border-default">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center">
          {/* Brand label — hidden on small screens to make room for nav links */}
          <span className="hidden sm:block font-semibold text-sm text-text-primary flex-none">
            RemoteNIF Admin
          </span>

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
    </div>
  )
}
