/**
 * Unit tests for app/actions/settings.ts
 *
 * Three Server Actions are tested:
 *   changeEmail    — verifies current password, then calls supabase.auth.updateUser({ email })
 *   changePassword — verifies current password, then calls supabase.auth.updateUser({ password })
 *   deleteAccount  — calls admin.deleteUser, then supabase.auth.signOut
 *
 * All Supabase clients are mocked — no real network calls are made.
 * getCurrentUser is mocked via lib/auth/session so we control the auth state.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { changeEmail, changePassword, deleteAccount } from '@/app/actions/settings'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/auth/session', () => ({
  getCurrentUser: vi.fn(),
}))

// createClient is async — mock it to return a resolved promise wrapping the client object.
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// createAdminClient is sync — mock it to return the client object directly.
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

import * as session from '@/lib/auth/session'
import * as supabaseServer from '@/lib/supabase/server'
import * as supabaseAdmin from '@/lib/supabase/admin'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER = {
  id: 'c3d4e5f6-a1b2-4c3d-ae4e-5f6a7b8c9d0e',
  email: 'user@example.com',
  role: 'customer' as const,
}

const VALID_CHANGE_EMAIL_INPUT = {
  newEmail: 'new@example.com',
  currentPassword: 'OldPass1',
}

const VALID_CHANGE_PASSWORD_INPUT = {
  currentPassword: 'OldPass1',
  newPassword: 'NewPass2',
  confirmPassword: 'NewPass2',
}

// ---------------------------------------------------------------------------
// Supabase client mock builders
// ---------------------------------------------------------------------------

/**
 * Returns a mock for the server-side Supabase client (createClient returns a Promise).
 * signInResult and updateResult default to success ({ error: null }).
 */
function mockServerClient({
  signInError = null as null | { message: string },
  updateError = null as null | { message: string },
} = {}) {
  const client = {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: signInError }),
      updateUser: vi.fn().mockResolvedValue({ error: updateError }),
      signOut: vi.fn().mockResolvedValue({}),
    },
  }
  vi.mocked(supabaseServer.createClient).mockResolvedValue(client as any)
  return client
}

/**
 * Returns a mock for the admin Supabase client (createAdminClient is sync).
 * deleteError defaults to null (success).
 */
function mockAdminClient({
  deleteError = null as null | { message: string },
} = {}) {
  const client = {
    auth: {
      admin: {
        deleteUser: vi.fn().mockResolvedValue({ error: deleteError }),
      },
    },
  }
  vi.mocked(supabaseAdmin.createAdminClient).mockReturnValue(client as any)
  return client
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  // Default: authenticated user
  vi.mocked(session.getCurrentUser).mockResolvedValue(USER as any)
})

// ---------------------------------------------------------------------------
// changeEmail
// ---------------------------------------------------------------------------

describe('changeEmail', () => {
  it('returns a generic error when input fails Zod validation', async () => {
    mockServerClient()
    const result = await changeEmail({ newEmail: 'not-an-email', currentPassword: 'pw' })
    expect(result).toEqual({ success: false, error: 'settings.changeEmail.errors.generic' })
    // Supabase should never be called with invalid input
    expect(supabaseServer.createClient).not.toHaveBeenCalled()
  })

  it('returns a generic error when the user is not authenticated', async () => {
    vi.mocked(session.getCurrentUser).mockResolvedValue(null)
    mockServerClient()
    const result = await changeEmail(VALID_CHANGE_EMAIL_INPUT)
    expect(result).toEqual({ success: false, error: 'settings.changeEmail.errors.generic' })
  })

  it('returns incorrectPassword error when signInWithPassword fails', async () => {
    mockServerClient({ signInError: { message: 'Invalid login credentials' } })
    const result = await changeEmail(VALID_CHANGE_EMAIL_INPUT)
    expect(result).toEqual({
      success: false,
      error: 'settings.changeEmail.errors.incorrectPassword',
    })
  })

  it('calls signInWithPassword with the user email and the provided current password', async () => {
    const client = mockServerClient()
    await changeEmail(VALID_CHANGE_EMAIL_INPUT)
    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
      email: USER.email,
      password: VALID_CHANGE_EMAIL_INPUT.currentPassword,
    })
  })

  it('returns emailInUse error when Supabase reports the email is already registered', async () => {
    mockServerClient({ updateError: { message: 'User already registered' } })
    const result = await changeEmail(VALID_CHANGE_EMAIL_INPUT)
    expect(result).toEqual({
      success: false,
      error: 'settings.changeEmail.errors.emailInUse',
    })
  })

  it('returns emailInUse error on a unique-constraint message from Supabase', async () => {
    mockServerClient({ updateError: { message: 'unique constraint violation' } })
    const result = await changeEmail(VALID_CHANGE_EMAIL_INPUT)
    expect(result).toEqual({
      success: false,
      error: 'settings.changeEmail.errors.emailInUse',
    })
  })

  it('returns a generic error for any other Supabase updateUser failure', async () => {
    mockServerClient({ updateError: { message: 'unexpected server error' } })
    const result = await changeEmail(VALID_CHANGE_EMAIL_INPUT)
    expect(result).toEqual({ success: false, error: 'settings.changeEmail.errors.generic' })
  })

  it('returns success on the happy path', async () => {
    mockServerClient()
    const result = await changeEmail(VALID_CHANGE_EMAIL_INPUT)
    expect(result).toEqual({ success: true })
  })

  it('calls updateUser with the new email on the happy path', async () => {
    const client = mockServerClient()
    await changeEmail(VALID_CHANGE_EMAIL_INPUT)
    expect(client.auth.updateUser).toHaveBeenCalledWith({
      email: VALID_CHANGE_EMAIL_INPUT.newEmail,
    })
  })
})

// ---------------------------------------------------------------------------
// changePassword
// ---------------------------------------------------------------------------

describe('changePassword', () => {
  it('returns the passwordMismatch i18n key when Zod refine fails', async () => {
    mockServerClient()
    const result = await changePassword({
      currentPassword: 'OldPass1',
      newPassword: 'NewPass2',
      confirmPassword: 'Different2', // mismatch
    })
    expect(result).toEqual({
      success: false,
      error: 'settings.changePassword.errors.passwordMismatch',
    })
    // Must not reach Supabase on a parse failure
    expect(supabaseServer.createClient).not.toHaveBeenCalled()
  })

  it('returns a generic error for other parse failures (e.g. weak new password)', async () => {
    mockServerClient()
    const result = await changePassword({
      currentPassword: 'OldPass1',
      newPassword: 'weak',   // fails strongPassword rule
      confirmPassword: 'weak',
    })
    // Zod message for weak password is a raw English string, not an i18n key.
    // What matters is that success is false and we didn't reach Supabase.
    expect(result.success).toBe(false)
    expect(supabaseServer.createClient).not.toHaveBeenCalled()
  })

  it('returns a generic error when the user is not authenticated', async () => {
    vi.mocked(session.getCurrentUser).mockResolvedValue(null)
    mockServerClient()
    const result = await changePassword(VALID_CHANGE_PASSWORD_INPUT)
    expect(result).toEqual({ success: false, error: 'settings.changePassword.errors.generic' })
  })

  it('returns incorrectPassword error when signInWithPassword fails', async () => {
    mockServerClient({ signInError: { message: 'Invalid login credentials' } })
    const result = await changePassword(VALID_CHANGE_PASSWORD_INPUT)
    expect(result).toEqual({
      success: false,
      error: 'settings.changePassword.errors.incorrectPassword',
    })
  })

  it('calls signInWithPassword with the user email and the provided current password', async () => {
    const client = mockServerClient()
    await changePassword(VALID_CHANGE_PASSWORD_INPUT)
    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
      email: USER.email,
      password: VALID_CHANGE_PASSWORD_INPUT.currentPassword,
    })
  })

  it('returns a generic error when updateUser fails', async () => {
    mockServerClient({ updateError: { message: 'unexpected error' } })
    const result = await changePassword(VALID_CHANGE_PASSWORD_INPUT)
    expect(result).toEqual({ success: false, error: 'settings.changePassword.errors.generic' })
  })

  it('returns success on the happy path', async () => {
    mockServerClient()
    const result = await changePassword(VALID_CHANGE_PASSWORD_INPUT)
    expect(result).toEqual({ success: true })
  })

  it('calls updateUser with the new password on the happy path', async () => {
    const client = mockServerClient()
    await changePassword(VALID_CHANGE_PASSWORD_INPUT)
    expect(client.auth.updateUser).toHaveBeenCalledWith({
      password: VALID_CHANGE_PASSWORD_INPUT.newPassword,
    })
  })

  it('does NOT call updateUser if signInWithPassword fails', async () => {
    const client = mockServerClient({ signInError: { message: 'wrong password' } })
    await changePassword(VALID_CHANGE_PASSWORD_INPUT)
    expect(client.auth.updateUser).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// deleteAccount
// ---------------------------------------------------------------------------

describe('deleteAccount', () => {
  it('returns a generic error when the user is not authenticated', async () => {
    vi.mocked(session.getCurrentUser).mockResolvedValue(null)
    const result = await deleteAccount()
    expect(result).toEqual({
      success: false,
      error: 'settings.deleteAccount.dialog.errors.generic',
    })
    // Neither Supabase client should be touched
    expect(supabaseAdmin.createAdminClient).not.toHaveBeenCalled()
  })

  it('returns a generic error when admin.deleteUser fails', async () => {
    mockAdminClient({ deleteError: { message: 'deletion failed' } })
    mockServerClient()
    const result = await deleteAccount()
    expect(result).toEqual({
      success: false,
      error: 'settings.deleteAccount.dialog.errors.generic',
    })
  })

  it('calls admin.deleteUser with the authenticated user id', async () => {
    const admin = mockAdminClient()
    mockServerClient()
    await deleteAccount()
    expect(admin.auth.admin.deleteUser).toHaveBeenCalledWith(USER.id)
  })

  it('calls signOut after a successful deletion to invalidate the session', async () => {
    mockAdminClient()
    const client = mockServerClient()
    await deleteAccount()
    expect(client.auth.signOut).toHaveBeenCalled()
  })

  it('does NOT call signOut if admin.deleteUser fails', async () => {
    mockAdminClient({ deleteError: { message: 'deletion failed' } })
    const client = mockServerClient()
    await deleteAccount()
    expect(client.auth.signOut).not.toHaveBeenCalled()
  })

  it('returns success on the happy path', async () => {
    mockAdminClient()
    mockServerClient()
    const result = await deleteAccount()
    expect(result).toEqual({ success: true })
  })
})
