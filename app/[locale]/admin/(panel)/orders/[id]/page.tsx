import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { requireRole } from '@/lib/auth/session'
import { getAdminOrderDetail } from '@/lib/db/queries'
import { OrderDetailHeader } from '@/components/admin/OrderDetailHeader'
import { DocumentReviewCard } from '@/components/admin/DocumentReviewCard'
import { ApproveOrderSection } from '@/components/admin/ApproveOrderSection'
import { StatusUpdateSection } from '@/components/admin/StatusUpdateSection'
import { EmailResendSection } from '@/components/admin/EmailResendSection'

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

  const t = await getTranslations('admin.detail')

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
            <h2 className="text-lg font-bold text-[var(--text-primary)] px-1">{t('documents')}</h2>
            <DocumentReviewCard doc={passport} type="passport" orderId={order.id} />
            <DocumentReviewCard doc={proofOfAddress} type="proof_of_address" orderId={order.id} />
            <DocumentReviewCard doc={signedPoa} type="signed_poa" orderId={order.id} />
          </div>
        </div>

        <aside className="space-y-4 mt-8 lg:mt-0 lg:sticky lg:top-6">
          <ApproveOrderSection
            orderId={order.id}
            orderStatus={order.status}
            allDocsApproved={allDocsApproved}
            tier={order.tier}
          />

          <StatusUpdateSection
            orderId={order.id}
            currentStatus={order.status as 'documents_pending' | 'documents_under_review' | 'documents_approved' | 'submitted' | 'delivered'}
          />

          <EmailResendSection orderId={order.id} />
        </aside>
      </div>
    </div>
  )
}
