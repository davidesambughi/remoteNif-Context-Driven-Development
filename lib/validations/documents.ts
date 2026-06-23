import { z } from 'zod'

// Used by the client to request a signed upload URL from the server.
export const CreateUploadUrlSchema = z.object({
  orderId: z.string().uuid(),
  fileName: z.string().min(1),
  contentType: z.string().regex(/^(application\/pdf|image\/jpeg|image\/png)$/),
})

// Used by the client to register a completed upload in the database.
export const UploadDocumentSchema = z.object({
  orderId: z.string().uuid(),
  type: z.enum(['passport', 'proof_of_address', 'signed_poa']),
  filePath: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().int().positive().max(10 * 1024 * 1024), // 10 MB cap
  mimeType: z.string().regex(/^(application\/pdf|image\/jpeg|image\/png)$/),
})

// Finite set of reason keys Gemini may return when flagging a document.
// The Gemini prompt must list these keys exactly — any other value fails schema validation
// and is treated as an error, not surfaced to the user as-is.
export const DOCUMENT_FLAG_REASON_KEYS = [
  'passport_expired',
  'passport_blurry',
  'passport_obscured',
  'passport_wrong_document',
  'address_too_old',
  'address_type_not_accepted',
  'address_blurry',
  'address_wrong_document',
  'address_name_mismatch',
  'poa_unsigned',
  'poa_wrong_document',
  'poa_incomplete',
] as const

export type DocumentFlagReasonKey = typeof DOCUMENT_FLAG_REASON_KEYS[number]

// Schema for Groq's JSON response. Use safeParse — never trust LLM output directly.
export const AiReviewResponseSchema = z.object({
  status: z.enum(['clear', 'flagged', 'error']),
  reasonKey: z.enum(DOCUMENT_FLAG_REASON_KEYS).optional(),
})

export type AiReviewResponse = z.infer<typeof AiReviewResponseSchema>
export type CreateUploadUrlData = z.infer<typeof CreateUploadUrlSchema>
export type UploadDocumentData = z.infer<typeof UploadDocumentSchema>
