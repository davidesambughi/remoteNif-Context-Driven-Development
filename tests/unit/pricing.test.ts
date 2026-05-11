/**
 * Tests for the pricing constants in lib/pricing.ts.
 *
 * WHY TEST CONSTANTS?
 * Prices are business-critical. A misplaced zero (7900 → 790) is a real
 * revenue bug that TypeScript won't catch because the type is still `number`.
 * These tests act as a tripwire: if a price changes in code, a test fails
 * and forces a deliberate decision instead of an accidental one.
 *
 * They also document the exact business rules (who gets fiscal rep, how
 * many months, what the renewal costs) in a place that's easy to read.
 */

import { describe, it, expect } from 'vitest'
import { TIERS, TIER_ORDER, RENEWAL_PRICE_EUR_CENTS } from '@/lib/pricing'

// ---------------------------------------------------------------------------
// Prices
// ---------------------------------------------------------------------------

describe('tier prices', () => {
  // Prices are stored in euro cents to avoid floating-point arithmetic bugs.
  // €79.00 → 7900 cents, €129.00 → 12900 cents, €179.00 → 17900 cents.
  it('Essential costs €79.00 (7900 cents)', () => {
    expect(TIERS.essential.priceEurCents).toBe(7900)
  })

  it('Standard costs €129.00 (12900 cents)', () => {
    expect(TIERS.standard.priceEurCents).toBe(12900)
  })

  it('Express costs €179.00 (17900 cents)', () => {
    expect(TIERS.express.priceEurCents).toBe(17900)
  })

  it('Renewal costs €89.00 (8900 cents)', () => {
    expect(RENEWAL_PRICE_EUR_CENTS).toBe(8900)
  })
})

// ---------------------------------------------------------------------------
// Fiscal representation rules
// ---------------------------------------------------------------------------

// These tests encode the legal/product decision about which tiers include
// fiscal rep. If this ever changes, tests break and force a conscious update.

describe('fiscal representation inclusion', () => {
  it('Essential does NOT include fiscal representation', () => {
    expect(TIERS.essential.includesFiscalRep).toBe(false)
    expect(TIERS.essential.fiscalRepMonths).toBeNull()
  })

  it('Standard includes 12 months of fiscal representation', () => {
    expect(TIERS.standard.includesFiscalRep).toBe(true)
    expect(TIERS.standard.fiscalRepMonths).toBe(12)
  })

  it('Express includes 12 months of fiscal representation', () => {
    expect(TIERS.express.includesFiscalRep).toBe(true)
    expect(TIERS.express.fiscalRepMonths).toBe(12)
  })
})

// ---------------------------------------------------------------------------
// Tier ordering
// ---------------------------------------------------------------------------

describe('TIER_ORDER', () => {
  // The pricing page renders tiers in this order. If someone reorders
  // TIER_ORDER, this test breaks — which is the intended behavior, because
  // a reorder should be a conscious UI decision, not an accident.
  it('renders Essential → Standard → Express', () => {
    expect(TIER_ORDER).toEqual(['essential', 'standard', 'express'])
  })

  it('contains all three tiers', () => {
    expect(TIER_ORDER).toHaveLength(3)
  })
})

// ---------------------------------------------------------------------------
// Tier IDs
// ---------------------------------------------------------------------------

describe('tier IDs', () => {
  // The id field in each config must match the key used to look it up.
  // A mismatch (e.g. TIERS.express.id === 'standard') would cause silent
  // bugs when code reads the id from a config object.
  it('each tier config id matches its key', () => {
    expect(TIERS.essential.id).toBe('essential')
    expect(TIERS.standard.id).toBe('standard')
    expect(TIERS.express.id).toBe('express')
  })
})
