import { Skeleton } from '@/components/ui/skeleton'

/**
 * Dashboard Loading State.
 * Provides a skeleton layout for the dashboard while user and order data are streaming.
 */
export default function DashboardLoading() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-[var(--bg-base)]">
      <main className="flex-1 w-full max-w-4xl mx-auto p-[length:var(--space-6)] py-[length:var(--space-12)] space-y-[length:var(--space-8)]">
        <div className="space-y-[length:var(--space-2)]">
          <Skeleton className="h-10 w-48" />
        </div>
        
        <Skeleton className="h-[250px] w-full rounded-[length:var(--radius-xl)]" />
      </main>
    </div>
  )
}
