'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { adminApproveOrder } from '@/app/actions/admin'
import type { SelectOrder } from '@/lib/db/schema'

interface ApproveOrderSectionProps {
  orderId: string
  orderStatus: SelectOrder['status']
  allDocsApproved: boolean
  tier: SelectOrder['tier']
}

export function ApproveOrderSection({ orderId, orderStatus, allDocsApproved, tier: _tier }: ApproveOrderSectionProps) {
  const t = useTranslations('admin.detail')
  const [isPending, startTransition] = useTransition()
  const [isConfirming, setIsConfirming] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canApprove = allDocsApproved && orderStatus === 'documents_under_review'

  const handleConfirm = () => {
    setError(null)
    startTransition(async () => {
      const result = await adminApproveOrder(orderId)
      if (result.success) {
        setSuccess(true)
        setIsConfirming(false)
      } else {
        setError(result.error || 'Failed to approve order')
        setIsConfirming(false)
      }
    })
  }

  return (
    <Card className="shadow-[var(--shadow-md)] border-[var(--border-default)]">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-brand-primary text-on-accent text-[10px] font-bold shrink-0">2</span>
          {t('approveOrder')}
        </CardTitle>
        <CardDescription className="text-xs">
          {t('approveOrderDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="flex items-center gap-2 text-success text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            {t('approveOrderSuccess')}
          </div>
        ) : isConfirming ? (
          // Inline confirmation — replaces the button to avoid window.confirm
          <div className="bg-warning-subtle border border-warning/20 rounded-lg p-3 space-y-3">
            <p className="text-sm font-medium text-[var(--text-primary)]">{t('approveOrderConfirmTitle')}</p>
            <p className="text-xs text-[var(--text-secondary)]">{t('approveOrderConfirmDescription')}</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-success hover:bg-success/90 text-on-accent"
                disabled={isPending}
                onClick={handleConfirm}
              >
                {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                {t('approveOrderConfirm')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={isPending}
                onClick={() => setIsConfirming(false)}
              >
                {t('approveOrderCancel')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full border-success text-success hover:bg-success-subtle hover:text-success"
              disabled={!canApprove || isPending}
              onClick={() => setIsConfirming(true)}
            >
              {t('approveOrder')}
            </Button>

            {!allDocsApproved && (
              <p className="text-2xs text-muted-foreground italic">
                * {t('approveOrderDisabledDocs')}
              </p>
            )}
            {allDocsApproved && orderStatus !== 'documents_under_review' && (
              <p className="text-2xs text-muted-foreground italic">
                * {t('approveOrderDisabledStatus')}
              </p>
            )}
            {error && <p className="text-error text-xs mt-2">{error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
