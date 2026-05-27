import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { db } from '@/lib/db'
import { auditLog, orders } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { insertAuditLog, deliverNifNumber } from '@/lib/db/queries'
import { truncateAll } from '../setup'
import { insertTestUser, insertTestOrder } from '../fixtures'

beforeEach(async () => {
  await truncateAll()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Audit Log Resilience', () => {
  it('insertAuditLog catches database errors and does not throw', async () => {
    const user = await insertTestUser()
    
    // Mock console.error to avoid polluting test logs
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock db.insert to throw when auditLog is targeted
    const insertSpy = vi.spyOn(db, 'insert').mockImplementation((table) => {
      if (table === auditLog) {
        throw new Error('Simulated Database Failure')
      }
      return db.insert(table) // Fallback for other tables if any
    })

    // This should NOT throw
    await expect(insertAuditLog({
      userId: user.id,
      action: 'test.action',
      details: { foo: 'bar' }
    })).resolves.not.toThrow()

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to insert audit log:',
      expect.any(Error)
    )
    
    insertSpy.mockRestore()
    consoleSpy.mockRestore()
  })

  it('a failed audit log does not break a business operation (NIF delivery)', async () => {
    const user = await insertTestUser()
    const admin = await insertTestUser({ email: 'admin@test.com' })
    const order = await insertTestOrder(user.id, { tier: 'standard' })

    // 1. Mock audit log to fail
    vi.spyOn(db, 'insert').mockImplementation((table) => {
      if (table === auditLog) {
        throw new Error('Audit Table Unreachable')
      }
      return (db as any).insert(table)
    })
    
    // Mock console.error to keep logs clean
    vi.spyOn(console, 'error').mockImplementation(() => {})

    // 2. Perform a business operation followed by an audit log
    // In a real Server Action, these are separate calls.
    // We simulate the sequence here.
    
    // The main operation
    await deliverNifNumber(order.id, '999888777', 'standard')
    
    // The audit log (which fails silently)
    await insertAuditLog({
      userId: admin.id,
      orderId: order.id,
      action: 'order.nif.delivered',
      details: { nifNumber: '999888777' }
    })

    // 3. Verify the main operation succeeded
    const [updated] = await db.select().from(orders).where(eq(orders.id, order.id))
    expect(updated!.status).toBe('delivered')
    expect(updated!.nifNumber).toBe('999888777')
    expect(updated!.fiscalRepExpiresAt).not.toBeNull()

    // 4. Verify no audit log was actually created (since it failed)
    const logs = await db.select().from(auditLog).where(eq(auditLog.orderId, order.id))
    expect(logs).toHaveLength(0)
  })
})
