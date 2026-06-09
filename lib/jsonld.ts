// jsonld.ts — Pure builder functions for Schema.org JSON-LD structured data.
// No React imports. No next-intl. Always outputs English (crawler-facing, not user-facing).
// Each function returns a plain object that can be passed directly to <JsonLd data={...} />.

import { TIERS, TIER_ORDER, type Tier } from '@/lib/pricing'

// ── Organization ─────────────────────────────────────────────────────────────

/**
 * Organization schema — identifies the brand entity behind the site.
 * Injected once in the root layout.
 */
export function buildOrganizationSchema(baseUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'RemoteNIF',
    url: baseUrl,
    description:
      'Online Portuguese NIF application service. Apply fully remotely from anywhere in the world.',
    areaServed: 'Worldwide',
    serviceType: 'NIF Application',
  }
}

// ── WebSite ───────────────────────────────────────────────────────────────────

/**
 * WebSite schema — tells crawlers the canonical site URL and name.
 * No potentialAction (no internal search feature).
 * Injected once in the root layout alongside Organization.
 */
export function buildWebSiteSchema(baseUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'RemoteNIF',
    url: baseUrl,
  }
}

// ── Product (pricing tiers) ───────────────────────────────────────────────────

// Tier-specific copy for Product schema descriptions.
// Typed as Record<Tier, ...> so TypeScript knows all three keys are present
// and access via TIER_ORDER (which yields Tier values) is always defined.
// Keep these descriptions aligned with the pricing page copy.
const TIER_SCHEMA_COPY: Record<Tier, { name: string; description: string }> = {
  essential: {
    name: 'Essential NIF Application',
    description:
      'NIF number issued in 5 business days. No fiscal representation included.',
  },
  standard: {
    name: 'Standard NIF Application',
    description:
      'NIF number in 5 business days, plus 12 months of licensed fiscal representation.',
  },
  express: {
    name: 'Express NIF Application',
    description:
      'NIF application submitted to Finanças within 48 hours of document approval. Includes 12 months of fiscal representation.',
  },
}

/**
 * Returns an array of three Product schemas — one per pricing tier.
 * Prices are derived from lib/pricing.ts TIERS to stay in sync automatically.
 * Injected into the Pricing page.
 */
export function buildProductSchemas(
  baseUrl: string,
): Record<string, unknown>[] {
  const pricingUrl = `${baseUrl}/pricing`

  return TIER_ORDER.map((tierId) => {
    const tier = TIERS[tierId]
    const copy = TIER_SCHEMA_COPY[tierId]
    // Convert cents to a 2-decimal EUR string (e.g. 7900 → "79.00")
    const priceStr = (tier.priceEurCents / 100).toFixed(2)

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: copy.name,
      description: copy.description,
      url: pricingUrl,
      brand: {
        '@type': 'Brand',
        name: 'RemoteNIF',
      },
      offers: {
        '@type': 'Offer',
        price: priceStr,
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        url: pricingUrl,
      },
    }
  })
}

// ── FAQPage ───────────────────────────────────────────────────────────────────

// Keep in sync with messages/en.json home.faq.* keys.
// Note: Google deprecated FAQ rich results in May 2026 — this schema is kept
// for AI crawlers (Perplexity, ChatGPT, ClaudeBot) that still parse FAQPage.
const FAQ_ENTRIES: Array<{ question: string; answer: string }> = [
  {
    question: 'How long does it take to get a Portuguese NIF?',
    answer:
      'Standard NIF delivery takes 5–10 business days from document approval. Express orders are submitted to Finanças within 48 hours of document approval. Finanças processing time after submission is outside our control.',
  },
  {
    question: 'Do I need to be in Portugal to apply for a NIF?',
    answer:
      'No, the entire Portuguese NIF application process is 100% remote. We act as your fiscal representative in Portugal and submit the application to Finanças digitally on your behalf.',
  },
  {
    question: 'What documents are required for a Portuguese NIF?',
    answer:
      'You need a valid passport and proof of address dated within the last 3 months (utility bill, bank statement, or rental agreement). Phone and TV bills are not accepted.',
  },
  {
    question: 'Is a fiscal representative mandatory for a NIF in 2026?',
    answer:
      'Fiscal representation is only mandatory for non-EU/EEA residents with active Portuguese tax obligations. Under Decree-Law 44/2022, EU/EEA residents are never required to appoint a fiscal representative. Others only need one if they own property, earn income, or run a business in Portugal.',
  },
  {
    question: 'What is the current Portuguese fiscal representation law (Decree-Law 44/2022)?',
    answer:
      'Decree-Law 44/2022 removed the universal requirement for non-EU/EEA residents to appoint a fiscal representative. The requirement now only applies to those with active Portuguese tax obligations (property, income, or business). If you have none, a representative is not legally required.',
  },
]

/**
 * FAQPage schema — structured Q&A data for AI crawlers and search engines.
 * Google deprecated FAQ rich results in May 2026 (no visual SERP snippet),
 * but the markup is still consumed by AI search engines.
 * Injected into the homepage alongside the visible FAQSection.
 */
export function buildFaqPageSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ENTRIES.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: entry.answer,
      },
    })),
  }
}
