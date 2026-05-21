import { getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getSubmittedOrders } from '@/lib/db/queries'
import { formatSubmissionDate } from '@/lib/utils/dates'

/**
 * Operator archive — read-only list of all submitted orders, newest first.
 * Auth is enforced by the parent (operator) layout — no role check needed here.
 */
export default async function SubmittedOrdersPage() {
  const [orders, t] = await Promise.all([
    getSubmittedOrders(),
    getTranslations('operator.submitted'),
  ])

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
      <h1 className="text-[var(--text-primary)] text-2xl font-bold mb-8">
        {t('title')}
      </h1>

      {orders.length === 0 ? (
        // Empty state — centered, muted
        <p className="text-[var(--text-muted)] text-sm text-center py-16">
          {t('empty')}
        </p>
      ) : (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
          {/* Table header — hidden on mobile, shown on sm+ */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_120px_180px_120px] gap-4 px-4 py-3 text-[var(--text-muted)] text-xs font-medium uppercase tracking-wide">
            <span>{t('columns.customer')}</span>
            <span>{t('columns.tier')}</span>
            <span>{t('columns.submitted')}</span>
            <span>{t('columns.orderId')}</span>
          </div>

          <Separator />

          {/* Order rows */}
          {orders.map((order, index) => (
            <div key={order.id}>
              <div className="flex flex-col gap-1 px-4 py-4 sm:grid sm:grid-cols-[1fr_120px_180px_120px] sm:items-center sm:gap-4">
                {/* Customer name */}
                <p className="text-[var(--text-primary)] font-medium text-sm">
                  {order.fullName ?? '—'}
                </p>

                {/* Tier badge — matches the QueueRow pattern */}
                <div>
                  {order.tier === 'express' ? (
                    <Badge className="bg-warning text-on-accent border-0 text-xs">
                      Express
                    </Badge>
                  ) : order.tier === 'standard' ? (
                    <Badge variant="secondary" className="text-xs">
                      Standard
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Essential
                    </Badge>
                  )}
                </div>

                {/* Submission timestamp — formatted via lib/utils/dates.ts */}
                <p className="text-[var(--text-secondary)] text-sm">
                  {formatSubmissionDate(order.submittedToFinancasAt)}
                </p>

                {/* Short order ID — first 8 chars of UUID, monospace for readability */}
                <p className="font-mono text-[var(--text-muted)] text-xs">
                  {order.id.slice(0, 8)}
                </p>
              </div>

              {/* Row divider — not shown after the last row */}
              {index < orders.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
