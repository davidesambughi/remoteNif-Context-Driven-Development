import { Suspense } from 'react'
import { getLocale } from 'next-intl/server'
import { getCurrentUser } from '@/lib/auth/session'
import { redirect } from '@/i18n/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardContent } from '@/components/dashboard/DashboardContent'

/**
 * Main Customer Dashboard — thin shell with streaming.
 *
 * Architecture: auth resolves first (layout already checked it, React cache deduplicates
 * the call), then this page renders a static shell immediately. The slow DB queries
 * (getUserActiveOrder, documents, POA URL) are pushed into <DashboardContent> which
 * streams in once its data resolves, showing the skeleton in the meantime.
 *
 * This means the user sees the page header and layout instantly rather than waiting
 * for the order query before anything renders.
 */
export default async function DashboardPage() {
  // getCurrentUser() is wrapped in React cache() — the layout already resolved this,
  // so this call is free (no extra DB hit). We need it here to pass userId to DashboardContent.
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()])

  // Guard: layout already redirects, but keep this for type narrowing.
  if (!user) {
    redirect({ href: '/signin', locale: locale as 'en' | 'fr' | 'es' | 'de' })
    return null
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-[var(--bg-base)]">
      <main className="flex-1 w-full max-w-4xl mx-auto p-[length:var(--space-6)] py-[length:var(--space-12)] space-y-[length:var(--space-10)]">
        {/*
         * Suspense boundary: streams the static shell immediately, then injects
         * the order/document content once DashboardContent's DB queries resolve.
         * Fallback matches the existing loading.tsx skeleton shape.
         */}
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent userId={user.id} />
        </Suspense>
      </main>
    </div>
  )
}

/** Inline skeleton — mirrors loading.tsx, used as the Suspense fallback. */
function DashboardSkeleton() {
  return (
    <div className="space-y-[length:var(--space-8)]">
      <div className="space-y-[length:var(--space-2)]">
        <Skeleton className="h-10 w-48" />
      </div>
      <Skeleton className="h-[250px] w-full rounded-[length:var(--radius-xl)]" />
    </div>
  )
}
