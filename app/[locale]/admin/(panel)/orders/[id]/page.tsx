import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { requireRole } from '@/lib/auth/session'
import { getAdminOrderDetail } from '@/lib/db/queries'
import { ORDER_STATUS_SEQUENCE } from '@/lib/db/schema'
import { OrderDetailHeader } from '@/components/admin/OrderDetailHeader'
import { DocumentReviewCard } from '@/components/admin/DocumentReviewCard'
import { ApproveOrderSection } from '@/components/admin/ApproveOrderSection'
import { StatusUpdateSection } from '@/components/admin/StatusUpdateSection'
import { EmailResendSection } from '@/components/admin/EmailResendSection'
import { DeliverNifSection } from '@/components/admin/DeliverNifSection'

interface OrderDetailPageProps {
  params: Promise<{ id: string; locale: string }>
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id, locale } = await params

  const admin = await requireRole('admin').catch(() => {
    redirect(`/${locale}/admin/signin`)
  })

  const order = await getAdminOrderDetail(id)
  if (!order) {
    notFound()
  }

  // Load both namespaces — detail for section labels, admin for shared status strings in the stepper
  const [t, tAdmin] = await Promise.all([
    getTranslations('admin.detail'),
    getTranslations('admin'),
  ])

  // Group documents by type
  const passport = order.documents.find(d => d.type === 'passport')
  const proofOfAddress = order.documents.find(d => d.type === 'proof_of_address')
  const signedPoa = order.documents.find(d => d.type === 'signed_poa')

  const allDocsApproved = order.documents.length === 3 && order.documents.every(d => d.approved)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-[var(--text-muted)] text-sm hover:text-[var(--text-primary)] mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        {t('back')}
      </Link>

      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 items-start">
        <div className="space-y-6">
          <OrderDetailHeader order={order} />

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[var(--text-primary)] px-1 flex items-center gap-2">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-brand-primary text-on-accent text-[10px] font-bold shrink-0">1</span>
                {t('documents')}
              </h2>
            <DocumentReviewCard doc={passport} type="passport" orderId={order.id} />
            <DocumentReviewCard doc={proofOfAddress} type="proof_of_address" orderId={order.id} />
            <DocumentReviewCard doc={signedPoa} type="signed_poa" orderId={order.id} />
          </div>
        </div>

        <aside className="space-y-4 mt-8 lg:mt-0 lg:sticky lg:top-6">

          {/* Workflow stepper — 5-segment progress bar + current step label.
              Past steps are green, current is brand-primary, future are muted.
              Reuses ORDER_STATUS_SEQUENCE and existing admin.statuses.* keys — no new i18n needed. */}
          <div className="bg-surface border border-[var(--border-default)] rounded-lg px-4 py-3 shadow-[var(--shadow-sm)]">
            <p className="text-[var(--text-muted)] text-2xs font-medium uppercase tracking-wide mb-2">
              Workflow
            </p>
            <ol className="flex items-center gap-1 mb-2" aria-label="Order workflow progress">
              {ORDER_STATUS_SEQUENCE.map((s, i) => {
                const currentIndex = ORDER_STATUS_SEQUENCE.indexOf(order.status)
                return (
                  <li key={s} className="flex-1">
                    <div
                      className={`h-1.5 rounded-full ${
                        i < currentIndex
                          ? 'bg-success'
                          : i === currentIndex
                            ? 'bg-brand-primary'
                            : 'bg-[var(--border-subtle)]'
                      }`}
                    />
                  </li>
                )
              })}
            </ol>
            <p className="text-[var(--text-primary)] text-xs font-semibold">
              {tAdmin(`statuses.${order.status}`)}
            </p>
          </div>

          {/* Approve — only shown during document review; disabled/irrelevant at all other steps */}
          {order.status === 'documents_under_review' && (
            <ApproveOrderSection
              orderId={order.id}
              orderStatus={order.status}
              allDocsApproved={allDocsApproved}
              tier={order.tier}
            />
          )}

          {/* Deliver NIF — shown once submitted to Finanças, and kept visible after delivery
              for the read-only NIF display (nifNumber !== null handles the delivered state) */}
          {(order.status === 'submitted' || order.nifNumber !== null) && (
            <DeliverNifSection
              orderId={order.id}
              currentStatus={order.status}
              existingNifNumber={order.nifNumber}
            />
          )}

          {/* Status override — always visible; admin may need to correct at any step */}
          <StatusUpdateSection
            orderId={order.id}
            currentStatus={order.status}
          />

          {/* Email resend — always visible; useful at any step */}
          <EmailResendSection orderId={order.id} />

        </aside>
      </div>

      {/* Step legend — quick reference for the numbered sidebar actions */}
      <div className="mt-10 border-t border-[var(--border-subtle)] pt-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">Legend</p>
        <ol className="flex flex-wrap gap-x-6 gap-y-2">
          {[
            'Review and approve each uploaded document',
            'Confirm all docs and advance the order to submitted',
            'Enter the 9-digit NIF received from Finanças',
            'Manually override the order stage if something needs correcting',
            'Trigger a status notification email to the customer',
          ].map((label, i) => (
            <li key={i} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-brand-primary text-on-accent text-[9px] font-bold shrink-0">
                {i + 1}
              </span>
              {label}
            </li>
          ))}
        </ol>
      </div>

    </div>
  )
}
