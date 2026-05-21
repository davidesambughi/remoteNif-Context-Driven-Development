/**
 * Unit tests for app/api/operator/package/[orderId]/route.ts
 *
 * Tests every HTTP response path: 400, 401, 403, 404, 500, and 200.
 * All external deps (Supabase, DB, packageBuilder) are mocked so the tests
 * run fast and without any real services.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — must be declared before the import of the route handler
// ---------------------------------------------------------------------------

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/db/queries', () => ({
  getUserById: vi.fn(),
  getOperatorPackageData: vi.fn(),
}))

vi.mock('@/lib/operator/packageBuilder', () => ({
  buildOperatorPackage: vi.fn(),
}))

import { GET } from '@/app/api/operator/package/[orderId]/route'
import * as serverSupabase from '@/lib/supabase/server'
import * as queries from '@/lib/db/queries'
import * as packageBuilder from '@/lib/operator/packageBuilder'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_UUID = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d'
const OPERATOR_USER = { id: 'op-user-id', role: 'operator' as const }

const PACKAGE_DATA = {
  order: {
    id: VALID_UUID,
    tier: 'standard',
    fullName: 'Jane Doe',
    dateOfBirth: '1990-05-15',
    nationality: 'US',
    passportNumber: 'AB123456',
    passportExpiry: '2030-05-14',
    address: '123 Main St',
  },
  documents: [
    { type: 'passport' as const, filePath: 'p.pdf', mimeType: 'application/pdf' },
    { type: 'proof_of_address' as const, filePath: 'po.pdf', mimeType: 'application/pdf' },
    { type: 'signed_poa' as const, filePath: 'poa.pdf', mimeType: 'application/pdf' },
  ],
}

/** Builds a fake Supabase server client whose getClaims() returns the given userId. */
function mockSession(userId: string | null) {
  vi.mocked(serverSupabase.createClient).mockResolvedValue({
    auth: {
      getClaims: vi.fn().mockResolvedValue({
        data: userId ? { claims: { sub: userId } } : { claims: null },
      }),
    },
  } as never)
}

/** Helper to call the GET handler with a given orderId param. */
async function callGet(orderId: string): Promise<Response> {
  return GET(
    new Request(`http://localhost/api/operator/package/${orderId}`),
    { params: Promise.resolve({ orderId }) },
  )
}

beforeEach(() => {
  vi.clearAllMocks()

  // Defaults: authenticated operator, valid package data, successful build
  mockSession(OPERATOR_USER.id)
  vi.mocked(queries.getUserById).mockResolvedValue(OPERATOR_USER as never)
  vi.mocked(queries.getOperatorPackageData).mockResolvedValue(PACKAGE_DATA as never)
  vi.mocked(packageBuilder.buildOperatorPackage).mockResolvedValue({
    zipBuffer: Buffer.from('fake-zip'),
    fileName: `nif-application-${VALID_UUID}.zip`,
  })
})

// ---------------------------------------------------------------------------
// 400 — Invalid UUID
// ---------------------------------------------------------------------------

describe('GET /api/operator/package/[orderId] — 400', () => {
  it('returns 400 for a non-UUID string', async () => {
    const res = await callGet('not-a-uuid')
    expect(res.status).toBe(400)
  })

  it('returns 400 for an empty string', async () => {
    const res = await callGet('')
    expect(res.status).toBe(400)
  })

  it('returns 400 for a UUID with wrong format (8-4-4-4-12)', async () => {
    const res = await callGet('zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz')
    // Zod uuid validator rejects non-hex characters
    expect(res.status).toBe(400)
  })

  it('does not call getUserById when UUID is invalid', async () => {
    await callGet('bad')
    expect(queries.getUserById).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// 401 — Unauthenticated
// ---------------------------------------------------------------------------

describe('GET /api/operator/package/[orderId] — 401', () => {
  it('returns 401 when session has no user ID', async () => {
    mockSession(null)
    const res = await callGet(VALID_UUID)
    expect(res.status).toBe(401)
  })

  it('does not call getUserById when there is no session', async () => {
    mockSession(null)
    await callGet(VALID_UUID)
    expect(queries.getUserById).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// 403 — Wrong role
// ---------------------------------------------------------------------------

describe('GET /api/operator/package/[orderId] — 403', () => {
  it('returns 403 when user is a customer', async () => {
    vi.mocked(queries.getUserById).mockResolvedValue({ ...OPERATOR_USER, role: 'customer' } as never)
    const res = await callGet(VALID_UUID)
    expect(res.status).toBe(403)
  })

  it('returns 403 when user is an admin', async () => {
    vi.mocked(queries.getUserById).mockResolvedValue({ ...OPERATOR_USER, role: 'admin' } as never)
    const res = await callGet(VALID_UUID)
    expect(res.status).toBe(403)
  })

  it('returns 403 when getUserById returns null (user deleted mid-session)', async () => {
    vi.mocked(queries.getUserById).mockResolvedValue(null)
    const res = await callGet(VALID_UUID)
    expect(res.status).toBe(403)
  })

  it('does not call getOperatorPackageData when role check fails', async () => {
    vi.mocked(queries.getUserById).mockResolvedValue({ ...OPERATOR_USER, role: 'customer' } as never)
    await callGet(VALID_UUID)
    expect(queries.getOperatorPackageData).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// 404 — Order not ready
// ---------------------------------------------------------------------------

describe('GET /api/operator/package/[orderId] — 404', () => {
  it('returns 404 when getOperatorPackageData returns null', async () => {
    vi.mocked(queries.getOperatorPackageData).mockResolvedValue(null)
    const res = await callGet(VALID_UUID)
    expect(res.status).toBe(404)
  })

  it('does not call buildOperatorPackage when package data is null', async () => {
    vi.mocked(queries.getOperatorPackageData).mockResolvedValue(null)
    await callGet(VALID_UUID)
    expect(packageBuilder.buildOperatorPackage).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// 500 — Unexpected error
// ---------------------------------------------------------------------------

describe('GET /api/operator/package/[orderId] — 500', () => {
  it('returns 500 when buildOperatorPackage throws', async () => {
    vi.mocked(packageBuilder.buildOperatorPackage).mockRejectedValue(
      new Error('Storage connection failed'),
    )
    const res = await callGet(VALID_UUID)
    expect(res.status).toBe(500)
  })

  it('500 response is plain text, not JSON', async () => {
    vi.mocked(packageBuilder.buildOperatorPackage).mockRejectedValue(new Error('boom'))
    const res = await callGet(VALID_UUID)
    const body = await res.text()
    // Must not be JSON — client expects binary and parses this as an error string
    expect(() => JSON.parse(body)).toThrow()
  })
})

// ---------------------------------------------------------------------------
// 200 — Success path
// ---------------------------------------------------------------------------

describe('GET /api/operator/package/[orderId] — 200', () => {
  it('returns status 200', async () => {
    const res = await callGet(VALID_UUID)
    expect(res.status).toBe(200)
  })

  it('sets Content-Type to application/zip', async () => {
    const res = await callGet(VALID_UUID)
    expect(res.headers.get('content-type')).toBe('application/zip')
  })

  it('sets Content-Disposition with the correct filename', async () => {
    const res = await callGet(VALID_UUID)
    const disposition = res.headers.get('content-disposition')
    expect(disposition).toContain('attachment')
    expect(disposition).toContain(`nif-application-${VALID_UUID}.zip`)
  })

  it('sets Content-Length matching the buffer size', async () => {
    const fakeZip = Buffer.from('fake-zip-content-longer')
    vi.mocked(packageBuilder.buildOperatorPackage).mockResolvedValue({
      zipBuffer: fakeZip,
      fileName: `nif-application-${VALID_UUID}.zip`,
    })

    const res = await callGet(VALID_UUID)
    expect(res.headers.get('content-length')).toBe(String(fakeZip.byteLength))
  })

  it('calls getOperatorPackageData with the validated orderId', async () => {
    await callGet(VALID_UUID)
    expect(queries.getOperatorPackageData).toHaveBeenCalledOnce()
    expect(queries.getOperatorPackageData).toHaveBeenCalledWith(VALID_UUID)
  })

  it('calls getUserById with the ID from the session claims', async () => {
    await callGet(VALID_UUID)
    expect(queries.getUserById).toHaveBeenCalledWith(OPERATOR_USER.id)
  })
})
