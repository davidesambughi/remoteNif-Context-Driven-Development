// Reusable DB queries — populated by feature specs as each feature is built.

import { eq, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users, orders } from '@/lib/db/schema'
import type { SelectUser, SelectOrder } from '@/lib/db/schema'

export async function getUserById(id: string): Promise<SelectUser | null> {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return result[0] ?? null
}

export async function getUserByEmail(email: string): Promise<SelectUser | null> {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return result[0] ?? null
}

export async function getUserActiveOrder(userId: string): Promise<SelectOrder | null> {
  const result = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt)).limit(1)
  return result[0] ?? null
}
