import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { SlaCountdown } from '@/components/admin/SlaCountdown'
import type { AdminOrderDetail } from '@/lib/db/queries'

interface OrderDetailHeaderProps {
  order: AdminOrderDetail
}

export async function OrderDetailHeader({ order }: OrderDetailHeaderProps) {
  const t = await getTranslations('admin.detail')

  const statusColors: Record<string, string> = {
    documents_pending: 'bg-warning-subtle text-warning border-warning',
    documents_under_review: 'bg-info/10 text-info border-info/20',
    documents_approved: 'bg-success-subtle text-success border-success',
    submitted: 'bg-brand-primary-dim text-brand-primary border-brand-primary/20',
    delivered: 'bg-success text-on-accent border-transparent',
  }

  const tierColors: Record<string, string> = {
    essential: 'bg-subtle text-secondary',
    standard: 'bg-brand-primary-dim text-brand-primary',
    express: 'bg-brand-primary text-on-accent',
  }

  return (
    <Card className="bg-surface border-[var(--border-default)] rounded-lg p-6 mb-6 shadow-[var(--shadow-md)]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              {order.fullName || 'Unnamed Customer'}
            </h1>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${tierColors[order.tier]}`}>
              {order.tier.toUpperCase()}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[order.status]}`}>
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wider">
              {t('orderId')}: {order.id.split('-')[0]}...
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-8 text-sm">
          <div className="flex flex-col">
            <span className="text-[var(--text-muted)] text-xs uppercase font-medium mb-1">{t('ordered')}</span>
            <span className="text-[var(--text-secondary)] font-medium">
              {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[var(--text-muted)] text-xs uppercase font-medium mb-1">{t('customerEmail')}</span>
            <span className="text-[var(--text-secondary)] font-medium">
              {order.customerEmail}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[var(--text-muted)] text-xs uppercase font-medium mb-1">{t('payment')}</span>
            <span className="text-[var(--text-secondary)] font-medium">
              {order.paymentAmountCents 
                ? `${(order.paymentAmountCents / 100).toFixed(2)}€`
                : '—'} 
              {' '}({order.paymentStatus?.toUpperCase() || 'UNKNOWN'})
            </span>
          </div>
        </div>

        {order.tier === 'express' && order.status === 'documents_approved' && order.documentsApprovedAt && (
          <div className="pt-4 mt-2 border-t border-[var(--border-subtle)] flex items-center gap-3">
            <span className="text-sm font-semibold text-[var(--text-primary)]">{t('slaRemaining')}</span>
            <SlaCountdown documentsApprovedAt={new Date(order.documentsApprovedAt).toISOString()} />
          </div>
        )}
      </div>
    </Card>
  )
}
