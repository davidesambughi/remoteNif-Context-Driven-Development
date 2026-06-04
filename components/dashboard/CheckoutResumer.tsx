'use client'

/**
 * Invisible Client Component mounted on the Dashboard.
 * Intercepts the ?checkout_tier=... parameter from the URL (passed via email confirmation)
 * and automatically triggers a Stripe Checkout session.
 */

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createCheckoutSession } from '@/app/actions/checkout'
import { useLocale, useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import type { Tier } from '@/lib/pricing'

export function CheckoutResumer() {
  const searchParams = useSearchParams()
  const locale = useLocale()
  const t = useTranslations('checkout')
  const [isResuming, setIsResuming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tier = searchParams.get('checkout_tier') as Tier | null

  useEffect(() => {
    if (!tier) return

    // Simple validation to ensure the tier exists
    const validTiers: Tier[] = ['essential', 'standard', 'express']
    if (!validTiers.includes(tier)) return

    async function resumeCheckout() {
      setIsResuming(true)
      setError(null)

      try {
        const result = await createCheckoutSession({ tier, locale })
        
        if (result.success && result.data?.url) {
          // Redirect immediately to Stripe
          window.location.href = result.data.url
        } else {
          // Actions return full keys like 'checkout.errors.generic'. 
          // Since we are in the 'checkout' namespace, we strip the prefix if present.
          let errorKey = (result.success === false && result.error)
            ? result.error
            : 'errors.generic'
          
          if (errorKey.startsWith('checkout.')) {
            errorKey = errorKey.replace('checkout.', '')
          }

          setError(t(errorKey as Parameters<typeof t>[0]))
          setIsResuming(false)
        }
      } catch (err) {
        console.error('[CheckoutResumer] failed:', err)
        setError(t('errors.generic'))
        setIsResuming(false)
      }
    }

    resumeCheckout()
  }, [tier, locale, t])

  if (!isResuming && !error) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface/80 backdrop-blur-sm p-4 text-center">
      {isResuming ? (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-brand-primary mb-4" />
          <h2 className="text-[length:var(--text-xl)] font-[number:var(--font-bold)] text-text-primary">
            {t('resuming.title')}
          </h2>
          <p className="mt-2 text-[length:var(--text-sm)] text-text-secondary">
            {t('resuming.subtitle')}
          </p>
        </>
      ) : error ? (
        <div className="max-w-md bg-surface p-6 rounded-[length:var(--radius-lg)] shadow-[var(--shadow-xl)] border border-error/20">
          <h2 className="text-[length:var(--text-xl)] font-[number:var(--font-bold)] text-error">
            {t('errors.title')}
          </h2>
          <p className="mt-2 text-[length:var(--text-sm)] text-text-secondary">
            {error}
          </p>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="mt-6 px-4 py-2 bg-brand-primary text-on-accent rounded-[length:var(--radius-md)] font-[number:var(--font-semibold)]"
          >
            {t('errors.close')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
