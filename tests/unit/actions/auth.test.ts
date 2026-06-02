/**
 * Unit tests for app/actions/auth.ts
 * 
 * Specifically testing the signUp action and the new duplicate email check.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signUp, signIn } from '@/app/actions/auth'
import * as queries from '@/lib/db/queries'
import * as supabaseServer from '@/lib/supabase/server'
import * as checkoutActions from '@/app/actions/checkout'

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

vi.mock('@/app/actions/checkout', () => ({
  createCheckoutSession: vi.fn(),
}))

vi.mock('@/i18n/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('next-intl/server', () => ({
  getLocale: vi.fn().mockResolvedValue('en'),
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

function mockSupabaseSignIn({ error = null, user = EXISTING_USER } = {}) {
  const client = {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error, data: { user } }),
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
    vi.mocked(queries.getUserByEmail).mockResolvedValue(EXISTING_USER as any)
    const result = await signUp({ ...VALID_SIGN_UP_INPUT, email: EXISTING_USER.email })
    expect(result).toEqual({ success: false, error: 'auth.signUp.errors.emailInUse' })
  })

  it('returns { success: true } on the happy path without tier', async () => {
    vi.mocked(queries.getUserByEmail).mockResolvedValue(null)
    mockSupabaseSignUp()
    const result = await signUp(VALID_SIGN_UP_INPUT)
    expect(result).toEqual({ success: true, data: { checkoutUrl: undefined } })
  })

  it('returns { success: true, data: { checkoutUrl } } when tier is provided', async () => {
    vi.mocked(queries.getUserByEmail).mockResolvedValue(null)
    mockSupabaseSignUp()
    vi.mocked(checkoutActions.createCheckoutSession).mockResolvedValue({
      success: true,
      data: { url: 'https://checkout.stripe.com/test' }
    } as any)

    const result = await signUp({ ...VALID_SIGN_UP_INPUT, tier: 'express' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.checkoutUrl).toBe('https://checkout.stripe.com/test')
    }
    expect(checkoutActions.createCheckoutSession).toHaveBeenCalledWith({
      tier: 'express',
      locale: 'en'
    })
  })
})

describe('signIn action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns { success: true, data: { role } } on the happy path without tier', async () => {
    mockSupabaseSignIn()
    vi.mocked(queries.getUserById).mockResolvedValue(EXISTING_USER as any)

    const result = await signIn({ email: 'test@example.com', password: 'password' })

    expect(result).toEqual({ 
      success: true, 
      data: { role: 'customer', checkoutUrl: undefined } 
    })
  })

  it('returns { success: true, data: { role, checkoutUrl } } when tier is provided', async () => {
    mockSupabaseSignIn()
    vi.mocked(queries.getUserById).mockResolvedValue({
      ...EXISTING_USER,
      language: 'fr'
    } as any)
    vi.mocked(checkoutActions.createCheckoutSession).mockResolvedValue({
      success: true,
      data: { url: 'https://checkout.stripe.com/test' }
    } as any)

    const result = await signIn({ 
      email: 'test@example.com', 
      password: 'password', 
      tier: 'standard' 
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.role).toBe('customer')
      expect(result.data.checkoutUrl).toBe('https://checkout.stripe.com/test')
    }
    expect(checkoutActions.createCheckoutSession).toHaveBeenCalledWith({
      tier: 'standard',
      locale: 'fr'
    })
  })

  it('does not create checkout session for non-customer roles even if tier is provided', async () => {
    mockSupabaseSignIn()
    vi.mocked(queries.getUserById).mockResolvedValue({
      ...EXISTING_USER,
      role: 'admin'
    } as any)

    const result = await signIn({ 
      email: 'admin@example.com', 
      password: 'password', 
      tier: 'standard' 
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.checkoutUrl).toBeUndefined()
    }
    expect(checkoutActions.createCheckoutSession).not.toHaveBeenCalled()
  })
})
