import { getTranslations } from 'next-intl/server'
import { Separator } from '@/components/ui/separator'
import { QueueRow } from '@/components/operator/QueueRow'
import type { OperatorQueueItem } from '@/lib/db/queries'

interface Props {
  items: OperatorQueueItem[]
}

/**
 * Operator queue layout — two sections: Express (top) and Standard (bottom).
 * Express orders show SLA countdowns; Standard orders show order date.
 * Server Component — data is already fetched by the parent page.
 */
export async function OperatorQueue({ items }: Props) {
  const t = await getTranslations('operator.queue')

  // Split items by tier — order from DB is already correct (Express first)
  const expressItems = items.filter((item) => item.tier === 'express')
  const standardItems = items.filter((item) => item.tier === 'standard')
  const essentialItems = items.filter((item) => item.tier === 'essential')

  return (
    <div className="space-y-6">

      {/* Express Orders section */}
      <section aria-labelledby="express-heading">
        <h2
          id="express-heading"
          className="text-[var(--text-primary)] font-semibold text-base mb-1"
        >
          {t('expressSection')}
        </h2>
        {/* Hint: explains sorting logic and SLA clock origin so operator always knows what to do next */}
        <p className="text-[var(--text-muted)] text-xs mb-3">{t('expressHint')}</p>
        <div className="bg-surface border border-[var(--border-default)] rounded-[length:var(--radius-lg)] shadow-[var(--shadow-md)] overflow-hidden">
          {expressItems.length === 0 ? (
            <p className="text-[var(--text-muted)] text-sm px-4 py-6">
              {t('emptyExpress')}
            </p>
          ) : (
            <ul role="list" className="divide-y divide-[var(--border-subtle)]">
              {expressItems.map((item) => (
                <li key={item.id}>
                  <QueueRow item={item} isExpress />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <Separator />

      {/* Standard Orders section */}
      <section aria-labelledby="standard-heading">
        <h2
          id="standard-heading"
          className="text-[var(--text-primary)] font-semibold text-base mb-1"
        >
          {t('standardSection')}
        </h2>
        <p className="text-[var(--text-muted)] text-xs mb-3">{t('standardHint')}</p>
        <div className="bg-surface border border-[var(--border-default)] rounded-[length:var(--radius-lg)] shadow-[var(--shadow-md)] overflow-hidden">
          {standardItems.length === 0 ? (
            <p className="text-[var(--text-muted)] text-sm px-4 py-6">
              {t('emptyStandard')}
            </p>
          ) : (
            <ul role="list" className="divide-y divide-[var(--border-subtle)]">
              {standardItems.map((item) => (
                <li key={item.id}>
                  <QueueRow item={item} isExpress={false} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <Separator />

      {/* Essential Orders section — no SLA, no fiscal representation */}
      <section aria-labelledby="essential-heading">
        <h2
          id="essential-heading"
          className="text-[var(--text-primary)] font-semibold text-base mb-1"
        >
          {t('essentialSection')}
        </h2>
        <p className="text-[var(--text-muted)] text-xs mb-3">{t('essentialHint')}</p>
        <div className="bg-surface border border-[var(--border-default)] rounded-[length:var(--radius-lg)] shadow-[var(--shadow-md)] overflow-hidden">
          {essentialItems.length === 0 ? (
            <p className="text-[var(--text-muted)] text-sm px-4 py-6">
              {t('emptyEssential')}
            </p>
          ) : (
            <ul role="list" className="divide-y divide-[var(--border-subtle)]">
              {essentialItems.map((item) => (
                <li key={item.id}>
                  <QueueRow item={item} isExpress={false} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

    </div>
  )
}
