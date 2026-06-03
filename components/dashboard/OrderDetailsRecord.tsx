import { useTranslations } from 'next-intl'

interface OrderDetailsRecordProps {
  referenceId: string
  tier: 'essential' | 'standard' | 'express'
  orderDate: string
  deliveredDate: string
}

/**
 * OrderDetailsRecord — static server component that renders the 4-field
 * order summary in the delivered state. Data and formatted dates come from
 * DashboardContent; no fetching or interactivity here.
 */
export function OrderDetailsRecord({ referenceId, tier, orderDate, deliveredDate }: OrderDetailsRecordProps) {
  const t = useTranslations('dashboard.states.delivered')

  const fields = [
    { label: t('orderRecord.reference'), value: referenceId, mono: true },
    { label: t('orderRecord.plan'), value: t(`orderRecord.tiers.${tier}`), mono: false },
    { label: t('orderRecord.orderDate'), value: orderDate, mono: false },
    { label: t('orderRecord.deliveredDate'), value: deliveredDate, mono: false },
  ]

  return (
    <div className="w-full pt-[length:var(--space-2)]">
      <div className="text-[length:var(--text-xs)] text-text-secondary uppercase tracking-widest font-[number:var(--font-bold)] mb-[length:var(--space-4)]">
        {t('orderRecord.title')}
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-[length:var(--space-6)] gap-y-[length:var(--space-4)]">
        {fields.map(({ label, value, mono }) => (
          <div key={label} className="flex flex-col gap-[length:var(--space-1)]">
            <dt className="text-[length:var(--text-xs)] text-text-muted uppercase tracking-widest font-[number:var(--font-bold)]">
              {label}
            </dt>
            <dd
              className={`text-[length:var(--text-sm)] text-text-primary font-[number:var(--font-medium)]${mono ? ' font-mono' : ''}`}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
