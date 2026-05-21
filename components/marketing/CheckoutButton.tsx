'use client'

/**
 * Client Component for the Pricing Page CTAs.
 * Handles the transition to Stripe Checkout and manages loading/error states.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createCheckoutSession } from '@/app/actions/checkout'
import type { Tier } from '@/lib/pricing'
import { Loader2 } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

interface CheckoutButtonProps {
  tier: Tier
  cta: string
  ctaVariant: 'default' | 'outline'
}

export function CheckoutButton({ tier, cta, ctaVariant }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  // Root translator — Server Actions return full-path i18n keys (e.g. 'checkout.errors.generic')
  // that span namespaces, so we translate at the root level rather than scoping to 'checkout'.
  const t = useTranslations()
  // Current locale passed to the action so Stripe redirect URLs land in the user's language.
  const locale = useLocale()

  const handleCheckout = async () => {
    setIsLoading(true)
    setErrorMsg(null)

    try {
      // Trigger the server action to get a Stripe Checkout URL
      const result = await createCheckoutSession({ tier, locale })
      
      if (result.success && result.data?.url) {
        // Redirect the browser directly to the Stripe-hosted checkout page
        window.location.href = result.data.url
      } else {
        // result.error is always a valid i18n key — Server Actions in this project
        // return typed key strings, never raw messages.
        const errorKey = (result.success === false && result.error)
          ? result.error as Parameters<typeof t>[0]
          : 'checkout.errors.generic' as Parameters<typeof t>[0]
        setErrorMsg(t(errorKey))
        setIsLoading(false)
      }
    } catch {
      setErrorMsg(t('checkout.errors.generic'))
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <Button 
        variant={ctaVariant} 
        size="lg" 
        className="w-full" 
        onClick={handleCheckout}
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {cta}
      </Button>
      {errorMsg && (
        <p className="text-[length:var(--text-sm)] text-error text-center">
          {errorMsg}
        </p>
      )}
    </div>
  )
}
