'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { checkHasActiveOrder } from '@/app/actions/orders'

const POLL_INTERVAL_MS = 2500
const MAX_POLLS = 12 // 12 × 2500ms = 30 seconds

type PollerStatus = 'idle' | 'polling' | 'timeout'

/**
 * Invisible client component mounted on the dashboard.
 * When Stripe redirects back with ?session_id=..., the webhook may not have
 * fired yet. This component detects the param, shows a processing overlay,
 * and polls checkHasActiveOrder every 2.5s for up to 30s.
 *
 * On success: router.replace(pathname) strips the param and re-runs the
 * Server Component tree so DashboardContent renders the real order.
 * On timeout: shows the spec-mandated error card with the support email.
 */
export function WebhookPoller() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('dashboard')

  const sessionId = searchParams.get('session_id')
  // Initialise as 'polling' when session_id is present — avoids a synchronous setState in the effect
  const [status, setStatus] = useState<PollerStatus>(() => (sessionId ? 'polling' : 'idle'))

  // Use a ref for the poll counter so the interval callback always sees the
  // current value without needing to be recreated.
  const pollCount = useRef(0)

  useEffect(() => {
    // Only activate when the Stripe session_id param is present.
    if (!sessionId) return

    pollCount.current = 0

    const interval = setInterval(async () => {
      pollCount.current += 1

      const result = await checkHasActiveOrder()

      if (result.success && result.data.hasOrder) {
        clearInterval(interval)
        // Navigate locale-aware — strips ?session_id= and re-runs Server Components.
        router.replace(pathname)
        return
      }

      if (pollCount.current >= MAX_POLLS) {
        clearInterval(interval)
        setStatus('timeout')
      }
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [sessionId, router, pathname])

  if (status === 'idle') return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface/80 backdrop-blur-sm p-4 text-center">
      {status === 'polling' && (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-brand-primary mb-4" />
          <h2 className="text-[length:var(--text-xl)] font-[number:var(--font-bold)] text-text-primary">
            {t('processing.title')}
          </h2>
          <p className="mt-2 text-[length:var(--text-sm)] text-text-secondary">
            {t('processing.subtitle')}
          </p>
        </>
      )}

      {status === 'timeout' && (
        <div className="max-w-md bg-surface p-6 rounded-[length:var(--radius-lg)] shadow-[var(--shadow-xl)] border border-error/20 text-left">
          <h2 className="text-[length:var(--text-xl)] font-[number:var(--font-bold)] text-error">
            {t('processing.timeout.title')}
          </h2>
          <p className="mt-2 text-[length:var(--text-sm)] text-text-secondary">
            {t('processing.timeout.message')}{' '}
            <a
              href="mailto:support@remotenif.com"
              className="text-brand-primary font-[number:var(--font-medium)] hover:underline"
            >
              support@remotenif.com
            </a>
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="mt-6 px-4 py-2 bg-brand-primary text-on-accent rounded-[length:var(--radius-md)] font-[number:var(--font-semibold)]"
          >
            {t('processing.timeout.dismiss')}
          </button>
        </div>
      )}
    </div>
  )
}
