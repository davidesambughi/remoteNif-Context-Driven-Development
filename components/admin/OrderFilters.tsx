'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { usePathname } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SelectOrder } from '@/lib/db/schema'

interface Props {
  currentStatus?: SelectOrder['status']
  currentTier?: SelectOrder['tier']
}

const STATUS_VALUES: SelectOrder['status'][] = [
  'documents_pending',
  'documents_under_review',
  'documents_approved',
  'submitted',
  'delivered',
]

const TIER_VALUES: SelectOrder['tier'][] = ['essential', 'standard', 'express']

// Sentinel value for "show all" — shadcn Select requires a non-empty string value
const ALL = '__all__'

/** Status and tier filter bar — updates URL search params, triggers server re-render. */
export function OrderFilters({ currentStatus, currentTier }: Props) {
  const t = useTranslations('admin')
  const router = useRouter()
  const pathname = usePathname()

  // Explicit label maps — next-intl requires literal key strings
  const statusLabels: Record<SelectOrder['status'], string> = {
    documents_pending: t('statuses.documents_pending'),
    documents_under_review: t('statuses.documents_under_review'),
    documents_approved: t('statuses.documents_approved'),
    submitted: t('statuses.submitted'),
    delivered: t('statuses.delivered'),
  }
  const tierLabels: Record<SelectOrder['tier'], string> = {
    essential: t('tiers.essential'),
    standard: t('tiers.standard'),
    express: t('tiers.express'),
  }

  function update(key: 'status' | 'tier', value: string) {
    const params = new URLSearchParams()
    const effectiveValue = value === ALL ? '' : value
    if (key === 'status') {
      if (effectiveValue) params.set('status', effectiveValue)
      if (currentTier) params.set('tier', currentTier)
    } else {
      if (currentStatus) params.set('status', currentStatus)
      if (effectiveValue) params.set('tier', effectiveValue)
    }
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <Select value={currentStatus ?? ALL} onValueChange={(v) => update('status', v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t('filters.allStatuses')}</SelectItem>
          {STATUS_VALUES.map((s) => (
            <SelectItem key={s} value={s}>
              {statusLabels[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentTier ?? ALL} onValueChange={(v) => update('tier', v)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t('filters.allTiers')}</SelectItem>
          {TIER_VALUES.map((tier) => (
            <SelectItem key={tier} value={tier}>
              {tierLabels[tier]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
