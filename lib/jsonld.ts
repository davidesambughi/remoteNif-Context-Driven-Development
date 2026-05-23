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
    question: 'How long does the process take?',
    answer:
      'Standard orders take 5–10 business days from document approval. Express orders are submitted to Finanças within 48 hours of document approval. Finanças processing time after submission is outside our control.',
  },
  {
    question: 'Do I need to be in Portugal?',
    answer:
      'No. The entire process is remote. We act as your fiscal representative in Portugal and submit the application to Finanças on your behalf.',
  },
  {
    question: 'What documents are required?',
    answer:
      'You need a valid passport and proof of address dated within the last 3 months (utility bill, bank statement, or rental agreement). Phone and TV bills are not accepted.',
  },
  {
    question: 'Do I need a fiscal representative?',
    answer:
      'It depends on your situation in Portugal. Under Decree-Law 44/2022, EU/EEA residents are never required to appoint a fiscal representative. Non-EU/EEA residents only need one if they have active Portuguese tax obligations — such as property ownership, rental income, or business activity in Portugal. Our Essential tier is for anyone without fiscal representation needs, regardless of nationality. Standard and Express include 12 months of licensed fiscal representation.',
  },
  {
    question: "I've heard the fiscal representative law changed — what's the current rule?",
    answer:
      'The law already changed in July 2022. Decree-Law 44/2022 removed the blanket requirement for non-EU/EEA residents to appoint a fiscal representative. Today, the requirement applies only to non-EU/EEA residents with active Portuguese tax obligations. If you have no property, income, or business activity in Portugal, you are not legally required to appoint one.',
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
