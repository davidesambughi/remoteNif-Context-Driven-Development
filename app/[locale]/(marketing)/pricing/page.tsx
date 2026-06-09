import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
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

  // Split headline so the first word renders as serif italic brand-primary.
  // Translation: "When do you need your NIF?" → "When" italic + " do you need your NIF?"
  const headline = t('hero.headline')
  const firstSpace = headline.indexOf(' ')
  const heroFirstWord = firstSpace > -1 ? headline.slice(0, firstSpace) : headline
  const heroRest     = firstSpace > -1 ? headline.slice(firstSpace)    : ''

  // Express subtitle: highlight "48 hours" in brand color.
  // Split on the literal marker — falls back to plain string if not found (other locales).
  const expressSubtitleRaw = t('tiers.express.subtitle')
  const marker48 = '48 hours'
  const markerIdx = expressSubtitleRaw.indexOf(marker48)
  const expressSub = markerIdx > -1
    ? (
        <>
          {expressSubtitleRaw.slice(0, markerIdx)}
          <span className="text-brand-primary font-[number:var(--font-semibold)]">{marker48}</span>
          {expressSubtitleRaw.slice(markerIdx + marker48.length)}
        </>
      )
    : expressSubtitleRaw

  return (
    <>
    {/* Full-screen background image — the glass cards need a visible background to blur against.
        mt-[-3.5rem] cancels the layout padding to bleed behind the transparent navbar.
        pt-[3.5rem] ensures the actual content starts below the navbar. */}
    <div className="relative min-h-screen bg-[url('/images/sign-in-up-background.png')] bg-cover bg-center bg-no-repeat mt-[-3.5rem] pt-[3.5rem] pb-[length:var(--space-16)]">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-4 pt-[length:var(--space-8)] text-center">
        {/* Headline: entire headline → Playfair Display (serif) */}
        <h1 className="font-serif leading-[var(--leading-tight)]">
          <span className="italic font-[number:var(--font-bold)]
            text-[length:var(--text-4xl)] text-brand-primary">
            {heroFirstWord}
          </span>
          <span className="font-[number:var(--font-bold)]
            text-[length:var(--text-4xl)] text-text-primary">
            {heroRest}
          </span>
        </h1>
        <p
          className="mt-[length:var(--space-4)] text-[length:var(--text-base)]
            text-text-secondary leading-[var(--leading-relaxed)]"
        >
          {t('hero.subheadline')}
        </p>
      </section>

      {/* ── Tier cards ───────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-[length:var(--space-6)] mt-[length:var(--space-10)]">
        <ul className="grid grid-cols-1 lg:grid-cols-3 gap-[length:var(--space-6)] list-none p-0 m-0">

          {/* Essential */}
          <li className="h-full flex flex-col">
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
              badge={t('tiers.essential.badge')}
              ctaVariant="default"
            />
          </li>

          {/* Standard */}
          <li className="h-full flex flex-col">
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
              isFeatured
              badge={t('tiers.standard.badge')}
              ctaVariant="default"
            />
          </li>

          {/* Express — subtitle uses expressSub (pre-built above) to color "48 hours" */}
          <li className="h-full flex flex-col">
            <TierCard
              name={t('tiers.express.name')}
              tierId="express"
              priceEurCents={TIERS.express.priceEurCents}
              subtitle={expressSub}
              infoHint={t('tiers.express.help')}
              features={[
                { label: t('tiers.express.features.submission'), icon: 'zap' },
                { label: t('tiers.express.features.nif'),        icon: 'check' },
                { label: t('tiers.express.features.fiscalRep'),  icon: 'check' },
                { label: t('tiers.express.features.priority'),   icon: 'check' },
              ]}
              cta={t('tiers.express.cta')}
              href={`${ctaBase}?tier=express`}
              isAuthenticated={!!user}
              badge={t('tiers.express.badge')}
              ctaVariant="default"
            />
          </li>

        </ul>
      </section>


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
