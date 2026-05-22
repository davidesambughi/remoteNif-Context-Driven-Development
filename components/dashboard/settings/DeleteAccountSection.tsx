'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

import { deleteAccount } from '@/app/actions/settings'

interface DeleteAccountSectionProps {
  /** True when the user has an order that has not yet reached 'delivered' status */
  hasActiveOrder: boolean
  /** Non-null when the user has active fiscal representation (Standard/Express orders) */
  fiscalRepExpiresAt: Date | null
}

/** Formats a date as a human-readable locale string for the fiscal rep warning */
function formatExpiryDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Delete Account section — destructive card with an AlertDialog gate.
 * The confirm button stays disabled until the user types "DELETE" exactly.
 * On confirmation: calls deleteAccount() Server Action, then redirects to homepage.
 */
export function DeleteAccountSection({
  hasActiveOrder,
  fiscalRepExpiresAt,
}: DeleteAccountSectionProps) {
  const t = useTranslations('settings.deleteAccount')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmationInput, setConfirmationInput] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  // Whether fiscal representation is currently active (expiry date is in the future)
  const hasFiscalRep = fiscalRepExpiresAt !== null && fiscalRepExpiresAt > new Date()

  // Confirm button is only active when the user has typed "DELETE" exactly
  const canConfirm = confirmationInput === 'DELETE' && !isPending

  function handleOpenChange(next: boolean) {
    // Reset confirmation input and error when dialog closes
    if (!next) {
      setConfirmationInput('')
      setActionError(null)
    }
    setOpen(next)
  }

  function handleConfirm() {
    if (!canConfirm) return
    setActionError(null)

    startTransition(async () => {
      const result = await deleteAccount()

      if (result.success) {
        // Session is cleared server-side; redirect to homepage
        router.push('/')
        return
      }

      setActionError(t('dialog.errors.generic'))
    })
  }

  return (
    // Destructive section: top border in error token to signal the danger zone
    <Card className="border-[var(--border-default)] border-t-2 border-t-[var(--status-error)] shadow-[var(--shadow-md)]">
      <CardHeader>
        <CardTitle className="text-[length:var(--text-xl)] font-[number:var(--font-semibold)] text-[var(--text-primary)]">
          {t('heading')}
        </CardTitle>
        <CardDescription className="text-[var(--text-secondary)]">
          {t('description')}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
          {/* Trigger — destructive button styling */}
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="bg-[var(--status-error)] text-[var(--text-on-accent)] hover:opacity-90"
            >
              {t('triggerButton')}
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('dialog.title')}</AlertDialogTitle>
              <AlertDialogDescription asChild>
                {/* Use a div so we can render multiple paragraphs inside the description */}
                <div className="space-y-3 text-[var(--text-secondary)]">
                  <p>{t('dialog.body')}</p>

                  {/* Conditional warnings — only shown when relevant */}
                  {hasActiveOrder && (
                    <p className="rounded-[length:var(--radius-md)] bg-[var(--bg-subtle)] px-3 py-2 text-[length:var(--text-sm)] text-[var(--text-primary)]">
                      {t('dialog.activeOrderWarning')}
                    </p>
                  )}

                  {hasFiscalRep && fiscalRepExpiresAt && (
                    <p className="rounded-[length:var(--radius-md)] bg-[var(--bg-subtle)] px-3 py-2 text-[length:var(--text-sm)] text-[var(--text-primary)]">
                      {t('dialog.fiscalRepWarning', { date: formatExpiryDate(fiscalRepExpiresAt) })}
                    </p>
                  )}

                  {/* Typed confirmation input — controls the confirm button's enabled state */}
                  <div className="pt-1">
                    <label
                      htmlFor="delete-confirm-input"
                      className="mb-1.5 block text-[length:var(--text-sm)] font-[number:var(--font-medium)] text-[var(--text-primary)]"
                    >
                      {t('dialog.confirmationLabel')}
                    </label>
                    <Input
                      id="delete-confirm-input"
                      value={confirmationInput}
                      onChange={(e) => setConfirmationInput(e.target.value)}
                      placeholder={t('dialog.confirmationPlaceholder')}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>

                  {/* Action-level error shown inside the dialog */}
                  {actionError && (
                    <p className="text-[length:var(--text-sm)] text-[var(--status-error)]">
                      {actionError}
                    </p>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>
                {t('dialog.cancelButton')}
              </AlertDialogCancel>

              {/* Not using AlertDialogAction to avoid its default close behavior —
                  we need to control closing manually after the async action completes */}
              <Button
                variant="destructive"
                className="bg-[var(--status-error)] text-[var(--text-on-accent)] hover:opacity-90"
                disabled={!canConfirm}
                onClick={handleConfirm}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('dialog.confirmButton')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
