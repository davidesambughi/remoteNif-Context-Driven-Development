import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleCheckoutSessionCompleted } from '@/lib/stripe/webhooks'
import type Stripe from 'stripe'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/db', () => ({
  db: {
    query: { payments: { findFirst: vi.fn() } },
    transaction: vi.fn(),
  },
}))

vi.mock('@/lib/db/queries', () => ({
  getUserLanguage: vi.fn(),
}))

vi.mock('@/lib/email/send', () => ({
  sendEmail: vi.fn(),
}))

vi.mock('@/lib/env', () => ({
  env: { NEXT_PUBLIC_APP_URL: 'http://localhost:3000' },
}))

import { db } from '@/lib/db'
import * as queries from '@/lib/db/queries'
import * as emailSend from '@/lib/email/send'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeSession(overrides: Record<string, unknown> = {}): Stripe.Checkout.Session {
  return {
    id: 'cs_test_1',
    metadata: { userId: 'user-uuid-abc1-abc1-abc1-abc1abc1abc1', tier: 'standard' },
    payment_intent: 'pi_test_1',
    amount_total: 12900,
    currency: 'eur',
    payment_status: 'paid',
    customer_details: { email: 'customer@example.com' },
    customer_email: null,
    ...overrides,
  } as unknown as Stripe.Checkout.Session
}

// Returns a Drizzle tx stub: insert().values().returning() resolves to [{ id }]
// as any: typing the full Drizzle tx interface adds no value in tests
function makeTxStub(orderId = 'order-created-id') {
  const tx: any = {
    insert: vi.fn().mockImplementation(() => tx),
    values: vi.fn().mockImplementation(() => tx),
    returning: vi.fn().mockResolvedValue([{ id: orderId }]),
  }
  return tx
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(db as any).query.payments.findFirst.mockResolvedValue(undefined)
  vi.mocked(emailSend.sendEmail).mockResolvedValue(undefined)
  vi.mocked(queries.getUserLanguage).mockResolvedValue('en')
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('handleCheckoutSessionCompleted', () => {
  it('returns early without touching the DB when metadata is incomplete', async () => {
    await handleCheckoutSessionCompleted(makeSession({ metadata: {} }))

    expect((db.transaction as any)).not.toHaveBeenCalled()
    expect(emailSend.sendEmail).not.toHaveBeenCalled()
  })

  it('returns early without creating records when the session was already processed (idempotency)', async () => {
    ;(db as any).query.payments.findFirst.mockResolvedValue({ id: 'existing-payment' })

    await handleCheckoutSessionCompleted(makeSession())

    expect((db.transaction as any)).not.toHaveBeenCalled()
    expect(emailSend.sendEmail).not.toHaveBeenCalled()
  })

  it('creates order and payment records inside a transaction on first call', async () => {
    const tx = makeTxStub()
    ;(db.transaction as any).mockImplementation(async (cb: (tx: unknown) => Promise<void>) => cb(tx))

    await handleCheckoutSessionCompleted(makeSession())

    expect((db.transaction as any)).toHaveBeenCalledOnce()
    // insert is called twice: once for orders, once for payments
    expect(tx.insert).toHaveBeenCalledTimes(2)
  })

  it('sends order_confirmation email with the correct data after transaction commits', async () => {
    const tx = makeTxStub('order-abc-123')
    ;(db.transaction as any).mockImplementation(async (cb: (tx: unknown) => Promise<void>) => cb(tx))

    await handleCheckoutSessionCompleted(makeSession())

    expect(emailSend.sendEmail).toHaveBeenCalledWith(
      'customer@example.com',
      'en',
      expect.objectContaining({
        template: 'order_confirmation',
        orderId: 'order-abc-123',
        tier: 'standard',
      }),
    )
  })

  it('does not send email when no customer email is available on the session', async () => {
    const tx = makeTxStub()
    ;(db.transaction as any).mockImplementation(async (cb: (tx: unknown) => Promise<void>) => cb(tx))

    await handleCheckoutSessionCompleted(
      makeSession({ customer_details: null, customer_email: null }),
    )

    expect(emailSend.sendEmail).not.toHaveBeenCalled()
  })
})
