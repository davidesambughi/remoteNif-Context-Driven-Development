import { use } from 'react'
import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { HeroSection } from '@/components/marketing/HeroSection'
import { HowItWorksSection } from '@/components/marketing/HowItWorksSection'
import { FAQSection } from '@/components/marketing/FAQSection'
import { ComingSoonSection } from '@/components/marketing/ComingSoonSection'
import type { Locale } from '@/i18n/routing'
import { buildAlternates } from '@/lib/seo'
import { JsonLd } from '@/components/shared/JsonLd'
import { buildFaqPageSchema } from '@/lib/jsonld'

// Per-page metadata — title populates the root layout's '%s | RemoteNIF' template.
// Canonical + hreflang alternates are locale-aware (self-referencing canonical per Google spec).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const { canonical, languages } = buildAlternates(locale, '/')

  return {
    // ── 20a: canonical + hreflang ──────────────────────────────────────
    title: 'Get Your Portuguese NIF Online — Fast & Fully Remote',
    description:
      'Apply for a Portuguese NIF (Tax Identification Number) from anywhere in the world. ' +
      'Choose Essential, Standard, or Express. No hidden fees. AI document review included.',
    alternates: { canonical, languages },

    // ── 20b: Open Graph + Twitter Card ────────────────────────────────
    // og:image is auto-registered by opengraph-image.tsx — do not add images here.
    openGraph: {
      title: 'Get Your Portuguese NIF Online — Fast & Fully Remote',
      description:
        'Apply for a Portuguese NIF from anywhere. Essential, Standard, or Express. ' +
        'No hidden fees. AI document review included.',
      url: canonical,
      siteName: 'RemoteNIF',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Get Your Portuguese NIF Online — Fast & Fully Remote',
      description:
        'Apply for a Portuguese NIF from anywhere. Essential, Standard, or Express.',
    },
  }
}

export default function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = use(params)
  setRequestLocale(locale)

  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <FAQSection />
      <ComingSoonSection />
      {/* ── 20c: FAQPage JSON-LD — AI crawlers parse this even though Google
           deprecated FAQ rich results in May 2026. Placed after <FAQSection />
           so the schema is near the content it describes. */}
      <JsonLd data={buildFaqPageSchema()} />
    </>
  )
}
