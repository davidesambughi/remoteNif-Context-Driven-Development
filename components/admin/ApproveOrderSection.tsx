'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { adminApproveOrder } from '@/app/actions/admin'

interface ApproveOrderSectionProps {
  orderId: string
  orderStatus: string
  allDocsApproved: boolean
  tier: string
}

export function ApproveOrderSection({ orderId, orderStatus, allDocsApproved, tier }: ApproveOrderSectionProps) {
  const t = useTranslations('admin.detail')
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canApprove = allDocsApproved && orderStatus === 'documents_under_review'

  const handleApprove = () => {
    if (!window.confirm(t('approveOrderConfirmDescription'))) return

    setError(null)
    startTransition(async () => {
      const result = await adminApproveOrder(orderId)
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || 'Failed to approve order')
      }
    })
  }

  return (
    <Card className="shadow-[var(--shadow-md)] border-[var(--border-default)]">
      <CardHeader>
        <CardTitle className="text-base">{t('approveOrder')}</CardTitle>
        <CardDescription className="text-xs">
          {t('approveOrderDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="flex items-center gap-2 text-success text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Order Approved
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              className="w-full border-success text-success hover:bg-success-subtle hover:text-success"
              disabled={!canApprove || isPending}
              onClick={handleApprove}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('approveOrder')}
            </Button>
            
            {!allDocsApproved && (
              <p className="text-[10px] text-muted-foreground italic">
                * {t('approveOrderDisabledDocs')}
              </p>
            )}
            {allDocsApproved && orderStatus !== 'documents_under_review' && (
              <p className="text-[10px] text-muted-foreground italic">
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
