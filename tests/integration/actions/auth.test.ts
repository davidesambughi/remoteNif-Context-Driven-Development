import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signUp } from '@/app/actions/auth'
import { truncateAll } from '../setup'
import { insertTestUser } from '../fixtures'
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

vi.mock('next-intl/server', () => ({
  getLocale: vi.fn().mockResolvedValue('en'),
}))

vi.mock('@/app/actions/checkout', () => ({
  createCheckoutSession: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
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

// ---------------------------------------------------------------------------
// signUp
// ---------------------------------------------------------------------------

describe('signUp integration', () => {
  it('returns emailInUse error when the user already exists in the database', async () => {
    // 1. Seed a user in the real test database
    const existingEmail = 'duplicate@example.com'
    await insertTestUser({ email: existingEmail })

    // 2. Mock Supabase (should NOT be called)
    const client = {
      auth: {
        signUp: vi.fn(),
      },
    }
    vi.mocked(supabaseServer.createClient).mockResolvedValue(client as any)

    // 3. Execute
    const result = await signUp({
      email: existingEmail,
      password: 'StrongPassword123!',
      language: 'en',
    })

    // 4. Assert
    expect(result).toEqual({
      success: false,
      error: 'auth.signUp.errors.emailInUse',
    })

    // Verify Supabase was never reached due to the DB check short-circuit
    expect(client.auth.signUp).not.toHaveBeenCalled()
  })

  it('proceeds to Supabase when the user does not exist in the database', async () => {
    // 1. Mock Supabase (WILL be called)
    const client = {
      auth: {
        signUp: vi.fn().mockResolvedValue({
          error: null,
          data: { session: { user: { id: 'new-id' } } },
        }),
      },
    }
    vi.mocked(supabaseServer.createClient).mockResolvedValue(client as any)

    // 2. Execute
    const result = await signUp({
      email: 'new-user@example.com',
      password: 'StrongPassword123!',
      language: 'en',
    })

    // 3. Assert
    expect(result).toEqual({ success: true, data: { checkoutUrl: undefined } })
    expect(client.auth.signUp).toHaveBeenCalled()
  })
})
