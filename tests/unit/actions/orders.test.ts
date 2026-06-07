/**
 * Unit tests for app/actions/orders.ts — dismissFiscalRep
 *
 * Covers validation, auth, ownership, and the happy-path DB write.
 * DB queries and auth are mocked — no real network calls.
 * Pattern matches tests/unit/actions/admin.test.ts (top-level imports, vi.mocked).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dismissFiscalRep, checkHasActiveOrder } from '@/app/actions/orders'
import * as session from '@/lib/auth/session'
import * as queries from '@/lib/db/queries'
import * as nextCache from 'next/cache'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/auth/session', () => ({
  requireAuth: vi.fn(),
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/db/queries', () => ({
  getUserActiveOrder: vi.fn(),
  dismissFiscalRepForOrder: vi.fn(),
  // Stub out all other queries imported by orders.ts
  updateOrderPersonalDetails: vi.fn(),
  updateOrderPoaPath: vi.fn(),
  getOrderPersonalDetails: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// pdf generator is imported by orders.ts — stub it out to avoid file-system calls
vi.mock('@/lib/pdf/generator', () => ({
  generateAndStorePoaPdf: vi.fn(),
  deleteStoredPoaPdf: vi.fn(),
  getPoaSignedUrl: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER = { id: 'user-uuid-1', email: 'u@example.com', role: 'customer' as const }
// Must be UUID v4 shape — Zod v4 enforces 13th char='4', 17th char in [89ab]
const ORDER_ID = '00000000-0000-4000-8000-000000000001'

function makeOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: ORDER_ID,
    userId: USER.id,
    tier: 'standard' as const,
    fiscalRepDismissedAt: null,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Setup — default happy-path mocks, overridden per test as needed
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  // Default: authenticated user with a matching order
  vi.mocked(session.requireAuth).mockResolvedValue(USER as unknown as Awaited<ReturnType<typeof session.requireAuth>>)
  vi.mocked(queries.getUserActiveOrder).mockResolvedValue(makeOrder() as unknown as Awaited<ReturnType<typeof queries.getUserActiveOrder>>)
  vi.mocked(queries.dismissFiscalRepForOrder).mockResolvedValue(undefined)
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('dismissFiscalRep', () => {
  it('returns error when orderId is not a valid UUID', async () => {
    const result = await dismissFiscalRep('not-a-uuid')
    expect(result).toEqual({
      success: false,
      error: 'dashboard.renewalBanner.errors.generic',
    })
    expect(queries.dismissFiscalRepForOrder).not.toHaveBeenCalled()
  })

  it('returns error when orderId is an empty string', async () => {
    const result = await dismissFiscalRep('')
    expect(result).toEqual({
      success: false,
      error: 'dashboard.renewalBanner.errors.generic',
    })
    expect(queries.dismissFiscalRepForOrder).not.toHaveBeenCalled()
  })

  it('returns error when requireAuth throws (unauthenticated)', async () => {
    vi.mocked(session.requireAuth).mockRejectedValueOnce(new Error('Not authenticated'))

    const result = await dismissFiscalRep(ORDER_ID)
    expect(result).toEqual({
      success: false,
      error: 'dashboard.renewalBanner.errors.generic',
    })
  })

  it('returns error when user has no active order', async () => {
    vi.mocked(queries.getUserActiveOrder).mockResolvedValueOnce(null)

    const result = await dismissFiscalRep(ORDER_ID)
    expect(result).toEqual({
      success: false,
      error: 'dashboard.renewalBanner.errors.generic',
    })
    expect(queries.dismissFiscalRepForOrder).not.toHaveBeenCalled()
  })

  it('returns error when order belongs to a different user (ownership mismatch)', async () => {
    // The order in DB has a different ID than the one being dismissed
    vi.mocked(queries.getUserActiveOrder).mockResolvedValueOnce(
      makeOrder({ id: 'different-order-id' }) as any,
    )

    const result = await dismissFiscalRep(ORDER_ID)
    expect(result).toEqual({
      success: false,
      error: 'dashboard.renewalBanner.errors.generic',
    })
    expect(queries.dismissFiscalRepForOrder).not.toHaveBeenCalled()
  })

  it('calls dismissFiscalRepForOrder and revalidatePath on success', async () => {
    const result = await dismissFiscalRep(ORDER_ID)

    expect(result).toEqual({ success: true })
    expect(queries.dismissFiscalRepForOrder).toHaveBeenCalledWith(ORDER_ID)
    expect(nextCache.revalidatePath).toHaveBeenCalledWith('/dashboard')
  })

  it('calls getUserActiveOrder with the authenticated user ID', async () => {
    await dismissFiscalRep(ORDER_ID)
    expect(queries.getUserActiveOrder).toHaveBeenCalledWith(USER.id)
  })
})

describe('checkHasActiveOrder', () => {
  it('returns hasOrder: true when an active order is found', async () => {
    const result = await checkHasActiveOrder()
    expect(result).toEqual({ success: true, data: { hasOrder: true } })
    expect(queries.getUserActiveOrder).toHaveBeenCalledWith(USER.id)
  })

  it('returns hasOrder: false when no active order is found', async () => {
    vi.mocked(queries.getUserActiveOrder).mockResolvedValueOnce(null)
    const result = await checkHasActiveOrder()
    expect(result).toEqual({ success: true, data: { hasOrder: false } })
  })

  it('returns success: false when requireAuth throws', async () => {
    vi.mocked(session.requireAuth).mockRejectedValueOnce(new Error('Unauthorized'))
    const result = await checkHasActiveOrder()
    expect(result).toEqual({ success: false, error: 'dashboard.errors.generic' })
  })

  it('returns success: false when getUserActiveOrder throws', async () => {
    vi.mocked(queries.getUserActiveOrder).mockRejectedValueOnce(new Error('DB error'))
    const result = await checkHasActiveOrder()
    expect(result).toEqual({ success: false, error: 'dashboard.errors.generic' })
  })
})
