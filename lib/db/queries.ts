// Reusable DB queries — populated by feature specs as each feature is built.

import { eq, desc, and, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users, orders, documents } from '@/lib/db/schema'
import type { SelectUser, SelectOrder, SelectDocument, InsertDocument } from '@/lib/db/schema'
import type { PersonalDetailsData } from '@/lib/validations/orders'
import type { EmailLocale } from '@/lib/email/send'

// ---------------------------------------------------------------------------
// Document queries (Feature 11)
// ---------------------------------------------------------------------------

/**
 * Returns all active (not superseded) documents for an order.
 * Used to hydrate upload slots from DB state and to check if all 3 are approved.
 */
export async function getActiveDocumentsForOrder(orderId: string): Promise<SelectDocument[]> {
  return db
    .select()
    .from(documents)
    .where(and(eq(documents.orderId, orderId), isNull(documents.supersededAt)))
}

/**
 * Fetches a single active document by ID with an ownership check.
 * Returns null if the document doesn't exist, has been superseded, or belongs to a different user.
 */
export async function getDocumentByIdForUser(
  documentId: string,
  userId: string,
): Promise<SelectDocument | null> {
  const result = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.id, documentId),
        eq(documents.userId, userId),
        isNull(documents.supersededAt),
      ),
    )
    .limit(1)
  return result[0] ?? null
}

/**
 * Writes the AI review outcome to a document in a single atomic update.
 * Always writes approved + approvedAt together to keep approval state consistent.
 */
export async function updateDocumentAiReview(
  documentId: string,
  update: {
    aiReviewStatus: 'clear' | 'flagged' | 'error' | 'manual_review'
    aiReviewReason: string | null
    aiReviewAttempts: number
    approved: boolean
    approvedAt: Date | null
  },
): Promise<void> {
  await db
    .update(documents)
    .set({
      aiReviewStatus: update.aiReviewStatus,
      aiReviewReason: update.aiReviewReason,
      aiReviewAttempts: update.aiReviewAttempts,
      aiReviewedAt: new Date(),
      approved: update.approved,
      approvedAt: update.approvedAt,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, documentId))
}

/**
 * Transitions an order to documents_under_review once all 3 documents are approved.
 * Sets documentsSubmittedAt to the current timestamp (admin SLA clock starts here).
 */
export async function markOrderDocumentsUnderReview(orderId: string): Promise<void> {
  await db
    .update(orders)
    .set({
      status: 'documents_under_review',
      documentsSubmittedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
}

/**
 * Fetches the minimal order info needed to populate admin notification emails.
 * Returns null if the order does not exist.
 */
export async function getOrderBasicInfo(
  orderId: string,
): Promise<{ fullName: string | null; tier: 'essential' | 'standard' | 'express' } | null> {
  const result = await db
    .select({ fullName: orders.fullName, tier: orders.tier })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)
  return result[0] ?? null
}

/**
 * Returns the user's stored language preference, defaulting to 'en'.
 * Used to send transactional emails in the customer's language.
 */
export async function getUserLanguage(userId: string): Promise<EmailLocale> {
  const result = await db
    .select({ language: users.language })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  return result[0]?.language ?? 'en'
}

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
 * Fetches the personal details fields and current POA path for an order.
 * Returns null if the order doesn't exist or isn't owned by the given user.
 * Used by the generatePoa action to verify data completeness before PDF rendering.
 */
export async function getOrderPersonalDetails(
  orderId: string,
  userId: string,
): Promise<Pick<SelectOrder, 'fullName' | 'dateOfBirth' | 'nationality' | 'passportNumber' | 'passportExpiry' | 'address' | 'poaGeneratedPath'> | null> {
  const result = await db
    .select({
      fullName: orders.fullName,
      dateOfBirth: orders.dateOfBirth,
      nationality: orders.nationality,
      passportNumber: orders.passportNumber,
      passportExpiry: orders.passportExpiry,
      address: orders.address,
      poaGeneratedPath: orders.poaGeneratedPath,
    })
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1)

  return result[0] ?? null
}

/**
 * Updates the poaGeneratedPath on an order.
 * Pass null to clear the path (forces regeneration after a details edit).
 * Enforces ownership by checking both orderId and userId.
 */
export async function updateOrderPoaPath(
  orderId: string,
  userId: string,
  path: string | null,
): Promise<void> {
  await db
    .update(orders)
    .set({ poaGeneratedPath: path, updatedAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
}

/**
 * Verifies that an order exists and belongs to the given user.
 * Returns the order row or null — used as an ownership gate in Server Actions.
 */
export async function getOrderForUser(
  orderId: string,
  userId: string,
): Promise<SelectOrder | null> {
  const result = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1)
  return result[0] ?? null
}

/**
 * Inserts a new document record into the documents table.
 * id, createdAt, and updatedAt are handled by the database.
 */
export async function createDocumentRecord(
  data: Omit<InsertDocument, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<SelectDocument> {
  const result = await db.insert(documents).values(data).returning()
  const record = result[0]
  if (!record) throw new Error('Document insert returned no rows')
  return record
}

/**
 * Soft-deletes all active (supersededAt = null) documents of a given type for an order.
 * Called before inserting a replacement upload so old records are kept for audit.
 */
export async function supersedePreviousDocuments(
  orderId: string,
  type: 'passport' | 'proof_of_address' | 'signed_poa',
): Promise<void> {
  await db
    .update(documents)
    .set({ supersededAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(documents.orderId, orderId),
        eq(documents.type, type),
        isNull(documents.supersededAt),
      ),
    )
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
