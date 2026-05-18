/**
 * Tests for CreateUploadUrlSchema and UploadDocumentSchema in lib/validations/documents.ts.
 *
 * These schemas are the first line of defense before any storage or DB operation runs.
 * If a constraint changes here, the upload flow must be audited end-to-end.
 */

import { describe, it, expect } from 'vitest'
import { CreateUploadUrlSchema, UploadDocumentSchema } from '@/lib/validations/documents'

const VALID_UUID = '3fa85f64-5717-4562-b3fc-2c963f66afa6'

// ---------------------------------------------------------------------------
// CreateUploadUrlSchema
// ---------------------------------------------------------------------------

const VALID_URL_INPUT = {
  orderId: VALID_UUID,
  fileName: 'passport.pdf',
  contentType: 'application/pdf',
}

describe('CreateUploadUrlSchema — valid input', () => {
  it('accepts a valid PDF upload request', () => {
    expect(CreateUploadUrlSchema.safeParse(VALID_URL_INPUT).success).toBe(true)
  })

  it('accepts image/jpeg as contentType', () => {
    expect(
      CreateUploadUrlSchema.safeParse({ ...VALID_URL_INPUT, contentType: 'image/jpeg' }).success,
    ).toBe(true)
  })

  it('accepts image/png as contentType', () => {
    expect(
      CreateUploadUrlSchema.safeParse({ ...VALID_URL_INPUT, contentType: 'image/png' }).success,
    ).toBe(true)
  })
})

describe('CreateUploadUrlSchema — orderId', () => {
  it('rejects a non-UUID orderId', () => {
    expect(
      CreateUploadUrlSchema.safeParse({ ...VALID_URL_INPUT, orderId: 'not-a-uuid' }).success,
    ).toBe(false)
  })

  it('rejects an empty orderId', () => {
    expect(
      CreateUploadUrlSchema.safeParse({ ...VALID_URL_INPUT, orderId: '' }).success,
    ).toBe(false)
  })

  it('rejects a missing orderId', () => {
    const { orderId: _, ...rest } = VALID_URL_INPUT
    expect(CreateUploadUrlSchema.safeParse(rest).success).toBe(false)
  })
})

describe('CreateUploadUrlSchema — fileName', () => {
  it('rejects an empty fileName', () => {
    expect(
      CreateUploadUrlSchema.safeParse({ ...VALID_URL_INPUT, fileName: '' }).success,
    ).toBe(false)
  })

  it('rejects a missing fileName', () => {
    const { fileName: _, ...rest } = VALID_URL_INPUT
    expect(CreateUploadUrlSchema.safeParse(rest).success).toBe(false)
  })
})

describe('CreateUploadUrlSchema — contentType', () => {
  it('rejects image/gif', () => {
    expect(
      CreateUploadUrlSchema.safeParse({ ...VALID_URL_INPUT, contentType: 'image/gif' }).success,
    ).toBe(false)
  })

  it('rejects text/plain', () => {
    expect(
      CreateUploadUrlSchema.safeParse({ ...VALID_URL_INPUT, contentType: 'text/plain' }).success,
    ).toBe(false)
  })

  it('rejects application/msword', () => {
    expect(
      CreateUploadUrlSchema.safeParse({ ...VALID_URL_INPUT, contentType: 'application/msword' }).success,
    ).toBe(false)
  })

  it('rejects an empty contentType', () => {
    expect(
      CreateUploadUrlSchema.safeParse({ ...VALID_URL_INPUT, contentType: '' }).success,
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// UploadDocumentSchema
// ---------------------------------------------------------------------------

const TEN_MB = 10 * 1024 * 1024

const VALID_UPLOAD = {
  orderId: VALID_UUID,
  type: 'passport' as const,
  filePath: `user-id/${VALID_UUID}/1234567890-passport.pdf`,
  fileName: 'passport.pdf',
  fileSize: 1_500_000, // 1.5 MB
  mimeType: 'application/pdf',
}

describe('UploadDocumentSchema — valid input', () => {
  it('accepts a valid passport upload', () => {
    expect(UploadDocumentSchema.safeParse(VALID_UPLOAD).success).toBe(true)
  })

  it('accepts proof_of_address type', () => {
    expect(
      UploadDocumentSchema.safeParse({ ...VALID_UPLOAD, type: 'proof_of_address' }).success,
    ).toBe(true)
  })

  it('accepts signed_poa type', () => {
    expect(
      UploadDocumentSchema.safeParse({ ...VALID_UPLOAD, type: 'signed_poa' }).success,
    ).toBe(true)
  })

  it('accepts a file exactly at the 10 MB limit', () => {
    expect(
      UploadDocumentSchema.safeParse({ ...VALID_UPLOAD, fileSize: TEN_MB }).success,
    ).toBe(true)
  })

  it('accepts image/jpeg mimeType', () => {
    expect(
      UploadDocumentSchema.safeParse({ ...VALID_UPLOAD, mimeType: 'image/jpeg' }).success,
    ).toBe(true)
  })

  it('accepts image/png mimeType', () => {
    expect(
      UploadDocumentSchema.safeParse({ ...VALID_UPLOAD, mimeType: 'image/png' }).success,
    ).toBe(true)
  })
})

describe('UploadDocumentSchema — orderId', () => {
  it('rejects a non-UUID orderId', () => {
    expect(
      UploadDocumentSchema.safeParse({ ...VALID_UPLOAD, orderId: 'abc-123' }).success,
    ).toBe(false)
  })

  it('rejects an empty orderId', () => {
    expect(
      UploadDocumentSchema.safeParse({ ...VALID_UPLOAD, orderId: '' }).success,
    ).toBe(false)
  })
})

describe('UploadDocumentSchema — type', () => {
  it('rejects an unknown document type', () => {
    expect(
      UploadDocumentSchema.safeParse({ ...VALID_UPLOAD, type: 'id_card' }).success,
    ).toBe(false)
  })

  it('rejects an empty type', () => {
    expect(
      UploadDocumentSchema.safeParse({ ...VALID_UPLOAD, type: '' }).success,
    ).toBe(false)
  })
})

describe('UploadDocumentSchema — fileSize', () => {
  it('rejects a file 1 byte over 10 MB', () => {
    expect(
      UploadDocumentSchema.safeParse({ ...VALID_UPLOAD, fileSize: TEN_MB + 1 }).success,
    ).toBe(false)
  })

  it('rejects fileSize of zero', () => {
    expect(
      UploadDocumentSchema.safeParse({ ...VALID_UPLOAD, fileSize: 0 }).success,
    ).toBe(false)
  })

  it('rejects a negative fileSize', () => {
    expect(
      UploadDocumentSchema.safeParse({ ...VALID_UPLOAD, fileSize: -1 }).success,
    ).toBe(false)
  })

  it('rejects a non-integer fileSize', () => {
    expect(
      UploadDocumentSchema.safeParse({ ...VALID_UPLOAD, fileSize: 1024.5 }).success,
    ).toBe(false)
  })
})

describe('UploadDocumentSchema — mimeType', () => {
  it('rejects image/gif', () => {
    expect(
      UploadDocumentSchema.safeParse({ ...VALID_UPLOAD, mimeType: 'image/gif' }).success,
    ).toBe(false)
  })

  it('rejects image/webp', () => {
    expect(
      UploadDocumentSchema.safeParse({ ...VALID_UPLOAD, mimeType: 'image/webp' }).success,
    ).toBe(false)
  })

  it('rejects application/msword', () => {
    expect(
      UploadDocumentSchema.safeParse({ ...VALID_UPLOAD, mimeType: 'application/msword' }).success,
    ).toBe(false)
  })

  it('rejects an empty mimeType', () => {
    expect(
      UploadDocumentSchema.safeParse({ ...VALID_UPLOAD, mimeType: '' }).success,
    ).toBe(false)
  })
})

describe('UploadDocumentSchema — filePath and fileName', () => {
  it('rejects an empty filePath', () => {
    expect(
      UploadDocumentSchema.safeParse({ ...VALID_UPLOAD, filePath: '' }).success,
    ).toBe(false)
  })

  it('rejects an empty fileName', () => {
    expect(
      UploadDocumentSchema.safeParse({ ...VALID_UPLOAD, fileName: '' }).success,
    ).toBe(false)
  })
})
