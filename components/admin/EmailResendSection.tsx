'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { adminResendEmail, type AdminEmailType } from '@/app/actions/admin'

interface EmailResendSectionProps {
  orderId: string
}

export function EmailResendSection({ orderId }: EmailResendSectionProps) {
  const t = useTranslations('admin.detail')
  const [isPending, startTransition] = useTransition()
  const [emailType, setEmailType] = useState<AdminEmailType>('order_confirmation')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleResend = () => {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await adminResendEmail(orderId, emailType)
      if (result.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error || 'Failed to resend email')
      }
    })
  }

  return (
    <Card className="shadow-[var(--shadow-md)] border-[var(--border-default)]">
      <CardHeader>
        <CardTitle className="text-base">{t('resendEmail')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={emailType} onValueChange={(v) => setEmailType(v as AdminEmailType)} disabled={isPending}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="order_confirmation">
              {t('emailTypes.order_confirmation')}
            </SelectItem>
            <SelectItem value="documents_approved_customer">
              {t('emailTypes.documents_approved_customer')}
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="secondary"
          className="w-full"
          disabled={isPending}
          onClick={handleResend}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('resendSubmit')}
        </Button>

        {success && (
          <div className="flex items-center gap-2 text-success text-xs font-medium">
            <CheckCircle2 className="h-3 w-3" />
            {t('resendSuccess')}
          </div>
        )}
        {error && <p className="text-error text-xs">{error}</p>}
      </CardContent>
    </Card>
  )
}
