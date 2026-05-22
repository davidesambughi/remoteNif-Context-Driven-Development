import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendEmail } from '@/lib/email/send'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock the Resend client before send.ts imports it — vi.mock is hoisted
vi.mock('@/lib/email/resend', () => ({
  resendClient: { emails: { send: vi.fn() } },
}))

vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    RESEND_FROM_EMAIL: 'noreply@remotenif.com',
    ADMIN_EMAIL: 'admin@example.com',
  },
}))

import { resendClient } from '@/lib/email/resend'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TO = 'recipient@example.com'
const LOCALE = 'en' as const
const ORDER_ID = 'order-uuid-test-1'
const CUSTOMER_NAME = 'Test Customer'

beforeEach(() => {
  vi.clearAllMocks()
  // Default: Resend API returns success — sendEmail must not throw in either case
  vi.mocked(resendClient.emails.send).mockResolvedValue({ data: { id: 'msg-1' }, error: null } as any)
})

// ---------------------------------------------------------------------------
// Tests — one per EmailPayload variant
// ---------------------------------------------------------------------------

describe('sendEmail dispatch routing', () => {
  it('routes order_confirmation to the correct template and subject', async () => {
    await sendEmail(TO, LOCALE, {
      template: 'order_confirmation',
      orderId: ORDER_ID,
      tier: 'standard',
      amountEur: '€129',
    })

    expect(resendClient.emails.send).toHaveBeenCalledOnce()
    const [call] = vi.mocked(resendClient.emails.send).mock.calls
    expect(call![0].subject).toContain(ORDER_ID)
    expect(call![0].react).toBeTruthy()
    expect(call![0].from).toBe('noreply@remotenif.com')
    expect(call![0].to).toBe(TO)
  })

  it('routes admin_document_escalated to the correct template and subject', async () => {
    await sendEmail(TO, LOCALE, {
      template: 'admin_document_escalated',
      orderId: ORDER_ID,
      customerName: CUSTOMER_NAME,
      documentType: 'Passport',
      escalationReason: 'AI review failed',
    })

    const [call] = vi.mocked(resendClient.emails.send).mock.calls
    expect(call![0].subject).toContain(CUSTOMER_NAME)
    expect(call![0].react).toBeTruthy()
  })

  it('routes admin_order_ready to the correct template and subject', async () => {
    await sendEmail(TO, LOCALE, {
      template: 'admin_order_ready',
      orderId: ORDER_ID,
      customerName: CUSTOMER_NAME,
      tier: 'express',
    })

    const [call] = vi.mocked(resendClient.emails.send).mock.calls
    expect(call![0].subject).toContain(CUSTOMER_NAME)
    expect(call![0].react).toBeTruthy()
  })

  it('routes documents_approved_customer to the correct template', async () => {
    await sendEmail(TO, LOCALE, {
      template: 'documents_approved_customer',
      customerName: CUSTOMER_NAME,
      tier: 'standard',
    })

    expect(resendClient.emails.send).toHaveBeenCalledOnce()
    const [call] = vi.mocked(resendClient.emails.send).mock.calls
    expect(call![0].react).toBeTruthy()
    expect(call![0].subject).toBeTruthy()
  })

  it('routes operator_submission_ready to the correct template', async () => {
    await sendEmail(TO, LOCALE, {
      template: 'operator_submission_ready',
      customerName: CUSTOMER_NAME,
      tier: 'express',
      orderId: ORDER_ID,
      slaNote: '48h SLA has started',
    })

    const [call] = vi.mocked(resendClient.emails.send).mock.calls
    expect(call![0].subject).toContain(CUSTOMER_NAME)
    expect(call![0].react).toBeTruthy()
  })

  it('routes operator_submission_ready without slaNote without throwing', async () => {
    await expect(
      sendEmail(TO, LOCALE, {
        template: 'operator_submission_ready',
        customerName: CUSTOMER_NAME,
        tier: 'standard',
        orderId: ORDER_ID,
      }),
    ).resolves.toBeUndefined()

    expect(resendClient.emails.send).toHaveBeenCalledOnce()
  })

  it('routes order_submitted_customer to the correct template and subject', async () => {
    await sendEmail(TO, LOCALE, {
      template: 'order_submitted_customer',
      customerName: CUSTOMER_NAME,
      tier: 'standard',
    })

    expect(resendClient.emails.send).toHaveBeenCalledOnce()
    const [call] = vi.mocked(resendClient.emails.send).mock.calls
    expect(call![0].react).toBeTruthy()
    expect(call![0].subject).toBeTruthy()
    expect(call![0].from).toBe('noreply@remotenif.com')
    expect(call![0].to).toBe(TO)
  })

  it('routes order_submitted_customer with FR locale without throwing', async () => {
    await expect(
      sendEmail(TO, 'fr', {
        template: 'order_submitted_customer',
        customerName: CUSTOMER_NAME,
        tier: 'express',
      }),
    ).resolves.toBeUndefined()

    expect(resendClient.emails.send).toHaveBeenCalledOnce()
  })

  // Feature 16 — nif_delivered
  it('routes nif_delivered to the correct template and subject', async () => {
    await sendEmail(TO, LOCALE, {
      template: 'nif_delivered',
      customerName: CUSTOMER_NAME,
      nifNumber: '123456789',
    })

    expect(resendClient.emails.send).toHaveBeenCalledOnce()
    const [call] = vi.mocked(resendClient.emails.send).mock.calls
    expect(call![0].react).toBeTruthy()
    expect(call![0].subject).toBeTruthy()
    expect(call![0].from).toBe('noreply@remotenif.com')
    expect(call![0].to).toBe(TO)
  })

  it('routes nif_delivered with DE locale without throwing', async () => {
    await expect(
      sendEmail(TO, 'de', {
        template: 'nif_delivered',
        customerName: CUSTOMER_NAME,
        nifNumber: '987654321',
      }),
    ).resolves.toBeUndefined()

    expect(resendClient.emails.send).toHaveBeenCalledOnce()
  })

  it('swallows Resend API errors — sendEmail always resolves', async () => {
    vi.mocked(resendClient.emails.send).mockResolvedValue({ data: null, error: { message: 'rate limited' } } as any)

    await expect(
      sendEmail(TO, LOCALE, {
        template: 'order_confirmation',
        orderId: ORDER_ID,
        tier: 'standard',
        amountEur: '€129',
      }),
    ).resolves.toBeUndefined()
  })
})
