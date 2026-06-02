'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { SlaCountdown } from '@/components/operator/SlaCountdown'
import { markOrderAsSubmitted } from '@/app/actions/operator'
import type { OperatorQueueItem } from '@/lib/db/queries'

interface Props {
  item: OperatorQueueItem
  isExpress: boolean
}

/**
 * A single row in the operator queue.
 * Renders customer info, SLA countdown (Express only), and action buttons.
 * "Mark as submitted" opens an AlertDialog before firing the Server Action.
 */
export function QueueRow({ item, isExpress }: Props) {
  const t = useTranslations('operator.queue')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Format the createdAt date for Standard rows (e.g. "12 Jan 2026")
  const orderedDate = item.createdAt.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  function handleSubmitConfirm() {
    setErrorMessage(null)
    startTransition(async () => {
      const result = await markOrderAsSubmitted(item.id)
      if (result.success) {
        setDialogOpen(false)
        // Row disappears automatically via revalidatePath — toast confirms the action
        toast.success(t('submitSuccess'))
      } else {
        // Keep dialog open so the operator can retry; show error inline
        setErrorMessage(result.error)
      }
    })
  }

  return (
    <>
      {/* Row — flex column on mobile, grid on desktop */}
      <div className="flex flex-col gap-3 px-4 py-4 sm:grid sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-4">

        {/* Customer info */}
        <div>
          <p className="text-[var(--text-primary)] font-medium text-sm">
            {item.fullName ?? '—'}
          </p>
          <p className="text-[var(--text-muted)] text-xs">{item.email}</p>
          {/* On mobile: show ordered date inline under name */}
          {!isExpress && (
            <p className="text-[var(--text-muted)] text-xs mt-0.5 sm:hidden">
              {t('columns.ordered')}: {orderedDate}
            </p>
          )}
        </div>

        {/* Middle column — SLA countdown (Express) or tier badge + ordered date (Standard/Essential) */}
        <div className="flex items-center gap-2">
          {isExpress ? (
            <>
              <Badge className="bg-warning text-on-accent border-0 text-xs">Express</Badge>
              <SlaCountdown
                documentsApprovedAt={item.documentsApprovedAt.toISOString()}
                className="text-sm"
              />
            </>
          ) : (
            <>
              <Badge variant="outline" className="text-xs shrink-0">
                {item.tier === 'essential' ? 'Essential' : 'Standard'}
              </Badge>
              <span className="text-[var(--text-muted)] text-sm hidden sm:block">
                {orderedDate}
              </span>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Download package — points to the 14a-2 API route (not yet built) */}
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/operator/package/${item.id}`} download>
              {t('actions.downloadPackage')}
            </a>
          </Button>

          {/* Mark as submitted — opens confirmation dialog */}
          <Button
            size="sm"
            onClick={() => {
              setErrorMessage(null)
              setDialogOpen(true)
            }}
          >
            {t('actions.markSubmitted')}
          </Button>
        </div>
      </div>

      {/* Confirmation dialog — uses shadcn AlertDialog for accessibility (focus trap, Esc, ARIA) */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('submitConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('submitConfirm.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Inline error — shown when the action fails; dialog stays open so operator can retry */}
          {errorMessage && (
            <p className="text-error text-sm mt-2" role="alert">
              {errorMessage}
            </p>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              {t('submitConfirm.cancel')}
            </AlertDialogCancel>
            <Button
              onClick={handleSubmitConfirm}
              disabled={isPending}
              aria-busy={isPending}
            >
              {isPending ? t('actions.submitting') : t('submitConfirm.confirm')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
