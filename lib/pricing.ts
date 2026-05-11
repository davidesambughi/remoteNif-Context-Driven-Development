export type Tier = 'essential' | 'standard' | 'express'

export interface TierConfig {
  id: Tier
  priceEurCents: number
  deliveryDescription: string
  includesFiscalRep: boolean
  fiscalRepMonths: number | null
}

export const TIERS: Record<Tier, TierConfig> = {
  essential: {
    id: 'essential',
    priceEurCents: 7900,
    deliveryDescription: '5 business days',
    includesFiscalRep: false,
    fiscalRepMonths: null,
  },
  standard: {
    id: 'standard',
    priceEurCents: 12900,
    deliveryDescription: '5 business days',
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

// Canonical render order for the pricing page
export const TIER_ORDER: Tier[] = ['essential', 'standard', 'express']

export const RENEWAL_PRICE_EUR_CENTS = 8900
