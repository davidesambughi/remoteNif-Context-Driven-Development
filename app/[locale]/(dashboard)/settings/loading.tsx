import { Skeleton } from '@/components/ui/skeleton'

/**
 * Settings page skeleton — mirrors the three-card layout so there is no
 * content shift when the page data resolves.
 */
export default function SettingsLoading() {
  return (
    <div className="max-w-xl mx-auto px-[length:var(--space-6)] py-[length:var(--space-12)]">
      {/* Page title skeleton */}
      <Skeleton className="mb-[length:var(--space-8)] h-9 w-48" />

      <div className="flex flex-col gap-[length:var(--space-8)]">
        {/* Change Email card skeleton */}
        <SettingsCardSkeleton rows={2} />
        {/* Change Password card skeleton */}
        <SettingsCardSkeleton rows={3} />
        {/* Delete Account card skeleton */}
        <SettingsCardSkeleton rows={0} />
        {/* Language Preference card skeleton — 1 row for the select field */}
        <SettingsCardSkeleton rows={1} />
      </div>
    </div>
  )
}

/** Reusable card skeleton — heading + description + N input rows + button */
function SettingsCardSkeleton({ rows }: { rows: number }) {
  return (
    <div className="rounded-[length:var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-[length:var(--space-6)] shadow-[var(--shadow-md)]">
      {/* Card heading */}
      <Skeleton className="mb-2 h-6 w-36" />
      {/* Card description */}
      <Skeleton className="mb-[length:var(--space-6)] h-4 w-full max-w-sm" />

      {/* Input field skeletons */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="mb-[length:var(--space-4)]">
          <Skeleton className="mb-1.5 h-4 w-28" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}

      {/* Submit button skeleton */}
      <Skeleton className="mt-2 h-10 w-36" />
    </div>
  )
}
