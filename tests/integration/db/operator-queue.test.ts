import { describe, it, expect, beforeEach } from 'vitest'
import { getOperatorQueue } from '@/lib/db/queries'
import { truncateAll } from '../setup'
import { insertTestUser, insertTestOrder } from '../fixtures'

beforeEach(truncateAll)

// ---------------------------------------------------------------------------
// getOperatorQueue
// ---------------------------------------------------------------------------

describe('getOperatorQueue', () => {
  it('returns only orders with status = documents_approved', async () => {
    const user = await insertTestUser()
    
    // Orders that should be excluded
    await insertTestOrder(user.id, { status: 'documents_pending' })
    await insertTestOrder(user.id, { status: 'documents_under_review' })
    await insertTestOrder(user.id, { status: 'submitted' })
    await insertTestOrder(user.id, { status: 'delivered' })

    // Order that should be included
    const approved = await insertTestOrder(user.id, { 
      status: 'documents_approved',
      documentsApprovedAt: new Date()
    })

    const result = await getOperatorQueue()

    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe(approved.id)
  })

  it('prioritizes Express orders over Standard orders regardless of creation time', async () => {
    const user = await insertTestUser()
    
    // Standard order created EARLY
    const standard = await insertTestOrder(user.id, {
      tier: 'standard',
      status: 'documents_approved',
      createdAt: new Date('2026-01-01T10:00:00Z'),
      documentsApprovedAt: new Date('2026-01-01T12:00:00Z')
    })

    // Express order created LATE
    const express = await insertTestOrder(user.id, {
      tier: 'express',
      status: 'documents_approved',
      createdAt: new Date('2026-01-05T10:00:00Z'),
      documentsApprovedAt: new Date('2026-01-05T12:00:00Z')
    })

    const result = await getOperatorQueue()

    expect(result).toHaveLength(2)
    // Express must be first
    expect(result[0]!.id).toBe(express.id)
    expect(result[1]!.id).toBe(standard.id)
  })

  it('sorts Express orders by SLA urgency (oldest approval first)', async () => {
    const user = await insertTestUser()
    
    // Express order approved LATER
    const newerApproval = await insertTestOrder(user.id, {
      tier: 'express',
      status: 'documents_approved',
      documentsApprovedAt: new Date('2026-01-10T15:00:00Z')
    })

    // Express order approved EARLIER (more urgent SLA)
    const olderApproval = await insertTestOrder(user.id, {
      tier: 'express',
      status: 'documents_approved',
      documentsApprovedAt: new Date('2026-01-10T10:00:00Z')
    })

    const result = await getOperatorQueue()

    expect(result).toHaveLength(2)
    // Older approval must be first
    expect(result[0]!.id).toBe(olderApproval.id)
    expect(result[1]!.id).toBe(newerApproval.id)
  })

  it('sorts Standard orders by FIFO (oldest creation first)', async () => {
    const user = await insertTestUser()
    
    // Standard order created LATER
    const newerOrder = await insertTestOrder(user.id, {
      tier: 'standard',
      status: 'documents_approved',
      createdAt: new Date('2026-01-20T10:00:00Z'),
      documentsApprovedAt: new Date()
    })

    // Standard order created EARLIER
    const olderOrder = await insertTestOrder(user.id, {
      tier: 'standard',
      status: 'documents_approved',
      createdAt: new Date('2026-01-10T10:00:00Z'),
      documentsApprovedAt: new Date()
    })

    const result = await getOperatorQueue()

    expect(result).toHaveLength(2)
    // Older creation must be first
    expect(result[0]!.id).toBe(olderOrder.id)
    expect(result[1]!.id).toBe(newerOrder.id)
  })

  it('enforces a composite sort: Express (Urgency) > Standard (FIFO)', async () => {
    const user = await insertTestUser()
    
    // 1. Express Urgent
    const expressUrgent = await insertTestOrder(user.id, {
      tier: 'express',
      status: 'documents_approved',
      documentsApprovedAt: new Date('2026-01-01T08:00:00Z')
    })

    // 2. Express Less Urgent
    const expressLessUrgent = await insertTestOrder(user.id, {
      tier: 'express',
      status: 'documents_approved',
      documentsApprovedAt: new Date('2026-01-01T12:00:00Z')
    })

    // 3. Standard FIFO Oldest
    const standardOldest = await insertTestOrder(user.id, {
      tier: 'standard',
      status: 'documents_approved',
      createdAt: new Date('2026-01-01T09:00:00Z'),
      documentsApprovedAt: new Date('2026-01-01T15:00:00Z')
    })

    // 4. Standard FIFO Newest
    const standardNewest = await insertTestOrder(user.id, {
      tier: 'standard',
      status: 'documents_approved',
      createdAt: new Date('2026-01-01T18:00:00Z'),
      documentsApprovedAt: new Date('2026-01-01T20:00:00Z')
    })

    const result = await getOperatorQueue()

    expect(result).toHaveLength(4)
    expect(result[0]!.id).toBe(expressUrgent.id)
    expect(result[1]!.id).toBe(expressLessUrgent.id)
    expect(result[2]!.id).toBe(standardOldest.id)
    expect(result[3]!.id).toBe(standardNewest.id)
  })

  it('returns correct fields joined from users table', async () => {
    const user = await insertTestUser({ email: 'op-test@example.com' })
    const order = await insertTestOrder(user.id, { 
      status: 'documents_approved',
      fullName: 'Queue Item Test',
      documentsApprovedAt: new Date('2026-01-01T10:00:00Z')
    })

    const result = await getOperatorQueue()
    const item = result[0]!

    expect(item.id).toBe(order.id)
    expect(item.tier).toBe('standard')
    expect(item.fullName).toBe('Queue Item Test')
    expect(item.email).toBe('op-test@example.com')
    expect(item.createdAt).toBeInstanceOf(Date)
    expect(item.documentsApprovedAt).toBeInstanceOf(Date)
  })
})
