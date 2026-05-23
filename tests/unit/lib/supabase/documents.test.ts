/**
 * Unit tests for lib/supabase/documents.ts — getSignedDocumentUrl
 *
 * Covers the three observable branches:
 *   A — Supabase succeeds and returns a signed URL
 *   B — Supabase returns an error (file missing, permissions, etc.)
 *   C — Supabase returns no error but also no URL (unexpected response shape)
 *
 * The Supabase storage chain is fully mocked — no real network calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSignedDocumentUrl } from '@/lib/supabase/documents'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import * as supabaseServer from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Wires up the full Supabase storage mock chain:
 * createClient() → .storage.from('documents').createSignedUrl(path, ttl)
 */
function mockCreateSignedUrl(result: {
  data: { signedUrl: string } | null
  error: unknown
}) {
  vi.mocked(supabaseServer.createClient).mockResolvedValue({
    storage: {
      from: vi.fn().mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue(result),
      }),
    },
  // Cast is necessary because we only mock the storage subset of the Supabase client
  } as never)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getSignedDocumentUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('A — returns the signed URL string when Supabase succeeds', async () => {
    const expectedUrl =
      'https://storage.supabase.co/object/sign/documents/orders/user-1/passport.pdf?token=abc'
    mockCreateSignedUrl({ data: { signedUrl: expectedUrl }, error: null })

    const result = await getSignedDocumentUrl('orders/user-1/passport.pdf')

    expect(result).toBe(expectedUrl)
  })

  it('B — returns null when Supabase returns an error', async () => {
    mockCreateSignedUrl({ data: null, error: { message: 'Object not found', status: 404 } })

    const result = await getSignedDocumentUrl('orders/user-1/missing.pdf')

    expect(result).toBeNull()
  })

  it('C — returns null when Supabase returns no error but also no URL', async () => {
    // Defensive: guards against an unexpected response shape that has no signedUrl
    mockCreateSignedUrl({ data: null, error: null })

    const result = await getSignedDocumentUrl('orders/user-1/passport.pdf')

    expect(result).toBeNull()
  })

  it('calls storage.from with the correct bucket name', async () => {
    const expectedUrl = 'https://storage.supabase.co/signed/test.pdf?token=xyz'
    mockCreateSignedUrl({ data: { signedUrl: expectedUrl }, error: null })

    await getSignedDocumentUrl('orders/user-1/passport.pdf')

    // Confirm the 'documents' bucket name is hardcoded, not caller-supplied
    const supabase = await vi.mocked(supabaseServer.createClient).mock.results[0]?.value
    expect(supabase.storage.from).toHaveBeenCalledWith('documents')
  })
})
