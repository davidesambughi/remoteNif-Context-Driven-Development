'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { adminDeliverNif } from '@/app/actions/admin'
import type { SelectOrder } from '@/lib/db/schema'

interface DeliverNifSectionProps {
  orderId: string
  currentStatus: SelectOrder['status']
  existingNifNumber: string | null
}

/**
 * Admin sidebar card for entering and confirming the NIF number.
 * Only renders when the order is in `submitted` status.
 * Two states:
 *   - Input: NIF entry form + inline confirmation step.
 *   - Delivered: read-only display of the NIF already on record.
 */
export function DeliverNifSection({
  orderId,
  currentStatus,
  existingNifNumber,
}: DeliverNifSectionProps) {
  const t = useTranslations('admin.detail.deliverNif')
  const [isPending, startTransition] = useTransition()
  const [nifInput, setNifInput] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [delivered, setDelivered] = useState(existingNifNumber !== null)
  const [deliveredNif, setDeliveredNif] = useState<string | null>(existingNifNumber)

  // Only relevant at the `submitted` stage
  if (currentStatus !== 'submitted' && !delivered) return null

  // Once delivered (either from prop or after a successful action) show read-only view
  if (delivered && deliveredNif) {
    return (
      <Card className="shadow-[var(--shadow-md)] border-border-default">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-success">
            <CheckCircle2 className="h-4 w-4" />
            {t('alreadyDeliveredLabel')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* NIF displayed in monospace — matches customer dashboard style */}
          <p className="font-mono text-2xl font-bold text-text-primary tracking-tighter">
            {deliveredNif}
          </p>
        </CardContent>
      </Card>
    )
  }

  /** Client-side format check — regex mirrors DeliverNifSchema on the server. */
  function validateFormat(value: string): boolean {
    return /^\d{9}$/.test(value)
  }

  function handleTrigger() {
    if (!validateFormat(nifInput)) {
      setInputError(t('invalidFormat'))
      return
    }
    setInputError(null)
    setIsConfirming(true)
  }

  function handleConfirm() {
    setInputError(null)
    startTransition(async () => {
      const result = await adminDeliverNif(orderId, nifInput)
      if (result.success) {
        // Optimistic delivered state — page revalidation will sync server data
        setDeliveredNif(nifInput)
        setDelivered(true)
        setIsConfirming(false)
      } else {
        setInputError(result.error ?? 'unexpected_error')
        setIsConfirming(false)
      }
    })
  }

  return (
    <Card className="shadow-[var(--shadow-md)] border-border-default">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-brand-primary text-on-accent text-[10px] font-bold shrink-0">3</span>
          {t('sectionTitle')}
        </CardTitle>
        <CardDescription className="text-xs">{t('description')}</CardDescription>
      </CardHeader>

      <CardContent>
        {isConfirming ? (
          /* Inline confirmation — consistent with ApproveOrderSection pattern */
          <div className="bg-subtle border border-border-default rounded-[length:var(--radius-md)] p-3 space-y-3">
            <p className="text-sm font-medium text-text-primary">{t('confirmTitle')}</p>
            <p className="text-xs text-text-secondary">{t('confirmDescription')}</p>
            {/* Echo back the NIF being delivered so admin can double-check */}
            <p className="font-mono text-xl font-bold text-text-primary tracking-tighter">
              {nifInput}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-brand-primary hover:opacity-90 text-on-accent"
                disabled={isPending}
                onClick={handleConfirm}
              >
                {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                {t('confirmButton')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={isPending}
                onClick={() => setIsConfirming(false)}
              >
                {t('cancelButton')}
              </Button>
            </div>
            {inputError && (
              <p className="text-error text-xs">{inputError}</p>
            )}
          </div>
        ) : (
          /* Input form */
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="nif-input" className="text-xs font-medium text-text-secondary">
                {t('inputLabel')}
              </Label>
              <Input
                id="nif-input"
                type="text"
                inputMode="numeric"
                maxLength={9}
                placeholder={t('inputPlaceholder')}
                value={nifInput}
                onChange={(e) => {
                  // Allow only digits
                  setNifInput(e.target.value.replace(/\D/g, ''))
                  setInputError(null)
                }}
                className="font-mono text-lg tracking-widest"
                aria-describedby={inputError ? 'nif-input-error' : undefined}
              />
              {inputError && (
                <p id="nif-input-error" className="text-error text-xs">
                  {inputError}
                </p>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full border-brand-primary text-brand-primary hover:bg-brand-primary-dim hover:text-brand-primary"
              onClick={handleTrigger}
              disabled={nifInput.length === 0}
            >
              {t('triggerButton')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
