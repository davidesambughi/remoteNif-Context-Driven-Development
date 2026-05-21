import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { Toaster } from '@/components/ui/sonner'
import { OperatorSignOutButton } from '@/components/operator/OperatorSignOutButton'
import { OperatorNav } from '@/components/operator/OperatorNav'

interface Props {
  children: React.ReactNode
}

/** Operator shell — requires operator role. Redirects to /operator/signin if unauthenticated. */
export default async function OperatorLayout({ children }: Props) {
  const user = await getCurrentUser()

  // Unauthenticated → dedicated operator sign-in
  if (!user) redirect('/operator/signin')

  // Wrong role → homepage (doesn't expose operator route existence)
  if (user.role !== 'operator') redirect('/')

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Operator top bar */}
      <header className="bg-surface border-b border-[var(--border-default)] px-6 h-14 flex items-center justify-between">
        <span className="text-[var(--text-primary)] font-semibold text-sm">
          RemoteNIF Operator
        </span>
        <div className="flex items-center gap-4">
          <span className="text-[var(--text-muted)] text-sm hidden sm:block">
            {user.email}
          </span>
          <OperatorSignOutButton />
        </div>
      </header>

      {/* Section nav — Queue / Archive / Preferences */}
      <OperatorNav />

      {/* Page content */}
      <main>{children}</main>

      {/* Sonner toast container — operator-scoped */}
      <Toaster richColors position="bottom-right" />
    </div>
  )
}
