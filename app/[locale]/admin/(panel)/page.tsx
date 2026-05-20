import { z } from 'zod'
import { getTranslations } from 'next-intl/server'
import { getAdminOrderList } from '@/lib/db/queries'
import { OrderFilters } from '@/components/admin/OrderFilters'
import { OrderRow } from '@/components/admin/OrderRow'
import { SlaCountdown } from '@/components/admin/SlaCountdown'
import type { SelectOrder } from '@/lib/db/schema'

// Validates URL search params — invalid values are silently discarded
const AdminOrderFiltersSchema = z.object({
  status: z
    .enum([
      'documents_pending',
      'documents_under_review',
      'documents_approved',
      'submitted',
      'delivered',
    ])
    .optional(),
  tier: z.enum(['essential', 'standard', 'express']).optional(),
})

interface Props {
  searchParams: Promise<{ status?: string; tier?: string }>
}

/** Admin order list page — shows all orders with status, tier, and Express SLA countdowns. */
export default async function AdminOrderListPage({ searchParams }: Props) {
  const [rawParams, t] = await Promise.all([
    searchParams,
    getTranslations('admin'),
  ])

  // Validate search params — unknown values fall back to undefined
  const parsed = AdminOrderFiltersSchema.safeParse(rawParams)
  const filters = parsed.success ? parsed.data : {}

  const orders = await getAdminOrderList(
    filters as { status?: SelectOrder['status']; tier?: SelectOrder['tier'] },
  )

  // Build label maps upfront — next-intl requires literal key strings, not template literals
  const tierLabels: Record<string, string> = {
    essential: t('tiers.essential'),
    standard: t('tiers.standard'),
    express: t('tiers.express'),
  }
  const statusLabels: Record<SelectOrder['status'], string> = {
    documents_pending: t('statuses.documents_pending'),
    documents_under_review: t('statuses.documents_under_review'),
    documents_approved: t('statuses.documents_approved'),
    submitted: t('statuses.submitted'),
    delivered: t('statuses.delivered'),
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
      <h1 className="text-[var(--text-primary)] text-2xl font-bold mb-6">{t('title')}</h1>

      <OrderFilters currentStatus={filters.status} currentTier={filters.tier} />

      {/* overflow-x-auto lets the table scroll horizontally on narrow screens */}
      <div className="bg-surface border border-[var(--border-default)] rounded-lg overflow-x-auto shadow-[var(--shadow-md)]">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-subtle text-[var(--text-muted)] text-xs font-medium uppercase tracking-wide">
              <th className="px-4 py-3 text-left">{t('columns.customer')}</th>
              <th className="px-4 py-3 text-left">{t('columns.tier')}</th>
              <th className="px-4 py-3 text-left">{t('columns.status')}</th>
              <th className="px-4 py-3 text-left">{t('columns.ordered')}</th>
              <th className="px-4 py-3 text-left">{t('columns.sla')}</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-[var(--text-muted)] text-sm py-12 text-center">
                  {t('emptyState')}
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const isExpressApproved =
                  order.tier === 'express' && order.status === 'documents_approved'

                return (
                  <OrderRow
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className={[
                      'border-t border-[var(--border-subtle)] hover:bg-subtle cursor-pointer transition-[var(--transition-fast)]',
                      isExpressApproved ? 'border-l-4 border-l-warning' : '',
                    ]
                      .join(' ')
                      .trim()}
                  >
                    {/* Customer */}
                    <td className="px-4 py-3">
                      <div className="text-[var(--text-primary)] font-medium">
                        {order.fullName ?? '—'}
                      </div>
                      <div className="text-[var(--text-muted)] text-xs">{order.email}</div>
                    </td>

                    {/* Tier */}
                    <td className="px-4 py-3">
                      <TierBadge tier={order.tier} label={tierLabels[order.tier] ?? order.tier} />
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={order.status as SelectOrder['status']}
                        label={statusLabels[order.status as SelectOrder['status']] ?? order.status}
                      />
                    </td>

                    {/* Ordered date */}
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {order.createdAt.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* SLA countdown — Express approved only */}
                    <td className="px-4 py-3">
                      {isExpressApproved && order.documentsApprovedAt ? (
                        <SlaCountdown
                          documentsApprovedAt={order.documentsApprovedAt.toISOString()}
                        />
                      ) : (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                  </OrderRow>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Badge sub-components — inline since they're only used here
// ---------------------------------------------------------------------------

function TierBadge({ tier, label }: { tier: string; label: string }) {
  const classMap: Record<string, string> = {
    essential: 'bg-subtle text-[var(--text-secondary)]',
    standard: 'bg-brand-primary-dim text-brand-primary',
    express: 'bg-warning-subtle text-warning',
  }
  const cls = classMap[tier] ?? 'bg-subtle text-[var(--text-secondary)]'
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}

function StatusBadge({ status, label }: { status: SelectOrder['status']; label: string }) {
  const classMap: Record<SelectOrder['status'], string> = {
    documents_pending: 'bg-subtle text-[var(--text-muted)]',
    documents_under_review: 'bg-subtle text-info',
    documents_approved: 'bg-warning-subtle text-warning',
    submitted: 'bg-success-subtle text-success',
    delivered: 'bg-success text-on-accent',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${classMap[status]}`}>
      {label}
    </span>
  )
}
