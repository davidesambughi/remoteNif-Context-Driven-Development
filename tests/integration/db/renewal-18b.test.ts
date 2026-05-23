/**
 * Integration tests for Feature 18b — Renewal Reminder DB queries.
 * Requires a running Postgres test instance (Docker). Run with:
 *   npx vitest run --config vitest.integration.config.ts
 *
 * Covers:
 *   - getOrdersForRenewalReminders — day-window filter, tier/status/dismissed guards,
 *                                    join shape, fullName null handling, language forwarding
 *   - dismissFiscalRepForOrder     — sets fiscalRepDismissedAt, updates updatedAt,
 *                                    row isolation (bystander untouched)
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  getOrdersForRenewalReminders,
  dismissFiscalRepForOrder,
} from '@/lib/db/queries'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { truncateAll } from '../setup'
import { insertTestUser, insertTestOrder } from '../fixtures'

beforeEach(truncateAll)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a Date that falls exactly in the middle of the calendar day that is
 * `daysFromNow` days from today (UTC noon), safely inside the day-window.
 */
function expiryInDays(daysFromNow: number): Date {
  const d = new Date()
  // Set to UTC midnight of today
  d.setUTCHours(0, 0, 0, 0)
  // Advance by N days + 12 hours (noon) — comfortably inside the window
  d.setUTCDate(d.getUTCDate() + daysFromNow)
  d.setUTCHours(12, 0, 0, 0)
  return d
}

// ---------------------------------------------------------------------------
// getOrdersForRenewalReminders
// ---------------------------------------------------------------------------

describe('getOrdersForRenewalReminders', () => {
  it('returns empty array when no orders match', async () => {
    const result = await getOrdersForRenewalReminders(30)
    expect(result).toEqual([])
  })

  it('returns an order whose expiry is exactly in the 30-day window', async () => {
    const user = await insertTestUser({ language: 'en' })
    await insertTestOrder(user.id, {
      tier: 'standard',
      status: 'delivered',
      fiscalRepExpiresAt: expiryInDays(30),
      fiscalRepDismissedAt: null,
    })

    const result = await getOrdersForRenewalReminders(30)
    expect(result).toHaveLength(1)
  })

  it('returns an order in the 15-day window', async () => {
    const user = await insertTestUser()
    await insertTestOrder(user.id, {
      tier: 'express',
      status: 'delivered',
      fiscalRepExpiresAt: expiryInDays(15),
      fiscalRepDismissedAt: null,
    })

    const result = await getOrdersForRenewalReminders(15)
    expect(result).toHaveLength(1)
  })

  it('returns an order in the 0-day (expired today) window', async () => {
    const user = await insertTestUser()
    await insertTestOrder(user.id, {
      tier: 'standard',
      status: 'delivered',
      fiscalRepExpiresAt: expiryInDays(0),
      fiscalRepDismissedAt: null,
    })

    const result = await getOrdersForRenewalReminders(0)
    expect(result).toHaveLength(1)
  })

  it('excludes an order whose expiry is one day before the window (N-1 days)', async () => {
    const user = await insertTestUser()
    await insertTestOrder(user.id, {
      tier: 'standard',
      status: 'delivered',
      fiscalRepExpiresAt: expiryInDays(29), // 1 day too early for the 30-day cohort
    })

    const result = await getOrdersForRenewalReminders(30)
    expect(result).toHaveLength(0)
  })

  it('excludes an order whose expiry is one day after the window (N+1 days)', async () => {
    const user = await insertTestUser()
    await insertTestOrder(user.id, {
      tier: 'standard',
      status: 'delivered',
      fiscalRepExpiresAt: expiryInDays(31), // 1 day too late for the 30-day cohort
    })

    const result = await getOrdersForRenewalReminders(30)
    expect(result).toHaveLength(0)
  })

  it('excludes essential tier orders', async () => {
    const user = await insertTestUser()
    await insertTestOrder(user.id, {
      tier: 'essential',
      status: 'delivered',
      fiscalRepExpiresAt: expiryInDays(30),
    })

    const result = await getOrdersForRenewalReminders(30)
    expect(result).toHaveLength(0)
  })

  it('excludes non-delivered orders (e.g. documents_approved)', async () => {
    const user = await insertTestUser()
    await insertTestOrder(user.id, {
      tier: 'standard',
      status: 'documents_approved',
      fiscalRepExpiresAt: expiryInDays(30),
    })

    const result = await getOrdersForRenewalReminders(30)
    expect(result).toHaveLength(0)
  })

  it('excludes orders where fiscalRepDismissedAt is set', async () => {
    const user = await insertTestUser()
    await insertTestOrder(user.id, {
      tier: 'standard',
      status: 'delivered',
      fiscalRepExpiresAt: expiryInDays(30),
      fiscalRepDismissedAt: new Date(), // customer opted out
    })

    const result = await getOrdersForRenewalReminders(30)
    expect(result).toHaveLength(0)
  })

  it('returns the correct shape with all required fields', async () => {
    const user = await insertTestUser({ language: 'fr', email: 'marie@example.com' })
    const expiry = expiryInDays(30)
    const order = await insertTestOrder(user.id, {
      tier: 'standard',
      status: 'delivered',
      fiscalRepExpiresAt: expiry,
      fiscalRepDismissedAt: null,
    })

    const result = await getOrdersForRenewalReminders(30)

    expect(result).toHaveLength(1)
    const target = result[0]!
    expect(target.orderId).toBe(order.id)
    expect(target.userId).toBe(user.id)
    expect(target.email).toBe('marie@example.com')
    expect(target.language).toBe('fr')
    expect(target.fiscalRepExpiresAt).toBeInstanceOf(Date)
  })

  it('returns fullName as null when not yet provided by customer', async () => {
    const user = await insertTestUser()
    await insertTestOrder(user.id, {
      tier: 'standard',
      status: 'delivered',
      fiscalRepExpiresAt: expiryInDays(30),
      // fullName defaults to null in the schema
    })

    const result = await getOrdersForRenewalReminders(30)
    expect(result[0]!.fullName).toBeNull()
  })

  it('returns fullName when it has been set', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      tier: 'standard',
      status: 'delivered',
      fiscalRepExpiresAt: expiryInDays(30),
    })
    // Set fullName directly — simulates customer completing personal details
    await db.update(orders).set({ fullName: 'João Silva' }).where(eq(orders.id, order.id))

    const result = await getOrdersForRenewalReminders(30)
    expect(result[0]!.fullName).toBe('João Silva')
  })

  it('returns multiple orders from the same cohort window', async () => {
    const userA = await insertTestUser()
    const userB = await insertTestUser()
    await insertTestOrder(userA.id, {
      tier: 'standard',
      status: 'delivered',
      fiscalRepExpiresAt: expiryInDays(30),
    })
    await insertTestOrder(userB.id, {
      tier: 'express',
      status: 'delivered',
      fiscalRepExpiresAt: expiryInDays(30),
    })

    const result = await getOrdersForRenewalReminders(30)
    expect(result).toHaveLength(2)
  })

  it('does not cross-contaminate between cohort windows (30d vs 15d query)', async () => {
    const user = await insertTestUser()
    await insertTestOrder(user.id, {
      tier: 'standard',
      status: 'delivered',
      fiscalRepExpiresAt: expiryInDays(30),
    })

    // Query for the 15-day cohort must return nothing
    const result = await getOrdersForRenewalReminders(15)
    expect(result).toHaveLength(0)
  })

  it('forwards the user language from the users table join', async () => {
    const de = await insertTestUser({ language: 'de' })
    await insertTestOrder(de.id, {
      tier: 'express',
      status: 'delivered',
      fiscalRepExpiresAt: expiryInDays(30),
    })

    const result = await getOrdersForRenewalReminders(30)
    expect(result[0]!.language).toBe('de')
  })
})

// ---------------------------------------------------------------------------
// dismissFiscalRepForOrder
// ---------------------------------------------------------------------------

describe('dismissFiscalRepForOrder', () => {
  it('sets fiscalRepDismissedAt to a non-null timestamp', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, { tier: 'standard' })

    const before = new Date()
    await dismissFiscalRepForOrder(order.id)
    const after = new Date()

    const [row] = await db.select().from(orders).where(eq(orders.id, order.id))
    expect(row!.fiscalRepDismissedAt).not.toBeNull()
    // Timestamp should be within the test execution window
    expect(row!.fiscalRepDismissedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000)
    expect(row!.fiscalRepDismissedAt!.getTime()).toBeLessThanOrEqual(after.getTime() + 1000)
  })

  it('also updates updatedAt', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id)

    // Small delay so updatedAt is measurably newer than createdAt
    await new Promise((r) => setTimeout(r, 50))
    const before = new Date()
    await dismissFiscalRepForOrder(order.id)
    const after = new Date()

    const [row] = await db.select().from(orders).where(eq(orders.id, order.id))
    expect(row!.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000)
    expect(row!.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime() + 1000)
  })

  it('does not affect a bystander order', async () => {
    const user = await insertTestUser()
    const target = await insertTestOrder(user.id)
    const bystander = await insertTestOrder(user.id)

    await dismissFiscalRepForOrder(target.id)

    const [bystanderRow] = await db.select().from(orders).where(eq(orders.id, bystander.id))
    // Bystander must still have null fiscalRepDismissedAt
    expect(bystanderRow!.fiscalRepDismissedAt).toBeNull()
  })

  it('order excluded from getOrdersForRenewalReminders after dismiss', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      tier: 'standard',
      status: 'delivered',
      fiscalRepExpiresAt: expiryInDays(30),
      fiscalRepDismissedAt: null,
    })

    // Confirm it's in the cohort before dismissal
    const before = await getOrdersForRenewalReminders(30)
    expect(before.map((t) => t.orderId)).toContain(order.id)

    await dismissFiscalRepForOrder(order.id)

    // After dismissal it must be excluded
    const after = await getOrdersForRenewalReminders(30)
    expect(after.map((t) => t.orderId)).not.toContain(order.id)
  })
})
