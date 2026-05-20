import { beforeEach } from 'vitest'
import { db } from '@/lib/db'
import {
  auditLog,
  operatorNotifications,
  operatorPreferences,
  documents,
  payments,
  orders,
  users,
} from '@/lib/db/schema'

// Delete all rows in FK dependency order — children first to avoid constraint errors.
export async function truncateAll(): Promise<void> {
  await db.delete(auditLog)
  await db.delete(operatorNotifications)
  await db.delete(operatorPreferences)
  await db.delete(documents)
  await db.delete(payments)
  await db.delete(orders)
  await db.delete(users)
}

// Run automatically before every integration test — no need to call in each file.
beforeEach(truncateAll)
