/**
 * Integration tests for Feature 18a — Renewal Flow DB queries.
 * Requires a running Postgres test instance (Docker). Run with:
 *   npx vitest run --config vitest.integration.config.ts
 *
 * Covers:
 *   - getRenewalOrderInfo  — returns correct shape, null for missing/wrong-user orders
 *   - extendFiscalRepExpiry — GREATEST logic, 12-month extension, row isolation
 *   - getOrderFullName      — returns fullName or null
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  getRenewalOrderInfo,
  extendFiscalRepExpiry,
  getOrderFullName,
} from '@/lib/db/queries'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { truncateAll } from '../setup'
import { insertTestUser, insertTestOrder } from '../fixtures'

beforeEach(truncateAll)

// ---------------------------------------------------------------------------
// getRenewalOrderInfo
// ---------------------------------------------------------------------------

describe('getRenewalOrderInfo', () => {
  it('returns null for a non-existent order ID', async () => {
    const user = await insertTestUser()
    const result = await getRenewalOrderInfo(crypto.randomUUID(), user.id)
    expect(result).toBeNull()
  })

  it('returns null when the orderId belongs to a different user (ownership guard)', async () => {
    const owner = await insertTestUser()
    const attacker = await insertTestUser()
    const order = await insertTestOrder(owner.id, { tier: 'standard' })

    // attacker provides their own userId but tries to access owner's order
    const result = await getRenewalOrderInfo(order.id, attacker.id)
    expect(result).toBeNull()
  })

  it('returns the correct shape for a valid standard order belonging to the user', async () => {
    const user = await insertTestUser()
    const futureExpiry = new Date('2027-01-01')
    const order = await insertTestOrder(user.id, {
      tier: 'standard',
      status: 'delivered',
      fiscalRepExpiresAt: futureExpiry,
    })

    const result = await getRenewalOrderInfo(order.id, user.id)

    expect(result).not.toBeNull()
    expect(result!.id).toBe(order.id)
    expect(result!.userId).toBe(user.id)
    expect(result!.tier).toBe('standard')
    expect(result!.status).toBe('delivered')
    expect(result!.fiscalRepExpiresAt).not.toBeNull()
  })

  it('returns the correct shape for a valid express order', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      tier: 'express',
      status: 'delivered',
      fiscalRepExpiresAt: new Date('2027-06-01'),
    })

    const result = await getRenewalOrderInfo(order.id, user.id)

    expect(result).not.toBeNull()
    expect(result!.tier).toBe('express')
  })

  it('returns data even when fiscalRepExpiresAt is null (essential tier)', async () => {
    // The action guards against this — the query should still return the row.
    // The guard (tier === essential || fiscalRepExpiresAt === null) lives in the action layer.
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, { tier: 'essential', fiscalRepExpiresAt: null })

    const result = await getRenewalOrderInfo(order.id, user.id)

    expect(result).not.toBeNull()
    expect(result!.fiscalRepExpiresAt).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// extendFiscalRepExpiry
// ---------------------------------------------------------------------------

describe('extendFiscalRepExpiry', () => {
  it('extends a future expiry by exactly 12 calendar months', async () => {
    const user = await insertTestUser()
    const currentExpiry = new Date('2027-03-15T00:00:00.000Z')
    const order = await insertTestOrder(user.id, {
      tier: 'standard',
      fiscalRepExpiresAt: currentExpiry,
    })

    const newExpiry = await extendFiscalRepExpiry(order.id)

    // GREATEST(2027-03-15, NOW()) + 12 months = 2028-03-15 (since 2027-03-15 is in the future)
    expect(newExpiry.getFullYear()).toBe(2028)
    expect(newExpiry.getMonth()).toBe(currentExpiry.getMonth()) // same calendar month
    expect(newExpiry.getDate()).toBe(15)

    // DB row is updated to match the returned value
    const [row] = await db.select().from(orders).where(eq(orders.id, order.id))
    expect(row!.fiscalRepExpiresAt!.getFullYear()).toBe(2028)
  })

  it('extends from NOW() when expiry has already passed (late renewal)', async () => {
    const user = await insertTestUser()
    const pastExpiry = new Date('2020-01-01T00:00:00.000Z') // long in the past
    const order = await insertTestOrder(user.id, {
      tier: 'standard',
      fiscalRepExpiresAt: pastExpiry,
    })

    const before = new Date()
    const newExpiry = await extendFiscalRepExpiry(order.id)
    const after = new Date()

    // GREATEST(2020-01-01, NOW()) = NOW(), so new expiry should be ~12 months from now
    const minExpected = new Date(before.getTime())
    minExpected.setFullYear(minExpected.getFullYear() + 1)
    const maxExpected = new Date(after.getTime())
    maxExpected.setFullYear(maxExpected.getFullYear() + 1)

    // Allow a generous ±60s window for CI latency
    expect(newExpiry.getTime()).toBeGreaterThanOrEqual(minExpected.getTime() - 60_000)
    expect(newExpiry.getTime()).toBeLessThanOrEqual(maxExpected.getTime() + 60_000)
  })

  it('updates the correct row only — bystander order is untouched', async () => {
    const user = await insertTestUser()
    const target = await insertTestOrder(user.id, {
      tier: 'standard',
      fiscalRepExpiresAt: new Date('2027-01-01'),
    })
    const bystander = await insertTestOrder(user.id, {
      tier: 'express',
      fiscalRepExpiresAt: new Date('2027-06-01'),
    })

    await extendFiscalRepExpiry(target.id)

    const [bystanderRow] = await db.select().from(orders).where(eq(orders.id, bystander.id))
    // Bystander must keep its original expiry — only the target was updated
    expect(bystanderRow!.fiscalRepExpiresAt!.getFullYear()).toBe(2027)
    expect(bystanderRow!.fiscalRepExpiresAt!.getMonth()).toBe(5) // June = 5 (0-indexed)
  })

  it('works inside a db.transaction (dbOrTx param)', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      tier: 'standard',
      fiscalRepExpiresAt: new Date('2027-01-01'),
    })

    // Call extendFiscalRepExpiry with the tx — same interface as db
    await db.transaction(async (tx) => {
      await extendFiscalRepExpiry(order.id, tx)
    })

    const [row] = await db.select().from(orders).where(eq(orders.id, order.id))
    expect(row!.fiscalRepExpiresAt!.getFullYear()).toBe(2028)
  })
})

// ---------------------------------------------------------------------------
// getOrderFullName
// ---------------------------------------------------------------------------

describe('getOrderFullName', () => {
  it('returns null for a non-existent order ID', async () => {
    const result = await getOrderFullName(crypto.randomUUID())
    expect(result).toBeNull()
  })

  it('returns null when fullName has not been set yet', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id) // fullName defaults to null

    const result = await getOrderFullName(order.id)
    expect(result).toBeNull()
  })

  it('returns the stored fullName once set', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id)
    await db
      .update(orders)
      .set({ fullName: 'Maria Santos' })
      .where(eq(orders.id, order.id))

    const result = await getOrderFullName(order.id)
    expect(result).toBe('Maria Santos')
  })
})
