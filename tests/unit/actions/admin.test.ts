import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  adminApproveDocument,
  adminFlagDocument,
  adminApproveOrder,
  adminUpdateOrderStatus,
  adminResendEmail,
} from '@/app/actions/admin'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/db/queries', () => ({
  getAdminOrderDetail: vi.fn(),
  getOperatorUsers: vi.fn(),
  adminSetDocumentApproved: vi.fn(),
  adminSetDocumentFlagged: vi.fn(),
  adminTransitionOrderToApproved: vi.fn(),
  adminUpdateOrderStatusQuery: vi.fn(),
  insertAuditLog: vi.fn(),
  insertOperatorNotification: vi.fn(),
}))

vi.mock('@/lib/auth/session', () => ({
  requireRole: vi.fn(),
}))

vi.mock('@/lib/email/send', () => ({
  sendEmail: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import * as queries from '@/lib/db/queries'
import * as session from '@/lib/auth/session'
import * as emailSend from '@/lib/email/send'

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

// RFC 4122 v4 UUIDs: 3rd group starts with 4, 4th group first nibble is 8–b
const ADMIN = { id: 'c3d4e5f6-a1b2-4c3d-ae4e-5f6a7b8c9d0e', role: 'admin' as const }
const VALID_DOC_ID = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d'
const VALID_ORDER_ID = 'b2c3d4e5-f6a1-4b2c-9d3e-4f5a6b7c8d9e'

function makeOrder(overrides: Partial<ReturnType<typeof baseOrder>> = {}) {
  return { ...baseOrder(), ...overrides }
}

function baseOrder() {
  return {
    id: VALID_ORDER_ID,
    tier: 'standard' as const,
    status: 'documents_under_review' as const,
    fullName: 'João Silva',
    dateOfBirth: null,
    nationality: null,
    passportNumber: null,
    passportExpiry: null,
    address: null,
    createdAt: new Date(),
    documentsApprovedAt: null,
    customerEmail: 'joao@example.com',
    customerId: 'user-uuid-1',
    customerLanguage: 'en' as const,
    paymentAmountCents: 12900,
    paymentStatus: 'succeeded',
    documents: [
      { id: 'doc-1', type: 'passport' as const, approved: true, filePath: 'p.pdf', fileName: 'p.pdf', fileSize: 100, mimeType: 'application/pdf', aiReviewStatus: 'clear' as const, aiReviewReason: null, aiReviewAttempts: 1, adminOverride: false, adminOverrideBy: null, adminOverrideReason: null, adminOverrideAt: null, approvedAt: new Date(), createdAt: new Date() },
      { id: 'doc-2', type: 'proof_of_address' as const, approved: true, filePath: 'a.pdf', fileName: 'a.pdf', fileSize: 100, mimeType: 'application/pdf', aiReviewStatus: 'clear' as const, aiReviewReason: null, aiReviewAttempts: 1, adminOverride: false, adminOverrideBy: null, adminOverrideReason: null, adminOverrideAt: null, approvedAt: new Date(), createdAt: new Date() },
      { id: 'doc-3', type: 'signed_poa' as const, approved: true, filePath: 's.pdf', fileName: 's.pdf', fileSize: 100, mimeType: 'application/pdf', aiReviewStatus: null, aiReviewReason: null, aiReviewAttempts: 0, adminOverride: false, adminOverrideBy: null, adminOverrideReason: null, adminOverrideAt: null, approvedAt: new Date(), createdAt: new Date() },
    ],
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(session.requireRole).mockResolvedValue(ADMIN as any)
  vi.mocked(queries.insertAuditLog).mockResolvedValue(undefined)
  vi.mocked(queries.insertOperatorNotification).mockResolvedValue(undefined)
  vi.mocked(emailSend.sendEmail).mockResolvedValue(undefined)
})

// ---------------------------------------------------------------------------
// adminApproveDocument
// ---------------------------------------------------------------------------

describe('adminApproveDocument', () => {
  it('returns invalid_id for a non-UUID string', async () => {
    const result = await adminApproveDocument('not-a-uuid')
    expect(result).toEqual({ success: false, error: 'invalid_id' })
    expect(queries.adminSetDocumentApproved).not.toHaveBeenCalled()
  })

  it('calls adminSetDocumentApproved with doc id and admin id', async () => {
    vi.mocked(queries.adminSetDocumentApproved).mockResolvedValue(undefined)

    const result = await adminApproveDocument(VALID_DOC_ID)

    expect(result).toEqual({ success: true })
    expect(queries.adminSetDocumentApproved).toHaveBeenCalledWith(VALID_DOC_ID, ADMIN.id)
  })

  it('writes an audit log entry on success', async () => {
    vi.mocked(queries.adminSetDocumentApproved).mockResolvedValue(undefined)

    await adminApproveDocument(VALID_DOC_ID)

    expect(queries.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: ADMIN.id,
        action: 'document.admin_approved',
        details: expect.objectContaining({ documentId: VALID_DOC_ID }),
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// adminFlagDocument
// ---------------------------------------------------------------------------

describe('adminFlagDocument', () => {
  it('returns a validation error when reason is fewer than 10 characters', async () => {
    const result = await adminFlagDocument(VALID_DOC_ID, 'too short')
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/10/)
  })

  it('returns a validation error when reason exceeds 500 characters', async () => {
    const result = await adminFlagDocument(VALID_DOC_ID, 'x'.repeat(501))
    expect(result.success).toBe(false)
  })

  it('calls adminSetDocumentFlagged with the correct arguments', async () => {
    vi.mocked(queries.adminSetDocumentFlagged).mockResolvedValue(undefined)
    const reason = 'Passport photo is too blurry to read clearly'

    const result = await adminFlagDocument(VALID_DOC_ID, reason)

    expect(result).toEqual({ success: true })
    expect(queries.adminSetDocumentFlagged).toHaveBeenCalledWith(VALID_DOC_ID, ADMIN.id, reason)
  })

  it('writes an audit log entry with the flag reason', async () => {
    vi.mocked(queries.adminSetDocumentFlagged).mockResolvedValue(undefined)
    const reason = 'Document appears to be expired as of this year'

    await adminFlagDocument(VALID_DOC_ID, reason)

    expect(queries.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'document.admin_flagged',
        details: expect.objectContaining({ reason }),
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// adminApproveOrder
// ---------------------------------------------------------------------------

describe('adminApproveOrder', () => {
  it('returns order_not_found when the order does not exist', async () => {
    vi.mocked(queries.getAdminOrderDetail).mockResolvedValue(null)

    const result = await adminApproveOrder(VALID_ORDER_ID)
    expect(result).toEqual({ success: false, error: 'order_not_found' })
  })

  it('returns invalid_status when order is not documents_under_review', async () => {
    vi.mocked(queries.getAdminOrderDetail).mockResolvedValue(
      makeOrder({ status: 'documents_pending' }),
    )

    const result = await adminApproveOrder(VALID_ORDER_ID)
    expect(result).toEqual({ success: false, error: 'invalid_status' })
  })

  it('returns not_all_approved when fewer than 3 documents are present', async () => {
    vi.mocked(queries.getAdminOrderDetail).mockResolvedValue(
      makeOrder({ documents: [baseOrder().documents[0]!] }),
    )

    const result = await adminApproveOrder(VALID_ORDER_ID)
    expect(result).toEqual({ success: false, error: 'not_all_approved' })
  })

  it('returns not_all_approved when at least one document is not approved', async () => {
    const docs = baseOrder().documents.map((d, i) =>
      i === 1 ? { ...d, approved: false } : d,
    )
    vi.mocked(queries.getAdminOrderDetail).mockResolvedValue(makeOrder({ documents: docs }))

    const result = await adminApproveOrder(VALID_ORDER_ID)
    expect(result).toEqual({ success: false, error: 'not_all_approved' })
  })

  it('transitions the order, creates operator notifications, and sends both emails on success', async () => {
    const operators = [
      { id: 'op-1', email: 'op1@example.com' },
      { id: 'op-2', email: 'op2@example.com' },
    ]
    vi.mocked(queries.getAdminOrderDetail).mockResolvedValue(makeOrder())
    vi.mocked(queries.getOperatorUsers).mockResolvedValue(operators)
    vi.mocked(queries.adminTransitionOrderToApproved).mockResolvedValue(undefined)

    const result = await adminApproveOrder(VALID_ORDER_ID)

    expect(result).toEqual({ success: true })
    expect(queries.adminTransitionOrderToApproved).toHaveBeenCalledWith(VALID_ORDER_ID)
    expect(queries.insertOperatorNotification).toHaveBeenCalledTimes(2)
    // Customer email
    expect(emailSend.sendEmail).toHaveBeenCalledWith(
      'joao@example.com',
      'en',
      expect.objectContaining({ template: 'documents_approved_customer' }),
    )
    // Operator emails — one per operator
    expect(emailSend.sendEmail).toHaveBeenCalledWith(
      'op1@example.com',
      'en',
      expect.objectContaining({ template: 'operator_submission_ready' }),
    )
  })

  it('includes the SLA note in the operator email for express orders', async () => {
    vi.mocked(queries.getAdminOrderDetail).mockResolvedValue(makeOrder({ tier: 'express' }))
    vi.mocked(queries.getOperatorUsers).mockResolvedValue([{ id: 'op-1', email: 'op1@example.com' }])
    vi.mocked(queries.adminTransitionOrderToApproved).mockResolvedValue(undefined)

    await adminApproveOrder(VALID_ORDER_ID)

    expect(emailSend.sendEmail).toHaveBeenCalledWith(
      'op1@example.com',
      'en',
      expect.objectContaining({
        template: 'operator_submission_ready',
        slaNote: expect.stringContaining('48h'),
      }),
    )
  })

  it('does not include an SLA note for non-express orders', async () => {
    vi.mocked(queries.getAdminOrderDetail).mockResolvedValue(makeOrder({ tier: 'standard' }))
    vi.mocked(queries.getOperatorUsers).mockResolvedValue([{ id: 'op-1', email: 'op1@example.com' }])
    vi.mocked(queries.adminTransitionOrderToApproved).mockResolvedValue(undefined)

    await adminApproveOrder(VALID_ORDER_ID)

    expect(emailSend.sendEmail).toHaveBeenCalledWith(
      'op1@example.com',
      'en',
      expect.objectContaining({ slaNote: undefined }),
    )
  })
})

// ---------------------------------------------------------------------------
// adminUpdateOrderStatus
// ---------------------------------------------------------------------------

describe('adminUpdateOrderStatus', () => {
  it('returns note_required_for_backward_move when moving backward without a note', async () => {
    vi.mocked(queries.getAdminOrderDetail).mockResolvedValue(makeOrder({ status: 'submitted' }))

    const result = await adminUpdateOrderStatus(VALID_ORDER_ID, 'documents_pending')
    expect(result).toEqual({ success: false, error: 'note_required_for_backward_move' })
    expect(queries.adminUpdateOrderStatusQuery).not.toHaveBeenCalled()
  })

  it('succeeds when moving backward with a note', async () => {
    vi.mocked(queries.getAdminOrderDetail).mockResolvedValue(makeOrder({ status: 'submitted' }))
    vi.mocked(queries.adminUpdateOrderStatusQuery).mockResolvedValue(undefined)

    const result = await adminUpdateOrderStatus(VALID_ORDER_ID, 'documents_pending', 'Issue found')
    expect(result).toEqual({ success: true })
  })

  it('succeeds when moving forward without a note', async () => {
    vi.mocked(queries.getAdminOrderDetail).mockResolvedValue(makeOrder())
    vi.mocked(queries.adminUpdateOrderStatusQuery).mockResolvedValue(undefined)

    const result = await adminUpdateOrderStatus(VALID_ORDER_ID, 'documents_approved')
    expect(result).toEqual({ success: true })
  })

  it('sets documentsApprovedAt when transitioning to documents_approved (and it is not already set)', async () => {
    vi.mocked(queries.getAdminOrderDetail).mockResolvedValue(
      makeOrder({ documentsApprovedAt: null }),
    )
    vi.mocked(queries.adminUpdateOrderStatusQuery).mockResolvedValue(undefined)

    await adminUpdateOrderStatus(VALID_ORDER_ID, 'documents_approved')

    expect(queries.adminUpdateOrderStatusQuery).toHaveBeenCalledWith(
      VALID_ORDER_ID,
      'documents_approved',
      expect.objectContaining({ documentsApprovedAt: expect.any(Date) }),
    )
  })

  it('does not overwrite documentsApprovedAt when it is already set', async () => {
    vi.mocked(queries.getAdminOrderDetail).mockResolvedValue(
      makeOrder({ documentsApprovedAt: new Date('2024-01-01') }),
    )
    vi.mocked(queries.adminUpdateOrderStatusQuery).mockResolvedValue(undefined)

    await adminUpdateOrderStatus(VALID_ORDER_ID, 'documents_approved')

    const callArgs = vi.mocked(queries.adminUpdateOrderStatusQuery).mock.calls[0]!
    const timestamps = callArgs[2]
    expect(timestamps).not.toHaveProperty('documentsApprovedAt')
  })

  it('writes an audit log entry with previous and new status', async () => {
    vi.mocked(queries.getAdminOrderDetail).mockResolvedValue(makeOrder({ status: 'documents_under_review' }))
    vi.mocked(queries.adminUpdateOrderStatusQuery).mockResolvedValue(undefined)

    await adminUpdateOrderStatus(VALID_ORDER_ID, 'submitted')

    expect(queries.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'order.status_updated',
        details: expect.objectContaining({
          previousStatus: 'documents_under_review',
          newStatus: 'submitted',
        }),
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// adminResendEmail
// ---------------------------------------------------------------------------

describe('adminResendEmail', () => {
  it('returns order_not_found when the order does not exist', async () => {
    vi.mocked(queries.getAdminOrderDetail).mockResolvedValue(null)

    const result = await adminResendEmail(VALID_ORDER_ID, 'order_confirmation')
    expect(result).toEqual({ success: false, error: 'order_not_found' })
  })

  it('sends the order_confirmation email with payment amount', async () => {
    vi.mocked(queries.getAdminOrderDetail).mockResolvedValue(makeOrder())

    const result = await adminResendEmail(VALID_ORDER_ID, 'order_confirmation')

    expect(result).toEqual({ success: true })
    expect(emailSend.sendEmail).toHaveBeenCalledWith(
      'joao@example.com',
      'en',
      expect.objectContaining({ template: 'order_confirmation', orderId: VALID_ORDER_ID }),
    )
  })

  it('sends the documents_approved_customer email with customer name and tier', async () => {
    vi.mocked(queries.getAdminOrderDetail).mockResolvedValue(makeOrder())

    const result = await adminResendEmail(VALID_ORDER_ID, 'documents_approved_customer')

    expect(result).toEqual({ success: true })
    expect(emailSend.sendEmail).toHaveBeenCalledWith(
      'joao@example.com',
      'en',
      expect.objectContaining({
        template: 'documents_approved_customer',
        customerName: 'João Silva',
        tier: 'standard',
      }),
    )
  })

  it('writes an audit log entry on success', async () => {
    vi.mocked(queries.getAdminOrderDetail).mockResolvedValue(makeOrder())

    await adminResendEmail(VALID_ORDER_ID, 'order_confirmation')

    expect(queries.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'email.resent',
        details: expect.objectContaining({ emailType: 'order_confirmation' }),
      }),
    )
  })
})
