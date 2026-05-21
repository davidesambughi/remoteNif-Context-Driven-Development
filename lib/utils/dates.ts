/**
 * Date formatting utilities.
 * All date formatting in the app goes through here — never inline in components.
 */

/**
 * Formats a submission timestamp for display in the operator archive.
 * Example output: "12 Jan 2026, 14:30"
 */
export function formatSubmissionDate(date: Date): string {
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
