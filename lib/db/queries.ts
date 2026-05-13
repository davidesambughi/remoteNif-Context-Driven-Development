// Reusable DB queries — populated by feature specs as each feature is built.

import { eq, desc, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users, orders } from '@/lib/db/schema'
import type { SelectUser, SelectOrder } from '@/lib/db/schema'
import type { PersonalDetailsData } from '@/lib/validations/orders'

/** Fetches a user record by their primary ID. */
export async function getUserById(id: string): Promise<SelectUser | null> {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return result[0] ?? null
}

/** Fetches a user record by their unique email address. */
export async function getUserByEmail(email: string): Promise<SelectUser | null> {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return result[0] ?? null
}

/** 
 * Retrieves the most recent order for a specific user.
 * Used primarily for the customer dashboard.
 */
export async function getUserActiveOrder(userId: string): Promise<SelectOrder | null> {
  const result = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt)).limit(1)
  return result[0] ?? null
}

/**
 * Updates the personal details of an order.
 * Enforces ownership by checking both orderId and userId.
 */
export async function updateOrderPersonalDetails(
  orderId: string,
  userId: string,
  data: PersonalDetailsData
): Promise<void> {
  const result = await db
    .update(orders)
    .set({
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth,
      nationality: data.nationality,
      passportNumber: data.passportNumber,
      passportExpiry: data.passportExpiry,
      address: data.address,
      updatedAt: new Date(),
    })
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .returning()

  if (result.length === 0) {
    throw new Error('Order not found or ownership check failed')
  }
}
