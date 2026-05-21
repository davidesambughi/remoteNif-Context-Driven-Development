import { Skeleton } from '@/components/ui/skeleton'

/**
 * Operator preferences skeleton — shown while notification settings load.
 * Mirrors the heading + two toggle rows of the real preferences form.
 */
export default function OperatorPreferencesLoading() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col bg-[var(--bg-base)]">
      <main className="max-w-5xl mx-auto w-full px-6 py-12 space-y-4">
        {/* Page heading placeholder */}
        <Skeleton className="h-6 w-40" />
        {/* Toggle row placeholders (email + SMS notification toggles) */}
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </main>
    </div>
  )
}
