import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { deliverNifNumber, extendFiscalRepExpiry } from '@/lib/db/queries'
import { truncateAll } from '../setup'
import { insertTestUser, insertTestOrder } from '../fixtures'

beforeEach(async () => {
  await truncateAll()
  vi.useFakeTimers({ toFake: ['Date'] })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Fiscal Rep Expiry Calculation', () => {
  // ---------------------------------------------------------------------------
  // deliverNifNumber (JS Math)
  // ---------------------------------------------------------------------------
  describe('deliverNifNumber', () => {
    it('sets fiscalRepExpiresAt to exactly 12 months later for Standard/Express', async () => {
      const user = await insertTestUser()
      const order = await insertTestOrder(user.id, { tier: 'standard' })
      
      const now = new Date('2026-05-20T10:00:00Z')
      vi.setSystemTime(now)

      await deliverNifNumber(order.id, '123456789', 'standard')

      const [updated] = await db.select().from(orders).where(eq(orders.id, order.id))
      expect(updated!.status).toBe('delivered')
      expect(updated!.fiscalRepExpiresAt?.toISOString()).toBe('2027-05-20T10:00:00.000Z')
    })

    it('leaves fiscalRepExpiresAt null for Essential tier', async () => {
      const user = await insertTestUser()
      const order = await insertTestOrder(user.id, { tier: 'essential' })
      
      await deliverNifNumber(order.id, '123456789', 'essential')

      const [updated] = await db.select().from(orders).where(eq(orders.id, order.id))
      expect(updated!.fiscalRepExpiresAt).toBeNull()
    })

    it('handles Leap Day (Feb 29) rollover to March 1 of next year', async () => {
      const user = await insertTestUser()
      const order = await insertTestOrder(user.id, { tier: 'express' })
      
      // Feb 29, 2024 is a leap day
      const leapDay = new Date('2024-02-29T12:00:00Z')
      vi.setSystemTime(leapDay)

      await deliverNifNumber(order.id, '123456789', 'express')

      const [updated] = await db.select().from(orders).where(eq(orders.id, order.id))
      // JS behavior: Feb 29 + 1 year = March 1
      expect(updated!.fiscalRepExpiresAt?.toISOString()).toBe('2025-03-01T12:00:00.000Z')
    })

    it('handles month-end rollover (May 31 to May 31)', async () => {
      const user = await insertTestUser()
      const order = await insertTestOrder(user.id, { tier: 'standard' })
      
      const may31 = new Date('2023-05-31T15:00:00Z')
      vi.setSystemTime(may31)

      await deliverNifNumber(order.id, '123456789', 'standard')

      const [updated] = await db.select().from(orders).where(eq(orders.id, order.id))
      expect(updated!.fiscalRepExpiresAt?.toISOString()).toBe('2024-05-31T15:00:00.000Z')
    })
  })

  // ---------------------------------------------------------------------------
  // extendFiscalRepExpiry (Postgres Math)
  // ---------------------------------------------------------------------------
  describe('extendFiscalRepExpiry', () => {
    it('extends from current expiry if it is in the future (GREATEST logic)', async () => {
      const user = await insertTestUser()
      // Expiry is far in the future
      const futureExpiry = new Date('2030-01-01T00:00:00Z')
      const order = await insertTestOrder(user.id, { 
        tier: 'standard', 
        fiscalRepExpiresAt: futureExpiry 
      })

      const newExpiry = await extendFiscalRepExpiry(order.id)

      // Postgres INTERVAL '12 months' on 2030-01-01 should be 2031-01-01
      expect(newExpiry.toISOString()).toBe('2031-01-01T00:00:00.000Z')
    })

    it('extends from NOW() if the current expiry has passed', async () => {
      const user = await insertTestUser()
      // Expiry is in the past
      const pastExpiry = new Date('2020-01-01T00:00:00Z')
      const order = await insertTestOrder(user.id, { 
        tier: 'standard', 
        fiscalRepExpiresAt: pastExpiry 
      })

      const newExpiry = await extendFiscalRepExpiry(order.id)

      // It should be roughly 12 months from today
      const today = new Date()
      const twelveMonthsFromNow = new Date(today)
      twelveMonthsFromNow.setFullYear(today.getFullYear() + 1)

      // We allow a small margin for execution time because NOW() is DB-side
      const diffMs = Math.abs(newExpiry.getTime() - twelveMonthsFromNow.getTime())
      expect(diffMs).toBeLessThan(5000) // 5 second tolerance
    })
  })
})
