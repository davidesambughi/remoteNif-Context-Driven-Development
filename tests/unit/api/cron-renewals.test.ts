/**
 * Unit tests for app/api/cron/renewals/route.ts
 *
 * Verifies authentication, cohort processing, and email dispatch.
 * DB queries and sendEmail are mocked — no real network calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/cron/renewals/route'
import type { RenewalReminderTarget } from '@/lib/db/queries'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/env', () => ({
  env: {
    CRON_SECRET: 'test-secret',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  },
}))

vi.mock('@/lib/db/queries', () => ({
  getOrdersForRenewalReminders: vi.fn(),
}))

vi.mock('@/lib/email/send', () => ({
  sendEmail: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(authHeader?: string): Request {
  const headers = new Headers()
  if (authHeader !== undefined) headers.set('Authorization', authHeader)
  return new Request('http://localhost:3000/api/cron/renewals', { headers })
}

function makeTarget(overrides: Partial<RenewalReminderTarget> = {}): RenewalReminderTarget {
  return {
    orderId: 'order-uuid-1',
    userId: 'user-uuid-1',
    email: 'customer@example.com',
    language: 'en',
    fullName: 'Jane Smith',
    fiscalRepExpiresAt: new Date('2026-06-01'),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/cron/renewals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -- Authentication --

  it('returns 401 when Authorization header is missing', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ error: 'Unauthorized' })
  })

  it('returns 401 when Authorization header has wrong secret', async () => {
    const res = await GET(makeRequest('Bearer wrong-secret'))
    expect(res.status).toBe(401)
  })

  it('returns 401 when Authorization header is not Bearer format', async () => {
    const res = await GET(makeRequest('Basic test-secret'))
    expect(res.status).toBe(401)
  })

  // -- Happy path --

  it('returns 200 with processed count 0 when no cohorts match', async () => {
    const { getOrdersForRenewalReminders } = await import('@/lib/db/queries')
    vi.mocked(getOrdersForRenewalReminders).mockResolvedValue([])

    const res = await GET(makeRequest('Bearer test-secret'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ success: true, processed: 0 })
  })

  it('fires sendEmail for each target across all three cohorts', async () => {
    const { getOrdersForRenewalReminders } = await import('@/lib/db/queries')
    const { sendEmail } = await import('@/lib/email/send')

    // 30-day cohort: 1 customer, 15-day: 2, expired: 1
    vi.mocked(getOrdersForRenewalReminders)
      .mockResolvedValueOnce([makeTarget({ orderId: 'o1' })])           // 30 days
      .mockResolvedValueOnce([makeTarget({ orderId: 'o2' }), makeTarget({ orderId: 'o3' })]) // 15 days
      .mockResolvedValueOnce([makeTarget({ orderId: 'o4' })])           // expired

    const res = await GET(makeRequest('Bearer test-secret'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ success: true, processed: 4 })
    expect(sendEmail).toHaveBeenCalledTimes(4)
  })

  it('sends correct interval for each cohort', async () => {
    const { getOrdersForRenewalReminders } = await import('@/lib/db/queries')
    const { sendEmail } = await import('@/lib/email/send')

    const target = makeTarget()
    vi.mocked(getOrdersForRenewalReminders)
      .mockResolvedValueOnce([target])  // 30 days
      .mockResolvedValueOnce([])        // 15 days
      .mockResolvedValueOnce([])        // expired

    await GET(makeRequest('Bearer test-secret'))

    expect(sendEmail).toHaveBeenCalledWith(
      target.email,
      target.language,
      expect.objectContaining({ template: 'renewal_reminder', interval: '30_days' }),
    )
  })

  it('sends locale-aware renewalUrl with correct orderId', async () => {
    const { getOrdersForRenewalReminders } = await import('@/lib/db/queries')
    const { sendEmail } = await import('@/lib/email/send')

    const target = makeTarget({ orderId: 'abc-123', language: 'fr' })
    vi.mocked(getOrdersForRenewalReminders)
      .mockResolvedValueOnce([target])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    await GET(makeRequest('Bearer test-secret'))

    expect(sendEmail).toHaveBeenCalledWith(
      target.email,
      'fr',
      expect.objectContaining({
        renewalUrl: 'http://localhost:3000/fr/renewal?orderId=abc-123',
      }),
    )
  })

  it('falls back to email local-part when fullName is null', async () => {
    const { getOrdersForRenewalReminders } = await import('@/lib/db/queries')
    const { sendEmail } = await import('@/lib/email/send')

    const target = makeTarget({ fullName: null, email: 'jane@example.com' })
    vi.mocked(getOrdersForRenewalReminders)
      .mockResolvedValueOnce([target])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    await GET(makeRequest('Bearer test-secret'))

    expect(sendEmail).toHaveBeenCalledWith(
      target.email,
      target.language,
      expect.objectContaining({ customerName: 'jane' }),
    )
  })

  it('continues processing remaining cohorts if one DB query fails', async () => {
    const { getOrdersForRenewalReminders } = await import('@/lib/db/queries')
    const { sendEmail } = await import('@/lib/email/send')

    vi.mocked(getOrdersForRenewalReminders)
      .mockRejectedValueOnce(new Error('DB error'))   // 30 days fails
      .mockResolvedValueOnce([makeTarget()])          // 15 days succeeds
      .mockResolvedValueOnce([])                     // expired

    const res = await GET(makeRequest('Bearer test-secret'))
    expect(res.status).toBe(200)
    // 1 email sent from the 15-day cohort despite the 30-day failure
    expect(sendEmail).toHaveBeenCalledTimes(1)
    const body = await res.json()
    expect(body.processed).toBe(1)
  })
})
