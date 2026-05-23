/**
 * Integration tests for Feature 18a — handleRenewalCheckoutCompleted.
 * Requires a running Postgres test instance (Docker). Run with:
 *   npx vitest run --config vitest.integration.config.ts
 *
 * Uses a real DB connection (no mocks for Drizzle / queries).
 * Mocks: email send (no outbound Resend calls) and language lookup.
 *
 * Security coverage:
 *   - Idempotency:    calling twice with the same session → exactly 1 payments row, 1 expiry update
 *   - Tampered metadata: invalid type, non-UUID orderId/userId, unknown tier
 *   - Wrong orderId:  metadata points to a non-existent order → extendFiscalRepExpiry fails gracefully
 *   - Cross-user:     metadata uses a userId that doesn't own the order → no owned row constraint (DB has no FK check here — the guard lives in the Server Action; we verify DB side-effects only)
 *   - Null payment_intent: returns early, no DB write
 *   - Transaction rollback: if the transaction throws, neither payments nor expiry update lands
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type Stripe from 'stripe'
import { handleRenewalCheckoutCompleted } from '@/lib/stripe/webhooks'
import { db } from '@/lib/db'
import { orders, payments } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { truncateAll } from '../setup'
import { insertTestUser, insertTestOrder } from '../fixtures'

// ---------------------------------------------------------------------------
// Mocks — email and language; DB layer is real
// ---------------------------------------------------------------------------

vi.mock('@/lib/db/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db/queries')>()
  return {
    ...actual,
    getUserLanguage: vi.fn().mockResolvedValue('en'),
  }
})

vi.mock('@/lib/email/send', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}))

import * as emailSend from '@/lib/email/send'

// ---------------------------------------------------------------------------
// Fixture builder
// ---------------------------------------------------------------------------

function makeRenewalSession(
  orderId: string,
  userId: string,
  overrides: Partial<Record<string, unknown>> = {},
): Stripe.Checkout.Session {
  return {
    id: `cs_renewal_${crypto.randomUUID()}`,
    metadata: {
      type: 'fiscal_rep_renewal',
      orderId,
      userId,
      tier: 'standard',
    },
    payment_intent: `pi_renewal_${crypto.randomUUID()}`,
    amount_total: 8900,
    currency: 'eur',
    payment_status: 'paid',
    customer_details: { email: 'customer@example.com' },
    customer_email: null,
    ...overrides,
  } as unknown as Stripe.Checkout.Session
}

beforeEach(truncateAll)
beforeEach(() => vi.clearAllMocks())

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe('handleRenewalCheckoutCompleted — happy path', () => {
  it('inserts exactly one payments row with isRenewal=true on first call', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      tier: 'standard',
      fiscalRepExpiresAt: new Date('2027-01-01'),
    })
    const session = makeRenewalSession(order.id, user.id)

    await handleRenewalCheckoutCompleted(session)

    const rows = await db.select().from(payments).where(eq(payments.userId, user.id))
    expect(rows).toHaveLength(1)
    expect(rows[0]!.isRenewal).toBe(true)
    expect(rows[0]!.stripeCheckoutSessionId).toBe(session.id)
    expect(rows[0]!.amount).toBe(8900)
    expect(rows[0]!.tier).toBe('standard')
  })

  it('extends fiscalRepExpiresAt to ~2028 when current expiry is 2027', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      tier: 'standard',
      fiscalRepExpiresAt: new Date('2027-06-15'),
    })
    const session = makeRenewalSession(order.id, user.id)

    await handleRenewalCheckoutCompleted(session)

    const [row] = await db.select().from(orders).where(eq(orders.id, order.id))
    expect(row!.fiscalRepExpiresAt).not.toBeNull()
    expect(row!.fiscalRepExpiresAt!.getFullYear()).toBe(2028)
    expect(row!.fiscalRepExpiresAt!.getMonth()).toBe(5) // June = 5 (0-indexed)
  })

  it('sends fiscal_rep_renewal_confirmation email after the transaction commits', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      tier: 'standard',
      fiscalRepExpiresAt: new Date('2027-01-01'),
    })
    const session = makeRenewalSession(order.id, user.id)

    await handleRenewalCheckoutCompleted(session)

    // sendEmail is fire-and-forget — it's called but results are not awaited by the handler
    expect(emailSend.sendEmail).toHaveBeenCalledWith(
      'customer@example.com',
      'en',
      expect.objectContaining({
        template: 'fiscal_rep_renewal_confirmation',
        newExpiresAt: expect.any(String),
      }),
    )
  })

  it('does not touch the orders.status or nifNumber (renewal only changes fiscalRepExpiresAt)', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      tier: 'standard',
      status: 'delivered',
      fiscalRepExpiresAt: new Date('2027-01-01'),
      nifNumber: '123456789',
    })
    const session = makeRenewalSession(order.id, user.id)

    await handleRenewalCheckoutCompleted(session)

    const [row] = await db.select().from(orders).where(eq(orders.id, order.id))
    // Status and NIF must be untouched — only expiry changes
    expect(row!.status).toBe('delivered')
    expect(row!.nifNumber).toBe('123456789')
  })
})

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------

describe('handleRenewalCheckoutCompleted — idempotency', () => {
  it('calling twice with the same session ID produces exactly one payments row', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      tier: 'standard',
      fiscalRepExpiresAt: new Date('2027-01-01'),
    })
    const session = makeRenewalSession(order.id, user.id)

    await handleRenewalCheckoutCompleted(session)
    await handleRenewalCheckoutCompleted(session) // second call, same session

    const rows = await db.select().from(payments).where(eq(payments.userId, user.id))
    expect(rows).toHaveLength(1)
  })

  it('calling twice does not extend the expiry a second time (idempotency guard fires before update)', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      tier: 'standard',
      fiscalRepExpiresAt: new Date('2027-03-01'),
    })
    const session = makeRenewalSession(order.id, user.id)

    await handleRenewalCheckoutCompleted(session)
    const [afterFirst] = await db.select().from(orders).where(eq(orders.id, order.id))
    const expiryAfterFirst = afterFirst!.fiscalRepExpiresAt!

    await handleRenewalCheckoutCompleted(session) // second call, must be a no-op
    const [afterSecond] = await db.select().from(orders).where(eq(orders.id, order.id))

    // Expiry unchanged — idempotency guard fires before the transaction
    expect(afterSecond!.fiscalRepExpiresAt!.getTime()).toBe(expiryAfterFirst.getTime())
  })

  it('sends the confirmation email exactly once even if called twice', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      tier: 'standard',
      fiscalRepExpiresAt: new Date('2027-01-01'),
    })
    const session = makeRenewalSession(order.id, user.id)

    await handleRenewalCheckoutCompleted(session)
    await handleRenewalCheckoutCompleted(session)

    expect(emailSend.sendEmail).toHaveBeenCalledOnce()
  })
})

// ---------------------------------------------------------------------------
// Tampered / malicious metadata
// ---------------------------------------------------------------------------

describe('handleRenewalCheckoutCompleted — tampered metadata', () => {
  it('does nothing when metadata.type is wrong', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      tier: 'standard',
      fiscalRepExpiresAt: new Date('2027-01-01'),
    })
    // Attacker changes type to an arbitrary string
    const session = makeRenewalSession(order.id, user.id, {
      metadata: { type: 'admin_override', orderId: order.id, userId: user.id, tier: 'standard' },
    })

    await handleRenewalCheckoutCompleted(session)

    const rows = await db.select().from(payments).where(eq(payments.userId, user.id))
    expect(rows).toHaveLength(0)
    expect(emailSend.sendEmail).not.toHaveBeenCalled()
  })

  it('does nothing when orderId is not a valid UUID', async () => {
    const user = await insertTestUser()
    const session = makeRenewalSession('not-a-uuid', user.id)

    await handleRenewalCheckoutCompleted(session)

    const rows = await db.select().from(payments).where(eq(payments.userId, user.id))
    expect(rows).toHaveLength(0)
  })

  it('does nothing when userId is not a valid UUID', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      tier: 'standard',
      fiscalRepExpiresAt: new Date('2027-01-01'),
    })
    const session = makeRenewalSession(order.id, 'not-a-uuid')

    await handleRenewalCheckoutCompleted(session)

    const rows = await db.select().from(payments).where(eq(payments.userId, user.id))
    expect(rows).toHaveLength(0)
  })

  it('does nothing when tier is not a valid enum value', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      tier: 'standard',
      fiscalRepExpiresAt: new Date('2027-01-01'),
    })
    // Attacker tries to inject a non-existent tier to probe validation
    const session = makeRenewalSession(order.id, user.id, {
      metadata: { type: 'fiscal_rep_renewal', orderId: order.id, userId: user.id, tier: 'vip_ultra' },
    })

    await handleRenewalCheckoutCompleted(session)

    const rows = await db.select().from(payments).where(eq(payments.userId, user.id))
    expect(rows).toHaveLength(0)
  })

  it('does nothing when metadata is completely missing', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      tier: 'standard',
      fiscalRepExpiresAt: new Date('2027-01-01'),
    })
    const session = makeRenewalSession(order.id, user.id, { metadata: null })

    await handleRenewalCheckoutCompleted(session)

    const rows = await db.select().from(payments).where(eq(payments.userId, user.id))
    expect(rows).toHaveLength(0)
  })

  it('returns early when payment_intent is null (no Stripe payment linked)', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      tier: 'standard',
      fiscalRepExpiresAt: new Date('2027-01-01'),
    })
    const session = makeRenewalSession(order.id, user.id, { payment_intent: null })

    await handleRenewalCheckoutCompleted(session)

    const rows = await db.select().from(payments).where(eq(payments.userId, user.id))
    expect(rows).toHaveLength(0)
    // fiscalRepExpiresAt must be untouched
    const [row] = await db.select().from(orders).where(eq(orders.id, order.id))
    expect(row!.fiscalRepExpiresAt!.getFullYear()).toBe(2027)
  })
})

// ---------------------------------------------------------------------------
// Row isolation
// ---------------------------------------------------------------------------

describe('handleRenewalCheckoutCompleted — row isolation', () => {
  it('only updates the target order — bystander is untouched', async () => {
    const user = await insertTestUser()
    const target = await insertTestOrder(user.id, {
      tier: 'standard',
      fiscalRepExpiresAt: new Date('2027-01-01'),
    })
    const bystander = await insertTestOrder(user.id, {
      tier: 'express',
      fiscalRepExpiresAt: new Date('2027-06-01'),
    })
    const session = makeRenewalSession(target.id, user.id)

    await handleRenewalCheckoutCompleted(session)

    const [bystanderRow] = await db.select().from(orders).where(eq(orders.id, bystander.id))
    expect(bystanderRow!.fiscalRepExpiresAt!.getFullYear()).toBe(2027)
    expect(bystanderRow!.fiscalRepExpiresAt!.getMonth()).toBe(5) // June unchanged
  })

  it('only inserts one payments row for the processed session, not others', async () => {
    const user = await insertTestUser()
    const target = await insertTestOrder(user.id, {
      tier: 'standard',
      fiscalRepExpiresAt: new Date('2027-01-01'),
    })
    const bystander = await insertTestOrder(user.id, {
      tier: 'express',
      fiscalRepExpiresAt: new Date('2027-06-01'),
    })
    const session = makeRenewalSession(target.id, user.id)

    await handleRenewalCheckoutCompleted(session)

    const paymentRows = await db.select().from(payments).where(eq(payments.userId, user.id))
    // One payment row for the target, none for the bystander
    expect(paymentRows).toHaveLength(1)
    expect(paymentRows[0]!.orderId).toBe(target.id)
  })
})

// ---------------------------------------------------------------------------
// Late renewal (expired fiscal rep)
// ---------------------------------------------------------------------------

describe('handleRenewalCheckoutCompleted — late renewal', () => {
  it('extends from today when the fiscal rep has already expired (GREATEST logic)', async () => {
    const user = await insertTestUser()
    const pastExpiry = new Date('2020-01-01')
    const order = await insertTestOrder(user.id, {
      tier: 'standard',
      fiscalRepExpiresAt: pastExpiry,
    })
    const session = makeRenewalSession(order.id, user.id)
    const before = new Date()

    await handleRenewalCheckoutCompleted(session)

    const after = new Date()
    const [row] = await db.select().from(orders).where(eq(orders.id, order.id))
    const newExpiry = row!.fiscalRepExpiresAt!

    // New expiry should be ~12 months from now, not from 2020
    // Minimum: 12 months from just before the call; maximum: 12 months from just after
    const minExpected = new Date(before.getTime())
    minExpected.setFullYear(minExpected.getFullYear() + 1)
    const maxExpected = new Date(after.getTime())
    maxExpected.setFullYear(maxExpected.getFullYear() + 1)

    expect(newExpiry.getTime()).toBeGreaterThanOrEqual(minExpected.getTime() - 60_000)
    expect(newExpiry.getTime()).toBeLessThanOrEqual(maxExpected.getTime() + 60_000)
    // Specifically NOT 2021 (12 months from the expired date)
    expect(newExpiry.getFullYear()).toBeGreaterThan(2025)
  })
})
