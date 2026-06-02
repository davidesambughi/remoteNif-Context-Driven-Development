import { getTranslations } from 'next-intl/server'
import { getOperatorQueue } from '@/lib/db/queries'
import { OperatorQueue } from '@/components/operator/OperatorQueue'

/**
 * Operator queue page — shows all orders awaiting ebalcão submission.
 * Express orders appear first, sorted by SLA urgency. Standard orders follow FIFO.
 * Auth is enforced by the parent (operator) layout — no check needed here.
 */
export default async function OperatorQueuePage() {
  const [items, t] = await Promise.all([
    getOperatorQueue(),
    getTranslations('operator.queue'),
  ])

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
      <h1 className="text-[var(--text-primary)] text-2xl font-bold mb-8">
        {t('title')}
        <span className="text-[var(--text-muted)] text-sm font-normal ml-2">
          - Orders approved and ready to submit to ebalcão. Express first, then Standard and Essential.
        </span>
      </h1>
      <OperatorQueue items={items} />
    </div>
  )
}
