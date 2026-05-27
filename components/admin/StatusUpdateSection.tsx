'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { adminUpdateOrderStatus } from '@/app/actions/admin'
import type { SelectOrder } from '@/lib/db/schema'
import { ORDER_STATUS_SEQUENCE } from '@/lib/db/schema'

interface StatusUpdateSectionProps {
  orderId: string
  currentStatus: SelectOrder['status']
}

// Derived from the DB enum — single source of truth shared with the admin action.
const statusOrder = ORDER_STATUS_SEQUENCE

export function StatusUpdateSection({ orderId, currentStatus }: StatusUpdateSectionProps) {
  const t = useTranslations('admin.detail')
  // Separate namespace for status labels shared with the admin list page
  const tAdmin = useTranslations('admin')
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<SelectOrder['status']>(currentStatus)
  const [note, setNote] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentIndex = statusOrder.indexOf(currentStatus)
  const newIndex = statusOrder.indexOf(status)
  const isBackward = newIndex < currentIndex
  const noteRequired = isBackward && !note
  const hasChanged = status !== currentStatus

  const handleUpdate = () => {
    if (noteRequired) return
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await adminUpdateOrderStatus(orderId, status, note)
      if (result.success) {
        setSuccess(true)
        setNote('')
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error || 'Failed to update status')
      }
    })
  }

  return (
    <Card className="shadow-[var(--shadow-md)] border-[var(--border-default)]">
      <CardHeader>
        <CardTitle className="text-base">{t('updateStatus')}</CardTitle>
        {/* Hint: explains the backward-note requirement before the admin interacts */}
        <CardDescription className="text-xs">{t('updateStatusDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Select value={status} onValueChange={(v) => setStatus(v as SelectOrder['status'])} disabled={isPending}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOrder.map((s) => (
                <SelectItem key={s} value={s}>
                  {tAdmin(`statuses.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('updateStatusNote')}
            className={`text-sm ${isBackward && !note ? 'border-error ring-error' : ''}`}
            disabled={isPending}
          />
          {isBackward && !note && (
            <p className="text-2xs text-error">
              {t('updateStatusNoteRequired')}
            </p>
          )}
        </div>

        <Button
          className="w-full"
          disabled={!hasChanged || noteRequired || isPending}
          onClick={handleUpdate}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('updateStatusSubmit')}
        </Button>

        {success && (
          <div className="flex items-center gap-2 text-success text-xs font-medium">
            <CheckCircle2 className="h-3 w-3" />
            {t('updateStatusSuccess')}
          </div>
        )}
        {error && <p className="text-error text-xs">{error}</p>}
      </CardContent>
    </Card>
  )
}
