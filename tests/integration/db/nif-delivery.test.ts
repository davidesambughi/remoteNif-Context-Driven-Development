/**
 * Integration tests for Feature 15 DB queries.
 * Requires a running Postgres test instance (Docker). Run with:
 *   npx vitest run --config vitest.integration.config.ts
 *
 * Covers:
 *   - getOrderNifAndTier — returns correct shape, null for missing order
 *   - deliverNifNumber   — atomically sets nifNumber, status, deliveredAt,
 *                          and fiscalRepExpiresAt (tier-dependent)
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { getOrderNifAndTier, deliverNifNumber } from '@/lib/db/queries'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { truncateAll } from '../setup'
import { insertTestUser, insertTestOrder } from '../fixtures'

beforeEach(truncateAll)

// ---------------------------------------------------------------------------
// getOrderNifAndTier
// ---------------------------------------------------------------------------

describe('getOrderNifAndTier', () => {
  it('returns null for a non-existent order ID', async () => {
    const result = await getOrderNifAndTier(crypto.randomUUID())
    expect(result).toBeNull()
  })

  it('returns { nifNumber: null, tier } for a freshly created order', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, { tier: 'express' })

    const result = await getOrderNifAndTier(order.id)

    expect(result).not.toBeNull()
    expect(result!.nifNumber).toBeNull()
    expect(result!.tier).toBe('express')
  })

  it('returns the stored nifNumber once set', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, { tier: 'standard', status: 'submitted' })

    // Directly set nif_number so we can verify getOrderNifAndTier reads it back
    await db
      .update(orders)
      .set({ nifNumber: '987654321' })
      .where(eq(orders.id, order.id))

    const result = await getOrderNifAndTier(order.id)

    expect(result!.nifNumber).toBe('987654321')
    expect(result!.tier).toBe('standard')
  })
})

// ---------------------------------------------------------------------------
// deliverNifNumber
// ---------------------------------------------------------------------------

describe('deliverNifNumber', () => {
  it('sets nifNumber and transitions status to delivered', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, { status: 'submitted', tier: 'standard' })

    await deliverNifNumber(order.id, '123456789', 'standard')

    const [row] = await db.select().from(orders).where(eq(orders.id, order.id))
    expect(row!.nifNumber).toBe('123456789')
    expect(row!.status).toBe('delivered')
  })

  it('sets deliveredAt to approximately now', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, { status: 'submitted', tier: 'standard' })
    const before = new Date()

    await deliverNifNumber(order.id, '123456789', 'standard')

    const after = new Date()
    const [row] = await db.select().from(orders).where(eq(orders.id, order.id))
    expect(row!.deliveredAt).not.toBeNull()
    expect(row!.deliveredAt!.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(row!.deliveredAt!.getTime()).toBeLessThanOrEqual(after.getTime())
  })

  it('sets fiscalRepExpiresAt to deliveredAt + 12 months for standard', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, { status: 'submitted', tier: 'standard' })

    await deliverNifNumber(order.id, '123456789', 'standard')

    const [row] = await db.select().from(orders).where(eq(orders.id, order.id))
    expect(row!.fiscalRepExpiresAt).not.toBeNull()

    // Should be exactly 12 calendar months after deliveredAt
    const delivered = row!.deliveredAt!
    const expires = row!.fiscalRepExpiresAt!
    const expectedYear = delivered.getFullYear() + 1
    expect(expires.getFullYear()).toBe(expectedYear)
    expect(expires.getMonth()).toBe(delivered.getMonth())
    expect(expires.getDate()).toBe(delivered.getDate())
  })

  it('sets fiscalRepExpiresAt to deliveredAt + 12 months for express', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, { status: 'submitted', tier: 'express' })

    await deliverNifNumber(order.id, '123456789', 'express')

    const [row] = await db.select().from(orders).where(eq(orders.id, order.id))
    expect(row!.fiscalRepExpiresAt).not.toBeNull()

    const delivered = row!.deliveredAt!
    const expires = row!.fiscalRepExpiresAt!
    expect(expires.getFullYear()).toBe(delivered.getFullYear() + 1)
    expect(expires.getMonth()).toBe(delivered.getMonth())
  })

  it('leaves fiscalRepExpiresAt as null for essential (no fiscal rep)', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, { status: 'submitted', tier: 'essential' })

    await deliverNifNumber(order.id, '123456789', 'essential')

    const [row] = await db.select().from(orders).where(eq(orders.id, order.id))
    expect(row!.fiscalRepExpiresAt).toBeNull()
    // Status and NIF still set correctly
    expect(row!.nifNumber).toBe('123456789')
    expect(row!.status).toBe('delivered')
  })

  it('does not affect other orders (row isolation)', async () => {
    const user = await insertTestUser()
    const target = await insertTestOrder(user.id, { status: 'submitted', tier: 'standard' })
    const bystander = await insertTestOrder(user.id, { status: 'submitted', tier: 'express' })

    await deliverNifNumber(target.id, '123456789', 'standard')

    const [bystanderRow] = await db.select().from(orders).where(eq(orders.id, bystander.id))
    // Bystander order must be completely untouched
    expect(bystanderRow!.nifNumber).toBeNull()
    expect(bystanderRow!.status).toBe('submitted')
    expect(bystanderRow!.deliveredAt).toBeNull()
    expect(bystanderRow!.fiscalRepExpiresAt).toBeNull()
  })
})
