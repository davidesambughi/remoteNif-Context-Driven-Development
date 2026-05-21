'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { getRemainingMs, getColorClass, formatRemaining } from '@/lib/operator/sla'

interface Props {
  /** ISO date string from the server — when admin approved the order. */
  documentsApprovedAt: string
  className?: string
}

/**
 * Live SLA countdown for the operator queue.
 * Shows "{Xh Ym remaining}" in color-coded text; "SLA EXPIRED" when overdue.
 * Updates every 60 seconds. Renders nothing until client hydration to avoid SSR mismatch.
 */
export function SlaCountdown({ documentsApprovedAt, className }: Props) {
  const t = useTranslations('operator.queue.sla')
  const [remainingMs, setRemainingMs] = useState<number | null>(null)

  useEffect(() => {
    const update = () => setRemainingMs(getRemainingMs(documentsApprovedAt))
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [documentsApprovedAt])

  // Avoid SSR/client mismatch — render nothing until hydrated
  if (remainingMs === null) return null

  const colorClass = getColorClass(remainingMs)
  const formatted = formatRemaining(remainingMs)

  if (!formatted) {
    return (
      <span className={`${colorClass} ${className ?? ''}`.trim()}>
        {t('expired')}
      </span>
    )
  }

  return (
    <span className={`${colorClass} ${className ?? ''}`.trim()}>
      {t('hoursRemaining', { hours: formatted.hours, minutes: formatted.minutes })}
    </span>
  )
}
