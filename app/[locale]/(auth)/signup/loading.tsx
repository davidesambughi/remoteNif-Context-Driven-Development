import { Skeleton } from '@/components/ui/skeleton'

/**
 * Sign-up page skeleton — shown while the auth page renders server-side.
 * Mirrors the centered AuthCard layout: title + two inputs + one button.
 */
export default function SignUpLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
      <div className="w-full max-w-md px-6 space-y-4">
        {/* Card title placeholder */}
        <Skeleton className="h-7 w-48" />
        {/* Email input placeholder */}
        <Skeleton className="h-10 w-full rounded-md" />
        {/* Password input placeholder */}
        <Skeleton className="h-10 w-full rounded-md" />
        {/* Submit button placeholder */}
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  )
}
