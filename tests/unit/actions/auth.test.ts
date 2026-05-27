/**
 * Unit tests for app/actions/auth.ts
 * 
 * Specifically testing the signUp action and the new duplicate email check.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signUp } from '@/app/actions/auth'
import * as queries from '@/lib/db/queries'
import * as supabaseServer from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/db/queries', () => ({
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_SIGN_UP_INPUT = {
  email: 'new-user@example.com',
  password: 'StrongPassword123!',
  language: 'en',
}

const EXISTING_USER = {
  id: 'user-123',
  email: 'existing@example.com',
  role: 'customer',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockSupabaseSignUp({ error = null, session = { user: { id: 'new-id' } } } = {}) {
  const client = {
    auth: {
      signUp: vi.fn().mockResolvedValue({ error, data: { session } }),
    },
  }
  vi.mocked(supabaseServer.createClient).mockResolvedValue(client as any)
  return client
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('signUp action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns emailInUse error when the email already exists in the database', async () => {
    // 1. Mock getUserByEmail to return a user
    vi.mocked(queries.getUserByEmail).mockResolvedValue(EXISTING_USER as any)
    
    // 2. Execute
    const result = await signUp({
      ...VALID_SIGN_UP_INPUT,
      email: EXISTING_USER.email,
    })

    // 3. Assert
    expect(result).toEqual({
      success: false,
      error: 'auth.signUp.errors.emailInUse',
    })
    
    // getUserByEmail should be called
    expect(queries.getUserByEmail).toHaveBeenCalledWith(EXISTING_USER.email)
    
    // supabase.auth.signUp should NOT be called (short-circuit)
    expect(supabaseServer.createClient).not.toHaveBeenCalled()
  })

  it('proceeds to Supabase signUp when the email does not exist in the database', async () => {
    // 1. Mock getUserByEmail to return null
    vi.mocked(queries.getUserByEmail).mockResolvedValue(null)
    const client = mockSupabaseSignUp()

    // 2. Execute
    const result = await signUp(VALID_SIGN_UP_INPUT)

    // 3. Assert
    expect(result).toEqual({ success: true })
    expect(queries.getUserByEmail).toHaveBeenCalledWith(VALID_SIGN_UP_INPUT.email)
    expect(client.auth.signUp).toHaveBeenCalled()
  })

  it('returns emailInUse error if Supabase natively returns "User already registered"', async () => {
    // (Edge case where DB check missed it but Supabase caught it)
    vi.mocked(queries.getUserByEmail).mockResolvedValue(null)
    const client = mockSupabaseSignUp({
      error: { message: 'User already registered', status: 422 } as any,
      session: null
    })

    const result = await signUp(VALID_SIGN_UP_INPUT)

    expect(result).toEqual({
      success: false,
      error: 'auth.signUp.errors.emailInUse',
    })
  })

  it('returns emailConfirmationRequired if Supabase returns success but no session', async () => {
    // This happens when email confirmation is enabled in Supabase
    vi.mocked(queries.getUserByEmail).mockResolvedValue(null)
    mockSupabaseSignUp({ session: null })

    const result = await signUp(VALID_SIGN_UP_INPUT)

    expect(result).toEqual({
      success: false,
      error: 'auth.signUp.errors.emailConfirmationRequired',
    })
  })

  it('returns generic error for any other Supabase failure', async () => {
    vi.mocked(queries.getUserByEmail).mockResolvedValue(null)
    mockSupabaseSignUp({
      error: { message: 'Unexpected server error', status: 500 } as any,
      session: null
    })

    const result = await signUp(VALID_SIGN_UP_INPUT)

    expect(result).toEqual({
      success: false,
      error: 'auth.signUp.errors.generic',
    })
  })

  it('returns generic error if Zod validation fails', async () => {
    const result = await signUp({ email: 'invalid', password: 'short' })
    expect(result).toEqual({
      success: false,
      error: 'auth.signUp.errors.generic',
    })
    expect(queries.getUserByEmail).not.toHaveBeenCalled()
  })
})
