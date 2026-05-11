// Reusable DB queries — populated by feature specs as each feature is built.

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import type { SelectUser } from '@/lib/db/schema'

export async function getUserById(id: string): Promise<SelectUser | null> {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return result[0] ?? null
}

export async function getUserByEmail(email: string): Promise<SelectUser | null> {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return result[0] ?? null
}
