import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8">
      <Skeleton className="h-6 w-32 mb-4 bg-subtle" />

      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <Skeleton className="h-40 w-full rounded-lg bg-subtle" />

          {/* Document Card Skeletons */}
          <Skeleton className="h-64 w-full rounded-lg bg-subtle" />
          <Skeleton className="h-64 w-full rounded-lg bg-subtle" />
          <Skeleton className="h-64 w-full rounded-lg bg-subtle" />
        </div>

        <div className="space-y-4 mt-8 lg:mt-0">
          <Skeleton className="h-48 w-full rounded-lg bg-subtle" />
          <Skeleton className="h-64 w-full rounded-lg bg-subtle" />
          <Skeleton className="h-48 w-full rounded-lg bg-subtle" />
        </div>
      </div>
    </div>
  )
}
