'use client'
// "use client" required: uses useEffect (auto-trigger on mount) and useRouter (redirect to Stripe URL).

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createRenewalCheckoutSession } from '@/app/actions/checkout'

interface RenewalCheckoutButtonProps {
  orderId: string
  locale: string
  isCanceled: boolean
}

// Single state machine — no boolean flags. All UI variations derive from this union.
type ButtonState = 'loading' | 'error' | 'canceled'

/**
 * Auto-triggers renewal checkout on mount when isCanceled is false.
 * On success: redirects to the Stripe-hosted payment page.
 * On error or cancellation: shows an error block with a retry button.
 *
 * The button stays in 'loading' state after a successful redirect so the
 * spinner stays visible while Stripe loads (no flicker needed).
 */
export function RenewalCheckoutButton({ orderId, locale, isCanceled }: RenewalCheckoutButtonProps) {
  const t = useTranslations('renewal')
  const router = useRouter()

  // Start in 'canceled' if the user was bounced back from Stripe, otherwise kick off loading
  const [state, setState] = useState<ButtonState>(isCanceled ? 'canceled' : 'loading')

  // Triggers the server action and handles success/error
  async function triggerCheckout() {
    setState('loading')

    const result = await createRenewalCheckoutSession({ orderId, locale })

    if (!result.success) {
      setState('error')
      return
    }

    // Push to the Stripe-hosted checkout page — keep spinner visible during navigation
    router.push(result.data.url as Parameters<typeof router.push>[0])
  }

  // Auto-trigger on mount unless the user arrived via a cancellation redirect
  useEffect(() => {
    if (!isCanceled) {
      void triggerCheckout()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Loading state — spinner + disabled button
  if (state === 'loading') {
    return (
      <Button
        disabled
        className="w-full bg-[var(--brand-primary)] text-[var(--text-on-accent)]"
      >
        <Loader2 className="animate-spin h-4 w-4 mr-2" />
        {t('preparingCheckout')}
      </Button>
    )
  }

  // Error / canceled states — error copy block + retry button
  const description =
    state === 'canceled' ? t('canceledDescription') : t('errorDescription')

  return (
    <div>
      {/* Error copy block — title + context-specific description */}
      <p className="text-[length:var(--text-sm)] text-[var(--status-error)] mb-4">
        <span className="font-[number:var(--font-bold)]">{t('errorTitle')} </span>
        {description}
      </p>

      <Button
        onClick={() => void triggerCheckout()}
        className="w-full bg-[var(--brand-primary)] text-[var(--text-on-accent)]"
      >
        {t('retryButton')}
      </Button>
    </div>
  )
}
