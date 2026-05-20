'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/session'
import {
  getOrderForUser,
  createDocumentRecord,
  supersedePreviousDocuments,
  getDocumentByIdForUser,
  getActiveDocumentsForOrder,
  updateDocumentAiReview,
  markOrderDocumentsUnderReview,
  getOrderBasicInfo,
} from '@/lib/db/queries'
import {
  CreateUploadUrlSchema,
  UploadDocumentSchema,
  type CreateUploadUrlData,
  type UploadDocumentData,
} from '@/lib/validations/documents'
import { reviewDocumentWithAI } from '@/lib/ai/document-review'
import { sendEmail } from '@/lib/email/send'
import { env } from '@/lib/env'
import type { ActionResult } from '@/lib/types'

// Human-readable labels for document types used in admin notification emails
const DOCUMENT_TYPE_LABELS: Record<'passport' | 'proof_of_address' | 'signed_poa', string> = {
  passport: 'Passport',
  proof_of_address: 'Proof of address',
  signed_poa: 'Signed POA',
}

/**
 * Generates a short-lived signed upload URL so the browser can PUT a file
 * directly to Supabase Storage without routing it through the Next.js server.
 * Ownership of the order is verified before the URL is issued.
 */
export async function createUploadSignedUrl(
  input: CreateUploadUrlData,
): Promise<ActionResult<{ signedUrl: string; path: string; token: string }>> {
  const parsed = CreateUploadUrlSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const user = await requireAuth()

  const order = await getOrderForUser(parsed.data.orderId, user.id)
  if (!order) return { success: false, error: 'Order not found' }

  // Sanitise the filename to strip characters that Storage path-segments disallow.
  const safeName = parsed.data.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  // Prefix with timestamp to avoid collisions on re-upload.
  const path = `${user.id}/${parsed.data.orderId}/${Date.now()}-${safeName}`

  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUploadUrl(path)

  if (error || !data) {
    return { success: false, error: 'Failed to create upload URL' }
  }

  return { success: true, data: { signedUrl: data.signedUrl, path, token: data.token } }
}

/**
 * Registers a completed document upload in the database.
 * Called by the client after a successful PUT to the signed URL.
 * Soft-deletes any previous active document of the same type before inserting.
 *
 * signed_poa: accepted immediately (no AI review).
 * passport / proof_of_address: queued for AI review — client calls reviewDocument next.
 *
 * Returns the new document ID so the client can pass it to reviewDocument.
 */
export async function uploadDocument(
  input: UploadDocumentData,
): Promise<ActionResult<{ documentId: string }>> {
  const parsed = UploadDocumentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const user = await requireAuth()

  const order = await getOrderForUser(parsed.data.orderId, user.id)
  if (!order) return { success: false, error: 'Order not found' }

  const { orderId, type, filePath, fileName, fileSize, mimeType } = parsed.data
  // Soft-delete previous active upload of the same type (keeps audit trail).
  await supersedePreviousDocuments(orderId, type)

  const record = await createDocumentRecord({
    orderId,
    userId: user.id,
    type,
    filePath,
    fileName,
    fileSize,
    mimeType,
    // All document types go through AI review — none are auto-approved on upload.
    aiReviewStatus: 'pending',
    approved: false,
    approvedAt: null,
  })

  return { success: true, data: { documentId: record.id } }
}

/**
 * Runs AI review on an uploaded passport or proof_of_address document.
 * Called by the client immediately after uploadDocument succeeds for those types.
 *
 * Rules:
 * - Verifies ownership before touching anything.
 * - AI errors → manual_review immediately (not counted as a failed attempt) → admin notified.
 * - Flagged result on first attempt → status = flagged, attempts = 1.
 * - Flagged result on second attempt (attempts >= 2) → escalates to manual_review → admin notified.
 * - Clear result → approved = true, checks if all 3 docs approved → order status transitions → admin notified.
 */
export async function reviewDocument(
  documentId: string,
): Promise<ActionResult<{ aiReviewStatus: 'clear' | 'flagged' | 'manual_review'; aiReviewReason: string | null }>> {
  const user = await requireAuth()

  const doc = await getDocumentByIdForUser(documentId, user.id)
  if (!doc) return { success: false, error: 'Document not found' }

  const aiResult = await reviewDocumentWithAI(doc.filePath, doc.mimeType, doc.type)
  const now = new Date()
  const currentAttempts = doc.aiReviewAttempts

  // --- AI unavailable or unrecoverable error ---
  // Go directly to manual_review. Do NOT increment attempts — the AI failed, not the document.
  if (aiResult.status === 'error') {
    await updateDocumentAiReview(documentId, {
      aiReviewStatus: 'manual_review',
      aiReviewReason: null,
      aiReviewAttempts: currentAttempts,
      approved: false,
      approvedAt: null,
    })

    // Notify admin — manual intervention required (fire-and-forget)
    const orderInfo = await getOrderBasicInfo(doc.orderId)
    if (orderInfo) {
      await sendEmail(env.ADMIN_EMAIL, 'en', {
        template: 'admin_document_escalated',
        orderId: doc.orderId,
        customerName: orderInfo.fullName ?? 'Customer',
        documentType: DOCUMENT_TYPE_LABELS[doc.type],
        escalationReason: 'AI review failed',
      })
    }

    return { success: true, data: { aiReviewStatus: 'manual_review', aiReviewReason: null } }
  }

  // --- Document passed AI review ---
  if (aiResult.status === 'clear') {
    await updateDocumentAiReview(documentId, {
      aiReviewStatus: 'clear',
      aiReviewReason: null,
      aiReviewAttempts: currentAttempts,
      approved: true,
      approvedAt: now,
    })

    // Check if all 3 active documents for this order are now approved.
    // Only transition the order if this is the final document needed.
    const activeDocs = await getActiveDocumentsForOrder(doc.orderId)
    const allThreeApproved =
      activeDocs.length === 3 && activeDocs.every((d) => d.approved)

    if (allThreeApproved) {
      await markOrderDocumentsUnderReview(doc.orderId)

      // Notify admin — all documents cleared, order is in the review queue (fire-and-forget)
      const orderInfo = await getOrderBasicInfo(doc.orderId)
      if (orderInfo) {
        await sendEmail(env.ADMIN_EMAIL, 'en', {
          template: 'admin_order_ready',
          orderId: doc.orderId,
          customerName: orderInfo.fullName ?? 'Customer',
          tier: orderInfo.tier,
        })
      }
    }

    return { success: true, data: { aiReviewStatus: 'clear', aiReviewReason: null } }
  }

  // --- Document flagged by AI ---
  const newAttempts = currentAttempts + 1
  const escalate = newAttempts >= 2

  if (escalate) {
    // Second failure — escalate to manual review, no further uploads required from user.
    await updateDocumentAiReview(documentId, {
      aiReviewStatus: 'manual_review',
      aiReviewReason: null,
      aiReviewAttempts: newAttempts,
      approved: false,
      approvedAt: null,
    })

    // Notify admin — manual intervention required (fire-and-forget)
    const orderInfo = await getOrderBasicInfo(doc.orderId)
    if (orderInfo) {
      await sendEmail(env.ADMIN_EMAIL, 'en', {
        template: 'admin_document_escalated',
        orderId: doc.orderId,
        customerName: orderInfo.fullName ?? 'Customer',
        documentType: DOCUMENT_TYPE_LABELS[doc.type],
        // aiResult.reasonKey is the last flag reason from this attempt
        escalationReason: aiResult.reasonKey ?? 'Document flagged twice',
      })
    }

    return { success: true, data: { aiReviewStatus: 'manual_review', aiReviewReason: null } }
  }

  // First failure — return flagged status with the reason key so the client can translate it.
  await updateDocumentAiReview(documentId, {
    aiReviewStatus: 'flagged',
    aiReviewReason: aiResult.reasonKey ?? null,
    aiReviewAttempts: newAttempts,
    approved: false,
    approvedAt: null,
  })

  return {
    success: true,
    data: {
      aiReviewStatus: 'flagged',
      // reasonKey is stored in DB — client translates it using documents.flagReasons.*
      aiReviewReason: aiResult.reasonKey ?? null,
    },
  }
}
