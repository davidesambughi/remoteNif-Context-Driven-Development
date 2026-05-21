/**
 * Pure SLA computation utilities for the operator queue.
 * Extracted here so they can be unit-tested independently of the React component.
 */

export const SLA_MS = 48 * 60 * 60 * 1000 // 48 hours in ms

/** Returns milliseconds remaining until the 48h SLA deadline. Negative means overdue. */
export function getRemainingMs(documentsApprovedAt: string | Date): number {
  const approvedTime =
    typeof documentsApprovedAt === 'string'
      ? new Date(documentsApprovedAt).getTime()
      : documentsApprovedAt.getTime()
  return approvedTime + SLA_MS - Date.now()
}

/**
 * Maps remaining milliseconds to the correct Tailwind color class.
 * Thresholds:
 *   > 24 h  → green  (safe)
 *   8–24 h  → amber  (warning)
 *   < 8 h   → red    (danger)
 *   ≤ 0     → red bold (overdue)
 */
export function getColorClass(remainingMs: number): string {
  if (remainingMs <= 0) return 'text-error font-bold'
  const hours = remainingMs / 3_600_000
  if (hours > 24) return 'text-success font-medium'
  if (hours >= 8) return 'text-warning font-medium'
  return 'text-error font-medium'
}

/** Formats remaining ms as "{Xh Ym}" string. Returns null if overdue. */
export function formatRemaining(remainingMs: number): { hours: number; minutes: number } | null {
  if (remainingMs <= 0) return null
  const totalMinutes = Math.floor(remainingMs / 60_000)
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  }
}
