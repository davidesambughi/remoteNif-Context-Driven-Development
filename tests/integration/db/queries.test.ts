import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import {
  getOrderForUser,
  createDocumentRecord,
  supersedePreviousDocuments,
  getActiveDocumentsForOrder,
  markOrderDocumentsUnderReview,
  getOrderBasicInfo,
} from '@/lib/db/queries'
import { truncateAll } from '../setup'
import { insertTestUser, insertTestOrder, insertTestDocument } from '../fixtures'

beforeEach(truncateAll)

// ---------------------------------------------------------------------------
// getOrderForUser
// ---------------------------------------------------------------------------

describe('getOrderForUser', () => {
  it('returns the order when ownership matches', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id)

    const result = await getOrderForUser(order.id, user.id)

    expect(result).not.toBeNull()
    expect(result!.id).toBe(order.id)
  })

  it('returns null when the userId does not match', async () => {
    const user1 = await insertTestUser()
    const user2 = await insertTestUser()
    const order = await insertTestOrder(user1.id)

    const result = await getOrderForUser(order.id, user2.id)

    expect(result).toBeNull()
  })

  it('returns null for a non-existent order ID', async () => {
    const user = await insertTestUser()

    const result = await getOrderForUser(crypto.randomUUID(), user.id)

    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// createDocumentRecord
// ---------------------------------------------------------------------------

describe('createDocumentRecord', () => {
  it('inserts a row and returns a record with a generated id and createdAt', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id)

    const doc = await createDocumentRecord({
      orderId: order.id,
      userId: user.id,
      type: 'passport',
      filePath: 'test/path/passport.pdf',
      fileName: 'passport.pdf',
      fileSize: 2048,
      mimeType: 'application/pdf',
      aiReviewStatus: 'pending',
      approved: false,
      aiReviewAttempts: 0,
      supersededAt: null,
    })

    expect(doc.id).toBeTruthy()
    expect(doc.createdAt).toBeInstanceOf(Date)
    expect(doc.orderId).toBe(order.id)
  })

  it('inserted row is retrievable via getActiveDocumentsForOrder', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id)

    const doc = await createDocumentRecord({
      orderId: order.id,
      userId: user.id,
      type: 'passport',
      filePath: 'test/path/passport.pdf',
      fileName: 'passport.pdf',
      fileSize: 2048,
      mimeType: 'application/pdf',
      aiReviewStatus: 'pending',
      approved: false,
      aiReviewAttempts: 0,
      supersededAt: null,
    })

    const active = await getActiveDocumentsForOrder(order.id)
    expect(active.map((d) => d.id)).toContain(doc.id)
  })
})

// ---------------------------------------------------------------------------
// supersedePreviousDocuments
// ---------------------------------------------------------------------------

describe('supersedePreviousDocuments', () => {
  it('sets supersededAt on all active documents of the given type', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id)
    const doc = await insertTestDocument(order.id, user.id, { type: 'passport' })

    await supersedePreviousDocuments(order.id, 'passport')

    const active = await getActiveDocumentsForOrder(order.id)
    expect(active.find((d) => d.id === doc.id)).toBeUndefined()
  })

  it('does not affect documents of a different type on the same order', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id)
    await insertTestDocument(order.id, user.id, { type: 'passport' })
    const poa = await insertTestDocument(order.id, user.id, { type: 'proof_of_address' })

    await supersedePreviousDocuments(order.id, 'passport')

    const active = await getActiveDocumentsForOrder(order.id)
    expect(active.find((d) => d.id === poa.id)).toBeDefined()
  })

  it('does not affect documents of the same type on a different order', async () => {
    const user = await insertTestUser()
    const order1 = await insertTestOrder(user.id)
    const order2 = await insertTestOrder(user.id)
    const doc1 = await insertTestDocument(order1.id, user.id, { type: 'passport' })
    const doc2 = await insertTestDocument(order2.id, user.id, { type: 'passport' })

    await supersedePreviousDocuments(order1.id, 'passport')

    const active2 = await getActiveDocumentsForOrder(order2.id)
    expect(active2.find((d) => d.id === doc2.id)).toBeDefined()

    const active1 = await getActiveDocumentsForOrder(order1.id)
    expect(active1.find((d) => d.id === doc1.id)).toBeUndefined()
  })

  it('after superseding, getActiveDocumentsForOrder no longer returns the superseded document', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id)
    await insertTestDocument(order.id, user.id, { type: 'passport' })

    const beforeSupersede = await getActiveDocumentsForOrder(order.id)
    expect(beforeSupersede).toHaveLength(1)

    await supersedePreviousDocuments(order.id, 'passport')

    const afterSupersede = await getActiveDocumentsForOrder(order.id)
    expect(afterSupersede).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// getActiveDocumentsForOrder
// ---------------------------------------------------------------------------

describe('getActiveDocumentsForOrder', () => {
  it('returns only documents where supersededAt IS NULL', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id)
    const activeDoc = await insertTestDocument(order.id, user.id, { type: 'passport' })
    // Insert a superseded document directly via the DB
    await insertTestDocument(order.id, user.id, {
      type: 'proof_of_address',
      supersededAt: new Date(),
    })

    const active = await getActiveDocumentsForOrder(order.id)

    expect(active).toHaveLength(1)
    expect(active[0]!.id).toBe(activeDoc.id)
  })

  it('returns all 3 types when 3 active documents exist', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id)
    await insertTestDocument(order.id, user.id, { type: 'passport' })
    await insertTestDocument(order.id, user.id, { type: 'proof_of_address' })
    await insertTestDocument(order.id, user.id, { type: 'signed_poa' })

    const active = await getActiveDocumentsForOrder(order.id)

    expect(active).toHaveLength(3)
  })

  it('returns an empty array when all documents have been superseded', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id)
    await insertTestDocument(order.id, user.id, { type: 'passport', supersededAt: new Date() })

    const active = await getActiveDocumentsForOrder(order.id)

    expect(active).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// markOrderDocumentsUnderReview
// ---------------------------------------------------------------------------

describe('markOrderDocumentsUnderReview', () => {
  it('updates the order status to documents_under_review', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id)

    await markOrderDocumentsUnderReview(order.id)

    const [updated] = await db.select().from(orders).where(eq(orders.id, order.id))
    expect(updated!.status).toBe('documents_under_review')
  })

  it('sets documentsSubmittedAt to a non-null timestamp', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id)

    await markOrderDocumentsUnderReview(order.id)

    const [updated] = await db.select().from(orders).where(eq(orders.id, order.id))
    expect(updated!.documentsSubmittedAt).toBeInstanceOf(Date)
  })

  it('does not affect other orders', async () => {
    const user = await insertTestUser()
    const order1 = await insertTestOrder(user.id)
    const order2 = await insertTestOrder(user.id)

    await markOrderDocumentsUnderReview(order1.id)

    const [unchanged] = await db.select().from(orders).where(eq(orders.id, order2.id))
    expect(unchanged!.status).toBe('documents_pending')
    expect(unchanged!.documentsSubmittedAt).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// getOrderBasicInfo
// ---------------------------------------------------------------------------

describe('getOrderBasicInfo', () => {
  it('returns fullName and tier for an existing order', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, { tier: 'express', fullName: 'Ana Costa' })

    const result = await getOrderBasicInfo(order.id)

    expect(result).not.toBeNull()
    expect(result!.fullName).toBe('Ana Costa')
    expect(result!.tier).toBe('express')
  })

  it('returns null for a non-existent order ID', async () => {
    const result = await getOrderBasicInfo(crypto.randomUUID())

    expect(result).toBeNull()
  })
})
