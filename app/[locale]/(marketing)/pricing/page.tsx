import { getTranslations } from 'next-intl/server'
import { ScanSearch, UserCheck, Mail } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/session'
import { TIERS } from '@/lib/pricing'
import { TierCard } from '@/components/marketing/TierCard'

// Pricing page — server-rendered, no auth required.
// Checks session only to decide the CTA destination (signup vs dashboard).
export default async function PricingPage() {
  const [t, user] = await Promise.all([
    getTranslations('pricing'),
    getCurrentUser(),
  ])

  // Unauthenticated users go to signup; authenticated users go straight to dashboard
  const ctaBase = user ? '/dashboard' : '/signup'

  return (
    <div className="bg-[var(--bg-base)] pb-[length:var(--space-16)]">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-4 pt-[length:var(--space-16)] text-center">
        <h1
          className="text-[length:var(--text-4xl)] font-[number:var(--font-bold)]
            text-text-primary leading-[var(--leading-tight)]"
        >
          {t('hero.headline')}
        </h1>
        <p
          className="mt-[length:var(--space-4)] text-[length:var(--text-base)]
            text-text-secondary leading-[var(--leading-relaxed)]"
        >
          {t('hero.subheadline')}
        </p>
      </section>

      {/* ── Tier cards ───────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 mt-[length:var(--space-12)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-[length:var(--space-6)]">

          {/* Essential */}
          <TierCard
            name={t('tiers.essential.name')}
            tierId="essential"
            priceEurCents={TIERS.essential.priceEurCents}
            subtitle={t('tiers.essential.subtitle')}
            features={[
              { label: t('tiers.essential.features.delivery'), icon: 'clock' },
              { label: t('tiers.essential.features.nif'),      icon: 'check' },
              { label: t('tiers.essential.features.noFiscalRep'), icon: 'disabled' },
            ]}
            cta={t('tiers.essential.cta')}
            href={`${ctaBase}?tier=essential`}
            isAuthenticated={!!user}
            ctaVariant="outline"
          />

          {/* Standard */}
          <TierCard
            name={t('tiers.standard.name')}
            tierId="standard"
            priceEurCents={TIERS.standard.priceEurCents}
            subtitle={t('tiers.standard.subtitle')}
            features={[
              { label: t('tiers.standard.features.delivery'),  icon: 'clock' },
              { label: t('tiers.standard.features.nif'),       icon: 'check' },
              { label: t('tiers.standard.features.fiscalRep'), icon: 'check' },
            ]}
            cta={t('tiers.standard.cta')}
            href={`${ctaBase}?tier=standard`}
            isAuthenticated={!!user}
            ctaVariant="default"
          />

          {/* Express */}
          <TierCard
            name={t('tiers.express.name')}
            tierId="express"
            priceEurCents={TIERS.express.priceEurCents}
            subtitle={t('tiers.express.subtitle')}
            features={[
              { label: t('tiers.express.features.submission'), icon: 'zap' },
              { label: t('tiers.express.features.nif'),        icon: 'check' },
              { label: t('tiers.express.features.fiscalRep'),  icon: 'check' },
              { label: t('tiers.express.features.priority'),   icon: 'check' },
            ]}
            cta={t('tiers.express.cta')}
            href={`${ctaBase}?tier=express`}
            isAuthenticated={!!user}
            isFeatured
            badge={t('tiers.express.badge')}
            ctaVariant="default"
          />

        </div>
      </section>

      {/* ── All tiers include bar ─────────────────────────────────────── */}
      <div className="mt-[length:var(--space-12)] bg-subtle py-[length:var(--space-6)]">
        <div className="max-w-5xl mx-auto px-4">
          <div
            className="flex flex-col md:flex-row items-center justify-center
              gap-[length:var(--space-4)] md:gap-[length:var(--space-8)]"
          >
            <span
              className="text-[length:var(--text-sm)] font-[number:var(--font-semibold)]
                text-text-secondary uppercase tracking-wide"
            >
              {t('includes.title')}
            </span>

            <div
              className="flex flex-col md:flex-row items-center
                gap-[length:var(--space-4)] md:gap-[length:var(--space-6)]"
            >
              <div className="flex items-center gap-[length:var(--space-2)]">
                <ScanSearch className="h-4 w-4 text-brand-primary" aria-hidden="true" />
                <span className="text-[length:var(--text-sm)] text-text-secondary">
                  {t('includes.aiReview')}
                </span>
              </div>

              <div className="flex items-center gap-[length:var(--space-2)]">
                <UserCheck className="h-4 w-4 text-brand-primary" aria-hidden="true" />
                <span className="text-[length:var(--text-sm)] text-text-secondary">
                  {t('includes.adminVerification')}
                </span>
              </div>

              <div className="flex items-center gap-[length:var(--space-2)]">
                <Mail className="h-4 w-4 text-brand-primary" aria-hidden="true" />
                <span className="text-[length:var(--text-sm)] text-text-secondary">
                  {t('includes.emailSupport')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
