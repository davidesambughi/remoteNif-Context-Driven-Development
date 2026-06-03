// Reusable DB queries — populated by feature specs as each feature is built.

import { eq, desc, and, isNull, gte, lt, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users, orders, documents, payments, auditLog, operatorNotifications, operatorPreferences } from '@/lib/db/schema'
import type { SelectUser, SelectOrder, SelectDocument, InsertDocument, InsertAuditLog, InsertOperatorNotification, InsertOperatorPreferences } from '@/lib/db/schema'
import type { PersonalDetailsData } from '@/lib/validations/orders'
import type { EmailLocale } from '@/lib/email/send'
import type { Locale } from '@/i18n/routing'

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

// ---------------------------------------------------------------------------
// Admin queries (Feature 13a)
// ---------------------------------------------------------------------------

/** Shape returned by getAdminOrderList — includes the customer email from the users join. */
export interface AdminOrderListItem {
  id: string
  tier: 'essential' | 'standard' | 'express'
  status: string
  fullName: string | null
  email: string
  createdAt: Date
  documentsApprovedAt: Date | null
}

/**
 * Returns all orders joined with their owner's email for the admin order list.
 * Express documents_approved rows sort first (SLA urgency), then by createdAt DESC.
 * Accepts optional status and tier filters — omitting either returns all values.
 */
export async function getAdminOrderList(filters?: {
  status?: SelectOrder['status']
  tier?: SelectOrder['tier']
}): Promise<AdminOrderListItem[]> {
  const conditions = []
  if (filters?.status) conditions.push(eq(orders.status, filters.status))
  if (filters?.tier) conditions.push(eq(orders.tier, filters.tier))

  return db
    .select({
      id: orders.id,
      tier: orders.tier,
      status: orders.status,
      fullName: orders.fullName,
      email: users.email,
      createdAt: orders.createdAt,
      documentsApprovedAt: orders.documentsApprovedAt,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(
      // Express documents_approved rows float to the top — highest SLA urgency
      sql`CASE WHEN ${orders.tier} = 'express' AND ${orders.status} = 'documents_approved' THEN 0 ELSE 1 END`,
      sql`${orders.documentsApprovedAt} ASC NULLS LAST`,
      desc(orders.createdAt),
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

// ---------------------------------------------------------------------------
// Admin queries (Feature 13b)
// ---------------------------------------------------------------------------

export interface AdminOrderDetail {
  // Order fields
  id: string
  tier: 'essential' | 'standard' | 'express'
  status: SelectOrder['status']
  fullName: string | null
  dateOfBirth: string | null
  nationality: string | null
  passportNumber: string | null
  passportExpiry: string | null
  address: string | null
  nifNumber: string | null          // null until admin delivers (Feature 15)
  createdAt: Date
  documentsApprovedAt: Date | null
  // Customer
  customerEmail: string
  customerId: string
  customerLanguage: 'en' | 'fr' | 'es' | 'de'
  // Payment (latest)
  paymentAmountCents: number | null
  paymentStatus: string | null
  // Documents (all 3 active records — may be fewer if not yet uploaded)
  documents: AdminDocumentDetail[]
}

export interface AdminDocumentDetail {
  id: string
  type: 'passport' | 'proof_of_address' | 'signed_poa'
  filePath: string
  fileName: string
  fileSize: number
  mimeType: string
  aiReviewStatus: SelectDocument['aiReviewStatus']
  aiReviewReason: string | null
  aiReviewAttempts: number
  adminOverride: boolean
  adminOverrideBy: string | null
  adminOverrideReason: string | null
  adminOverrideAt: Date | null
  approved: boolean
  approvedAt: Date | null
  createdAt: Date
}

/**
 * Fetches the full composite detail for an order.
 */
export async function getAdminOrderDetail(orderId: string): Promise<AdminOrderDetail | null> {
  const orderResult = await db
    .select({
      id: orders.id,
      tier: orders.tier,
      status: orders.status,
      fullName: orders.fullName,
      dateOfBirth: orders.dateOfBirth,
      nationality: orders.nationality,
      passportNumber: orders.passportNumber,
      passportExpiry: orders.passportExpiry,
      address: orders.address,
      nifNumber: orders.nifNumber,
      createdAt: orders.createdAt,
      documentsApprovedAt: orders.documentsApprovedAt,
      customerEmail: users.email,
      customerId: users.id,
      customerLanguage: users.language,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, orderId))
    .limit(1)

  const order = orderResult[0]
  if (!order) return null

  const paymentResult = await db
    .select({
      amount: payments.amount,
      status: payments.status,
    })
    .from(payments)
    .where(eq(payments.orderId, orderId))
    .orderBy(desc(payments.createdAt))
    .limit(1)

  const latestPayment = paymentResult[0]

  const docs = await db
    .select()
    .from(documents)
    .where(and(eq(documents.orderId, orderId), isNull(documents.supersededAt)))

  return {
    ...order,
    paymentAmountCents: latestPayment?.amount ?? null,
    paymentStatus: latestPayment?.status ?? null,
    documents: docs.map(doc => ({
      id: doc.id,
      type: doc.type,
      filePath: doc.filePath,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      aiReviewStatus: doc.aiReviewStatus,
      aiReviewReason: doc.aiReviewReason,
      aiReviewAttempts: doc.aiReviewAttempts,
      adminOverride: doc.adminOverride,
      adminOverrideBy: doc.adminOverrideBy,
      adminOverrideReason: doc.adminOverrideReason,
      adminOverrideAt: doc.adminOverrideAt,
      approved: doc.approved,
      approvedAt: doc.approvedAt,
      createdAt: doc.createdAt,
    })),
  }
}

/** Fetches all operator users for notifications. */
export async function getOperatorUsers(): Promise<Array<{ id: string; email: string }>> {
  return db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.role, 'operator'))
}

/** Sets a document as approved via admin override. */
export async function adminSetDocumentApproved(documentId: string, adminId: string): Promise<void> {
  await db
    .update(documents)
    .set({
      adminOverride: true,
      adminOverrideBy: adminId,
      adminOverrideAt: new Date(),
      adminOverrideReason: null,
      approved: true,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(documents.id, documentId))
}

/** Sets a document as flagged via admin override. */
export async function adminSetDocumentFlagged(documentId: string, adminId: string, reason: string): Promise<void> {
  await db
    .update(documents)
    .set({
      adminOverride: true,
      adminOverrideBy: adminId,
      adminOverrideAt: new Date(),
      adminOverrideReason: reason,
      aiReviewStatus: 'flagged',
      approved: false,
      approvedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, documentId))
}

/** Transitions an order to the approved state. */
export async function adminTransitionOrderToApproved(orderId: string): Promise<void> {
  await db
    .update(orders)
    .set({
      status: 'documents_approved',
      documentsApprovedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
}

/** Updates the status and optional timestamps of an order. */
export async function adminUpdateOrderStatusQuery(
  orderId: string,
  newStatus: SelectOrder['status'],
  timestamps: Partial<Pick<SelectOrder, 'documentsApprovedAt' | 'submittedToFinancasAt' | 'deliveredAt'>>
): Promise<void> {
  await db
    .update(orders)
    .set({
      status: newStatus,
      ...timestamps,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
}

/** Inserts an entry into the append-only audit log. Fails silently to prevent breaking main logic. */
export async function insertAuditLog(entry: Omit<InsertAuditLog, 'id' | 'createdAt'>): Promise<void> {
  try {
    await db.insert(auditLog).values(entry)
  } catch (error) {
    console.error('Failed to insert audit log:', error)
  }
}

/** Inserts a record for an operator notification. */
export async function insertOperatorNotification(data: Omit<InsertOperatorNotification, 'id' | 'createdAt'>): Promise<void> {
  await db.insert(operatorNotifications).values(data)
}

/**
 * Lightweight read used by adminDeliverNif to check immutability, get tier,
 * and retrieve the customer email + language needed for the delivery email.
 * Uses a leftJoin on users to avoid the full getAdminOrderDetail join cost.
 */
export async function getOrderNifAndTier(
  orderId: string,
): Promise<{
  nifNumber: string | null
  tier: 'essential' | 'standard' | 'express'
  customerEmail: string
  customerLanguage: 'en' | 'fr' | 'es' | 'de'
  fullName: string | null
} | null> {
  const result = await db
    .select({
      nifNumber: orders.nifNumber,
      tier: orders.tier,
      fullName: orders.fullName,
      customerEmail: users.email,
      customerLanguage: users.language,
    })
    .from(orders)
    .leftJoin(users, eq(users.id, orders.userId))
    .where(eq(orders.id, orderId))
    .limit(1)

  if (!result[0]) return null

  return {
    nifNumber: result[0].nifNumber,
    tier: result[0].tier,
    fullName: result[0].fullName,
    // Guard against null from leftJoin — orders always have a valid userId
    customerEmail: result[0].customerEmail ?? '',
    customerLanguage: (result[0].customerLanguage ?? 'en') as 'en' | 'fr' | 'es' | 'de',
  }
}

/**
 * Atomically marks an order as delivered.
 * Sets nifNumber, status, deliveredAt, and — for Standard/Express tiers —
 * fiscalRepExpiresAt to exactly 12 months after deliveredAt.
 * Essential orders leave fiscalRepExpiresAt null (no fiscal rep purchased).
 */
export async function deliverNifNumber(
  orderId: string,
  nifNumber: string,
  tier: 'essential' | 'standard' | 'express',
): Promise<void> {
  const deliveredAt = new Date()
  // Add exactly 12 calendar months; handles month-length edge cases via Date constructor
  const fiscalRepExpiresAt =
    tier !== 'essential'
      ? new Date(
          deliveredAt.getFullYear() + 1,
          deliveredAt.getMonth(),
          deliveredAt.getDate(),
          deliveredAt.getHours(),
          deliveredAt.getMinutes(),
          deliveredAt.getSeconds(),
          deliveredAt.getMilliseconds(),
        )
      : null

  await db
    .update(orders)
    .set({
      nifNumber,
      status: 'delivered',
      deliveredAt,
      fiscalRepExpiresAt,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
}

// ---------------------------------------------------------------------------
// Operator queue queries (Feature 14a-1)
// ---------------------------------------------------------------------------

/** Shape returned by getOperatorQueue. documentsApprovedAt is non-null at this status. */
export interface OperatorQueueItem {
  id: string
  tier: 'essential' | 'standard' | 'express'
  fullName: string | null
  email: string
  createdAt: Date
  documentsApprovedAt: Date
}

/**
 * Returns all orders in `documents_approved` status for the operator queue.
 * Express orders sort first; within Express sorted by SLA urgency (oldest approval = least time
 * remaining). Standard orders sort by createdAt ASC (FIFO).
 */
export async function getOperatorQueue(): Promise<OperatorQueueItem[]> {
  const rows = await db
    .select({
      id: orders.id,
      tier: orders.tier,
      fullName: orders.fullName,
      email: users.email,
      createdAt: orders.createdAt,
      documentsApprovedAt: orders.documentsApprovedAt,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.status, 'documents_approved'))
    .orderBy(
      // Express rows float to the top
      sql`CASE WHEN ${orders.tier} = 'express' THEN 0 ELSE 1 END`,
      // Express: sort by oldest approval first (nearest SLA deadline).
      // Standard: sort by oldest order first (FIFO).
      sql`CASE WHEN ${orders.tier} = 'express' THEN ${orders.documentsApprovedAt} ELSE ${orders.createdAt} END ASC NULLS LAST`,
    )

  // Cast documentsApprovedAt: guaranteed non-null on documents_approved rows
  return rows.map((r) => ({
    ...r,
    documentsApprovedAt: r.documentsApprovedAt as Date,
  }))
}

/**
 * Fetches a single order's status by ID.
 * Returns null if not found.
 */
export async function getOrderStatusById(
  orderId: string,
): Promise<{ status: SelectOrder['status'] } | null> {
  const [row] = await db
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.id, orderId))
  return row ?? null
}

// ---------------------------------------------------------------------------
// Operator package queries (Feature 14a-2)
// ---------------------------------------------------------------------------

/**
 * Shaped return type for getOperatorPackageData.
 * Note: dateOfBirth and passportExpiry are ISO date strings (Drizzle `date()` returns string,
 * not Date). The cover sheet template receives them as strings and renders them as-is.
 */
export interface OperatorPackageData {
  order: {
    id: string
    tier: string
    fullName: string
    dateOfBirth: string
    nationality: string
    passportNumber: string
    passportExpiry: string
    address: string
  }
  documents: Array<{
    type: 'passport' | 'proof_of_address' | 'signed_poa'
    filePath: string
    mimeType: string
  }>
}

/**
 * Fetches all data needed to build an operator download package.
 * Returns null in any of these cases — the caller returns 404:
 *  - Order does not exist
 *  - Order is not in `documents_approved` status
 *  - Any required personal-detail field is null (order is incomplete)
 *  - Fewer than exactly 3 active approved documents exist
 */
export async function getOperatorPackageData(
  orderId: string,
): Promise<OperatorPackageData | null> {
  // Fetch order — gate on status and personal-details completeness in one go
  const orderRows = await db
    .select({
      id: orders.id,
      tier: orders.tier,
      status: orders.status,
      fullName: orders.fullName,
      dateOfBirth: orders.dateOfBirth,
      nationality: orders.nationality,
      passportNumber: orders.passportNumber,
      passportExpiry: orders.passportExpiry,
      address: orders.address,
    })
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.status, 'documents_approved')))
    .limit(1)

  const order = orderRows[0]
  if (!order) return null

  // Guard: all personal-detail fields must be present before we can generate the cover sheet
  if (
    !order.fullName ||
    !order.dateOfBirth ||
    !order.nationality ||
    !order.passportNumber ||
    !order.passportExpiry ||
    !order.address
  ) {
    return null
  }

  // Fetch the 3 active approved documents
  const docs = await db
    .select({
      type: documents.type,
      filePath: documents.filePath,
      mimeType: documents.mimeType,
    })
    .from(documents)
    .where(
      and(
        eq(documents.orderId, orderId),
        isNull(documents.supersededAt),
        eq(documents.approved, true),
      ),
    )

  // Must have exactly 3 approved documents (passport + proof_of_address + signed_poa)
  if (docs.length !== 3) return null

  return {
    order: {
      id: order.id,
      tier: order.tier,
      fullName: order.fullName,
      dateOfBirth: order.dateOfBirth,
      nationality: order.nationality,
      passportNumber: order.passportNumber,
      passportExpiry: order.passportExpiry,
      address: order.address,
    },
    documents: docs,
  }
}

/**
 * Transitions an order from documents_approved → submitted.
 * Sets submittedToFinancasAt timestamp.
 */
export async function markOrderSubmitted(orderId: string): Promise<void> {
  await db
    .update(orders)
    .set({
      status: 'submitted',
      submittedToFinancasAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
}

// ---------------------------------------------------------------------------
// Feature 14b — Operator archive, preferences, submission email
// ---------------------------------------------------------------------------

/**
 * Shaped return type for getOrderDataForSubmissionEmail.
 * Provides the customer contact details needed to send the submission notification.
 */
export interface OrderDataForSubmissionEmail {
  customerEmail: string
  customerLanguage: EmailLocale
  fullName: string | null
  tier: string
}

/**
 * Fetches the customer contact info needed to send the "submitted to Finanças" email.
 * Joins orders + users. Returns null if the order does not exist.
 */
export async function getOrderDataForSubmissionEmail(
  orderId: string,
): Promise<OrderDataForSubmissionEmail | null> {
  const [row] = await db
    .select({
      customerEmail: users.email,
      customerLanguage: users.language,
      fullName: orders.fullName,
      tier: orders.tier,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, orderId))
    .limit(1)
  return row ?? null
}

/**
 * Shaped return type for getSubmittedOrders — the operator archive list.
 */
export interface SubmittedOrderItem {
  id: string
  fullName: string | null
  tier: 'essential' | 'standard' | 'express'
  submittedToFinancasAt: Date
}

/**
 * Returns all orders with status = 'submitted', newest first.
 * Used for the operator archive view — read-only, no SLA pressure.
 */
export async function getSubmittedOrders(): Promise<SubmittedOrderItem[]> {
  const rows = await db
    .select({
      id: orders.id,
      fullName: orders.fullName,
      tier: orders.tier,
      submittedToFinancasAt: orders.submittedToFinancasAt,
    })
    .from(orders)
    .where(eq(orders.status, 'submitted'))
    .orderBy(desc(orders.submittedToFinancasAt))

  // submittedToFinancasAt is guaranteed non-null on 'submitted' rows
  return rows.map((r) => ({
    ...r,
    submittedToFinancasAt: r.submittedToFinancasAt as Date,
  }))
}

/**
 * Shaped return type for getOperatorPreferencesOrDefaults.
 * Mirrors the relevant columns of operator_preferences.
 */
export interface OperatorPreferencesData {
  emailNotifications: boolean
  smsNotifications: boolean
  phoneNumber: string | null
}

/**
 * Returns the operator's notification preferences.
 * If no row exists yet (first-time operator), returns schema defaults without inserting.
 */
export async function getOperatorPreferencesOrDefaults(
  userId: string,
): Promise<OperatorPreferencesData> {
  const [row] = await db
    .select({
      emailNotifications: operatorPreferences.emailNotifications,
      smsNotifications: operatorPreferences.smsNotifications,
      phoneNumber: operatorPreferences.phoneNumber,
    })
    .from(operatorPreferences)
    .where(eq(operatorPreferences.userId, userId))
    .limit(1)

  // Return schema defaults if no preferences row exists yet
  return row ?? { emailNotifications: true, smsNotifications: true, phoneNumber: null }
}

/**
 * Upserts operator notification preferences.
 * Inserts on first save; updates on conflict with existing userId.
 * Data param uses Pick from InsertOperatorPreferences — avoids duplicating the schema shape.
 */
export async function upsertOperatorPreferences(
  userId: string,
  data: Pick<InsertOperatorPreferences, 'emailNotifications' | 'smsNotifications' | 'phoneNumber'>,
): Promise<void> {
  await db
    .insert(operatorPreferences)
    .values({ userId, ...data })
    .onConflictDoUpdate({
      target: operatorPreferences.userId,
      set: { ...data, updatedAt: new Date() },
    })
}

// ---------------------------------------------------------------------------
// User language preference (Feature 17b)
// ---------------------------------------------------------------------------

/**
 * Persists the user's chosen language preference to public.users.
 * Called only after the action has validated the locale value.
 */
export async function updateUserLanguage(
  userId: string,
  language: Locale,
): Promise<void> {
  await db
    .update(users)
    .set({ language, updatedAt: new Date() })
    .where(eq(users.id, userId))
}

// ---------------------------------------------------------------------------
// Renewal queries (Feature 18a)
// ---------------------------------------------------------------------------

/**
 * Partial select from SelectOrder — no duplicate interface needed.
 * Used by getRenewalOrderInfo and createRenewalCheckoutSession.
 */
type RenewalOrderInfo = Pick<SelectOrder, 'id' | 'userId' | 'tier' | 'fiscalRepExpiresAt' | 'status'>

/**
 * Fetches the minimal order data needed to validate a renewal request.
 * Returns null if the order does not exist or belongs to a different user.
 * The userId ownership check prevents customers accessing each other's orders.
 */
export async function getRenewalOrderInfo(
  orderId: string,
  userId: string,
): Promise<RenewalOrderInfo | null> {
  const [row] = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      tier: orders.tier,
      fiscalRepExpiresAt: orders.fiscalRepExpiresAt,
      status: orders.status,
    })
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1)

  return row ?? null
}

/**
 * Extends the fiscal rep expiry by 12 months from the LATER of the current expiry
 * or the current timestamp. This handles late renewals: if the expiry has already
 * passed, the 12-month window starts from today rather than from the expired date.
 *
 * SQL: GREATEST(fiscal_rep_expires_at, NOW()) + INTERVAL '12 months'
 *
 * Accepts an optional dbOrTx parameter so the update can participate in a
 * calling transaction. Uses `any` to avoid the complex Drizzle transaction generic —
 * the runtime shape is identical to `db` so this is safe.
 *
 * Returns the new fiscalRepExpiresAt value.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function extendFiscalRepExpiry(orderId: string, dbOrTx: any = db): Promise<Date> {
  const result = await dbOrTx
    .update(orders)
    .set({
      fiscalRepExpiresAt: sql`GREATEST(${orders.fiscalRepExpiresAt}, NOW()) + INTERVAL '12 months'`,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
    .returning({ fiscalRepExpiresAt: orders.fiscalRepExpiresAt })

  // Non-null assertion: we just set the value unconditionally above
  return result[0]!.fiscalRepExpiresAt!
}

// ---------------------------------------------------------------------------
// Renewal reminder queries (Feature 18b)
// ---------------------------------------------------------------------------

/**
 * Shape returned by getOrdersForRenewalReminders — one row per order that needs
 * a reminder email, joined with the user's email and language preference.
 */
export type RenewalReminderTarget = {
  orderId: string
  userId: string
  email: string
  language: EmailLocale
  fullName: string | null
  fiscalRepExpiresAt: Date
}

/**
 * Fetches all orders whose fiscal rep expires on the calendar day that is
 * exactly `targetDaysFromNow` days from today (in UTC).
 *
 * Uses a day-window range (>= startOfDay AND < startOfNextDay) because
 * `fiscal_rep_expires_at` is a full timestamp, not a date-only value.
 * A simple equality comparison would match nothing in practice.
 *
 * Filters:
 *  - status = 'delivered'
 *  - tier IN ('standard', 'express')  — Essential orders have no fiscal rep
 *  - fiscalRepDismissedAt IS NULL     — customer opted out: no more emails
 *  - fiscalRepExpiresAt within the target calendar day
 *
 * NOTE: no dedup guard — known limitation, acceptable at current scale.
 * If the cron fires twice on the same day a customer may receive a duplicate
 * reminder. Tracked as a known issue; add a sent-flag column if volume grows.
 */
export async function getOrdersForRenewalReminders(
  targetDaysFromNow: number,
): Promise<RenewalReminderTarget[]> {
  return db
    .select({
      orderId: orders.id,
      userId: orders.userId,
      email: users.email,
      // Language is stored on the users table; cast to EmailLocale — the column
      // is constrained to the same four values so the cast is safe.
      language: users.language,
      fullName: orders.fullName,
      // Non-null assertion below is safe: the WHERE clause guarantees non-null
      fiscalRepExpiresAt: orders.fiscalRepExpiresAt,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(
      and(
        eq(orders.status, 'delivered'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sql`${orders.tier} IN ('standard', 'express')` as any,
        isNull(orders.fiscalRepDismissedAt),
        // Day-window range: >= start of target day, < start of next day (UTC)
        gte(
          orders.fiscalRepExpiresAt,
          sql`CURRENT_DATE + INTERVAL '${sql.raw(String(targetDaysFromNow))} days'`,
        ),
        lt(
          orders.fiscalRepExpiresAt,
          sql`CURRENT_DATE + INTERVAL '${sql.raw(String(targetDaysFromNow + 1))} days'`,
        ),
      ),
    ) as unknown as Promise<RenewalReminderTarget[]>
}

// ---------------------------------------------------------------------------
// SLA breach queries (Feature S6-Fix10)
// ---------------------------------------------------------------------------

/**
 * Shape returned by getOverdueExpressOrders.
 * Contains only what the SLA breach alert email needs — no customer PII beyond name.
 */
export type OverdueExpressOrder = {
  id: string
  fullName: string | null
  documentsApprovedAt: Date
}

/**
 * Returns Express orders that have exceeded the 48-hour operator SLA and have not
 * yet had a breach alert sent.
 *
 * Filters:
 *  - tier = 'express'
 *  - status = 'documents_approved'
 *  - documentsApprovedAt < NOW() - 48h
 *  - slaBreachAlertSentAt IS NULL   — dedup: one alert per order per breach
 */
export async function getOverdueExpressOrders(): Promise<OverdueExpressOrder[]> {
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)

  const rows = await db
    .select({
      id: orders.id,
      fullName: orders.fullName,
      documentsApprovedAt: orders.documentsApprovedAt,
    })
    .from(orders)
    .where(
      and(
        eq(orders.tier, 'express'),
        eq(orders.status, 'documents_approved'),
        lt(orders.documentsApprovedAt, fortyEightHoursAgo),
        isNull(orders.slaBreachAlertSentAt),
      ),
    )

  // documentsApprovedAt is non-null on all documents_approved rows; cast is safe
  return rows.map((r) => ({ ...r, documentsApprovedAt: r.documentsApprovedAt as Date }))
}

/**
 * Marks an order's SLA breach alert as sent.
 * Called immediately after sending the admin alert email.
 * Sets slaBreachAlertSentAt once — never cleared.
 */
export async function markSlaBreachAlertSent(orderId: string): Promise<void> {
  await db
    .update(orders)
    .set({ slaBreachAlertSentAt: new Date(), updatedAt: new Date() })
    .where(eq(orders.id, orderId))
}

/**
 * Sets fiscalRepDismissedAt to NOW() for the given order.
 * Ownership is verified by the caller (Server Action) before this runs.
 */
export async function dismissFiscalRepForOrder(orderId: string): Promise<void> {
  await db
    .update(orders)
    .set({ fiscalRepDismissedAt: new Date(), updatedAt: new Date() })
    .where(eq(orders.id, orderId))
}

/**
 * Fetches the full name stored against an order.
 * Used by handleRenewalCheckoutCompleted to personalise the confirmation email.
 * Returns null if no name has been saved yet (name is collected after payment).
 */
export async function getOrderFullName(orderId: string): Promise<string | null> {
  const [row] = await db
    .select({ fullName: orders.fullName })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)

  return row?.fullName ?? null
}
