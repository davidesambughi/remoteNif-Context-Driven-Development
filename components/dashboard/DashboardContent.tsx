import { getTranslations, getLocale } from 'next-intl/server'
import { getUserActiveOrder, getActiveDocumentsForOrder } from '@/lib/db/queries'
import { getPoaSignedUrl } from '@/lib/pdf/generator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import OrderTimeline from '@/components/dashboard/OrderTimeline'
import { PersonalDetailsForm } from '@/components/dashboard/PersonalDetailsForm'
import { RenewalBanner } from '@/components/dashboard/RenewalBanner'
import { Mail, ShieldCheck, FileCheck, Send, CheckCircle2 } from 'lucide-react'

interface Props {
  /** The authenticated user's ID — passed from DashboardPage after auth resolves. */
  userId: string
}

/**
 * DashboardContent — async server component that handles all slow data fetching.
 * Wrapped in <Suspense> by DashboardPage so the page shell streams immediately
 * while this component fetches order/document data from the database.
 *
 * Splitting this out means the user sees the page layout and header instantly,
 * with only the order card section waiting on DB queries.
 */
export async function DashboardContent({ userId }: Props) {
  // Fetch translations in parallel with order data — getTranslations is fast (in-memory)
  // but getUserActiveOrder is the slow DB query we want to Suspense-boundary.
  const [t, tc, locale, order] = await Promise.all([
    getTranslations('dashboard'),
    getTranslations('common'),
    getLocale(),
    getUserActiveOrder(userId),
  ])

  // Conditionally fetch POA signed URL and document records in parallel.
  // Both are only needed for specific order states, avoiding unnecessary DB hits.
  const [poaSignedUrl, documentRecords] = await Promise.all([
    order?.poaGeneratedPath ? getPoaSignedUrl(order.poaGeneratedPath) : Promise.resolve(null),
    order?.status === 'documents_pending'
      ? getActiveDocumentsForOrder(order.id)
      : Promise.resolve([]),
  ])

  return (
    <>
      {/* Case A: User has no orders yet (Empty State) */}
      {!order && (
        <div className="space-y-[length:var(--space-6)]">
          <div>
            <h1 className="text-[length:var(--text-3xl)] font-[number:var(--font-bold)] text-text-primary">
              {t('emptyState.title')}
            </h1>
            <p className="text-[length:var(--text-base)] text-text-secondary mt-[length:var(--space-2)]">
              {t('emptyState.description')}
            </p>
          </div>

          <Button asChild>
            <Link href="/pricing">{t('emptyState.buttonLabel')}</Link>
          </Button>
        </div>
      )}

      {/* Case B: User has an active order */}
      {order && (
        <>
          {/* Renewal banner — renders only for Standard/Express within 30 days of expiry */}
          <RenewalBanner order={order} locale={locale} />

          <div className="space-y-[length:var(--space-2)]">
            <h1 className="text-[length:var(--text-3xl)] font-[number:var(--font-bold)] text-text-primary">
              {t('title')}
            </h1>
            <p className="text-[length:var(--text-sm)] text-text-secondary">
              {t('orderInfo', { tier: order.tier, id: order.id.slice(0, 8) })}
            </p>
          </div>

          <OrderTimeline status={order.status} />

          <div className="grid gap-[length:var(--space-6)]">
            {/* Status-specific card — only one renders at a time */}

            {order.status === 'documents_pending' && (
              <PersonalDetailsForm
                orderId={order.id}
                initialValues={
                  order.fullName
                    ? {
                        fullName: order.fullName,
                        dateOfBirth: order.dateOfBirth ?? '',
                        nationality: order.nationality ?? '',
                        passportNumber: order.passportNumber ?? '',
                        passportExpiry: order.passportExpiry ?? '',
                        address: order.address ?? '',
                      }
                    : null
                }
                detailsSaved={order.fullName !== null}
                poaSignedUrl={poaSignedUrl}
                documentRecords={documentRecords}
              />
            )}

            {order.status === 'documents_under_review' && (
              <Card className="rounded-[length:var(--radius-xl)] shadow-[var(--shadow-md)] bg-surface border-border-default">
                <CardHeader className="flex flex-row items-center gap-[length:var(--space-4)] space-y-0">
                  <div className="h-12 w-12 rounded-full bg-subtle flex items-center justify-center text-brand-primary shrink-0">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-[length:var(--text-xl)] text-text-primary">
                      {t('states.underReview.title')}
                    </CardTitle>
                    <CardDescription className="text-[length:var(--text-base)] text-text-secondary">
                      {t('states.underReview.description')}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            )}

            {order.status === 'documents_approved' && (
              <Card className="rounded-[length:var(--radius-xl)] shadow-[var(--shadow-md)] bg-surface border-border-default">
                <CardHeader className="flex flex-row items-center gap-[length:var(--space-4)] space-y-0">
                  <div className="h-12 w-12 rounded-full bg-subtle flex items-center justify-center text-success shrink-0">
                    <FileCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-[length:var(--text-xl)] text-text-primary">
                      {t('states.approved.title')}
                    </CardTitle>
                    <CardDescription className="text-[length:var(--text-base)] text-text-secondary">
                      {t('states.approved.description')}
                    </CardDescription>
                  </div>
                </CardHeader>
                {order.tier === 'express' && (
                  <CardContent>
                    <p className="text-[length:var(--text-sm)] text-brand-primary font-[number:var(--font-medium)]">
                      {t('states.approved.expressNotice')}
                    </p>
                  </CardContent>
                )}
              </Card>
            )}

            {order.status === 'submitted' && (
              <Card className="rounded-[length:var(--radius-xl)] shadow-[var(--shadow-md)] bg-surface border-border-default">
                <CardHeader className="flex flex-row items-center gap-[length:var(--space-4)] space-y-0">
                  <div className="h-12 w-12 rounded-full bg-subtle flex items-center justify-center text-brand-primary shrink-0">
                    <Send className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-[length:var(--text-xl)] text-text-primary">
                      {t('states.submitted.title')}
                    </CardTitle>
                    <CardDescription className="text-[length:var(--text-base)] text-text-secondary">
                      {t('states.submitted.description')}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            )}

            {/* Delivered State: Final NIF delivery with prominent mono-spaced display */}
            {order.status === 'delivered' && (
              <Card className="rounded-[length:var(--radius-xl)] shadow-[var(--shadow-lg)] bg-surface border-success border-2">
                <CardHeader className="flex flex-row items-center gap-[length:var(--space-4)] space-y-0 text-center sm:text-left">
                  <div className="h-12 w-12 rounded-full bg-success flex items-center justify-center text-on-accent shrink-0">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-[length:var(--text-2xl)] text-success">
                      {t('states.delivered.title')}
                    </CardTitle>
                    <CardDescription className="text-[length:var(--text-base)] text-text-secondary">
                      {t('states.delivered.description')}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center sm:items-start gap-[length:var(--space-4)]">
                  <div className="bg-subtle p-[length:var(--space-6)] rounded-[length:var(--radius-lg)] border border-border-subtle w-full text-center">
                    <div className="text-[length:var(--text-sm)] text-text-muted uppercase tracking-widest font-[number:var(--font-bold)] mb-[length:var(--space-2)]">
                      {t('states.delivered.nifLabel')}
                    </div>
                    <div className="text-[length:var(--text-4xl)] text-text-primary font-[number:var(--font-bold)] font-mono tracking-tighter">
                      {order.nifNumber || '--- --- ---'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Support contact — always visible regardless of order status */}
            <div className="pt-[length:var(--space-8)] border-t border-border-subtle">
              <div className="flex items-center gap-[length:var(--space-3)] text-text-secondary">
                <Mail className="h-5 w-5" />
                <p className="text-[length:var(--text-sm)]">
                  {tc('support.needHelp')}{' '}
                  <a
                    href="mailto:support@remotenif.com"
                    className="text-brand-primary font-[number:var(--font-medium)] hover:underline"
                  >
                    support@remotenif.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
