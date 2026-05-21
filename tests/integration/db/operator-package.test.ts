/**
 * Integration tests for getOperatorPackageData (lib/db/queries.ts)
 *
 * Uses a real Postgres database (test instance via Docker) to verify that the
 * query correctly gates on order status, document completeness, and personal details.
 * Run with: npx vitest run --config vitest.integration.config.ts
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { getOperatorPackageData } from '@/lib/db/queries'
import { truncateAll } from '../setup'
import { insertTestUser, insertTestOrder, insertTestDocument } from '../fixtures'

beforeEach(truncateAll)

// ---------------------------------------------------------------------------
// Complete personal details used across multiple tests
// ---------------------------------------------------------------------------

const PERSONAL_DETAILS = {
  fullName: 'Jane Doe',
  dateOfBirth: '1990-05-15',
  nationality: 'US',
  passportNumber: 'AB123456',
  passportExpiry: '2030-05-14',
  address: '123 Main Street, New York, NY 10001',
}

/** Inserts a complete set of 3 approved active documents for an order. */
async function insertApprovedDocuments(orderId: string, userId: string) {
  await insertTestDocument(orderId, userId, {
    type: 'passport',
    filePath: `orders/${orderId}/passport.pdf`,
    mimeType: 'application/pdf',
    approved: true,
    supersededAt: null,
  })
  await insertTestDocument(orderId, userId, {
    type: 'proof_of_address',
    filePath: `orders/${orderId}/proof.pdf`,
    mimeType: 'application/pdf',
    approved: true,
    supersededAt: null,
  })
  await insertTestDocument(orderId, userId, {
    type: 'signed_poa',
    filePath: `orders/${orderId}/poa.pdf`,
    mimeType: 'application/pdf',
    approved: true,
    supersededAt: null,
  })
}

// ---------------------------------------------------------------------------
// Null cases — every condition that should return null
// ---------------------------------------------------------------------------

describe('getOperatorPackageData — returns null', () => {
  it('returns null for a non-existent order ID', async () => {
    const result = await getOperatorPackageData(crypto.randomUUID())
    expect(result).toBeNull()
  })

  it('returns null when order status is documents_pending', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      status: 'documents_pending',
      ...PERSONAL_DETAILS,
    })
    await insertApprovedDocuments(order.id, user.id)

    const result = await getOperatorPackageData(order.id)
    expect(result).toBeNull()
  })

  it('returns null when order status is documents_under_review', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      status: 'documents_under_review',
      ...PERSONAL_DETAILS,
    })
    await insertApprovedDocuments(order.id, user.id)

    const result = await getOperatorPackageData(order.id)
    expect(result).toBeNull()
  })

  it('returns null when order status is submitted', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      status: 'submitted',
      ...PERSONAL_DETAILS,
    })
    await insertApprovedDocuments(order.id, user.id)

    const result = await getOperatorPackageData(order.id)
    expect(result).toBeNull()
  })

  it('returns null when order status is delivered', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      status: 'delivered',
      ...PERSONAL_DETAILS,
    })
    await insertApprovedDocuments(order.id, user.id)

    const result = await getOperatorPackageData(order.id)
    expect(result).toBeNull()
  })

  it('returns null when fullName is missing', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      status: 'documents_approved',
      ...PERSONAL_DETAILS,
      fullName: null,
    })
    await insertApprovedDocuments(order.id, user.id)

    const result = await getOperatorPackageData(order.id)
    expect(result).toBeNull()
  })

  it('returns null when dateOfBirth is missing', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      status: 'documents_approved',
      ...PERSONAL_DETAILS,
      dateOfBirth: null,
    })
    await insertApprovedDocuments(order.id, user.id)

    const result = await getOperatorPackageData(order.id)
    expect(result).toBeNull()
  })

  it('returns null when passportNumber is missing', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      status: 'documents_approved',
      ...PERSONAL_DETAILS,
      passportNumber: null,
    })
    await insertApprovedDocuments(order.id, user.id)

    const result = await getOperatorPackageData(order.id)
    expect(result).toBeNull()
  })

  it('returns null when no documents have been uploaded', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      status: 'documents_approved',
      ...PERSONAL_DETAILS,
    })
    // No documents inserted

    const result = await getOperatorPackageData(order.id)
    expect(result).toBeNull()
  })

  it('returns null when only 2 of 3 documents are present', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      status: 'documents_approved',
      ...PERSONAL_DETAILS,
    })
    // Only passport + proof_of_address — no signed_poa
    await insertTestDocument(order.id, user.id, {
      type: 'passport',
      approved: true,
      supersededAt: null,
    })
    await insertTestDocument(order.id, user.id, {
      type: 'proof_of_address',
      approved: true,
      supersededAt: null,
    })

    const result = await getOperatorPackageData(order.id)
    expect(result).toBeNull()
  })

  it('returns null when a document is superseded (not the active record)', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      status: 'documents_approved',
      ...PERSONAL_DETAILS,
    })

    // Insert passport as superseded (old upload), plus the other 2 active + approved
    await insertTestDocument(order.id, user.id, {
      type: 'passport',
      approved: true,
      supersededAt: new Date(), // superseded → not active
    })
    await insertTestDocument(order.id, user.id, {
      type: 'proof_of_address',
      approved: true,
      supersededAt: null,
    })
    await insertTestDocument(order.id, user.id, {
      type: 'signed_poa',
      approved: true,
      supersededAt: null,
    })

    // Only 2 active docs → null
    const result = await getOperatorPackageData(order.id)
    expect(result).toBeNull()
  })

  it('returns null when a document is present but not yet approved', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      status: 'documents_approved',
      ...PERSONAL_DETAILS,
    })

    // Passport is unapproved — still under AI review
    await insertTestDocument(order.id, user.id, {
      type: 'passport',
      approved: false,  // not approved
      supersededAt: null,
    })
    await insertTestDocument(order.id, user.id, {
      type: 'proof_of_address',
      approved: true,
      supersededAt: null,
    })
    await insertTestDocument(order.id, user.id, {
      type: 'signed_poa',
      approved: true,
      supersededAt: null,
    })

    // Only 2 approved docs → null
    const result = await getOperatorPackageData(order.id)
    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Success case — all conditions met
// ---------------------------------------------------------------------------

describe('getOperatorPackageData — success', () => {
  it('returns OperatorPackageData when all conditions are met', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      status: 'documents_approved',
      ...PERSONAL_DETAILS,
    })
    await insertApprovedDocuments(order.id, user.id)

    const result = await getOperatorPackageData(order.id)
    expect(result).not.toBeNull()
  })

  it('returns the correct order shape with all required fields', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      status: 'documents_approved',
      ...PERSONAL_DETAILS,
    })
    await insertApprovedDocuments(order.id, user.id)

    const result = await getOperatorPackageData(order.id)

    expect(result!.order).toMatchObject({
      id: order.id,
      tier: order.tier,
      fullName: PERSONAL_DETAILS.fullName,
      dateOfBirth: PERSONAL_DETAILS.dateOfBirth,
      nationality: PERSONAL_DETAILS.nationality,
      passportNumber: PERSONAL_DETAILS.passportNumber,
      passportExpiry: PERSONAL_DETAILS.passportExpiry,
      address: PERSONAL_DETAILS.address,
    })
  })

  it('returns exactly 3 documents', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      status: 'documents_approved',
      ...PERSONAL_DETAILS,
    })
    await insertApprovedDocuments(order.id, user.id)

    const result = await getOperatorPackageData(order.id)
    expect(result!.documents).toHaveLength(3)
  })

  it('returns documents with the correct types', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      status: 'documents_approved',
      ...PERSONAL_DETAILS,
    })
    await insertApprovedDocuments(order.id, user.id)

    const result = await getOperatorPackageData(order.id)
    const types = result!.documents.map((d) => d.type).sort()
    expect(types).toEqual(['passport', 'proof_of_address', 'signed_poa'])
  })

  it('does not include superseded documents in the result', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      status: 'documents_approved',
      ...PERSONAL_DETAILS,
    })

    // Old passport (superseded) — should not appear
    await insertTestDocument(order.id, user.id, {
      type: 'passport',
      filePath: 'orders/old-passport.pdf',
      approved: true,
      supersededAt: new Date(),
    })
    // Replacement passport (active)
    await insertTestDocument(order.id, user.id, {
      type: 'passport',
      filePath: `orders/${order.id}/passport.pdf`,
      approved: true,
      supersededAt: null,
    })
    await insertTestDocument(order.id, user.id, {
      type: 'proof_of_address',
      filePath: `orders/${order.id}/proof.pdf`,
      approved: true,
      supersededAt: null,
    })
    await insertTestDocument(order.id, user.id, {
      type: 'signed_poa',
      filePath: `orders/${order.id}/poa.pdf`,
      approved: true,
      supersededAt: null,
    })

    const result = await getOperatorPackageData(order.id)
    expect(result).not.toBeNull()
    expect(result!.documents).toHaveLength(3)

    const paths = result!.documents.map((d) => d.filePath)
    expect(paths).not.toContain('orders/old-passport.pdf')
  })

  it('returns filePath and mimeType for each document', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, {
      status: 'documents_approved',
      ...PERSONAL_DETAILS,
    })
    await insertApprovedDocuments(order.id, user.id)

    const result = await getOperatorPackageData(order.id)

    for (const doc of result!.documents) {
      expect(typeof doc.filePath).toBe('string')
      expect(doc.filePath.length).toBeGreaterThan(0)
      expect(typeof doc.mimeType).toBe('string')
      expect(doc.mimeType.length).toBeGreaterThan(0)
    }
  })
})
