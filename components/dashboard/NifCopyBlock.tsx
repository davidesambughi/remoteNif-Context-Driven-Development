'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NifCopyBlockProps {
  nifNumber: string | null
}

/**
 * NifCopyBlock — displays the delivered NIF number with a one-click copy button.
 * Must be a Client Component because it uses navigator.clipboard and useState.
 */
export function NifCopyBlock({ nifNumber }: NifCopyBlockProps) {
  const t = useTranslations('dashboard.states.delivered')
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    if (!nifNumber) return
    navigator.clipboard.writeText(nifNumber).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="bg-subtle p-[length:var(--space-6)] rounded-[length:var(--radius-lg)] border border-border-subtle w-full">
      <div className="text-[length:var(--text-sm)] text-text-muted uppercase tracking-widest font-[number:var(--font-bold)] mb-[length:var(--space-2)]">
        {t('nifLabel')}
      </div>
      <div className="flex items-center justify-between gap-[length:var(--space-4)]">
        <div className="text-[length:var(--text-4xl)] text-text-primary font-[number:var(--font-bold)] font-mono tracking-tighter">
          {nifNumber ?? '--- --- ---'}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          disabled={nifNumber === null}
          aria-label={copied ? t('copiedButton') : t('copyButton')}
          className="shrink-0"
        >
          {copied ? (
            <Check className="h-5 w-5 text-success" />
          ) : (
            <Copy className="h-5 w-5 text-text-muted" />
          )}
        </Button>
      </div>
    </div>
  )
}
