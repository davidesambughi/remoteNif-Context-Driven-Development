import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import {
  getOrderForUser,
  getRenewalOrderInfo,
  getOrderPersonalDetails,
  updateOrderPersonalDetails,
  updateOrderPoaPath,
  getUserActiveOrder,
} from '@/lib/db/queries'
import { truncateAll } from '../setup'
import { insertTestUser, insertTestOrder } from '../fixtures'

beforeEach(truncateAll)

const MOCK_PERSONAL_DETAILS = {
  fullName: 'John Doe',
  dateOfBirth: '1990-01-01',
  nationality: 'US',
  passportNumber: 'A1234567',
  passportExpiry: '2030-01-01',
  address: '123 Test St, Lisbon',
}

describe('Order Ownership & Security Isolation', () => {
  // ---------------------------------------------------------------------------
  // getOrderForUser (Read)
  // ---------------------------------------------------------------------------
  describe('getOrderForUser', () => {
    it('returns null when a user tries to access another user\'s order', async () => {
      const owner = await insertTestUser()
      const attacker = await insertTestUser()
      const order = await insertTestOrder(owner.id)

      const result = await getOrderForUser(order.id, attacker.id)

      expect(result).toBeNull()
    })

    it('returns the order when accessed by the correct owner', async () => {
      const owner = await insertTestUser()
      const order = await insertTestOrder(owner.id)

      const result = await getOrderForUser(order.id, owner.id)

      expect(result).not.toBeNull()
      expect(result!.id).toBe(order.id)
    })
  })

  // ---------------------------------------------------------------------------
  // getRenewalOrderInfo (Read)
  // ---------------------------------------------------------------------------
  describe('getRenewalOrderInfo', () => {
    it('returns null when a user tries to renew another user\'s order', async () => {
      const owner = await insertTestUser()
      const attacker = await insertTestUser()
      const order = await insertTestOrder(owner.id, { tier: 'standard', status: 'delivered' })

      const result = await getRenewalOrderInfo(order.id, attacker.id)

      expect(result).toBeNull()
    })

    it('returns renewal info when accessed by the correct owner', async () => {
      const owner = await insertTestUser()
      const order = await insertTestOrder(owner.id, { tier: 'standard', status: 'delivered' })

      const result = await getRenewalOrderInfo(order.id, owner.id)

      expect(result).not.toBeNull()
      expect(result!.id).toBe(order.id)
    })
  })

  // ---------------------------------------------------------------------------
  // getOrderPersonalDetails (Read)
  // ---------------------------------------------------------------------------
  describe('getOrderPersonalDetails', () => {
    it('returns null when a user tries to read personal details of another user\'s order', async () => {
      const owner = await insertTestUser()
      const attacker = await insertTestUser()
      const order = await insertTestOrder(owner.id, MOCK_PERSONAL_DETAILS)

      const result = await getOrderPersonalDetails(order.id, attacker.id)

      expect(result).toBeNull()
    })

    it('returns details when accessed by the correct owner', async () => {
      const owner = await insertTestUser()
      const order = await insertTestOrder(owner.id, MOCK_PERSONAL_DETAILS)

      const result = await getOrderPersonalDetails(order.id, owner.id)

      expect(result).not.toBeNull()
      expect(result!.fullName).toBe(MOCK_PERSONAL_DETAILS.fullName)
    })
  })

  // ---------------------------------------------------------------------------
  // updateOrderPersonalDetails (Write)
  // ---------------------------------------------------------------------------
  describe('updateOrderPersonalDetails', () => {
    it('throws error and does not update when a user tries to modify another user\'s order', async () => {
      const owner = await insertTestUser()
      const attacker = await insertTestUser()
      const order = await insertTestOrder(owner.id, { fullName: 'Original Name' })

      const maliciousUpdate = { ...MOCK_PERSONAL_DETAILS, fullName: 'Hacked Name' }

      await expect(
        updateOrderPersonalDetails(order.id, attacker.id, maliciousUpdate)
      ).rejects.toThrow('Order not found or ownership check failed')

      // Verify DB remains unchanged
      const [updated] = await db.select().from(orders).where(eq(orders.id, order.id))
      expect(updated!.fullName).toBe('Original Name')
    })

    it('updates correctly when called by the owner', async () => {
      const owner = await insertTestUser()
      const order = await insertTestOrder(owner.id)

      await updateOrderPersonalDetails(order.id, owner.id, MOCK_PERSONAL_DETAILS)

      const [updated] = await db.select().from(orders).where(eq(orders.id, order.id))
      expect(updated!.fullName).toBe(MOCK_PERSONAL_DETAILS.fullName)
    })
  })

  // ---------------------------------------------------------------------------
  // updateOrderPoaPath (Write)
  // ---------------------------------------------------------------------------
  describe('updateOrderPoaPath', () => {
    it('does not update when a user tries to modify POA path of another user\'s order', async () => {
      const owner = await insertTestUser()
      const attacker = await insertTestUser()
      const order = await insertTestOrder(owner.id, { poaGeneratedPath: 'original.pdf' })

      // This call doesn't throw, but it should not match any rows to update
      await updateOrderPoaPath(order.id, attacker.id, 'hacked.pdf')

      // Verify DB remains unchanged
      const [updated] = await db.select().from(orders).where(eq(orders.id, order.id))
      expect(updated!.poaGeneratedPath).toBe('original.pdf')
    })

    it('updates correctly when called by the owner', async () => {
      const owner = await insertTestUser()
      const order = await insertTestOrder(owner.id, { poaGeneratedPath: 'original.pdf' })

      await updateOrderPoaPath(order.id, owner.id, 'new.pdf')

      const [updated] = await db.select().from(orders).where(eq(orders.id, order.id))
      expect(updated!.poaGeneratedPath).toBe('new.pdf')
    })
  })

  // ---------------------------------------------------------------------------
  // getUserActiveOrder (Read)
  // ---------------------------------------------------------------------------
  describe('getUserActiveOrder', () => {
    it('only returns the order belonging to the specific userId requested', async () => {
      const userA = await insertTestUser()
      const userB = await insertTestUser()
      const orderA = await insertTestOrder(userA.id)
      
      const resultForA = await getUserActiveOrder(userA.id)
      expect(resultForA).not.toBeNull()
      expect(resultForA!.id).toBe(orderA.id)

      const resultForB = await getUserActiveOrder(userB.id)
      expect(resultForB).toBeNull()
    })
  })
})
