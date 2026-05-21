import { describe, it, expect } from 'vitest'
import { formatSubmissionDate } from '@/lib/utils/dates'

/**
 * formatSubmissionDate — pure function tests.
 * Tests deterministic output shapes, not exact locale strings (which vary by OS).
 */
describe('formatSubmissionDate', () => {
  const date = new Date('2026-01-12T14:30:00.000Z')

  it('returns a non-empty string', () => {
    expect(formatSubmissionDate(date)).toBeTruthy()
    expect(typeof formatSubmissionDate(date)).toBe('string')
  })

  it('includes the year', () => {
    expect(formatSubmissionDate(date)).toContain('2026')
  })

  it('includes the day digits', () => {
    // Day is 12 — should appear in the output
    const result = formatSubmissionDate(date)
    expect(result).toMatch(/12/)
  })

  it('includes hours and minutes in the output', () => {
    // Output should have time-like digits (HH:MM format or similar)
    const result = formatSubmissionDate(date)
    expect(result).toMatch(/\d{1,2}:\d{2}/)
  })

  it('handles midnight correctly without throwing', () => {
    const midnight = new Date('2026-06-01T00:00:00.000Z')
    expect(() => formatSubmissionDate(midnight)).not.toThrow()
    expect(formatSubmissionDate(midnight)).toContain('2026')
  })

  it('handles end-of-year date correctly', () => {
    const endOfYear = new Date('2026-12-31T23:59:00.000Z')
    expect(formatSubmissionDate(endOfYear)).toContain('2026')
  })
})
