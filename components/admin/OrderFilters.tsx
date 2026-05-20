'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { usePathname } from 'next/navigation'

interface Props {
  currentStatus?: string
  currentTier?: string
}

const STATUS_VALUES = [
  'documents_pending',
  'documents_under_review',
  'documents_approved',
  'submitted',
  'delivered',
] as const

const TIER_VALUES = ['essential', 'standard', 'express'] as const

/** Status and tier filter bar — updates URL search params, triggers server re-render. */
export function OrderFilters({ currentStatus, currentTier }: Props) {
  const t = useTranslations('admin')
  const router = useRouter()
  const pathname = usePathname()

  // Explicit label maps — next-intl requires literal key strings
  const statusLabels: Record<(typeof STATUS_VALUES)[number], string> = {
    documents_pending: t('statuses.documents_pending'),
    documents_under_review: t('statuses.documents_under_review'),
    documents_approved: t('statuses.documents_approved'),
    submitted: t('statuses.submitted'),
    delivered: t('statuses.delivered'),
  }
  const tierLabels: Record<(typeof TIER_VALUES)[number], string> = {
    essential: t('tiers.essential'),
    standard: t('tiers.standard'),
    express: t('tiers.express'),
  }

  function update(key: 'status' | 'tier', value: string) {
    const params = new URLSearchParams()
    if (key === 'status') {
      if (value) params.set('status', value)
      if (currentTier) params.set('tier', currentTier)
    } else {
      if (currentStatus) params.set('status', currentStatus)
      if (value) params.set('tier', value)
    }
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const selectClass =
    'bg-surface border border-[var(--border-default)] rounded-md px-3 py-1.5 text-sm text-[var(--text-primary)] cursor-pointer focus:outline-none focus:border-[var(--brand-primary)]'

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <select
        value={currentStatus ?? ''}
        onChange={(e) => update('status', e.target.value)}
        className={selectClass}
      >
        <option value="">{t('filters.allStatuses')}</option>
        {STATUS_VALUES.map((s) => (
          <option key={s} value={s}>
            {statusLabels[s]}
          </option>
        ))}
      </select>

      <select
        value={currentTier ?? ''}
        onChange={(e) => update('tier', e.target.value)}
        className={selectClass}
      >
        <option value="">{t('filters.allTiers')}</option>
        {TIER_VALUES.map((tier) => (
          <option key={tier} value={tier}>
            {tierLabels[tier]}
          </option>
        ))}
      </select>
    </div>
  )
}
