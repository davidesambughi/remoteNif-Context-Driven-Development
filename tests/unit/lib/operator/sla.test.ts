import { describe, it, expect, vi, afterEach } from 'vitest'
import { getRemainingMs, getColorClass, formatRemaining, SLA_MS } from '@/lib/operator/sla'

// ---------------------------------------------------------------------------
// getRemainingMs
// ---------------------------------------------------------------------------

describe('getRemainingMs', () => {
  afterEach(() => vi.useRealTimers())

  it('returns positive ms when deadline has not passed', () => {
    vi.useFakeTimers()
    const approvedAt = new Date(Date.now() - 10 * 60 * 60 * 1000) // 10h ago
    vi.setSystemTime(Date.now())

    const remaining = getRemainingMs(approvedAt.toISOString())
    // 48h SLA − 10h elapsed = 38h remaining
    expect(remaining).toBeCloseTo(38 * 60 * 60 * 1000, -3) // within 1 second
  })

  it('returns negative ms when deadline has passed', () => {
    vi.useFakeTimers()
    const approvedAt = new Date(Date.now() - 50 * 60 * 60 * 1000) // 50h ago
    vi.setSystemTime(Date.now())

    const remaining = getRemainingMs(approvedAt.toISOString())
    // 48h SLA − 50h elapsed = −2h
    expect(remaining).toBeLessThan(0)
  })

  it('accepts a Date object as well as a string', () => {
    vi.useFakeTimers()
    const approvedAt = new Date(Date.now() - SLA_MS / 2) // exactly half elapsed
    vi.setSystemTime(Date.now())

    const fromString = getRemainingMs(approvedAt.toISOString())
    const fromDate = getRemainingMs(approvedAt)
    expect(fromString).toBeCloseTo(fromDate, 0)
  })
})

// ---------------------------------------------------------------------------
// getColorClass — color threshold business logic
// ---------------------------------------------------------------------------

describe('getColorClass', () => {
  it('returns green class when > 24 hours remain', () => {
    const ms = 25 * 60 * 60 * 1000 // 25h
    expect(getColorClass(ms)).toBe('text-success font-medium')
  })

  it('returns green class at exactly 24h + 1ms boundary', () => {
    const ms = 24 * 60 * 60 * 1000 + 1 // just over 24h
    expect(getColorClass(ms)).toBe('text-success font-medium')
  })

  it('returns amber class when between 8 and 24 hours remain', () => {
    const ms = 16 * 60 * 60 * 1000 // 16h
    expect(getColorClass(ms)).toBe('text-warning font-medium')
  })

  it('returns amber class at exactly 8h boundary', () => {
    const ms = 8 * 60 * 60 * 1000 // exactly 8h
    expect(getColorClass(ms)).toBe('text-warning font-medium')
  })

  it('returns amber class at exactly 24h boundary', () => {
    const ms = 24 * 60 * 60 * 1000 // exactly 24h — NOT > 24h, so amber not green
    expect(getColorClass(ms)).toBe('text-warning font-medium')
  })

  it('returns red class when < 8 hours remain', () => {
    const ms = 4 * 60 * 60 * 1000 // 4h
    expect(getColorClass(ms)).toBe('text-error font-medium')
  })

  it('returns red class at 1ms remaining', () => {
    expect(getColorClass(1)).toBe('text-error font-medium')
  })

  it('returns red bold class when exactly at deadline (0ms)', () => {
    expect(getColorClass(0)).toBe('text-error font-bold')
  })

  it('returns red bold class when overdue (negative ms)', () => {
    expect(getColorClass(-1)).toBe('text-error font-bold')
    expect(getColorClass(-5 * 60 * 60 * 1000)).toBe('text-error font-bold')
  })
})

// ---------------------------------------------------------------------------
// formatRemaining
// ---------------------------------------------------------------------------

describe('formatRemaining', () => {
  it('returns null when overdue', () => {
    expect(formatRemaining(0)).toBeNull()
    expect(formatRemaining(-1000)).toBeNull()
  })

  it('returns correct hours and minutes', () => {
    const ms = (10 * 60 + 30) * 60 * 1000 // 10h 30m
    expect(formatRemaining(ms)).toEqual({ hours: 10, minutes: 30 })
  })

  it('floors partial minutes (does not round up)', () => {
    const ms = (5 * 60 + 45) * 60 * 1000 + 59_000 // 5h 45m 59s — should still show 45m
    expect(formatRemaining(ms)).toEqual({ hours: 5, minutes: 45 })
  })

  it('returns 0 minutes when exactly on the hour', () => {
    const ms = 3 * 60 * 60 * 1000 // exactly 3h
    expect(formatRemaining(ms)).toEqual({ hours: 3, minutes: 0 })
  })

  it('handles near-zero remaining time (1 minute left)', () => {
    const ms = 60_000 // 1 minute
    expect(formatRemaining(ms)).toEqual({ hours: 0, minutes: 1 })
  })
})
