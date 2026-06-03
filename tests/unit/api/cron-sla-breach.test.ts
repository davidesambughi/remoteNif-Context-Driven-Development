/**
 * Unit tests for app/api/cron/sla-breach/route.ts
 *
 * Verifies authentication, overdue order processing, email dispatch,
 * and dedup-column stamping. DB queries and sendEmail are mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/cron/sla-breach/route'
import type { OverdueExpressOrder } from '@/lib/db/queries'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/env', () => ({
  env: {
    CRON_SECRET: 'test-secret',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    ADMIN_EMAIL: 'admin@example.com',
  },
}))

vi.mock('@/lib/db/queries', () => ({
  getOverdueExpressOrders: vi.fn(),
  markSlaBreachAlertSent: vi.fn(),
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
  return new Request('http://localhost:3000/api/cron/sla-breach', { headers })
}

/** Returns an overdue order whose documentsApprovedAt is `hoursAgo` hours in the past. */
function makeOrder(hoursAgo: number, overrides: Partial<OverdueExpressOrder> = {}): OverdueExpressOrder {
  return {
    id: `order-${crypto.randomUUID()}`,
    fullName: 'João Silva',
    documentsApprovedAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/cron/sla-breach', () => {
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

  // -- DB failure --

  it('returns 500 when getOverdueExpressOrders throws', async () => {
    const { getOverdueExpressOrders } = await import('@/lib/db/queries')
    vi.mocked(getOverdueExpressOrders).mockRejectedValue(new Error('DB timeout'))

    const res = await GET(makeRequest('Bearer test-secret'))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toEqual({ success: false, error: 'db_query_failed' })
  })

  // -- Happy path: no overdue orders --

  it('returns 200 with processed: 0 when no overdue orders exist', async () => {
    const { getOverdueExpressOrders } = await import('@/lib/db/queries')
    vi.mocked(getOverdueExpressOrders).mockResolvedValue([])

    const res = await GET(makeRequest('Bearer test-secret'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ success: true, processed: 0 })
  })

  // -- Happy path: one order --

  it('calls sendEmail once for a single overdue order', async () => {
    const { getOverdueExpressOrders } = await import('@/lib/db/queries')
    const { sendEmail } = await import('@/lib/email/send')
    vi.mocked(getOverdueExpressOrders).mockResolvedValue([makeOrder(50)])

    await GET(makeRequest('Bearer test-secret'))

    expect(sendEmail).toHaveBeenCalledOnce()
  })

  it('sends to ADMIN_EMAIL with admin_sla_breach template', async () => {
    const { getOverdueExpressOrders } = await import('@/lib/db/queries')
    const { sendEmail } = await import('@/lib/email/send')
    const order = makeOrder(50, { id: 'abc-order-id', fullName: 'Maria Costa' })
    vi.mocked(getOverdueExpressOrders).mockResolvedValue([order])

    await GET(makeRequest('Bearer test-secret'))

    expect(sendEmail).toHaveBeenCalledWith(
      'admin@example.com',
      'en',
      expect.objectContaining({
        template: 'admin_sla_breach',
        orderId: 'abc-order-id',
        customerName: 'Maria Costa',
      }),
    )
  })

  it('computes hoursOverdue as an integer floor of hours since documentsApprovedAt', async () => {
    const { getOverdueExpressOrders } = await import('@/lib/db/queries')
    const { sendEmail } = await import('@/lib/email/send')
    // Exactly 72.5 hours overdue — should floor to 72
    const order = makeOrder(72.5)
    vi.mocked(getOverdueExpressOrders).mockResolvedValue([order])

    await GET(makeRequest('Bearer test-secret'))

    const [, , payload] = vi.mocked(sendEmail).mock.calls[0]!
    expect((payload as { hoursOverdue: number }).hoursOverdue).toBe(72)
  })

  it('uses "Unknown" as customerName when fullName is null', async () => {
    const { getOverdueExpressOrders } = await import('@/lib/db/queries')
    const { sendEmail } = await import('@/lib/email/send')
    vi.mocked(getOverdueExpressOrders).mockResolvedValue([makeOrder(50, { fullName: null })])

    await GET(makeRequest('Bearer test-secret'))

    expect(sendEmail).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ customerName: 'Unknown' }),
    )
  })

  it('calls markSlaBreachAlertSent for each order', async () => {
    const { getOverdueExpressOrders, markSlaBreachAlertSent } = await import('@/lib/db/queries')
    const o1 = makeOrder(50, { id: 'order-1' })
    const o2 = makeOrder(60, { id: 'order-2' })
    vi.mocked(getOverdueExpressOrders).mockResolvedValue([o1, o2])

    await GET(makeRequest('Bearer test-secret'))

    expect(markSlaBreachAlertSent).toHaveBeenCalledTimes(2)
    expect(markSlaBreachAlertSent).toHaveBeenCalledWith('order-1')
    expect(markSlaBreachAlertSent).toHaveBeenCalledWith('order-2')
  })

  it('returns processed count equal to the number of overdue orders', async () => {
    const { getOverdueExpressOrders } = await import('@/lib/db/queries')
    vi.mocked(getOverdueExpressOrders).mockResolvedValue([makeOrder(50), makeOrder(60), makeOrder(70)])

    const res = await GET(makeRequest('Bearer test-secret'))
    const body = await res.json()
    expect(body).toEqual({ success: true, processed: 3 })
  })

  it('continues processing remaining orders if markSlaBreachAlertSent throws for one', async () => {
    const { getOverdueExpressOrders, markSlaBreachAlertSent } = await import('@/lib/db/queries')
    const { sendEmail } = await import('@/lib/email/send')
    const o1 = makeOrder(50, { id: 'order-fail' })
    const o2 = makeOrder(60, { id: 'order-ok' })
    vi.mocked(getOverdueExpressOrders).mockResolvedValue([o1, o2])
    vi.mocked(markSlaBreachAlertSent)
      .mockRejectedValueOnce(new Error('DB write failed'))
      .mockResolvedValueOnce(undefined)

    const res = await GET(makeRequest('Bearer test-secret'))
    // Both sendEmail calls should still fire even though the first mark failed
    expect(sendEmail).toHaveBeenCalledTimes(2)
    const body = await res.json()
    expect(body).toEqual({ success: true, processed: 2 })
  })
})
