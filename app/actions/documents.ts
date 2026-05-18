'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth/session'
import {
  getOrderForUser,
  createDocumentRecord,
  supersedePreviousDocuments,
} from '@/lib/db/queries'
import {
  CreateUploadUrlSchema,
  UploadDocumentSchema,
  type CreateUploadUrlData,
  type UploadDocumentData,
} from '@/lib/validations/documents'
import type { ActionResult } from '@/lib/types'

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
 * passport / proof_of_address: queued for AI review (handled in Feature 11).
 */
export async function uploadDocument(
  input: UploadDocumentData,
): Promise<ActionResult> {
  const parsed = UploadDocumentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const user = await requireAuth()

  const order = await getOrderForUser(parsed.data.orderId, user.id)
  if (!order) return { success: false, error: 'Order not found' }

  const { orderId, type, filePath, fileName, fileSize, mimeType } = parsed.data
  const isPoA = type === 'signed_poa'

  // Soft-delete previous active upload of the same type (keeps audit trail).
  await supersedePreviousDocuments(orderId, type)

  await createDocumentRecord({
    orderId,
    userId: user.id,
    type,
    filePath,
    fileName,
    fileSize,
    mimeType,
    // signed_poa is accepted instantly — no AI review step.
    aiReviewStatus: isPoA ? null : 'pending',
    approved: isPoA,
    approvedAt: isPoA ? new Date() : null,
  })

  return { success: true }
}
