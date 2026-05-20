import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { AdminSignOutButton } from '@/components/admin/AdminSignOutButton'

interface Props {
  children: React.ReactNode
}

/** Admin shell — requires admin role. Redirects to /admin/signin if unauthenticated. */
export default async function AdminLayout({ children }: Props) {
  const user = await getCurrentUser()

  // Unauthenticated → dedicated admin sign-in
  if (!user) redirect('/admin/signin')

  // Wrong role → homepage (doesn't expose admin route existence)
  if (user.role !== 'admin') redirect('/')

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Admin top bar */}
      <header className="bg-surface border-b border-[var(--border-default)] px-6 h-14 flex items-center justify-between">
        <span className="text-[var(--text-primary)] font-semibold text-sm">
          RemoteNIF Admin
        </span>
        <div className="flex items-center gap-4">
          <span className="text-[var(--text-muted)] text-sm hidden sm:block">
            {user.email}
          </span>
          <AdminSignOutButton />
        </div>
      </header>

      {/* Page content */}
      <main>{children}</main>
    </div>
  )
}
