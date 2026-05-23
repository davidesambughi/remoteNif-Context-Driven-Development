/**
 * Renewal page loading skeleton.
 * Mirrors the RenewalCard layout: heading line + sub-line + button placeholder.
 * animate-pulse is applied to the card container so all children pulse together.
 * Token classes only — no raw color utilities.
 */
export default function RenewalLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-md w-full mx-auto px-4 py-16">
        <div
          className="bg-[var(--bg-surface)] border border-[var(--border-default)]
                     rounded-[length:var(--radius-lg)] shadow-[var(--shadow-md)] p-8
                     animate-pulse"
        >
          {/* Heading placeholder */}
          <div className="h-7 w-48 rounded-[length:var(--radius-md)] bg-[var(--bg-subtle)] mb-2" />
          {/* Sub-line placeholder */}
          <div className="h-5 w-32 rounded-[length:var(--radius-md)] bg-[var(--bg-subtle)] mb-8" />
          {/* Button placeholder */}
          <div className="h-10 w-full rounded-[length:var(--radius-md)] bg-[var(--bg-subtle)]" />
        </div>
      </div>
    </div>
  )
}
