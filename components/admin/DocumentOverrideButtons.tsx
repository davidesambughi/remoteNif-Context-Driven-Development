'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, AlertCircle, X } from 'lucide-react'
import { adminApproveDocument, adminFlagDocument } from '@/app/actions/admin'
import type { AdminDocumentDetail } from '@/lib/db/queries'

interface DocumentOverrideButtonsProps {
  document: AdminDocumentDetail
  orderId: string
}

export function DocumentOverrideButtons({ document, orderId: _orderId }: DocumentOverrideButtonsProps) {
  const t = useTranslations('admin.detail')
  const [isPending, startTransition] = useTransition()
  const [reason, setReason] = useState('')
  const [isFlagging, setIsFlagging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (document.type === 'signed_poa') return null

  const handleApprove = () => {
    setError(null)
    startTransition(async () => {
      const result = await adminApproveDocument(document.id)
      if (!result.success) {
        setError(result.error || 'Failed to approve')
      }
    })
  }

  const handleFlag = async () => {
    if (reason.length < 10) return
    setError(null)
    startTransition(async () => {
      const result = await adminFlagDocument(document.id, reason)
      if (result.success) {
        setIsFlagging(false)
        setReason('')
      } else {
        setError(result.error || 'Failed to flag')
      }
    })
  }

  return (
    <div className="flex flex-col gap-2 mt-4">
      <div className="flex items-center gap-2">
        {document.approved ? (
          !isFlagging ? (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-error hover:text-error hover:bg-error-subtle h-8 px-2 text-xs"
              onClick={() => setIsFlagging(true)}
              disabled={isPending}
            >
              <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
              {t('flagDocument')}
            </Button>
          ) : null
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleApprove} 
            disabled={isPending}
            className="border-success text-success hover:bg-success-subtle hover:text-success h-8 px-3 text-xs"
          >
            {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            {t('approveDocument')}
          </Button>
        )}
      </div>

      {isFlagging && (
        <div className="bg-error-subtle border border-error/20 rounded-lg p-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-error uppercase tracking-wider">{t('flagDocument')}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsFlagging(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('flagReasonPlaceholder')}
            className={`text-sm min-h-[80px] bg-surface ${error ? 'border-error ring-error' : ''}`}
            disabled={isPending}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsFlagging(false)} disabled={isPending}>
              {t('flagCancel')}
            </Button>
            <Button 
              size="sm"
              onClick={handleFlag} 
              disabled={isPending || reason.length < 10}
              className="bg-error hover:bg-error/90"
            >
              {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              {t('flagConfirm')}
            </Button>
          </div>
          {error && <p className="text-error text-2xs">{error}</p>}
        </div>
      )}

      {error && !isFlagging && <p className="text-error text-2xs">{error}</p>}
    </div>
  )
}
