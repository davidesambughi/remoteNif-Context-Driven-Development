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

export type CreateUploadUrlData = z.infer<typeof CreateUploadUrlSchema>
export type UploadDocumentData = z.infer<typeof UploadDocumentSchema>
