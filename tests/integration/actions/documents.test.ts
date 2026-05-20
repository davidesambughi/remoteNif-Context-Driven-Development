import { describe, it, expect, vi, beforeEach } from 'vitest'
import { uploadDocument, reviewDocument } from '@/app/actions/documents'
import { db } from '@/lib/db'
import { documents, orders } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { truncateAll } from '../setup'
import { insertTestUser, insertTestOrder, insertTestDocument } from '../fixtures'

// ---------------------------------------------------------------------------
// Mocks — only external services that require network calls
// ---------------------------------------------------------------------------

vi.mock('@/lib/auth/session', () => ({
  requireAuth: vi.fn(),
}))

// Storage path only — no real file upload needed
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/ai/document-review', () => ({
  reviewDocumentWithAI: vi.fn(),
}))

vi.mock('@/lib/email/send', () => ({
  sendEmail: vi.fn(),
}))

// getOrderBasicInfo is mocked in the reviewDocument test to avoid the extra join
vi.mock('@/lib/db/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db/queries')>()
  return {
    ...actual,
    getOrderBasicInfo: vi.fn(),
  }
})

vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    ADMIN_EMAIL: 'admin@example.com',
  },
}))

import * as session from '@/lib/auth/session'
import * as supabaseAdmin from '@/lib/supabase/admin'
import * as ai from '@/lib/ai/document-review'
import * as emailSend from '@/lib/email/send'
import * as queries from '@/lib/db/queries'

beforeEach(truncateAll)

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(emailSend.sendEmail).mockResolvedValue(undefined)
  vi.mocked(supabaseAdmin.createAdminClient).mockReturnValue({
    storage: {
      from: vi.fn().mockReturnValue({
        createSignedUploadUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: 'https://storage.example.com/signed', token: 'tok' },
          error: null,
        }),
      }),
    },
  // The Supabase client interface is huge — cast via unknown to avoid typing the full shape
  } as unknown as ReturnType<typeof supabaseAdmin.createAdminClient>)
})

// ---------------------------------------------------------------------------
// uploadDocument — happy path and supersede correctness
// ---------------------------------------------------------------------------

describe('uploadDocument', () => {
  it('creates a document row with aiReviewStatus pending and approved false', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id)
    vi.mocked(session.requireAuth).mockResolvedValue(user as Awaited<ReturnType<typeof session.requireAuth>>)

    const result = await uploadDocument({
      orderId: order.id,
      type: 'passport',
      filePath: `${user.id}/${order.id}/passport.pdf`,
      fileName: 'passport.pdf',
      fileSize: 204800,
      mimeType: 'application/pdf',
    })

    expect(result.success).toBe(true)

    const [doc] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, (result as { success: true; data: { documentId: string } }).data.documentId))

    expect(doc!.aiReviewStatus).toBe('pending')
    expect(doc!.approved).toBe(false)
    expect(doc!.supersededAt).toBeNull()
  })

  it('supersede correctness — old record gets supersededAt, new record has supersededAt null', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id)
    vi.mocked(session.requireAuth).mockResolvedValue(user as Awaited<ReturnType<typeof session.requireAuth>>)

    // Seed an existing passport document
    const oldDoc = await insertTestDocument(order.id, user.id, { type: 'passport' })
    expect(oldDoc.supersededAt).toBeNull()

    // Upload a replacement
    const result = await uploadDocument({
      orderId: order.id,
      type: 'passport',
      filePath: `${user.id}/${order.id}/passport-v2.pdf`,
      fileName: 'passport-v2.pdf',
      fileSize: 204800,
      mimeType: 'application/pdf',
    })

    expect(result.success).toBe(true)

    // Old record must now be superseded
    const [old] = await db.select().from(documents).where(eq(documents.id, oldDoc.id))
    expect(old!.supersededAt).toBeInstanceOf(Date)

    // New record must not be superseded
    const newDocId = (result as { success: true; data: { documentId: string } }).data.documentId
    const [newDoc] = await db.select().from(documents).where(eq(documents.id, newDocId))
    expect(newDoc!.supersededAt).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// reviewDocument — all-3-approved path (full multi-step DB write chain)
// ---------------------------------------------------------------------------

describe('reviewDocument — all-approved path', () => {
  it('approves the document, transitions the order status, and sets documentsSubmittedAt', async () => {
    const user = await insertTestUser()
    const order = await insertTestOrder(user.id, { status: 'documents_pending' })

    // Two already-approved docs
    await insertTestDocument(order.id, user.id, {
      type: 'passport',
      approved: true,
      aiReviewStatus: 'clear',
      approvedAt: new Date(),
    })
    await insertTestDocument(order.id, user.id, {
      type: 'proof_of_address',
      approved: true,
      aiReviewStatus: 'clear',
      approvedAt: new Date(),
    })

    // The third doc — to be reviewed now
    const signedPoa = await insertTestDocument(order.id, user.id, {
      type: 'signed_poa',
      approved: false,
      aiReviewStatus: 'pending',
    })

    vi.mocked(session.requireAuth).mockResolvedValue(user as Awaited<ReturnType<typeof session.requireAuth>>)
    vi.mocked(ai.reviewDocumentWithAI).mockResolvedValue({ status: 'clear' })
    vi.mocked(queries.getOrderBasicInfo).mockResolvedValue({ fullName: 'Test User', tier: 'standard' })

    await reviewDocument(signedPoa.id)

    // 1. The reviewed document must now be approved
    const [updatedDoc] = await db.select().from(documents).where(eq(documents.id, signedPoa.id))
    expect(updatedDoc!.approved).toBe(true)
    expect(updatedDoc!.approvedAt).toBeInstanceOf(Date)

    // 2. The order must have transitioned to documents_under_review
    const [updatedOrder] = await db.select().from(orders).where(eq(orders.id, order.id))
    expect(updatedOrder!.status).toBe('documents_under_review')

    // 3. The admin SLA clock must have started
    expect(updatedOrder!.documentsSubmittedAt).toBeInstanceOf(Date)
  })
})
