import { Skeleton } from '@/components/ui/skeleton'

/**
 * Operator queue skeleton — shown while Express/Standard order data loads.
 * Mirrors the two-section layout of the real queue (Express + Standard).
 */
export default function OperatorQueueLoading() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col bg-[var(--bg-base)]">
      <main className="max-w-5xl mx-auto w-full px-6 py-12 space-y-8">
        {/* Express section placeholder */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
        {/* Standard section placeholder */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </main>
    </div>
  )
}
