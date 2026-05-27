import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/lib/db'
import { orders, documents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import {
  getAdminOrderDetail,
  adminSetDocumentApproved,
  adminSetDocumentFlagged,
  adminTransitionOrderToApproved,
  adminUpdateOrderStatusQuery,
} from '@/lib/db/queries'
import { truncateAll } from '../setup'
import {
  insertTestUser,
  insertTestOrder,
  insertTestDocument,
  insertTestPayment,
} from '../fixtures'

beforeEach(truncateAll)

// ---------------------------------------------------------------------------
// getAdminOrderDetail
// ---------------------------------------------------------------------------

describe('getAdminOrderDetail', () => {
  it('returns the complete composite object with user, payment, and documents', async () => {
    const user = await insertTestUser({ email: 'customer@example.com' })
    const order = await insertTestOrder(user.id, { tier: 'express', fullName: 'Ana Costa' })
    await insertTestPayment(order.id, user.id, { amount: 17900, status: 'succeeded' })
    
    // Active documents
    const doc1 = await insertTestDocument(order.id, user.id, { type: 'passport' })
    const doc2 = await insertTestDocument(order.id, user.id, { type: 'proof_of_address' })
    
    // Superseded document (should be excluded)
    await insertTestDocument(order.id, user.id, { 
      type: 'passport', 
      supersededAt: new Date() 
    })

    const result = await getAdminOrderDetail(order.id)

    expect(result).not.toBeNull()
    expect(result!.id).toBe(order.id)
    expect(result!.customerEmail).toBe('customer@example.com')
    expect(result!.fullName).toBe('Ana Costa')
    expect(result!.paymentAmountCents).toBe(17900)
    expect(result!.paymentStatus).toBe('succeeded')
    
    // Verify document filtering (active only)
    expect(result!.documents).toHaveLength(2)
    const docIds = result!.documents.map(d => d.id)
    expect(docIds).toContain(doc1.id)
    expect(docIds).toContain(doc2.id)
  })

  it('returns null for a non-existent order ID', async () => {
    const result = await getAdminOrderDetail(crypto.randomUUID())
    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// adminSetDocumentApproved
// ---------------------------------------------------------------------------

describe('adminSetDocumentApproved', () => {
  it('updates the document to approved with admin override fields', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id)
    const doc = await insertTestDocument(order.id, user.id)
    const admin = await insertTestUser({ email: 'admin@example.com', role: 'admin' })

    await adminSetDocumentApproved(doc.id, admin.id)

    const [updated] = await db.select().from(documents).where(eq(documents.id, doc.id))
    expect(updated!.approved).toBe(true)
    expect(updated!.approvedAt).toBeInstanceOf(Date)
    expect(updated!.adminOverride).toBe(true)
    expect(updated!.adminOverrideBy).toBe(admin.id)
    expect(updated!.adminOverrideAt).toBeInstanceOf(Date)
  })
})

// ---------------------------------------------------------------------------
// adminSetDocumentFlagged
// ---------------------------------------------------------------------------

describe('adminSetDocumentFlagged', () => {
  it('updates the document to not approved and records the reason', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id)
    const doc = await insertTestDocument(order.id, user.id, { approved: true }) // Start approved
    const admin = await insertTestUser({ email: 'admin@example.com', role: 'admin' })
    const reason = 'Passport is expired'

    await adminSetDocumentFlagged(doc.id, admin.id, reason)

    const [updated] = await db.select().from(documents).where(eq(documents.id, doc.id))
    expect(updated!.approved).toBe(false)
    expect(updated!.adminOverride).toBe(true)
    expect(updated!.adminOverrideBy).toBe(admin.id)
    expect(updated!.adminOverrideReason).toBe(reason)
    expect(updated!.adminOverrideAt).toBeInstanceOf(Date)
  })
})

// ---------------------------------------------------------------------------
// adminTransitionOrderToApproved
// ---------------------------------------------------------------------------

describe('adminTransitionOrderToApproved', () => {
  it('updates the status to documents_approved and sets the timestamp', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, { status: 'documents_under_review' })

    await adminTransitionOrderToApproved(order.id)

    const [updated] = await db.select().from(orders).where(eq(orders.id, order.id))
    expect(updated!.status).toBe('documents_approved')
    expect(updated!.documentsApprovedAt).toBeInstanceOf(Date)
  })
})

// ---------------------------------------------------------------------------
// adminUpdateOrderStatusQuery
// ---------------------------------------------------------------------------

describe('adminUpdateOrderStatusQuery', () => {
  it('updates the status and provided timestamps', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, { status: 'documents_approved' })
    const submittedAt = new Date()

    await adminUpdateOrderStatusQuery(order.id, 'submitted', {
      submittedToFinancasAt: submittedAt,
    })

    const [updated] = await db.select().from(orders).where(eq(orders.id, order.id))
    expect(updated!.status).toBe('submitted')
    expect(updated!.submittedToFinancasAt?.getTime()).toBe(submittedAt.getTime())
  })

  it('can set multiple timestamps at once', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, { status: 'submitted' })
    const deliveredAt = new Date()

    await adminUpdateOrderStatusQuery(order.id, 'delivered', {
      deliveredAt,
    })

    const [updated] = await db.select().from(orders).where(eq(orders.id, order.id))
    expect(updated!.status).toBe('delivered')
    expect(updated!.deliveredAt?.getTime()).toBe(deliveredAt.getTime())
  })
})
