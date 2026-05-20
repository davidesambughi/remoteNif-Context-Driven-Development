import { describe, it, expect, vi, beforeEach } from 'vitest'
import type Stripe from 'stripe'
import { handleCheckoutSessionCompleted } from '@/lib/stripe/webhooks'
import { db } from '@/lib/db'
import { orders, payments } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { truncateAll } from '../setup'
import { insertTestUser } from '../fixtures'

// ---------------------------------------------------------------------------
// Mocks — email send and language lookup; DB layer is real
// ---------------------------------------------------------------------------

vi.mock('@/lib/db/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db/queries')>()
  return {
    ...actual,
    // Avoid the user language DB lookup in these tests — not what we're testing
    getUserLanguage: vi.fn().mockResolvedValue('en'),
  }
})

vi.mock('@/lib/email/send', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}))

// ---------------------------------------------------------------------------
// Fixture builder
// ---------------------------------------------------------------------------

function makeSession(
  userId: string,
  overrides: Partial<Record<string, unknown>> = {},
): Stripe.Checkout.Session {
  return {
    id: `cs_test_${crypto.randomUUID()}`,
    metadata: { userId, tier: 'standard' },
    payment_intent: `pi_test_${crypto.randomUUID()}`,
    amount_total: 12900,
    currency: 'eur',
    payment_status: 'paid',
    customer_details: { email: 'customer@example.com' },
    customer_email: null,
    ...overrides,
  } as unknown as Stripe.Checkout.Session
}

beforeEach(truncateAll)

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('handleCheckoutSessionCompleted', () => {
  it('creates one orders row and one payments row on the first call', async () => {
    const user = await insertTestUser()
    const session = makeSession(user.id)

    await handleCheckoutSessionCompleted(session)

    const orderRows = await db.select().from(orders).where(eq(orders.userId, user.id))
    const paymentRows = await db.select().from(payments).where(eq(payments.userId, user.id))

    expect(orderRows).toHaveLength(1)
    expect(paymentRows).toHaveLength(1)
    expect(orderRows[0]!.stripeCheckoutSessionId).toBe(session.id)
    expect(paymentRows[0]!.stripeCheckoutSessionId).toBe(session.id)
  })

  it('is idempotent — a second identical call creates no additional records', async () => {
    const user = await insertTestUser()
    const session = makeSession(user.id)

    await handleCheckoutSessionCompleted(session)
    await handleCheckoutSessionCompleted(session)

    const orderRows = await db.select().from(orders).where(eq(orders.userId, user.id))
    const paymentRows = await db.select().from(payments).where(eq(payments.userId, user.id))

    expect(orderRows).toHaveLength(1)
    expect(paymentRows).toHaveLength(1)
  })

  it('creates no records when session metadata is missing', async () => {
    const user = await insertTestUser()
    // metadata: {} means userId and tier are both absent — handler returns early
    const session = makeSession(user.id, { metadata: {} })

    await handleCheckoutSessionCompleted(session)

    const orderRows = await db.select().from(orders).where(eq(orders.userId, user.id))
    expect(orderRows).toHaveLength(0)
  })
})
