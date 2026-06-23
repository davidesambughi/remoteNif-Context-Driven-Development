/**
 * Single source of truth for the service tiers and pricing.
 * 
 * This file contains both the TypeScript interfaces (types) and the actual
 * configuration data (constants). By centralizing this here, we ensure that
 * the UI, Server Actions, and SEO schemas (JSON-LD) always use consistent values.
 */

export type Tier = 'essential' | 'standard' | 'express'

export interface TierConfig {
  id: Tier
  priceEurCents: number
  deliveryDescription: string
  includesFiscalRep: boolean
  fiscalRepMonths: number | null
}

/** Configuration for the three main service tiers. */
export const TIERS: Record<Tier, TierConfig> = {
  essential: {
    id: 'essential',
    priceEurCents: 7900,
    deliveryDescription: 'Submitted within 5 business days',
    includesFiscalRep: false,
    fiscalRepMonths: null,
  },
  standard: {
    id: 'standard',
    priceEurCents: 12900,
    deliveryDescription: 'Submitted within 5 business days',
    includesFiscalRep: true,
    fiscalRepMonths: 12,
  },
  express: {
    id: 'express',
    priceEurCents: 17900,
    deliveryDescription: 'Submitted within 48h of document approval',
    includesFiscalRep: true,
    fiscalRepMonths: 12,
  },
}

/** Canonical display order for the pricing page and comparison tables. */
export const TIER_ORDER: Tier[] = ['essential', 'standard', 'express']

/** Price for a 12-month fiscal representation renewal. */
export const RENEWAL_PRICE_EUR_CENTS = 8900
