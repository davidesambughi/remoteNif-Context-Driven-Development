import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { 
  adminDeliverNif, 
  adminApproveOrder, 
  adminResendEmail 
} from '@/app/actions/admin'
import { sendEmail } from '@/lib/email/send'
import { requireRole } from '@/lib/auth/session'
import { truncateAll } from '../setup'
import { 
  insertTestUser, 
  insertTestOrder, 
  insertTestDocument 
} from '../fixtures'

// Mock the email sending utility
vi.mock('@/lib/email/send', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}))

// Mock session/auth
vi.mock('@/lib/auth/session', () => ({
  requireRole: vi.fn(),
}))

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Multi-language Email Logic', () => {
  let admin: { id: string, role: string }

  beforeEach(async () => {
    await truncateAll()
    vi.clearAllMocks()
    
    // Create a real admin user to satisfy UUID constraints in audit log
    const adminUser = await insertTestUser({ role: 'admin', email: 'admin@nif.com' })
    admin = { id: adminUser.id, role: 'admin' }
    
    ;(requireRole as any).mockResolvedValue(admin)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const languages = ['en', 'fr', 'es', 'de'] as const

  it('adminDeliverNif sends localized NIF delivery emails', async () => {
    for (const lang of languages) {
      const user = await insertTestUser({ language: lang, email: `user-${lang}@test.com` })
      const order = await insertTestOrder(user.id, { tier: 'standard' })

      const result = await adminDeliverNif(order.id, '123456789')
      expect(result.success).toBe(true)

      // Verify sendEmail was called with the correct locale
      expect(sendEmail).toHaveBeenCalledWith(
        user.email,
        lang,
        expect.objectContaining({
          template: 'nif_delivered',
          customerName: user.fullName ?? 'there',
          nifNumber: '123456789'
        })
      )
    }
  })

  it('adminApproveOrder sends localized approval emails to customers', async () => {
    for (const lang of languages) {
      const user = await insertTestUser({ language: lang, email: `approve-${lang}@test.com` })
      const order = await insertTestOrder(user.id, { 
        tier: 'express', 
        status: 'documents_under_review' 
      })
      
      // Need 3 approved documents (passport, proof_of_address, signed_poa)
      await insertTestDocument(order.id, user.id, { type: 'passport', approved: true })
      await insertTestDocument(order.id, user.id, { type: 'proof_of_address', approved: true })
      await insertTestDocument(order.id, user.id, { type: 'signed_poa', approved: true })

      const result = await adminApproveOrder(order.id)
      expect(result.success).toBe(true)

      // Verify customer received localized email
      expect(sendEmail).toHaveBeenCalledWith(
        user.email,
        lang,
        expect.objectContaining({
          template: 'documents_approved_customer'
        })
      )
    }
  })

  it('adminResendEmail respects customer language preference', async () => {
    const user = await insertTestUser({ language: 'fr', email: 'resend-fr@test.com' })
    const order = await insertTestOrder(user.id, { tier: 'essential' })

    // Test resending order confirmation
    await adminResendEmail(order.id, 'order_confirmation')
    expect(sendEmail).toHaveBeenCalledWith(
      user.email,
      'fr',
      expect.objectContaining({
        template: 'order_confirmation'
      })
    )

    // Test resending approval email
    await adminResendEmail(order.id, 'documents_approved_customer')
    expect(sendEmail).toHaveBeenCalledWith(
      user.email,
      'fr',
      expect.objectContaining({
        template: 'documents_approved_customer'
      })
    )
  })
})
