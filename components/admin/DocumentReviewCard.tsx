import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { FileText, Download, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DocumentOverrideButtons } from './DocumentOverrideButtons'
import type { AdminDocumentDetail } from '@/lib/db/queries'

interface DocumentReviewCardProps {
  doc?: AdminDocumentDetail
  type: 'passport' | 'proof_of_address' | 'signed_poa'
  orderId: string
}

export async function DocumentReviewCard({ doc, type, orderId }: DocumentReviewCardProps) {
  const t = await getTranslations('admin.detail')
  
  const typeLabel = t(`documentTypes.${type}`)

  if (!doc) {
    return (
      <Card className="bg-surface border-border-default rounded-lg p-5 opacity-60">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-5 w-5 text-text-muted" />
          <h3 className="font-bold text-text-secondary">{typeLabel}</h3>
          <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-subtle text-text-muted border border-border-subtle">
            {t('notUploaded')}
          </span>
        </div>
      </Card>
    )
  }

  const supabase = await createClient()
  const { data } = await supabase.storage
    .from('documents')
    .createSignedUrl(doc.filePath, 3600)
  
  const signedUrl = data?.signedUrl

  // Maps each AI review status to its badge color classes.
  const statusColors: Record<string, string> = {
    clear: 'bg-success-subtle text-success border-success',
    flagged: 'bg-error-subtle text-error border-error',
    pending: 'bg-warning-subtle text-warning border-warning',
    manual_review: 'bg-warning-subtle text-warning border-warning',
    error: 'bg-error-subtle text-error border-error',
  }

  // Human-readable label for the AI review status badge — consistent Title Case throughout.
  const aiStatusLabel: Record<string, string> = {
    clear: 'Clear',
    flagged: 'Flagged',
    pending: 'Pending',
    manual_review: 'Manual review',
    error: 'Error',
  }

  return (
    <Card className="bg-surface border-border-default rounded-lg p-5 shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-brand-primary" />
          <h3 className="font-bold text-text-primary">{typeLabel}</h3>
          {doc.approved ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-success-subtle text-success border border-success/20">
              Approved
            </span>
          ) : (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[doc.aiReviewStatus ?? 'pending']}`}>
              {aiStatusLabel[doc.aiReviewStatus ?? 'pending']}
            </span>
          )}
        </div>

        {signedUrl && (
          <a
            href={signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline"
          >
            <Download className="h-4 w-4" />
            {t('download')}
          </a>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-text-muted font-medium">
          <span className="font-mono">{doc.fileName}</span>
          <span>{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
          <span>{new Date(doc.createdAt).toLocaleString()}</span>
        </div>

        {type !== 'signed_poa' && (
          <div className="bg-subtle rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                {t('aiReview')}:
              </span>
              <span className={`text-xs font-bold ${
                doc.aiReviewStatus === 'clear' ? 'text-success' :
                doc.aiReviewStatus === 'flagged' ? 'text-error' : 'text-warning'
              }`}>
                {/* Consistent Title Case — matches the status badge above */}
                {aiStatusLabel[doc.aiReviewStatus ?? 'pending']}
              </span>
              {doc.aiReviewAttempts > 0 && (
                <span className="text-[10px] text-text-muted">
                  ({doc.aiReviewAttempts} {t('aiAttempts')})
                </span>
              )}
            </div>
            {doc.aiReviewReason && (
              <p className="text-sm text-text-secondary pl-2 border-l-2 border-border-default">
                {doc.aiReviewReason}
              </p>
            )}
          </div>
        )}

        {doc.adminOverride && (
          <div className={`rounded-lg p-3 text-sm flex gap-3 ${
            doc.approved ? 'bg-success-subtle border border-success/20' : 'bg-error-subtle border border-error/20'
          }`}>
            {doc.approved ? (
              <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-error shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-semibold text-text-primary leading-none">
                {t('adminOverrideBadge')}
              </p>
              {doc.adminOverrideReason && (
                <p className="text-text-secondary text-xs">
                  {doc.adminOverrideReason}
                </p>
              )}
              <p className="text-[10px] text-text-muted">
                By {doc.adminOverrideBy?.split('-')[0]} on {doc.adminOverrideAt?.toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </div>

      <DocumentOverrideButtons document={doc} orderId={orderId} />
    </Card>
  )
}
