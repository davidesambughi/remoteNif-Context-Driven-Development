/**
 * Integration tests for getOverdueExpressOrders and markSlaBreachAlertSent.
 *
 * Requires Docker + the test DB to be running.
 * Run with: npm run test:integration
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getOverdueExpressOrders, markSlaBreachAlertSent } from '@/lib/db/queries'
import { truncateAll } from '../setup'
import { insertTestUser, insertTestOrder } from '../fixtures'

beforeEach(truncateAll)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Timestamp that is `hours` hours in the past. */
function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000)
}

/** Inserts an Express order with status=documents_approved and a specific documentsApprovedAt. */
async function insertExpressApprovedOrder(
  userId: string,
  approvedAt: Date,
  overrides: Record<string, unknown> = {},
) {
  return insertTestOrder(userId, {
    tier: 'express',
    status: 'documents_approved',
    documentsApprovedAt: approvedAt,
    ...overrides,
  })
}

// ---------------------------------------------------------------------------
// getOverdueExpressOrders
// ---------------------------------------------------------------------------

describe('getOverdueExpressOrders', () => {
  it('returns an empty array when no orders exist', async () => {
    const result = await getOverdueExpressOrders()
    expect(result).toEqual([])
  })

  it('returns an empty array when the only Express order is within the 48h window', async () => {
    const user = await insertTestUser()
    // 47 hours ago — not yet overdue
    await insertExpressApprovedOrder(user.id, hoursAgo(47))

    const result = await getOverdueExpressOrders()
    expect(result).toEqual([])
  })

  it('returns the order when it is exactly past 48h', async () => {
    const user = await insertTestUser()
    const order = await insertExpressApprovedOrder(user.id, hoursAgo(49))

    const result = await getOverdueExpressOrders()
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe(order.id)
  })

  it('does not return orders whose slaBreachAlertSentAt is already set', async () => {
    const user = await insertTestUser()
    // Order is overdue but already alerted
    await insertExpressApprovedOrder(user.id, hoursAgo(72), {
      slaBreachAlertSentAt: new Date(),
    })

    const result = await getOverdueExpressOrders()
    expect(result).toEqual([])
  })

  it('does not return Standard orders even if overdue', async () => {
    const user = await insertTestUser()
    await insertTestOrder(user.id, {
      tier: 'standard',
      status: 'documents_approved',
      documentsApprovedAt: hoursAgo(72),
    })

    const result = await getOverdueExpressOrders()
    expect(result).toEqual([])
  })

  it('does not return Essential orders even if overdue', async () => {
    const user = await insertTestUser()
    await insertTestOrder(user.id, {
      tier: 'essential',
      status: 'documents_approved',
      documentsApprovedAt: hoursAgo(72),
    })

    const result = await getOverdueExpressOrders()
    expect(result).toEqual([])
  })

  it('does not return Express orders that are not in documents_approved status', async () => {
    const user = await insertTestUser()
    // Submitted — past the documents_approved stage
    await insertTestOrder(user.id, {
      tier: 'express',
      status: 'submitted',
      documentsApprovedAt: hoursAgo(72),
    })

    const result = await getOverdueExpressOrders()
    expect(result).toEqual([])
  })

  it('returns the correct shape: id, fullName, documentsApprovedAt', async () => {
    const user = await insertTestUser()
    const order = await insertExpressApprovedOrder(user.id, hoursAgo(60), {
      fullName: 'Ana Costa',
    })

    const [result] = await getOverdueExpressOrders()
    expect(result).toMatchObject({
      id: order.id,
      fullName: 'Ana Costa',
    })
    expect(result!.documentsApprovedAt).toBeInstanceOf(Date)
  })

  it('returns null fullName when the order has no name set', async () => {
    const user = await insertTestUser()
    await insertExpressApprovedOrder(user.id, hoursAgo(60))

    const [result] = await getOverdueExpressOrders()
    expect(result!.fullName).toBeNull()
  })

  it('returns multiple overdue orders', async () => {
    const user = await insertTestUser()
    const o1 = await insertExpressApprovedOrder(user.id, hoursAgo(50))
    const o2 = await insertExpressApprovedOrder(user.id, hoursAgo(100))

    const result = await getOverdueExpressOrders()
    expect(result).toHaveLength(2)
    const ids = result.map((r) => r.id)
    expect(ids).toContain(o1.id)
    expect(ids).toContain(o2.id)
  })

  it('excludes already-alerted orders when mixed with un-alerted ones', async () => {
    const user = await insertTestUser()
    const alerted = await insertExpressApprovedOrder(user.id, hoursAgo(80), {
      slaBreachAlertSentAt: new Date(),
    })
    const pending = await insertExpressApprovedOrder(user.id, hoursAgo(72))

    const result = await getOverdueExpressOrders()
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe(pending.id)
    expect(result.map((r) => r.id)).not.toContain(alerted.id)
  })
})

// ---------------------------------------------------------------------------
// markSlaBreachAlertSent
// ---------------------------------------------------------------------------

describe('markSlaBreachAlertSent', () => {
  it('sets slaBreachAlertSentAt on the order', async () => {
    const user = await insertTestUser()
    const order = await insertExpressApprovedOrder(user.id, hoursAgo(72))

    // Verify it starts as null
    const [before] = await db.select().from(orders).where(eq(orders.id, order.id))
    expect(before!.slaBreachAlertSentAt).toBeNull()

    await markSlaBreachAlertSent(order.id)

    const [after] = await db.select().from(orders).where(eq(orders.id, order.id))
    expect(after!.slaBreachAlertSentAt).toBeInstanceOf(Date)
  })

  it('causes the order to no longer appear in getOverdueExpressOrders', async () => {
    const user = await insertTestUser()
    const order = await insertExpressApprovedOrder(user.id, hoursAgo(72))

    // Confirm it appears before marking
    const before = await getOverdueExpressOrders()
    expect(before.map((r) => r.id)).toContain(order.id)

    await markSlaBreachAlertSent(order.id)

    // Confirm it no longer appears after marking
    const after = await getOverdueExpressOrders()
    expect(after.map((r) => r.id)).not.toContain(order.id)
  })
})
