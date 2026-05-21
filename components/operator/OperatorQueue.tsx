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
  const standardItems = items.filter((item) => item.tier !== 'express')

  return (
    <div className="space-y-6">

      {/* Express Orders section */}
      <section aria-labelledby="express-heading">
        <h2
          id="express-heading"
          className="text-[var(--text-primary)] font-semibold text-base mb-3"
        >
          {t('expressSection')}
        </h2>
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

      {/* Visual separator between sections */}
      <Separator />

      {/* Standard Orders section */}
      <section aria-labelledby="standard-heading">
        <h2
          id="standard-heading"
          className="text-[var(--text-primary)] font-semibold text-base mb-3"
        >
          {t('standardSection')}
        </h2>
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

    </div>
  )
}
