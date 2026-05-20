import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createUploadSignedUrl,
  uploadDocument,
  reviewDocument,
} from '@/app/actions/documents'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/auth/session', () => ({
  requireAuth: vi.fn(),
}))

vi.mock('@/lib/db/queries', () => ({
  getOrderForUser: vi.fn(),
  createDocumentRecord: vi.fn(),
  supersedePreviousDocuments: vi.fn(),
  getDocumentByIdForUser: vi.fn(),
  getActiveDocumentsForOrder: vi.fn(),
  updateDocumentAiReview: vi.fn(),
  markOrderDocumentsUnderReview: vi.fn(),
  getOrderBasicInfo: vi.fn(),
}))

vi.mock('@/lib/ai/document-review', () => ({
  reviewDocumentWithAI: vi.fn(),
}))

vi.mock('@/lib/email/send', () => ({
  sendEmail: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    ADMIN_EMAIL: 'admin@example.com',
  },
}))

import * as session from '@/lib/auth/session'
import * as queries from '@/lib/db/queries'
import * as ai from '@/lib/ai/document-review'
import * as emailSend from '@/lib/email/send'
import * as supabaseAdmin from '@/lib/supabase/admin'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER = { id: 'c3d4e5f6-a1b2-4c3d-ae4e-5f6a7b8c9d0e' }
const VALID_ORDER_ID = 'b2c3d4e5-f6a1-4b2c-9d3e-4f5a6b7c8d9e'
const VALID_DOC_ID = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d'

function makeOrder(overrides: Record<string, unknown> = {}) {
  return { id: VALID_ORDER_ID, userId: USER.id, tier: 'standard' as const, status: 'documents_pending' as const, ...overrides }
}

function makeDoc(overrides: Record<string, unknown> = {}) {
  return {
    id: VALID_DOC_ID,
    orderId: VALID_ORDER_ID,
    userId: USER.id,
    type: 'passport' as const,
    filePath: 'user/order/passport.pdf',
    mimeType: 'application/pdf',
    aiReviewAttempts: 0,
    aiReviewStatus: 'pending' as const,
    approved: false,
    supersededAt: null,
    ...overrides,
  }
}

// Configures the Supabase storage chain mock for createUploadSignedUrl tests
function mockStorage(result: { data: { signedUrl: string; token: string } | null; error: unknown }) {
  vi.mocked(supabaseAdmin.createAdminClient).mockReturnValue({
    storage: {
      from: vi.fn().mockReturnValue({
        createSignedUploadUrl: vi.fn().mockResolvedValue(result),
      }),
    },
  } as any) // as any: not worth typing the full Supabase client shape in tests
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(session.requireAuth).mockResolvedValue(USER as any)
  vi.mocked(emailSend.sendEmail).mockResolvedValue(undefined)
  vi.mocked(queries.supersedePreviousDocuments).mockResolvedValue(undefined)
  vi.mocked(queries.updateDocumentAiReview).mockResolvedValue(undefined)
  vi.mocked(queries.markOrderDocumentsUnderReview).mockResolvedValue(undefined)
})

// ---------------------------------------------------------------------------
// createUploadSignedUrl
// ---------------------------------------------------------------------------

describe('createUploadSignedUrl', () => {
  const VALID_INPUT = {
    orderId: VALID_ORDER_ID,
    fileName: 'passport.pdf',
    contentType: 'application/pdf' as const,
  }

  it('returns error when the order does not belong to the authenticated user', async () => {
    vi.mocked(queries.getOrderForUser).mockResolvedValue(null)

    const result = await createUploadSignedUrl(VALID_INPUT)

    expect(result).toEqual({ success: false, error: 'Order not found' })
    expect(supabaseAdmin.createAdminClient).not.toHaveBeenCalled()
  })

  it('returns signed URL and token on success', async () => {
    vi.mocked(queries.getOrderForUser).mockResolvedValue(makeOrder() as any)
    mockStorage({ data: { signedUrl: 'https://storage.example.com/signed', token: 'tok-abc' }, error: null })

    const result = await createUploadSignedUrl(VALID_INPUT)

    expect(result.success).toBe(true)
    // Narrow the discriminated union before accessing the data branch
    if (!result.success) throw new Error('Expected success')
    expect(result.data.signedUrl).toBe('https://storage.example.com/signed')
    expect(result.data.token).toBe('tok-abc')
  })

  it('returns error when Supabase storage fails', async () => {
    vi.mocked(queries.getOrderForUser).mockResolvedValue(makeOrder() as any)
    mockStorage({ data: null, error: { message: 'storage unavailable' } })

    const result = await createUploadSignedUrl(VALID_INPUT)

    expect(result).toEqual({ success: false, error: 'Failed to create upload URL' })
  })
})

// ---------------------------------------------------------------------------
// uploadDocument
// ---------------------------------------------------------------------------

describe('uploadDocument', () => {
  const VALID_INPUT = {
    orderId: VALID_ORDER_ID,
    type: 'passport' as const,
    filePath: 'user/order/timestamp-passport.pdf',
    fileName: 'passport.pdf',
    fileSize: 204800,
    mimeType: 'application/pdf' as const,
  }

  it('returns error when the order does not belong to the authenticated user', async () => {
    vi.mocked(queries.getOrderForUser).mockResolvedValue(null)

    const result = await uploadDocument(VALID_INPUT)

    expect(result).toEqual({ success: false, error: 'Order not found' })
    expect(queries.supersedePreviousDocuments).not.toHaveBeenCalled()
    expect(queries.createDocumentRecord).not.toHaveBeenCalled()
  })

  it('supersedes previous document of same type and creates a new record', async () => {
    vi.mocked(queries.getOrderForUser).mockResolvedValue(makeOrder() as any)
    vi.mocked(queries.createDocumentRecord).mockResolvedValue({ id: 'new-doc-id' } as any)

    const result = await uploadDocument(VALID_INPUT)

    expect(result).toEqual({ success: true, data: { documentId: 'new-doc-id' } })
    expect(queries.supersedePreviousDocuments).toHaveBeenCalledWith(VALID_ORDER_ID, 'passport')
    expect(queries.createDocumentRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: VALID_ORDER_ID,
        type: 'passport',
        aiReviewStatus: 'pending',
        approved: false,
      }),
    )
  })

  it('creates signed_poa with aiReviewStatus pending (AI review triggered by client separately)', async () => {
    vi.mocked(queries.getOrderForUser).mockResolvedValue(makeOrder() as any)
    vi.mocked(queries.createDocumentRecord).mockResolvedValue({ id: 'poa-doc-id' } as any)

    await uploadDocument({ ...VALID_INPUT, type: 'signed_poa' })

    expect(queries.createDocumentRecord).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'signed_poa', aiReviewStatus: 'pending', approved: false }),
    )
  })
})

// ---------------------------------------------------------------------------
// reviewDocument — 5 branches
// ---------------------------------------------------------------------------

describe('reviewDocument', () => {
  it('returns error when document is not found or not owned by the user', async () => {
    vi.mocked(queries.getDocumentByIdForUser).mockResolvedValue(null)

    const result = await reviewDocument(VALID_DOC_ID)

    expect(result).toEqual({ success: false, error: 'Document not found' })
    expect(ai.reviewDocumentWithAI).not.toHaveBeenCalled()
  })

  describe('Branch A — AI error → manual_review, attempts NOT incremented', () => {
    it('transitions to manual_review and notifies admin', async () => {
      vi.mocked(queries.getDocumentByIdForUser).mockResolvedValue(makeDoc({ aiReviewAttempts: 0 }) as any)
      vi.mocked(ai.reviewDocumentWithAI).mockResolvedValue({ status: 'error' })
      vi.mocked(queries.getOrderBasicInfo).mockResolvedValue({ fullName: 'João Silva', tier: 'standard' })

      const result = await reviewDocument(VALID_DOC_ID)

      expect(result).toEqual({ success: true, data: { aiReviewStatus: 'manual_review', aiReviewReason: null } })
      // attempts must stay at 0 — the AI failed, not the document
      expect(queries.updateDocumentAiReview).toHaveBeenCalledWith(
        VALID_DOC_ID,
        expect.objectContaining({ aiReviewStatus: 'manual_review', aiReviewAttempts: 0 }),
      )
      expect(emailSend.sendEmail).toHaveBeenCalledWith(
        'admin@example.com',
        'en',
        expect.objectContaining({ template: 'admin_document_escalated', escalationReason: 'AI review failed' }),
      )
    })
  })

  describe('Branch B — AI clear, fewer than 3 docs approved → order stays unchanged', () => {
    it('approves the document but does not transition the order', async () => {
      vi.mocked(queries.getDocumentByIdForUser).mockResolvedValue(makeDoc() as any)
      vi.mocked(ai.reviewDocumentWithAI).mockResolvedValue({ status: 'clear' })
      // Only 2 active docs — allThreeApproved will be false
      vi.mocked(queries.getActiveDocumentsForOrder).mockResolvedValue([
        { approved: true } as any,
        { approved: false } as any,
      ])

      const result = await reviewDocument(VALID_DOC_ID)

      expect(result).toEqual({ success: true, data: { aiReviewStatus: 'clear', aiReviewReason: null } })
      expect(queries.updateDocumentAiReview).toHaveBeenCalledWith(
        VALID_DOC_ID,
        expect.objectContaining({ aiReviewStatus: 'clear', approved: true }),
      )
      expect(queries.markOrderDocumentsUnderReview).not.toHaveBeenCalled()
      expect(emailSend.sendEmail).not.toHaveBeenCalled()
    })
  })

  describe('Branch C — AI clear, all 3 docs approved → order transitions', () => {
    it('approves the document, transitions the order, and notifies admin', async () => {
      vi.mocked(queries.getDocumentByIdForUser).mockResolvedValue(makeDoc() as any)
      vi.mocked(ai.reviewDocumentWithAI).mockResolvedValue({ status: 'clear' })
      vi.mocked(queries.getActiveDocumentsForOrder).mockResolvedValue([
        { approved: true } as any,
        { approved: true } as any,
        { approved: true } as any,
      ])
      vi.mocked(queries.getOrderBasicInfo).mockResolvedValue({ fullName: 'Maria Santos', tier: 'express' })

      const result = await reviewDocument(VALID_DOC_ID)

      expect(result).toEqual({ success: true, data: { aiReviewStatus: 'clear', aiReviewReason: null } })
      expect(queries.markOrderDocumentsUnderReview).toHaveBeenCalledWith(VALID_ORDER_ID)
      expect(emailSend.sendEmail).toHaveBeenCalledWith(
        'admin@example.com',
        'en',
        expect.objectContaining({ template: 'admin_order_ready', orderId: VALID_ORDER_ID }),
      )
    })
  })

  describe('Branch D — AI flagged, first attempt (attempts = 0) → store flag, no escalation', () => {
    it('stores flagged status with the reason key and increments attempts to 1', async () => {
      vi.mocked(queries.getDocumentByIdForUser).mockResolvedValue(makeDoc({ aiReviewAttempts: 0 }) as any)
      vi.mocked(ai.reviewDocumentWithAI).mockResolvedValue({ status: 'flagged', reasonKey: 'passport_blurry' })

      const result = await reviewDocument(VALID_DOC_ID)

      expect(result).toEqual({
        success: true,
        data: { aiReviewStatus: 'flagged', aiReviewReason: 'passport_blurry' },
      })
      expect(queries.updateDocumentAiReview).toHaveBeenCalledWith(
        VALID_DOC_ID,
        expect.objectContaining({ aiReviewStatus: 'flagged', aiReviewAttempts: 1, approved: false }),
      )
      expect(emailSend.sendEmail).not.toHaveBeenCalled()
    })
  })

  describe('Branch E — AI flagged, second attempt (attempts = 1) → escalate to manual_review', () => {
    it('transitions to manual_review and notifies admin with the flag reason', async () => {
      vi.mocked(queries.getDocumentByIdForUser).mockResolvedValue(makeDoc({ aiReviewAttempts: 1 }) as any)
      vi.mocked(ai.reviewDocumentWithAI).mockResolvedValue({ status: 'flagged', reasonKey: 'passport_expired' })
      vi.mocked(queries.getOrderBasicInfo).mockResolvedValue({ fullName: 'Ana Costa', tier: 'standard' })

      const result = await reviewDocument(VALID_DOC_ID)

      expect(result).toEqual({ success: true, data: { aiReviewStatus: 'manual_review', aiReviewReason: null } })
      expect(queries.updateDocumentAiReview).toHaveBeenCalledWith(
        VALID_DOC_ID,
        expect.objectContaining({ aiReviewStatus: 'manual_review', aiReviewAttempts: 2 }),
      )
      expect(emailSend.sendEmail).toHaveBeenCalledWith(
        'admin@example.com',
        'en',
        expect.objectContaining({
          template: 'admin_document_escalated',
          escalationReason: 'passport_expired',
        }),
      )
    })
  })
})
