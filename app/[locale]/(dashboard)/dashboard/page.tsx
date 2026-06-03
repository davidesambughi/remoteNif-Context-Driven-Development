import { Suspense } from 'react'
import { getLocale } from 'next-intl/server'
import { getCurrentUser } from '@/lib/auth/session'
import { redirect } from '@/i18n/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardContent } from '@/components/dashboard/DashboardContent'
import { CheckoutResumer } from '@/components/dashboard/CheckoutResumer'
import { WebhookPoller } from '@/components/dashboard/WebhookPoller'

/**
 * Main Customer Dashboard — thin shell with streaming.
 *
 * Architecture: auth resolves first (layout already checked it, React cache deduplicates
 * the call), then this page renders a static shell immediately. The slow DB queries
 * (getUserActiveOrder, documents, POA URL) are pushed into <DashboardContent> which
 * streams in once its data resolves, showing the skeleton in the meantime.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // getCurrentUser() is wrapped in React cache() — the layout already resolved this,
  // so this call is free (no extra DB hit). We need it here to pass userId to DashboardContent.
  const [user, locale, resolvedSearchParams] = await Promise.all([
    getCurrentUser(),
    getLocale(),
    searchParams,
  ])

  // Guard: layout already redirects, but keep this for type narrowing.
  if (!user) {
    redirect({ href: '/signin', locale: locale as 'en' | 'fr' | 'es' | 'de' })
    return null
  }

  // Feature 22b: If we are in a resume flow, hide the main dashboard content
  // to avoid a 'flash' of empty state before the redirect to Stripe.
  const isResuming = !!resolvedSearchParams.checkout_tier

  return (
    /* Outer wrapper fills remaining viewport height below the sticky header */
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      {/* Feature 22b: Detects ?checkout_tier=... and resumes the Stripe flow if needed */}
      <Suspense>
        <CheckoutResumer />
      </Suspense>

      {/* Finding 1: Detects ?session_id=... post-Stripe redirect and polls for the order */}
      <Suspense>
        <WebhookPoller />
      </Suspense>

      {!isResuming && (
        <main className="flex-1 w-full max-w-4xl mx-auto p-[length:var(--space-6)] py-[length:var(--space-12)]">
          {/*
           * Glass card — white/semi-transparent with backdrop-blur so the content
           * stays legible regardless of what the background image shows behind it.
           *
           * Suspense boundary: streams the static shell immediately, then injects
           * the order/document content once DashboardContent's DB queries resolve.
           * Fallback matches the existing loading.tsx skeleton shape.
           */}
          <div className="bg-white/80 backdrop-blur-xl rounded-[length:var(--radius-2xl)] border border-white/50 shadow-xl p-[length:var(--space-8)] space-y-[length:var(--space-10)]">
            <Suspense fallback={<DashboardSkeleton />}>
              <DashboardContent userId={user.id} />
            </Suspense>
          </div>
        </main>
      )}
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
