'use client'

import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { dismissFiscalRep } from '@/app/actions/orders'

interface DismissRenewalDialogProps {
  orderId: string
}

/**
 * Client Component — wraps the "I no longer need fiscal representation" action in
 * a shadcn AlertDialog to prevent accidental dismissal.
 *
 * Uses useTransition so the trigger button disables while the Server Action runs,
 * giving immediate feedback without a separate loading state variable.
 */
export function DismissRenewalDialog({ orderId }: DismissRenewalDialogProps) {
  const t = useTranslations('dashboard.renewalBanner')
  const [isPending, startTransition] = useTransition()

  // Invoke the Server Action inside a transition so the UI stays interactive
  // (the button disables) while the mutation and revalidation complete.
  function handleConfirm() {
    startTransition(async () => {
      await dismissFiscalRep(orderId)
      // No explicit redirect needed — revalidatePath('/dashboard') in the action
      // will cause the dashboard RSC to re-render with the banner gone.
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {/* Ghost-style dismiss link — visually de-emphasised relative to the renew CTA */}
        <button
          className="text-[length:var(--text-xs)] text-[var(--text-muted)] underline underline-offset-2
            hover:text-[var(--text-secondary)] transition-[var(--transition-fast)]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]
            focus-visible:ring-offset-1 rounded-[length:var(--radius-sm)]"
        >
          {t('dismissLink')}
        </button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('dialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('dialog.description')}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>{t('dialog.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            // Destructive variant to signal the permanence of this action
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t('dialog.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
