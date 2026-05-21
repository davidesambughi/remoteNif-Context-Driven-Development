import { Skeleton } from '@/components/ui/skeleton'

/**
 * Operator submitted archive skeleton — shown while the submitted orders list loads.
 * Mirrors the single-table layout of the real archive view.
 */
export default function OperatorSubmittedLoading() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col bg-[var(--bg-base)]">
      <main className="max-w-5xl mx-auto w-full px-6 py-12 space-y-4">
        {/* Page heading placeholder */}
        <Skeleton className="h-5 w-48" />
        {/* Table row placeholders */}
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </main>
    </div>
  )
}
