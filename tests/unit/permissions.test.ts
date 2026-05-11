/**
 * Tests for the role helper functions in lib/auth/permissions.ts.
 *
 * WHY TEST THESE?
 * They're tiny functions — three lines total. But they're called in layouts
 * and Server Actions to decide whether someone can see admin pages or
 * perform privileged mutations. A wrong return value is a security gap, not
 * just a UI bug. The tests also document exactly which role maps to which
 * access level, which is useful context when reviewing future features.
 *
 * KEY CONCEPT — the "arrange, act, assert" pattern:
 * Most tests follow three steps:
 *   1. Arrange — set up the input data
 *   2. Act     — call the function being tested
 *   3. Assert  — check the result with expect()
 * You'll see this pattern clearly in the tests below.
 */

import { describe, it, expect } from 'vitest'
import { isAdmin, isOperator, isCustomer } from '@/lib/auth/permissions'
import type { SelectUser } from '@/lib/db/schema'

// ---------------------------------------------------------------------------
// Test helper
// ---------------------------------------------------------------------------

/**
 * Creates a minimal SelectUser object with the given role.
 *
 * WHY A HELPER?
 * SelectUser requires several fields (id, email, createdAt, etc.) that the
 * permission functions don't actually use. Rather than repeating all those
 * fields in every test, we centralise them here. If the SelectUser type gains
 * a new required field, we only fix it in one place.
 */
function makeUser(role: SelectUser['role']): SelectUser {
  return {
    id: 'test-id',
    email: 'test@example.com',
    role,
    language: 'en',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

// ---------------------------------------------------------------------------
// isAdmin
// ---------------------------------------------------------------------------

describe('isAdmin', () => {
  it('returns true for an admin user', () => {
    const user = makeUser('admin')
    expect(isAdmin(user)).toBe(true)
  })

  it('returns false for an operator user', () => {
    const user = makeUser('operator')
    expect(isAdmin(user)).toBe(false)
  })

  it('returns false for a customer user', () => {
    const user = makeUser('customer')
    expect(isAdmin(user)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isOperator
// ---------------------------------------------------------------------------

describe('isOperator', () => {
  it('returns true for an operator user', () => {
    const user = makeUser('operator')
    expect(isOperator(user)).toBe(true)
  })

  it('returns false for an admin user', () => {
    const user = makeUser('admin')
    expect(isOperator(user)).toBe(false)
  })

  it('returns false for a customer user', () => {
    const user = makeUser('customer')
    expect(isOperator(user)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isCustomer
// ---------------------------------------------------------------------------

describe('isCustomer', () => {
  it('returns true for a customer user', () => {
    const user = makeUser('customer')
    expect(isCustomer(user)).toBe(true)
  })

  it('returns false for an admin user', () => {
    const user = makeUser('admin')
    expect(isCustomer(user)).toBe(false)
  })

  it('returns false for an operator user', () => {
    const user = makeUser('operator')
    expect(isCustomer(user)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Role exclusivity
// ---------------------------------------------------------------------------

// A sanity check: exactly one role helper should return true for any given user.
// If two helpers return true for the same user, there's a logic overlap somewhere.
describe('role exclusivity', () => {
  it('exactly one helper returns true for an admin', () => {
    const user = makeUser('admin')
    const trueCount = [isAdmin(user), isOperator(user), isCustomer(user)].filter(Boolean).length
    expect(trueCount).toBe(1)
  })

  it('exactly one helper returns true for an operator', () => {
    const user = makeUser('operator')
    const trueCount = [isAdmin(user), isOperator(user), isCustomer(user)].filter(Boolean).length
    expect(trueCount).toBe(1)
  })

  it('exactly one helper returns true for a customer', () => {
    const user = makeUser('customer')
    const trueCount = [isAdmin(user), isOperator(user), isCustomer(user)].filter(Boolean).length
    expect(trueCount).toBe(1)
  })
})
