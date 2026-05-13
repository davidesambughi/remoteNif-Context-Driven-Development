import { getTranslations } from 'next-intl/server'
import { getCurrentUser } from '@/lib/auth/session'
import { redirect } from '@/i18n/navigation'
import { getUserActiveOrder } from '@/lib/db/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import OrderTimeline from '@/components/dashboard/OrderTimeline'
import { Mail, ShieldCheck, FileCheck, Send, CheckCircle2 } from 'lucide-react'

export default async function DashboardPage() {
  const [t, user, locale] = await Promise.all([
    getTranslations('dashboard'),
    getCurrentUser(),
    import('next-intl/server').then((m) => m.getLocale()),
  ])

  if (!user) {
    redirect({ href: '/signin', locale: locale as 'en' | 'fr' | 'es' | 'de' })
    return null
  }

  const order = await getUserActiveOrder(user.id)

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-[var(--bg-base)]">
      <main className="flex-1 w-full max-w-4xl mx-auto p-[length:var(--space-6)] py-[length:var(--space-12)] space-y-[length:var(--space-10)]">
        
        {!order && (
          <div className="space-y-[length:var(--space-6)]">
            <div>
              <h1 className="text-[length:var(--text-3xl)] font-[number:var(--font-bold)] text-[var(--text-primary)]">
                {t('emptyState.title')}
              </h1>
              <p className="text-[length:var(--text-base)] text-[var(--text-secondary)] mt-[length:var(--space-2)]">
                {t('emptyState.description')}
              </p>
            </div>
            
            <Button asChild>
              <Link href="/pricing">{t('emptyState.buttonLabel')}</Link>
            </Button>
          </div>
        )}

        {order && (
          <>
            <div className="space-y-[length:var(--space-2)]">
              <h1 className="text-[length:var(--text-3xl)] font-[number:var(--font-bold)] text-[var(--text-primary)]">
                {t('title')}
              </h1>
              <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">
                {t('orderInfo', { tier: order.tier, id: order.id.slice(0, 8) })}
              </p>
            </div>

            <OrderTimeline status={order.status} />

            <div className="grid gap-[length:var(--space-6)]">
              {/* Status Specific Card */}
              {order.status === 'documents_pending' && (
                <Card className="rounded-[length:var(--radius-xl)] shadow-[var(--shadow-md)] bg-[var(--bg-surface)] border-[var(--border-default)]">
                  <CardHeader>
                    <CardTitle className="text-[length:var(--text-xl)] text-[var(--text-primary)]">
                      {t('pending.title')}
                    </CardTitle>
                    <CardDescription className="text-[length:var(--text-base)] text-[var(--text-secondary)] mt-[length:var(--space-2)]">
                      {t('pending.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button disabled className="w-full sm:w-auto bg-[var(--brand-primary)] text-[var(--text-on-accent)]">
                      {t('pending.actionButton')}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {order.status === 'documents_under_review' && (
                <Card className="rounded-[length:var(--radius-xl)] shadow-[var(--shadow-md)] bg-[var(--bg-surface)] border-[var(--border-default)]">
                  <CardHeader className="flex flex-row items-center gap-[length:var(--space-4)] space-y-0">
                    <div className="h-12 w-12 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--brand-primary)] shrink-0">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-[length:var(--text-xl)] text-[var(--text-primary)]">
                        {t('states.underReview.title')}
                      </CardTitle>
                      <CardDescription className="text-[length:var(--text-base)] text-[var(--text-secondary)]">
                        {t('states.underReview.description')}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              )}

              {order.status === 'documents_approved' && (
                <Card className="rounded-[length:var(--radius-xl)] shadow-[var(--shadow-md)] bg-[var(--bg-surface)] border-[var(--border-default)]">
                  <CardHeader className="flex flex-row items-center gap-[length:var(--space-4)] space-y-0">
                    <div className="h-12 w-12 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--status-success)] shrink-0">
                      <FileCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-[length:var(--text-xl)] text-[var(--text-primary)]">
                        {t('states.approved.title')}
                      </CardTitle>
                      <CardDescription className="text-[length:var(--text-base)] text-[var(--text-secondary)]">
                        {t('states.approved.description')}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  {order.tier === 'express' && (
                    <CardContent>
                      <p className="text-[length:var(--text-sm)] text-[var(--brand-primary)] font-[number:var(--font-medium)]">
                        {t('states.approved.expressNotice')}
                      </p>
                    </CardContent>
                  )}
                </Card>
              )}

              {order.status === 'submitted' && (
                <Card className="rounded-[length:var(--radius-xl)] shadow-[var(--shadow-md)] bg-[var(--bg-surface)] border-[var(--border-default)]">
                  <CardHeader className="flex flex-row items-center gap-[length:var(--space-4)] space-y-0">
                    <div className="h-12 w-12 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-[var(--brand-primary)] shrink-0">
                      <Send className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-[length:var(--text-xl)] text-[var(--text-primary)]">
                        {t('states.submitted.title')}
                      </CardTitle>
                      <CardDescription className="text-[length:var(--text-base)] text-[var(--text-secondary)]">
                        {t('states.submitted.description')}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              )}

              {order.status === 'delivered' && (
                <Card className="rounded-[length:var(--radius-xl)] shadow-[var(--shadow-lg)] bg-[var(--bg-surface)] border-[var(--status-success)] border-2">
                  <CardHeader className="flex flex-row items-center gap-[length:var(--space-4)] space-y-0 text-center sm:text-left">
                    <div className="h-12 w-12 rounded-full bg-[var(--status-success)] flex items-center justify-center text-[var(--text-on-accent)] shrink-0">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-[length:var(--text-2xl)] text-[var(--status-success)]">
                        {t('states.delivered.title')}
                      </CardTitle>
                      <CardDescription className="text-[length:var(--text-base)] text-[var(--text-secondary)]">
                        {t('states.delivered.description')}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center sm:items-start gap-[length:var(--space-4)]">
                    <div className="bg-[var(--bg-subtle)] p-[length:var(--space-6)] rounded-[length:var(--radius-lg)] border border-[var(--border-subtle)] w-full text-center">
                      <div className="text-[length:var(--text-sm)] text-[var(--text-muted)] uppercase tracking-widest font-[number:var(--font-bold)] mb-[length:var(--space-2)]">
                        {t('states.delivered.nifLabel')}
                      </div>
                      <div className="text-[length:var(--text-4xl)] text-[var(--text-primary)] font-[number:var(--font-bold)] font-mono tracking-tighter">
                        {order.nifNumber || '--- --- ---'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Support Contact */}
              <div className="pt-[length:var(--space-8)] border-t border-[var(--border-subtle)]">
                <div className="flex items-center gap-[length:var(--space-3)] text-[var(--text-secondary)]">
                  <Mail className="h-5 w-5" />
                  <p className="text-[length:var(--text-sm)]">
                    {t('support.needHelp')}{' '}
                    <a href="mailto:support@remotenif.com" className="text-[var(--brand-primary)] font-[number:var(--font-medium)] hover:underline">
                      support@remotenif.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  )
}
