/**
 * Unit tests for lib/operator/packageBuilder.ts
 *
 * renderCoverSheetPdf is mocked — we test the assembly logic (storage download,
 * file naming, ZIP structure), not the PDF renderer internals.
 * JSZip is used to verify the returned buffer is a valid ZIP with correct entries.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import JSZip from 'jszip'

// ---------------------------------------------------------------------------
// Mocks — declared before imports so vi.mock hoisting works
// ---------------------------------------------------------------------------

vi.mock('@/lib/operator/CoverSheet', () => ({
  renderCoverSheetPdf: vi.fn(),
}))

import { buildOperatorPackage } from '@/lib/operator/packageBuilder'
import * as coverSheet from '@/lib/operator/CoverSheet'
import type { OperatorPackageData } from '@/lib/db/queries'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ORDER_ID = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d'

const BASE_DATA: OperatorPackageData = {
  order: {
    id: ORDER_ID,
    tier: 'standard',
    fullName: 'Jane Doe',
    dateOfBirth: '1990-05-15',
    nationality: 'US',
    passportNumber: 'AB123456',
    passportExpiry: '2030-05-14',
    address: '123 Main St, New York, NY 10001',
  },
  documents: [
    { type: 'passport', filePath: 'orders/abc/passport.jpg', mimeType: 'image/jpeg' },
    { type: 'proof_of_address', filePath: 'orders/abc/proof.pdf', mimeType: 'application/pdf' },
    { type: 'signed_poa', filePath: 'orders/abc/poa.png', mimeType: 'image/png' },
  ],
}

/** Creates a minimal Supabase admin mock where all downloads succeed. */
function makeAdminClient(downloadData: Record<string, Buffer> = {}) {
  // Default: return a small buffer for any path not explicitly in downloadData
  const defaultBuffer = Buffer.from('fake-file-content')

  return {
    storage: {
      from: vi.fn().mockReturnValue({
        download: vi.fn().mockImplementation(async (filePath: string) => {
          const buf = downloadData[filePath] ?? defaultBuffer
          // Supabase returns a Blob — simulate with a minimal ArrayBuffer-based Blob
          const blob = new Blob([buf])
          return { data: blob, error: null }
        }),
      }),
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  // Cover sheet always returns a small fake PDF buffer
  vi.mocked(coverSheet.renderCoverSheetPdf).mockResolvedValue(
    Buffer.from('%PDF-fake-cover-sheet'),
  )
})

// ---------------------------------------------------------------------------
// ZIP structure
// ---------------------------------------------------------------------------

describe('buildOperatorPackage — ZIP structure', () => {
  it('returns a Buffer and the correct fileName', async () => {
    const { zipBuffer, fileName } = await buildOperatorPackage(
      BASE_DATA,
      makeAdminClient() as never,
    )

    expect(Buffer.isBuffer(zipBuffer)).toBe(true)
    expect(zipBuffer.byteLength).toBeGreaterThan(0)
    expect(fileName).toBe(`nif-application-${ORDER_ID}.zip`)
  })

  it('returned Buffer is a valid ZIP file', async () => {
    const { zipBuffer } = await buildOperatorPackage(BASE_DATA, makeAdminClient() as never)

    // JSZip throws if the buffer is not a valid ZIP
    const zip = await JSZip.loadAsync(zipBuffer)
    expect(Object.keys(zip.files).length).toBeGreaterThan(0)
  })

  it('ZIP contains exactly 4 files inside the named folder', async () => {
    const { zipBuffer } = await buildOperatorPackage(BASE_DATA, makeAdminClient() as never)

    const zip = await JSZip.loadAsync(zipBuffer)
    const fileNames = Object.keys(zip.files).filter((name) => !name.endsWith('/'))

    expect(fileNames).toHaveLength(4)
  })

  it('ZIP contains cover-sheet.pdf', async () => {
    const { zipBuffer } = await buildOperatorPackage(BASE_DATA, makeAdminClient() as never)

    const zip = await JSZip.loadAsync(zipBuffer)
    expect(zip.files[`nif-application-${ORDER_ID}/cover-sheet.pdf`]).toBeDefined()
  })

  it('ZIP contains document files with names derived from document type', async () => {
    const { zipBuffer } = await buildOperatorPackage(BASE_DATA, makeAdminClient() as never)

    const zip = await JSZip.loadAsync(zipBuffer)
    const prefix = `nif-application-${ORDER_ID}/`

    // Verify each expected file exists
    expect(zip.files[`${prefix}passport.jpg`]).toBeDefined()
    expect(zip.files[`${prefix}proof-of-address.pdf`]).toBeDefined()
    expect(zip.files[`${prefix}signed-poa.png`]).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// MIME → extension mapping
// ---------------------------------------------------------------------------

describe('buildOperatorPackage — MIME type extension mapping', () => {
  it('uses .pdf for application/pdf', async () => {
    const data: OperatorPackageData = {
      ...BASE_DATA,
      documents: [
        { type: 'passport', filePath: 'p.pdf', mimeType: 'application/pdf' },
        { type: 'proof_of_address', filePath: 'po.pdf', mimeType: 'application/pdf' },
        { type: 'signed_poa', filePath: 'poa.pdf', mimeType: 'application/pdf' },
      ],
    }
    const { zipBuffer } = await buildOperatorPackage(data, makeAdminClient() as never)
    const zip = await JSZip.loadAsync(zipBuffer)
    const prefix = `nif-application-${ORDER_ID}/`

    expect(zip.files[`${prefix}passport.pdf`]).toBeDefined()
    expect(zip.files[`${prefix}proof-of-address.pdf`]).toBeDefined()
    expect(zip.files[`${prefix}signed-poa.pdf`]).toBeDefined()
  })

  it('uses .jpg for image/jpeg', async () => {
    const data: OperatorPackageData = {
      ...BASE_DATA,
      documents: BASE_DATA.documents.map((d) => ({ ...d, mimeType: 'image/jpeg' })),
    }
    const { zipBuffer } = await buildOperatorPackage(data, makeAdminClient() as never)
    const zip = await JSZip.loadAsync(zipBuffer)
    const prefix = `nif-application-${ORDER_ID}/`

    expect(zip.files[`${prefix}passport.jpg`]).toBeDefined()
  })

  it('uses .png for image/png', async () => {
    const data: OperatorPackageData = {
      ...BASE_DATA,
      documents: BASE_DATA.documents.map((d) => ({ ...d, mimeType: 'image/png' })),
    }
    const { zipBuffer } = await buildOperatorPackage(data, makeAdminClient() as never)
    const zip = await JSZip.loadAsync(zipBuffer)
    const prefix = `nif-application-${ORDER_ID}/`

    expect(zip.files[`${prefix}passport.png`]).toBeDefined()
  })

  it('falls back to .bin for an unknown MIME type', async () => {
    const data: OperatorPackageData = {
      ...BASE_DATA,
      documents: BASE_DATA.documents.map((d) => ({ ...d, mimeType: 'application/octet-stream' })),
    }
    const { zipBuffer } = await buildOperatorPackage(data, makeAdminClient() as never)
    const zip = await JSZip.loadAsync(zipBuffer)
    const prefix = `nif-application-${ORDER_ID}/`

    expect(zip.files[`${prefix}passport.bin`]).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Cover sheet buffer is included
// ---------------------------------------------------------------------------

describe('buildOperatorPackage — cover sheet content', () => {
  it('writes the buffer returned by renderCoverSheetPdf into cover-sheet.pdf', async () => {
    const fakeContent = Buffer.from('MY-FAKE-PDF-CONTENT')
    vi.mocked(coverSheet.renderCoverSheetPdf).mockResolvedValue(fakeContent)

    const { zipBuffer } = await buildOperatorPackage(BASE_DATA, makeAdminClient() as never)
    const zip = await JSZip.loadAsync(zipBuffer)
    const prefix = `nif-application-${ORDER_ID}/`
    const coverEntry = zip.files[`${prefix}cover-sheet.pdf`]

    expect(coverEntry).toBeDefined()
    const content = await coverEntry!.async('nodebuffer')
    expect(content).toEqual(fakeContent)
  })

  it('calls renderCoverSheetPdf with the order from the data argument', async () => {
    await buildOperatorPackage(BASE_DATA, makeAdminClient() as never)
    expect(coverSheet.renderCoverSheetPdf).toHaveBeenCalledOnce()
    expect(coverSheet.renderCoverSheetPdf).toHaveBeenCalledWith(BASE_DATA.order)
  })
})

// ---------------------------------------------------------------------------
// Storage download errors
// ---------------------------------------------------------------------------

describe('buildOperatorPackage — storage errors', () => {
  it('throws when Supabase storage returns an error for a document', async () => {
    const failingClient = {
      storage: {
        from: vi.fn().mockReturnValue({
          download: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Object not found' },
          }),
        }),
      },
    }

    await expect(
      buildOperatorPackage(BASE_DATA, failingClient as never),
    ).rejects.toThrow('Failed to download document')
  })

  it('throws when Supabase storage returns a null blob with no error', async () => {
    const nullBlobClient = {
      storage: {
        from: vi.fn().mockReturnValue({
          download: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      },
    }

    await expect(
      buildOperatorPackage(BASE_DATA, nullBlobClient as never),
    ).rejects.toThrow('blob was null')
  })
})
