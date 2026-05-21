/**
 * Integration tests for Feature 14b DB queries.
 * Requires a running Postgres test instance (Docker). Run with:
 *   npx vitest run --config vitest.integration.config.ts
 *
 * Covers:
 *   - getSubmittedOrders — status filter and descending order
 *   - getOperatorPreferencesOrDefaults — defaults when missing, stored values when present
 *   - upsertOperatorPreferences — insert on first call, update on second (ON CONFLICT)
 *   - getOrderDataForSubmissionEmail — join correctness, null for missing order
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  getSubmittedOrders,
  getOperatorPreferencesOrDefaults,
  upsertOperatorPreferences,
  getOrderDataForSubmissionEmail,
} from '@/lib/db/queries'
import { db } from '@/lib/db'
import { operatorPreferences } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { truncateAll } from '../setup'
import { insertTestUser, insertTestOrder } from '../fixtures'

beforeEach(truncateAll)

// ---------------------------------------------------------------------------
// getSubmittedOrders
// ---------------------------------------------------------------------------

describe('getSubmittedOrders', () => {
  it('returns an empty array when no submitted orders exist', async () => {
    const result = await getSubmittedOrders()
    expect(result).toEqual([])
  })

  it('returns orders with status = submitted', async () => {
    const user = await insertTestUser()
    const submittedAt = new Date('2026-01-10T10:00:00Z')
    await insertTestOrder(user.id, {
      status: 'submitted',
      tier: 'standard',
      submittedToFinancasAt: submittedAt,
      fullName: 'Test User',
    })

    const result = await getSubmittedOrders()
    expect(result).toHaveLength(1)
    expect(result[0]!.tier).toBe('standard')
    expect(result[0]!.fullName).toBe('Test User')
  })

  it('excludes orders with other statuses', async () => {
    const user = await insertTestUser()
    // Insert one of each non-submitted status
    await insertTestOrder(user.id, { status: 'documents_pending' })
    await insertTestOrder(user.id, { status: 'documents_under_review' })
    await insertTestOrder(user.id, { status: 'documents_approved' })
    await insertTestOrder(user.id, { status: 'delivered' })

    const result = await getSubmittedOrders()
    expect(result).toHaveLength(0)
  })

  it('returns newest submitted orders first (descending submittedToFinancasAt)', async () => {
    const user = await insertTestUser()
    const older = new Date('2026-01-05T09:00:00Z')
    const newer = new Date('2026-01-10T15:00:00Z')

    await insertTestOrder(user.id, {
      status: 'submitted',
      fullName: 'Older Order',
      submittedToFinancasAt: older,
    })
    await insertTestOrder(user.id, {
      status: 'submitted',
      fullName: 'Newer Order',
      submittedToFinancasAt: newer,
    })

    const result = await getSubmittedOrders()
    expect(result).toHaveLength(2)
    // Newest first
    expect(result[0]!.fullName).toBe('Newer Order')
    expect(result[1]!.fullName).toBe('Older Order')
  })

  it('includes all required fields in the returned shape', async () => {
    const user = await insertTestUser()
    await insertTestOrder(user.id, {
      status: 'submitted',
      tier: 'express',
      fullName: 'Shape Test',
      submittedToFinancasAt: new Date(),
    })

    const [row] = await getSubmittedOrders()
    expect(row).toMatchObject({
      id: expect.any(String),
      tier: 'express',
      fullName: 'Shape Test',
      submittedToFinancasAt: expect.any(Date),
    })
  })
})

// ---------------------------------------------------------------------------
// getOperatorPreferencesOrDefaults
// ---------------------------------------------------------------------------

describe('getOperatorPreferencesOrDefaults', () => {
  it('returns schema defaults when no preferences row exists', async () => {
    const user = await insertTestUser({ role: 'operator' })

    const result = await getOperatorPreferencesOrDefaults(user.id)

    expect(result).toEqual({
      emailNotifications: true,
      smsNotifications: true,
      phoneNumber: null,
    })
  })

  it('returns stored values when a preferences row exists', async () => {
    const user = await insertTestUser({ role: 'operator' })

    // Insert a custom preferences row
    await db.insert(operatorPreferences).values({
      userId: user.id,
      emailNotifications: false,
      smsNotifications: true,
      phoneNumber: '+351912345678',
    })

    const result = await getOperatorPreferencesOrDefaults(user.id)

    expect(result).toEqual({
      emailNotifications: false,
      smsNotifications: true,
      phoneNumber: '+351912345678',
    })
  })

  it('does not insert a row when returning defaults (read-only)', async () => {
    const user = await insertTestUser({ role: 'operator' })

    await getOperatorPreferencesOrDefaults(user.id)

    // No row should have been created
    const rows = await db
      .select()
      .from(operatorPreferences)
      .where(eq(operatorPreferences.userId, user.id))
    expect(rows).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// upsertOperatorPreferences
// ---------------------------------------------------------------------------

describe('upsertOperatorPreferences', () => {
  it('inserts a new row when none exists (first save)', async () => {
    const user = await insertTestUser({ role: 'operator' })

    await upsertOperatorPreferences(user.id, {
      emailNotifications: true,
      smsNotifications: false,
      phoneNumber: null,
    })

    const [row] = await db
      .select()
      .from(operatorPreferences)
      .where(eq(operatorPreferences.userId, user.id))

    expect(row).toBeDefined()
    expect(row!.emailNotifications).toBe(true)
    expect(row!.smsNotifications).toBe(false)
    expect(row!.phoneNumber).toBeNull()
  })

  it('updates the existing row on a second call (ON CONFLICT path)', async () => {
    const user = await insertTestUser({ role: 'operator' })

    // First insert
    await upsertOperatorPreferences(user.id, {
      emailNotifications: true,
      smsNotifications: true,
      phoneNumber: '+351911111111',
    })

    // Update — change all fields
    await upsertOperatorPreferences(user.id, {
      emailNotifications: false,
      smsNotifications: false,
      phoneNumber: null,
    })

    const rows = await db
      .select()
      .from(operatorPreferences)
      .where(eq(operatorPreferences.userId, user.id))

    // Only one row should exist — not two
    expect(rows).toHaveLength(1)
    expect(rows[0]!.emailNotifications).toBe(false)
    expect(rows[0]!.smsNotifications).toBe(false)
    expect(rows[0]!.phoneNumber).toBeNull()
  })

  it('stores a phone number correctly when SMS is enabled', async () => {
    const user = await insertTestUser({ role: 'operator' })

    await upsertOperatorPreferences(user.id, {
      emailNotifications: true,
      smsNotifications: true,
      phoneNumber: '+351912345678',
    })

    const [row] = await db
      .select()
      .from(operatorPreferences)
      .where(eq(operatorPreferences.userId, user.id))

    expect(row!.phoneNumber).toBe('+351912345678')
  })
})

// ---------------------------------------------------------------------------
// getOrderDataForSubmissionEmail
// ---------------------------------------------------------------------------

describe('getOrderDataForSubmissionEmail', () => {
  it('returns null for a non-existent order ID', async () => {
    const result = await getOrderDataForSubmissionEmail(crypto.randomUUID())
    expect(result).toBeNull()
  })

  it('returns the correct shape with joined user data', async () => {
    const user = await insertTestUser({
      email: 'customer@example.com',
      language: 'fr',
    })
    const order = await insertTestOrder(user.id, {
      tier: 'express',
      fullName: 'Marie Dupont',
    })

    const result = await getOrderDataForSubmissionEmail(order.id)

    expect(result).not.toBeNull()
    expect(result!.customerEmail).toBe('customer@example.com')
    expect(result!.customerLanguage).toBe('fr')
    expect(result!.fullName).toBe('Marie Dupont')
    expect(result!.tier).toBe('express')
  })

  it('returns null fullName when personal details have not been filled', async () => {
    const user = await insertTestUser()
    // insertTestOrder doesn't set fullName by default — it stays null
    const order = await insertTestOrder(user.id, { fullName: undefined })

    const result = await getOrderDataForSubmissionEmail(order.id)

    expect(result).not.toBeNull()
    expect(result!.fullName).toBeNull()
  })

  it('returns the correct customerLanguage for each supported locale', async () => {
    const locales = ['en', 'fr', 'es', 'de'] as const
    for (const lang of locales) {
      const user = await insertTestUser({ language: lang })
      const order = await insertTestOrder(user.id)
      const result = await getOrderDataForSubmissionEmail(order.id)
      expect(result!.customerLanguage).toBe(lang)
    }
  })
})
