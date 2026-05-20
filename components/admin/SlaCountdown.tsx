'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

interface Props {
  documentsApprovedAt: string // ISO date string
}

const SLA_MS = 48 * 60 * 60 * 1000

function getRemaining(approvedAt: string): number {
  return new Date(approvedAt).getTime() + SLA_MS - Date.now()
}

function formatCountdown(remainingMs: number): { text: string; className: string } {
  if (remainingMs <= 0) return { text: 'OVERDUE', className: 'text-error font-semibold' }
  const totalMinutes = Math.floor(remainingMs / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const text = `${hours}h ${minutes}m`
  if (hours > 24) return { text, className: 'text-success font-medium' }
  if (hours >= 8) return { text, className: 'text-warning font-medium' }
  return { text, className: 'text-error font-medium' }
}

/** Live countdown against the 48h Express SLA. Updates every minute on the client. */
export function SlaCountdown({ documentsApprovedAt }: Props) {
  const t = useTranslations('admin.sla')
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    const update = () => setRemaining(getRemaining(documentsApprovedAt))
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [documentsApprovedAt])

  // Render nothing until client hydration to avoid SSR mismatch
  if (remaining === null) return null

  const { text, className } = formatCountdown(remaining)
  const displayText = remaining <= 0 ? t('overdue') : text

  return <span className={className}>{displayText}</span>
}
