import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { ScanSearch, UserCheck, Mail } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/session'
import { TIERS } from '@/lib/pricing'
import { TierCard } from '@/components/marketing/TierCard'
import type { Locale } from '@/i18n/routing'
import { buildAlternates } from '@/lib/seo'
import { JsonLd } from '@/components/shared/JsonLd'
import { buildProductSchemas } from '@/lib/jsonld'
import { env } from '@/lib/env'

// Per-page metadata — distinct from homepage to avoid duplicate titles in Google Search.
// Canonical + hreflang cover all four locale variants (/pricing, /fr/pricing, etc.).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const { canonical, languages } = buildAlternates(locale, '/pricing')

  return {
    // ── 20a: canonical + hreflang ──────────────────────────────────────
    title: 'Pricing — NIF Application Plans',
    description:
      'Compare Essential (€79), Standard (€129), and Express (€179) NIF application plans. ' +
      'All include AI document review and admin verification. Choose the speed you need.',
    alternates: { canonical, languages },

    // ── 20b: Open Graph + Twitter Card ────────────────────────────────
    // og:image is auto-registered by pricing/opengraph-image.tsx — no images field here.
    openGraph: {
      title: 'NIF Application Plans — RemoteNIF',
      description:
        'Compare Essential (€79), Standard (€129), and Express (€179) plans. ' +
        'All include AI document review and admin verification.',
      url: canonical,
      siteName: 'RemoteNIF',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'NIF Application Plans — RemoteNIF',
      description:
        'Compare Essential (€79), Standard (€129), and Express (€179) plans. AI document review included.',
    },
  }
}

// Pricing page — server-rendered, no auth required.
// Checks session only to decide the CTA destination (signup vs dashboard).
export default async function PricingPage() {
  const [t, user] = await Promise.all([
    getTranslations('pricing'),
    getCurrentUser(),
  ])

  // Strip trailing slash — schema URLs must be clean (e.g. "https://remotenif.com")
  const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')

  // Unauthenticated users go to signup; authenticated users go straight to dashboard
  const ctaBase = user ? '/dashboard' : '/signup'

  return (
    <>
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

    {/* ── 20c: Product JSON-LD — one schema per pricing tier.
         Prices are derived from lib/pricing.ts TIERS to stay in sync automatically.
         Placed after the visible pricing UI so the schema sits near the content it describes. */}
    {buildProductSchemas(baseUrl).map((schema, i) => (
      <JsonLd key={i} data={schema} />
    ))}
    </>
  )
}
