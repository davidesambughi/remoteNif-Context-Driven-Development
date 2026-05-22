/**
 * Tests for the Zod validation schemas in lib/validations/settings.ts
 * and the strongPassword export from lib/validations/auth.ts.
 *
 * WHY TEST SCHEMAS?
 * These schemas are the first line of defence in the settings Server Actions.
 * If a rule changes here, the behaviour the user experiences changes too —
 * broken schemas would silently let bad data reach Supabase.
 *
 * All tests use safeParse so a failure gives a clean assertion message
 * rather than an uncaught Zod exception.
 */

import { describe, it, expect } from 'vitest'
import {
  changeEmailSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from '@/lib/validations/settings'
import { strongPassword } from '@/lib/validations/auth'

// ---------------------------------------------------------------------------
// strongPassword — exported from auth.ts so settings.ts can reuse it
// ---------------------------------------------------------------------------

describe('strongPassword (exported from auth.ts)', () => {
  // Smoke-test the export itself — if it wasn't exported, this import would fail.
  it('accepts a password that meets all strength requirements', () => {
    const result = strongPassword.safeParse('Password123')
    expect(result.success).toBe(true)
  })

  it('rejects a password shorter than 8 characters', () => {
    expect(strongPassword.safeParse('Pass1').success).toBe(false)
  })

  it('rejects a password with no uppercase letter', () => {
    expect(strongPassword.safeParse('password123').success).toBe(false)
  })

  it('rejects a password with no lowercase letter', () => {
    expect(strongPassword.safeParse('PASSWORD123').success).toBe(false)
  })

  it('rejects a password with no digit', () => {
    expect(strongPassword.safeParse('PasswordOnly').success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// changeEmailSchema
// ---------------------------------------------------------------------------

describe('changeEmailSchema', () => {
  it('accepts a valid new email and a non-empty current password', () => {
    const result = changeEmailSchema.safeParse({
      newEmail: 'new@example.com',
      currentPassword: 'anypassword',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a malformed email address', () => {
    const result = changeEmailSchema.safeParse({
      newEmail: 'not-an-email',
      currentPassword: 'anypassword',
    })
    expect(result.success).toBe(false)
  })

  it('rejects an empty email', () => {
    const result = changeEmailSchema.safeParse({
      newEmail: '',
      currentPassword: 'anypassword',
    })
    expect(result.success).toBe(false)
  })

  // currentPassword is min(1) — an empty string means the field was not filled in.
  it('rejects an empty current password', () => {
    const result = changeEmailSchema.safeParse({
      newEmail: 'new@example.com',
      currentPassword: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing fields entirely', () => {
    expect(changeEmailSchema.safeParse({}).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// changePasswordSchema
// ---------------------------------------------------------------------------

describe('changePasswordSchema', () => {
  it('accepts valid current password, matching strong new password', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'OldPass1',
      newPassword: 'NewPass1',
      confirmPassword: 'NewPass1',
    })
    expect(result.success).toBe(true)
  })

  // The refine() on the schema checks that newPassword === confirmPassword.
  // This is the most important rule — a mismatch must always fail.
  it('rejects mismatched newPassword and confirmPassword', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'OldPass1',
      newPassword: 'NewPass1',
      confirmPassword: 'Different1',
    })
    expect(result.success).toBe(false)
  })

  // When passwords don't match, the error must be on confirmPassword —
  // the form uses this path to highlight the right field.
  it('attaches the mismatch error to the confirmPassword field', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'OldPass1',
      newPassword: 'NewPass1',
      confirmPassword: 'Different1',
    })
    if (result.success) throw new Error('Expected failure')
    const paths = result.error.issues.map((i) => i.path.join('.'))
    expect(paths).toContain('confirmPassword')
  })

  // The mismatch error message is an i18n key — the action returns it directly
  // to the client so it can be translated.
  it('uses the i18n key as the mismatch error message', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'OldPass1',
      newPassword: 'NewPass1',
      confirmPassword: 'Different1',
    })
    if (result.success) throw new Error('Expected failure')
    const messages = result.error.issues.map((i) => i.message)
    expect(messages).toContain('settings.changePassword.errors.passwordMismatch')
  })

  // newPassword must satisfy the strongPassword rule — a weak new password fails
  // even if currentPassword and confirmPassword are otherwise valid.
  it('rejects a weak new password (no uppercase letter)', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'OldPass1',
      newPassword: 'weakpass1',
      confirmPassword: 'weakpass1',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a new password shorter than 8 characters', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'OldPass1',
      newPassword: 'Sh0rt',
      confirmPassword: 'Sh0rt',
    })
    expect(result.success).toBe(false)
  })

  // currentPassword has no strength requirement — it only needs to be non-empty.
  // The actual check happens server-side via signInWithPassword.
  it('accepts a weak current password (strength is only enforced on newPassword)', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'weak',
      newPassword: 'NewPass1',
      confirmPassword: 'NewPass1',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an empty current password', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: '',
      newPassword: 'NewPass1',
      confirmPassword: 'NewPass1',
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// deleteAccountSchema
// ---------------------------------------------------------------------------

describe('deleteAccountSchema', () => {
  // Only the exact string "DELETE" (uppercase) must pass.
  // This is validated client-side to disable the confirm button, but the schema
  // documents the contract clearly.
  it('accepts the exact string "DELETE"', () => {
    const result = deleteAccountSchema.safeParse({ confirmation: 'DELETE' })
    expect(result.success).toBe(true)
  })

  // Lowercase or mixed-case must be rejected — the user must type it exactly.
  it('rejects "delete" (lowercase)', () => {
    expect(deleteAccountSchema.safeParse({ confirmation: 'delete' }).success).toBe(false)
  })

  it('rejects "Delete" (mixed case)', () => {
    expect(deleteAccountSchema.safeParse({ confirmation: 'Delete' }).success).toBe(false)
  })

  it('rejects any other string', () => {
    expect(deleteAccountSchema.safeParse({ confirmation: 'yes' }).success).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(deleteAccountSchema.safeParse({ confirmation: '' }).success).toBe(false)
  })
})
