import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleCheckoutSessionCompleted, handleRenewalCheckoutCompleted } from '@/lib/stripe/webhooks'
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
  extendFiscalRepExpiry: vi.fn(),
  getOrderFullName: vi.fn(),
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
  vi.mocked(queries.extendFiscalRepExpiry).mockResolvedValue(new Date('2026-01-01'))
  vi.mocked(queries.getOrderFullName).mockResolvedValue('João Silva')
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

// ---------------------------------------------------------------------------
// handleRenewalCheckoutCompleted
// ---------------------------------------------------------------------------

/** Builds a renewal Checkout.Session with valid metadata */
function makeRenewalSession(overrides: Record<string, unknown> = {}): Stripe.Checkout.Session {
  return {
    id: 'cs_renewal_test_1',
    metadata: {
      type: 'fiscal_rep_renewal',
      orderId: 'a0a0a0a0-a0a0-4a0a-8a0a-a0a0a0a0a0a0',
      userId: 'b0b0b0b0-b0b0-4b0b-8b0b-b0b0b0b0b0b0',
      tier: 'standard',
    },
    payment_intent: 'pi_renewal_1',
    amount_total: 8900,
    currency: 'eur',
    payment_status: 'paid',
    customer_details: { email: 'customer@example.com' },
    customer_email: null,
    ...overrides,
  } as unknown as Stripe.Checkout.Session
}

/** Renewal tx stub: insert().values() returns the tx, extendFiscalRepExpiry is mocked separately */
function makeRenewalTxStub() {
  const tx: any = {
    insert: vi.fn().mockImplementation(() => tx),
    values: vi.fn().mockResolvedValue(undefined),
  }
  return tx
}

describe('handleRenewalCheckoutCompleted', () => {
  it('returns early without any DB write when metadata is invalid', async () => {
    await handleRenewalCheckoutCompleted(
      makeRenewalSession({ metadata: { type: 'wrong_type', orderId: 'bad' } }),
    )

    expect((db.transaction as any)).not.toHaveBeenCalled()
    expect(emailSend.sendEmail).not.toHaveBeenCalled()
  })

  it('returns early without any DB write when session was already processed (idempotency)', async () => {
    ;(db as any).query.payments.findFirst.mockResolvedValue({ id: 'existing-payment' })

    await handleRenewalCheckoutCompleted(makeRenewalSession())

    expect((db.transaction as any)).not.toHaveBeenCalled()
    expect(emailSend.sendEmail).not.toHaveBeenCalled()
  })

  it('returns early when payment_intent is null', async () => {
    await handleRenewalCheckoutCompleted(
      makeRenewalSession({ payment_intent: null }),
    )

    expect((db.transaction as any)).not.toHaveBeenCalled()
    expect(emailSend.sendEmail).not.toHaveBeenCalled()
  })

  it('inserts a payment row and calls extendFiscalRepExpiry inside a transaction on the happy path', async () => {
    const tx = makeRenewalTxStub()
    ;(db.transaction as any).mockImplementation(async (cb: (tx: unknown) => Promise<void>) => cb(tx))

    await handleRenewalCheckoutCompleted(makeRenewalSession())

    expect((db.transaction as any)).toHaveBeenCalledOnce()
    expect(tx.insert).toHaveBeenCalledOnce()
    expect(queries.extendFiscalRepExpiry).toHaveBeenCalledOnce()
  })

  it('sends fiscal_rep_renewal_confirmation email after the transaction commits', async () => {
    const tx = makeRenewalTxStub()
    ;(db.transaction as any).mockImplementation(async (cb: (tx: unknown) => Promise<void>) => cb(tx))

    await handleRenewalCheckoutCompleted(makeRenewalSession())

    expect(emailSend.sendEmail).toHaveBeenCalledWith(
      'customer@example.com',
      'en',
      expect.objectContaining({ template: 'fiscal_rep_renewal_confirmation' }),
    )
  })

  it('does NOT call extendFiscalRepExpiry or sendEmail if the transaction throws', async () => {
    ;(db.transaction as any).mockRejectedValue(new Error('DB connection lost'))

    await expect(handleRenewalCheckoutCompleted(makeRenewalSession())).rejects.toThrow()

    expect(queries.extendFiscalRepExpiry).not.toHaveBeenCalled()
    expect(emailSend.sendEmail).not.toHaveBeenCalled()
  })
})
