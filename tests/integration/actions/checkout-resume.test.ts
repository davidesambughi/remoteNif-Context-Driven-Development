import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signUp } from '@/app/actions/auth'
import { truncateAll } from '../setup'
import * as supabaseServer from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(),
}))

vi.mock('next-intl', () => ({
    useTranslations: vi.fn(() => (key: string) => key),
    useLocale: vi.fn(() => 'en'),
}))

vi.mock('next-intl/navigation', () => ({
    createNavigation: vi.fn(() => ({
        Link: vi.fn(),
        redirect: vi.fn(),
        usePathname: vi.fn(),
        useRouter: vi.fn(),
        getPathname: vi.fn(),
    })),
}))

vi.mock('@/i18n/navigation', () => ({
    redirect: vi.fn(),
    Link: vi.fn(),
    usePathname: vi.fn(),
    useRouter: vi.fn(),
}))

vi.mock('@/app/actions/checkout', () => ({
    createCheckoutSession: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock next-intl/server since it requires a real request context
vi.mock('next-intl/server', () => ({
  getLocale: vi.fn().mockResolvedValue('en'),
}))

vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  },
}))

beforeEach(truncateAll)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('signUp integration - encoded redirect', () => {
  it('encodes the selected tier into the emailRedirectTo URL', async () => {
    // 1. Mock Supabase
    const signUpMock = vi.fn().mockResolvedValue({
      error: null,
      data: { session: null }, // Simulate email confirmation enabled
    })
    const client = {
      auth: {
        signUp: signUpMock,
      },
    }
    vi.mocked(supabaseServer.createClient).mockResolvedValue(client as any)

    // 2. Execute signUp with a tier
    const result = await signUp({
      email: 'new-user@example.com',
      password: 'StrongPassword123!',
      language: 'fr',
      tier: 'express',
    })

    // 3. Assert
    expect(result.success).toBe(false) // returns false because no session is returned (confirmation required)
    if (result.success === false) {
        expect(result.error).toBe('auth.signUp.errors.emailConfirmationRequired')
    }

    expect(signUpMock).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          // The parameter must be URL-encoded inside the next param
          emailRedirectTo: expect.stringContaining('next=%2Fdashboard%3Fcheckout_tier%3Dexpress'),
        }),
      }),
    )
  })

  it('uses a standard redirect URL when no tier is provided', async () => {
    const signUpMock = vi.fn().mockResolvedValue({
      error: null,
      data: { session: null },
    })
    const client = {
      auth: {
        signUp: signUpMock,
      },
    }
    vi.mocked(supabaseServer.createClient).mockResolvedValue(client as any)

    await signUp({
      email: 'regular-user@example.com',
      password: 'StrongPassword123!',
      language: 'en',
    })

    expect(signUpMock).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          emailRedirectTo: expect.stringContaining('next=%2Fdashboard'),
        }),
      }),
    )
    
    // Should NOT contain the checkout_tier parameter
    const call = signUpMock.mock.calls[0][0]
    expect(call.options.emailRedirectTo).not.toContain('checkout_tier')
  })
})
