/**
 * Tests for the Zod validation schemas in lib/validations/auth.ts.
 *
 * WHY TEST SCHEMAS?
 * The schemas are the first line of defense in every Server Action.
 * If a schema is wrong, invalid data silently reaches Supabase or the DB.
 * These tests also document the exact rules the app enforces, which makes
 * them useful as a reference — not just a safety net.
 *
 * KEY CONCEPT — safeParse vs parse:
 *   schema.parse(data)      → throws an error if validation fails
 *   schema.safeParse(data)  → never throws; returns { success: true, data }
 *                             or { success: false, error }
 * We use safeParse in tests so a failed assertion gives a clean message
 * instead of an uncaught exception.
 */

import { describe, it, expect } from 'vitest'
import {
  signUpSchema,
  signInSchema,
  requestPasswordResetSchema,
  updatePasswordSchema,
} from '@/lib/validations/auth'

// ---------------------------------------------------------------------------
// signUpSchema
// ---------------------------------------------------------------------------

describe('signUpSchema', () => {
  // The "happy path" — a valid input that should always pass.
  // If this test breaks, something fundamental changed in the schema.
  it('accepts a valid email, strong password, and supported locale', () => {
    const result = signUpSchema.safeParse({
      email: 'user@example.com',
      password: 'Password123',
      language: 'en',
    })
    expect(result.success).toBe(true)
  })

  // Passwords shorter than 8 characters must be rejected.
  // Supabase has its own minimum too, but we enforce it here first
  // so the error message is in our control.
  it('rejects a password shorter than 8 characters', () => {
    const result = signUpSchema.safeParse({
      email: 'user@example.com',
      password: 'Short1',
      language: 'en',
    })
    expect(result.success).toBe(false)
  })

  // Each strength requirement is validated independently so the user gets
  // a specific error message rather than a generic "invalid password".
  it('rejects a password with no uppercase letter', () => {
    const result = signUpSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      language: 'en',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a password with no lowercase letter', () => {
    const result = signUpSchema.safeParse({
      email: 'user@example.com',
      password: 'PASSWORD123',
      language: 'en',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a password with no number', () => {
    const result = signUpSchema.safeParse({
      email: 'user@example.com',
      password: 'PasswordOnly',
      language: 'en',
    })
    expect(result.success).toBe(false)
  })

  // An email without '@' and a domain is not a valid email.
  it('rejects a malformed email address', () => {
    const result = signUpSchema.safeParse({
      email: 'not-an-email',
      password: 'Password123',
      language: 'en',
    })
    expect(result.success).toBe(false)
  })

  // The language field is an enum — only 'en', 'fr', 'es', 'de' are valid.
  // If a new locale is added to the app, this test will fail as a reminder
  // to update the schema too.
  it('rejects an unsupported language code', () => {
    const result = signUpSchema.safeParse({
      email: 'user@example.com',
      password: 'Password123',
      language: 'it', // Italian — not yet supported
    })
    expect(result.success).toBe(false)
  })

  // All four supported locales should pass.
  it.each(['en', 'fr', 'es', 'de'])('accepts language "%s"', (language) => {
    const result = signUpSchema.safeParse({
      email: 'user@example.com',
      password: 'Password123',
      language,
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// signInSchema
// ---------------------------------------------------------------------------

describe('signInSchema', () => {
  it('accepts a valid email and any non-empty password', () => {
    const result = signInSchema.safeParse({
      email: 'user@example.com',
      password: 'anypassword',
    })
    expect(result.success).toBe(true)
  })

  // Sign-in intentionally allows passwords shorter than 8 chars —
  // the user may have created their account before the minimum was introduced.
  // The minimum only applies at sign-up.
  it('accepts a short password (sign-in has no minimum length)', () => {
    const result = signInSchema.safeParse({
      email: 'user@example.com',
      password: 'abc',
    })
    expect(result.success).toBe(true)
  })

  // An empty password is rejected because it could only mean a blank form submission.
  it('rejects an empty password', () => {
    const result = signInSchema.safeParse({
      email: 'user@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a malformed email address', () => {
    const result = signInSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// requestPasswordResetSchema
// ---------------------------------------------------------------------------

describe('requestPasswordResetSchema', () => {
  it('accepts a valid email and supported locale', () => {
    const result = requestPasswordResetSchema.safeParse({
      email: 'user@example.com',
      locale: 'fr',
    })
    expect(result.success).toBe(true)
  })

  // The locale is used to build the password reset redirect URL.
  // An unsupported locale would produce a broken URL like /it/new-password.
  it('rejects an unsupported locale', () => {
    const result = requestPasswordResetSchema.safeParse({
      email: 'user@example.com',
      locale: 'it',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a malformed email address', () => {
    const result = requestPasswordResetSchema.safeParse({
      email: 'bad-email',
      locale: 'en',
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// updatePasswordSchema
// ---------------------------------------------------------------------------

describe('updatePasswordSchema', () => {
  it('accepts two matching passwords that meet all strength requirements', () => {
    const result = updatePasswordSchema.safeParse({
      password: 'Newpassword1',
      confirmPassword: 'Newpassword1',
    })
    expect(result.success).toBe(true)
  })

  // Strength rules apply to `password` only — `confirmPassword` just needs to match.
  it('rejects a password that fails the strength requirement', () => {
    const result = updatePasswordSchema.safeParse({
      password: 'alllowercase1', // missing uppercase
      confirmPassword: 'alllowercase1',
    })
    expect(result.success).toBe(false)
  })

  // The .refine() rule on the schema checks that both fields match.
  // This is the most important rule here — a mismatch must always fail.
  it('rejects mismatched passwords', () => {
    const result = updatePasswordSchema.safeParse({
      password: 'Newpassword1',
      confirmPassword: 'Differentpassword1',
    })
    expect(result.success).toBe(false)
  })

  // When passwords don't match, the error is attached to the confirmPassword field.
  // This tells the form exactly which field to highlight.
  it('attaches the mismatch error to the confirmPassword field', () => {
    const result = updatePasswordSchema.safeParse({
      password: 'Newpassword1',
      confirmPassword: 'Differentpassword1',
    })
    if (result.success) throw new Error('Expected failure')
    const paths = result.error.issues.map((i) => i.path.join('.'))
    expect(paths).toContain('confirmPassword')
  })

  it('rejects a password shorter than 8 characters', () => {
    const result = updatePasswordSchema.safeParse({
      password: 'Short1',
      confirmPassword: 'Short1',
    })
    expect(result.success).toBe(false)
  })
})
