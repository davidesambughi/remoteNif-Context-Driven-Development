'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Upload, CheckCircle2, Loader2, AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DOCUMENT_FLAG_REASON_KEYS,
  type DocumentFlagReasonKey,
} from '@/lib/validations/documents'
import { createUploadSignedUrl, uploadDocument, reviewDocument } from '@/app/actions/documents'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DocumentType = 'passport' | 'proof_of_address' | 'signed_poa'
type SlotStatus = 'idle' | 'uploading' | 'pending_review' | 'approved' | 'flagged' | 'manual_review'
type DisabledReason = 'details' | 'poa' | null

interface DocumentUploadSlotProps {
  orderId: string
  type: DocumentType
  label: string
  description: string
  disabled: boolean
  disabledReason: DisabledReason
  initialStatus: SlotStatus
  // Stored as a reasonKey in the DB — translated here before display
  initialFlagReason: string | null
  // Fires whenever this slot's status changes — used by parent for cross-slot locking
  onStatusChange: (status: SlotStatus) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCEPTED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const SLOW_REVIEW_MS = 30_000

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Guards that a string from the DB is one of the predefined reason keys before translating.
function isValidReasonKey(key: string | null): key is DocumentFlagReasonKey {
  return key !== null && (DOCUMENT_FLAG_REASON_KEYS as readonly string[]).includes(key)
}

// ---------------------------------------------------------------------------
// State → visual config
// Full class names written out in full so Tailwind's content scanner detects them.
// ---------------------------------------------------------------------------

const STATE_CONFIG = {
  idle: {
    border: 'border-border-default',
    iconBg: 'bg-subtle',
    iconColor: 'text-text-secondary',
    cardBg: 'bg-surface',
  },
  uploading: {
    border: 'border-border-default',
    iconBg: 'bg-subtle',
    iconColor: 'text-text-muted',
    cardBg: 'bg-surface',
  },
  pending_review: {
    border: 'border-warning',
    iconBg: 'bg-warning',
    iconColor: 'text-on-accent',
    cardBg: 'bg-warning-subtle',
  },
  approved: {
    border: 'border-success',
    iconBg: 'bg-success',
    iconColor: 'text-on-accent',
    cardBg: 'bg-success-subtle',
  },
  flagged: {
    border: 'border-error',
    iconBg: 'bg-error',
    iconColor: 'text-on-accent',
    cardBg: 'bg-error-subtle',
  },
  manual_review: {
    border: 'border-warning',
    iconBg: 'bg-warning',
    iconColor: 'text-on-accent',
    cardBg: 'bg-warning-subtle',
  },
} as const

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DocumentUploadSlot({
  orderId,
  type,
  label,
  description,
  disabled,
  disabledReason,
  initialStatus,
  initialFlagReason,
  onStatusChange,
}: DocumentUploadSlotProps) {
  const t = useTranslations('documents')
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [status, setStatus] = useState<SlotStatus>(initialStatus)

  // Translate the reason key from DB on first render; updated on new review results
  const [flagReason, setFlagReason] = useState<string | null>(
    isValidReasonKey(initialFlagReason) ? t(`flagReasons.${initialFlagReason}`) : null,
  )

  const [error, setError] = useState<string | null>(null)

  // True only when reviewDocument was called in this session and is still in-flight.
  // Prevents the spinner from showing for slots hydrated from DB with a stale 'pending' status.
  const [isReviewing, setIsReviewing] = useState(false)

  // True when the 30s timeout fires before reviewDocument resolves.
  // Does NOT change SlotStatus — only swaps the status text to the slow message.
  const [isSlowReview, setIsSlowReview] = useState(false)

  const cfg = STATE_CONFIG[status]

  // Wrapper that keeps local state and parent in sync
  function updateStatus(next: SlotStatus) {
    setStatus(next)
    onStatusChange(next)
  }

  function renderIcon() {
    const cls = `h-5 w-5 ${cfg.iconColor}`
    if (status === 'uploading') return <Loader2 className={`${cls} animate-spin`} />
    if (status === 'approved') return <CheckCircle2 className={cls} />
    if (status === 'flagged') return <AlertCircle className={cls} />
    if (status === 'pending_review' || status === 'manual_review') return <Clock className={cls} />
    return <Upload className={`h-5 w-5 ${disabled ? 'text-text-muted' : 'text-text-secondary'}`} />
  }

  function getStatusText(): string {
    if (status === 'uploading') return t('states.uploading')
    if (status === 'approved') return t('states.approved')
    if (status === 'manual_review') return t('states.manualReview')
    if (status === 'flagged') return flagReason ?? ''
    if (status === 'pending_review') {
      // 30s timeout fires → show the slow-review message while the action is still in flight
      return isSlowReview ? t('states.stillReviewing') : t('states.pendingReview')
    }
    if (disabled && disabledReason) return t(`disabled.${disabledReason}`)
    return description
  }

  async function handleFile(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      setError(t('errors.fileTooLarge'))
      return
    }
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      setError(t('errors.invalidType'))
      return
    }

    setError(null)
    setFlagReason(null)
    updateStatus('uploading')

    try {
      // Step 1 — get a signed upload URL from the server
      const urlResult = await createUploadSignedUrl({
        orderId,
        fileName: file.name,
        contentType: file.type,
      })
      if (!urlResult.success) {
        setError(t('errors.uploadFailed'))
        updateStatus('idle')
        return
      }

      // Step 2 — PUT file directly to Supabase Storage via the signed URL
      const uploadResponse = await fetch(urlResult.data.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!uploadResponse.ok) {
        setError(t('errors.uploadFailed'))
        updateStatus('idle')
        return
      }

      // Step 3 — register the upload in the database; get back the new document ID
      const docResult = await uploadDocument({
        orderId,
        type,
        filePath: urlResult.data.path,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      })
      if (!docResult.success) {
        setError(t('errors.uploadFailed'))
        updateStatus('idle')
        return
      }

      // Step 4 — trigger AI review for all document types
      updateStatus('pending_review')
      setIsReviewing(true)

      // Start 30s timeout — shows "still reviewing" message if the action is slow
      const timeoutId = setTimeout(() => setIsSlowReview(true), SLOW_REVIEW_MS)

      const reviewResult = await reviewDocument(docResult.data.documentId)

      // Clear both flags when the action resolves, even if the timeout already fired
      clearTimeout(timeoutId)
      setIsSlowReview(false)
      setIsReviewing(false)

      if (!reviewResult.success) {
        // Server action failure — surface as manual review (admin will handle it)
        updateStatus('manual_review')
        router.refresh()
        return
      }

      const { aiReviewStatus, aiReviewReason } = reviewResult.data

      if (aiReviewStatus === 'clear') {
        updateStatus('approved')
      } else if (aiReviewStatus === 'flagged') {
        // aiReviewReason is a reasonKey — translate before displaying
        setFlagReason(isValidReasonKey(aiReviewReason) ? t(`flagReasons.${aiReviewReason}`) : null)
        updateStatus('flagged')
      } else {
        // manual_review (error escalation or second failure)
        updateStatus('manual_review')
      }

      // Refresh so the parent RSC gets updated document records from DB
      router.refresh()
    } catch {
      setError(t('errors.uploadFailed'))
      setIsReviewing(false)
      setIsSlowReview(false)
      updateStatus('idle')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const canUpload = !disabled && (status === 'idle' || status === 'flagged')
  const buttonLabel = status === 'flagged' ? t('upload.reUpload') : t('upload.button')

  return (
    <div
      className={[
        'border rounded-[length:var(--radius-lg)]',
        'shadow-[var(--shadow-sm)] p-[length:var(--space-5)]',
        'flex items-center gap-[length:var(--space-4)]',
        'transition-colors duration-200',
        cfg.border,
        cfg.cardBg,
        disabled ? 'opacity-50' : '',
      ].join(' ')}
    >
      {/* Status icon — coloured circle whose background communicates current state */}
      <div
        className={[
          'shrink-0 h-10 w-10 rounded-full flex items-center justify-center',
          cfg.iconBg,
        ].join(' ')}
      >
        {renderIcon()}
      </div>

      {/* Label + status text */}
      <div className="flex-1 min-w-0">
        <p className="text-[length:var(--text-sm)] font-[number:var(--font-semibold)] text-text-primary leading-snug">
          {label}
        </p>
        <p className="text-[length:var(--text-sm)] text-text-muted mt-[length:var(--space-1)] leading-snug">
          {getStatusText()}
        </p>

        {/* Inline error — client-side validation or server action failure */}
        {error && (
          <p className="text-[length:var(--text-xs)] text-error mt-[length:var(--space-2)]">
            {error}
          </p>
        )}
      </div>

      {/* Upload / re-upload button */}
      {canUpload && (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => inputRef.current?.click()}
        >
          {buttonLabel}
        </Button>
      )}

      {/* Spinner only during active operations — not for stale DB-hydrated pending state */}
      {(status === 'uploading' || isReviewing) && (
        <Loader2 className="h-4 w-4 animate-spin text-text-muted shrink-0" />
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        aria-hidden="true"
        disabled={disabled || status === 'uploading' || isReviewing}
        onChange={handleInputChange}
      />
    </div>
  )
}
