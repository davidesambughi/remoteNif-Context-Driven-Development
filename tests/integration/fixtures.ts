import { db } from '@/lib/db'
import { users, orders, documents } from '@/lib/db/schema'
import type { SelectUser, SelectOrder, SelectDocument, InsertUser, InsertOrder, InsertDocument } from '@/lib/db/schema'

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export async function insertTestUser(overrides: Partial<InsertUser> = {}): Promise<SelectUser> {
  // Use a random UUID suffix to guarantee unique emails across test runs within a file.
  const email = overrides.email ?? `test-${crypto.randomUUID()}@example.com`
  const [user] = await db
    .insert(users)
    .values({ email, role: 'customer', language: 'en', ...overrides })
    .returning()
  if (!user) throw new Error('insertTestUser: insert returned no rows')
  return user
}

// ---------------------------------------------------------------------------
// Order
// ---------------------------------------------------------------------------

export async function insertTestOrder(
  userId: string,
  overrides: Partial<InsertOrder> = {},
): Promise<SelectOrder> {
  const [order] = await db
    .insert(orders)
    .values({ userId, tier: 'standard', status: 'documents_pending', ...overrides })
    .returning()
  if (!order) throw new Error('insertTestOrder: insert returned no rows')
  return order
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------

export async function insertTestDocument(
  orderId: string,
  userId: string,
  overrides: Partial<InsertDocument> = {},
): Promise<SelectDocument> {
  const [doc] = await db
    .insert(documents)
    .values({
      orderId,
      userId,
      type: 'passport',
      filePath: 'test/path/doc.pdf',
      fileName: 'doc.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      aiReviewStatus: 'pending',
      approved: false,
      aiReviewAttempts: 0,
      supersededAt: null,
      ...overrides,
    })
    .returning()
  if (!doc) throw new Error('insertTestDocument: insert returned no rows')
  return doc
}
