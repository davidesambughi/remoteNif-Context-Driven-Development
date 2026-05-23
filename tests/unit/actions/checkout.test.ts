/**
 * Unit tests for app/actions/checkout.ts — createRenewalCheckoutSession
 *
 * Covers all guard conditions (validation, auth, ownership, eligibility)
 * and the happy path. Stripe and DB are mocked — no real network calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRenewalCheckoutSession } from '@/app/actions/checkout'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/auth/session', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/db/queries', () => ({
  getRenewalOrderInfo: vi.fn(),
}))

vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    checkout: {
      sessions: { create: vi.fn() },
    },
  },
}))

vi.mock('@/lib/env', () => ({
  env: { NEXT_PUBLIC_APP_URL: 'http://localhost:3000' },
}))

vi.mock('@/lib/pricing', () => ({
  TIERS: {
    essential: { id: 'essential', priceEurCents: 7900, deliveryDescription: 'Essential' },
    standard: { id: 'standard', priceEurCents: 12900, deliveryDescription: 'Standard' },
    express: { id: 'express', priceEurCents: 19900, deliveryDescription: 'Express' },
  },
  RENEWAL_PRICE_EUR_CENTS: 8900,
}))

import * as session from '@/lib/auth/session'
import * as queries from '@/lib/db/queries'
import { stripe } from '@/lib/stripe/client'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER = {
  id: 'a1b2c3d4-e5f6-7890-ab12-cd34ef56ab12',
  email: 'user@example.com',
  role: 'customer' as const,
}

const ORDER_ID = 'b2c3d4e5-f6a7-8901-bc23-de45fa67bc23'

const STANDARD_ORDER = {
  id: ORDER_ID,
  userId: USER.id,
  tier: 'standard' as const,
  fiscalRepExpiresAt: new Date('2025-01-01'),
  status: 'delivered' as const,
}

const VALID_INPUT = { orderId: ORDER_ID, locale: 'en' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(session.getCurrentUser).mockResolvedValue(USER)
  vi.mocked(queries.getRenewalOrderInfo).mockResolvedValue(STANDARD_ORDER)
  ;(stripe.checkout.sessions.create as ReturnType<typeof vi.fn>).mockResolvedValue({
    url: 'https://checkout.stripe.com/test_session',
  })
})

// ---------------------------------------------------------------------------
// Tests — createRenewalCheckoutSession
// ---------------------------------------------------------------------------

describe('createRenewalCheckoutSession', () => {
  it('returns { success: false } when orderId is not a valid UUID', async () => {
    const result = await createRenewalCheckoutSession({ orderId: 'not-a-uuid', locale: 'en' })

    expect(result.success).toBe(false)
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
  })

  it('returns { success: false } when locale is invalid', async () => {
    const result = await createRenewalCheckoutSession({ orderId: ORDER_ID, locale: 'xx' })

    expect(result.success).toBe(false)
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
  })

  it('returns { success: false } when getCurrentUser returns null', async () => {
    vi.mocked(session.getCurrentUser).mockResolvedValue(null)

    const result = await createRenewalCheckoutSession(VALID_INPUT)

    expect(result.success).toBe(false)
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
  })

  it('returns { success: false } when getRenewalOrderInfo returns null (order not found / wrong user)', async () => {
    vi.mocked(queries.getRenewalOrderInfo).mockResolvedValue(null)

    const result = await createRenewalCheckoutSession(VALID_INPUT)

    expect(result.success).toBe(false)
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
  })

  it('returns { success: false } when order.tier is essential', async () => {
    vi.mocked(queries.getRenewalOrderInfo).mockResolvedValue({
      ...STANDARD_ORDER,
      tier: 'essential',
    })

    const result = await createRenewalCheckoutSession(VALID_INPUT)

    expect(result.success).toBe(false)
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
  })

  it('returns { success: false } when order.fiscalRepExpiresAt is null', async () => {
    vi.mocked(queries.getRenewalOrderInfo).mockResolvedValue({
      ...STANDARD_ORDER,
      fiscalRepExpiresAt: null,
    })

    const result = await createRenewalCheckoutSession(VALID_INPUT)

    expect(result.success).toBe(false)
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
  })

  it('returns { success: true, data: { url } } on the happy path', async () => {
    const result = await createRenewalCheckoutSession(VALID_INPUT)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.url).toBe('https://checkout.stripe.com/test_session')
    }
    expect(stripe.checkout.sessions.create).toHaveBeenCalledOnce()
  })

  it('includes the correct metadata in the Stripe session including type=fiscal_rep_renewal', async () => {
    await createRenewalCheckoutSession(VALID_INPUT)

    const [call] = vi.mocked(stripe.checkout.sessions.create).mock.calls
    expect(call![0].metadata).toEqual(
      expect.objectContaining({
        type: 'fiscal_rep_renewal',
        orderId: ORDER_ID,
        userId: USER.id,
        tier: 'standard',
      }),
    )
  })
})
