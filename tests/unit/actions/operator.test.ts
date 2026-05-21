import { describe, it, expect, vi, beforeEach } from 'vitest'
import { markOrderAsSubmitted } from '@/app/actions/operator'

// ---------------------------------------------------------------------------
// Mocks — same pattern as admin.test.ts
// ---------------------------------------------------------------------------

vi.mock('@/lib/db/queries', () => ({
  getOrderStatusById: vi.fn(),
  markOrderSubmitted: vi.fn(),
  insertAuditLog: vi.fn(),
}))

vi.mock('@/lib/auth/session', () => ({
  requireRole: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import * as queries from '@/lib/db/queries'
import * as session from '@/lib/auth/session'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const OPERATOR = { id: 'd1e2f3a4-b5c6-4d1e-8f2a-3b4c5d6e7f8a', role: 'operator' as const }
const VALID_ORDER_ID = 'b2c3d4e5-f6a1-4b2c-9d3e-4f5a6b7c8d9e'

beforeEach(() => {
  vi.clearAllMocks()
  // Default: authenticated as operator
  vi.mocked(session.requireRole).mockResolvedValue(OPERATOR as never)
})

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

describe('markOrderAsSubmitted — input validation', () => {
  it('returns error for an invalid UUID', async () => {
    const result = await markOrderAsSubmitted('not-a-uuid')
    expect(result).toEqual({ success: false, error: 'Invalid order ID.' })
  })

  it('returns error for an empty string', async () => {
    const result = await markOrderAsSubmitted('')
    expect(result).toEqual({ success: false, error: 'Invalid order ID.' })
  })

  it('does not call requireRole when UUID is invalid (fails fast)', async () => {
    await markOrderAsSubmitted('bad')
    expect(session.requireRole).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Order state checks
// ---------------------------------------------------------------------------

describe('markOrderAsSubmitted — order state', () => {
  it('returns error when order is not found', async () => {
    vi.mocked(queries.getOrderStatusById).mockResolvedValue(null)

    const result = await markOrderAsSubmitted(VALID_ORDER_ID)
    expect(result).toEqual({ success: false, error: 'Order not found.' })
  })

  it.each([
    'documents_pending',
    'documents_under_review',
    'submitted',
    'delivered',
  ] as const)(
    'returns error when order status is "%s" (not documents_approved)',
    async (status) => {
      vi.mocked(queries.getOrderStatusById).mockResolvedValue({ status })

      const result = await markOrderAsSubmitted(VALID_ORDER_ID)
      expect(result).toEqual({ success: false, error: 'Order is not awaiting submission.' })
    },
  )
})

// ---------------------------------------------------------------------------
// Success path
// ---------------------------------------------------------------------------

describe('markOrderAsSubmitted — success path', () => {
  beforeEach(() => {
    vi.mocked(queries.getOrderStatusById).mockResolvedValue({
      status: 'documents_approved',
    })
    vi.mocked(queries.markOrderSubmitted).mockResolvedValue(undefined)
    vi.mocked(queries.insertAuditLog).mockResolvedValue(undefined)
  })

  it('returns { success: true } on a valid documents_approved order', async () => {
    const result = await markOrderAsSubmitted(VALID_ORDER_ID)
    expect(result).toEqual({ success: true })
  })

  it('calls markOrderSubmitted with the correct orderId', async () => {
    await markOrderAsSubmitted(VALID_ORDER_ID)
    expect(queries.markOrderSubmitted).toHaveBeenCalledOnce()
    expect(queries.markOrderSubmitted).toHaveBeenCalledWith(VALID_ORDER_ID)
  })

  it('writes an audit log entry with the correct action and IDs', async () => {
    await markOrderAsSubmitted(VALID_ORDER_ID)
    expect(queries.insertAuditLog).toHaveBeenCalledOnce()
    expect(queries.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'order.submitted',
        orderId: VALID_ORDER_ID,
        userId: OPERATOR.id,
      }),
    )
  })

  it('calls revalidatePath to refresh the operator queue', async () => {
    await markOrderAsSubmitted(VALID_ORDER_ID)
    expect(revalidatePath).toHaveBeenCalledWith('/operator', 'page')
  })

  it('verifies requireRole is called with "operator"', async () => {
    await markOrderAsSubmitted(VALID_ORDER_ID)
    expect(session.requireRole).toHaveBeenCalledWith('operator')
  })
})

// ---------------------------------------------------------------------------
// Ordering guarantees — validate → auth → DB, never the other way around
// ---------------------------------------------------------------------------

describe('markOrderAsSubmitted — call ordering', () => {
  it('does not call DB queries when UUID is invalid', async () => {
    await markOrderAsSubmitted('bad-id')
    expect(queries.getOrderStatusById).not.toHaveBeenCalled()
    expect(queries.markOrderSubmitted).not.toHaveBeenCalled()
    expect(queries.insertAuditLog).not.toHaveBeenCalled()
  })

  it('does not call markOrderSubmitted when order is not found', async () => {
    vi.mocked(queries.getOrderStatusById).mockResolvedValue(null)
    await markOrderAsSubmitted(VALID_ORDER_ID)
    expect(queries.markOrderSubmitted).not.toHaveBeenCalled()
  })

  it('does not call markOrderSubmitted when order has wrong status', async () => {
    vi.mocked(queries.getOrderStatusById).mockResolvedValue({ status: 'submitted' })
    await markOrderAsSubmitted(VALID_ORDER_ID)
    expect(queries.markOrderSubmitted).not.toHaveBeenCalled()
  })
})
