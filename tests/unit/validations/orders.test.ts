/**
 * Tests for PersonalDetailsSchema in lib/validations/orders.ts.
 *
 * These tests guard the exact rules enforced before data reaches the DB.
 * If a field's constraints change, the corresponding test will break as a reminder
 * to audit the DB update query and any dependent UI too.
 */

import { describe, it, expect } from 'vitest'
import { PersonalDetailsSchema } from '@/lib/validations/orders'

// A valid payload that should always pass — the baseline for every other test.
const VALID = {
  fullName: 'Maria Da Silva',
  dateOfBirth: '1990-06-15',
  nationality: 'PT',
  passportNumber: 'AB1234567',
  passportExpiry: '2030-12-01',
  address: '123 Rua do Ouro, Lisbon 1100-001, Portugal',
}

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe('PersonalDetailsSchema — valid input', () => {
  it('accepts a fully valid payload', () => {
    const result = PersonalDetailsSchema.safeParse(VALID)
    expect(result.success).toBe(true)
  })

  it('accepts the minimum allowed fullName (2 chars)', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, fullName: 'Jo' })
    expect(result.success).toBe(true)
  })

  it('accepts a 2-letter ISO nationality code', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, nationality: 'GB' })
    expect(result.success).toBe(true)
  })

  it('accepts a 3-char passportNumber (minimum)', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, passportNumber: 'ABC' })
    expect(result.success).toBe(true)
  })

  it('accepts a 20-char passportNumber (maximum)', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, passportNumber: 'A'.repeat(20) })
    expect(result.success).toBe(true)
  })

  it('accepts an address at exactly 5 chars (minimum)', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, address: '12345' })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// fullName
// ---------------------------------------------------------------------------

describe('PersonalDetailsSchema — fullName', () => {
  it('rejects fullName shorter than 2 characters', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, fullName: 'A' })
    expect(result.success).toBe(false)
  })

  it('rejects an empty fullName', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, fullName: '' })
    expect(result.success).toBe(false)
  })

  it('rejects fullName longer than 150 characters', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, fullName: 'A'.repeat(151) })
    expect(result.success).toBe(false)
  })

  it('attaches the correct error key on short fullName', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, fullName: 'A' })
    if (result.success) throw new Error('Expected failure')
    const messages = result.error.issues.map((i) => i.message)
    expect(messages).toContain('validation.fullName.required')
  })
})

// ---------------------------------------------------------------------------
// dateOfBirth
// ---------------------------------------------------------------------------

describe('PersonalDetailsSchema — dateOfBirth', () => {
  it('rejects a date in DD/MM/YYYY format', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, dateOfBirth: '15/06/1990' })
    expect(result.success).toBe(false)
  })

  it('rejects a date in MM-DD-YYYY format', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, dateOfBirth: '06-15-1990' })
    expect(result.success).toBe(false)
  })

  it('rejects a plain year string', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, dateOfBirth: '1990' })
    expect(result.success).toBe(false)
  })

  it('rejects an empty string', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, dateOfBirth: '' })
    expect(result.success).toBe(false)
  })

  it('rejects a 5-digit year date', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, dateOfBirth: '19901-06-15' })
    expect(result.success).toBe(false)
  })

  it('attaches the correct error key on bad format', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, dateOfBirth: '15/06/1990' })
    if (result.success) throw new Error('Expected failure')
    const messages = result.error.issues.map((i) => i.message)
    expect(messages).toContain('validation.dateOfBirth.invalid')
  })
})

// ---------------------------------------------------------------------------
// nationality
// ---------------------------------------------------------------------------

describe('PersonalDetailsSchema — nationality', () => {
  it('rejects a 3-letter code', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, nationality: 'PRT' })
    expect(result.success).toBe(false)
  })

  it('rejects a 1-letter code', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, nationality: 'P' })
    expect(result.success).toBe(false)
  })

  it('rejects an empty string', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, nationality: '' })
    expect(result.success).toBe(false)
  })

  it('attaches the correct error key on bad nationality', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, nationality: 'PRT' })
    if (result.success) throw new Error('Expected failure')
    const messages = result.error.issues.map((i) => i.message)
    expect(messages).toContain('validation.nationality.invalid')
  })
})

// ---------------------------------------------------------------------------
// passportNumber
// ---------------------------------------------------------------------------

describe('PersonalDetailsSchema — passportNumber', () => {
  it('rejects a passport number shorter than 3 characters', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, passportNumber: 'AB' })
    expect(result.success).toBe(false)
  })

  it('rejects a passport number longer than 20 characters', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, passportNumber: 'A'.repeat(21) })
    expect(result.success).toBe(false)
  })

  it('rejects an empty string', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, passportNumber: '' })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// passportExpiry
// ---------------------------------------------------------------------------

describe('PersonalDetailsSchema — passportExpiry', () => {
  it('rejects a date in DD/MM/YYYY format', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, passportExpiry: '01/12/2030' })
    expect(result.success).toBe(false)
  })

  it('rejects an empty string', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, passportExpiry: '' })
    expect(result.success).toBe(false)
  })

  it('rejects a 5-digit year date', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, passportExpiry: '20301-12-01' })
    expect(result.success).toBe(false)
  })

  it('attaches the correct error key on bad format', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, passportExpiry: '01/12/2030' })
    if (result.success) throw new Error('Expected failure')
    const messages = result.error.issues.map((i) => i.message)
    expect(messages).toContain('validation.passportExpiry.invalid')
  })
})

// ---------------------------------------------------------------------------
// address
// ---------------------------------------------------------------------------

describe('PersonalDetailsSchema — address', () => {
  it('rejects an address shorter than 5 characters', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, address: '123' })
    expect(result.success).toBe(false)
  })

  it('rejects an empty address', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, address: '' })
    expect(result.success).toBe(false)
  })

  it('rejects an address longer than 500 characters', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, address: 'A'.repeat(501) })
    expect(result.success).toBe(false)
  })

  it('attaches the correct error key on short address', () => {
    const result = PersonalDetailsSchema.safeParse({ ...VALID, address: '123' })
    if (result.success) throw new Error('Expected failure')
    const messages = result.error.issues.map((i) => i.message)
    expect(messages).toContain('validation.address.required')
  })
})
