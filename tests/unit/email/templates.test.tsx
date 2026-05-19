import { describe, it, expect } from 'vitest'
import { render } from 'react-email'
import { OrderConfirmationEmail } from '@/lib/email/templates/order-confirmation'
import { AdminDocumentEscalatedEmail } from '@/lib/email/templates/admin-document-escalated'
import { AdminOrderReadyEmail } from '@/lib/email/templates/admin-order-ready'

// Smoke tests: verify each template renders to HTML without throwing and
// contains the key dynamic values passed as props.

describe('OrderConfirmationEmail', () => {
  const baseProps = {
    locale: 'en' as const,
    orderId: 'test-order-1',
    tier: 'standard',
    amountEur: '€99',
    dashboardUrl: 'https://example.com/en/dashboard',
  }

  it('renders without throwing', async () => {
    await expect(render(OrderConfirmationEmail(baseProps))).resolves.not.toThrow()
  })

  it('contains orderId in output', async () => {
    const html = await render(OrderConfirmationEmail(baseProps))
    expect(html).toContain('test-order-1')
  })

  it('contains amountEur in output', async () => {
    const html = await render(OrderConfirmationEmail(baseProps))
    expect(html).toContain('€99')
  })

  it('contains dashboard URL as a link', async () => {
    const html = await render(OrderConfirmationEmail(baseProps))
    expect(html).toContain('https://example.com/en/dashboard')
  })

  it('renders French locale without throwing', async () => {
    const html = await render(OrderConfirmationEmail({ ...baseProps, locale: 'fr' }))
    expect(html).toContain('test-order-1')
  })

  it('renders Spanish locale without throwing', async () => {
    const html = await render(OrderConfirmationEmail({ ...baseProps, locale: 'es' }))
    expect(html).toContain('test-order-1')
  })

  it('renders German locale without throwing', async () => {
    const html = await render(OrderConfirmationEmail({ ...baseProps, locale: 'de' }))
    expect(html).toContain('test-order-1')
  })
})

describe('AdminDocumentEscalatedEmail', () => {
  const baseProps = {
    orderId: 'test-order-2',
    customerName: 'João Silva',
    documentType: 'Passport',
    escalationReason: 'AI review failed',
    adminOrderUrl: 'https://example.com/en/admin/orders/test-order-2',
  }

  it('renders without throwing', async () => {
    await expect(render(AdminDocumentEscalatedEmail(baseProps))).resolves.not.toThrow()
  })

  it('contains customerName in output', async () => {
    const html = await render(AdminDocumentEscalatedEmail(baseProps))
    expect(html).toContain('João Silva')
  })

  it('contains orderId in output', async () => {
    const html = await render(AdminDocumentEscalatedEmail(baseProps))
    expect(html).toContain('test-order-2')
  })

  it('contains escalationReason in output', async () => {
    const html = await render(AdminDocumentEscalatedEmail(baseProps))
    expect(html).toContain('AI review failed')
  })

  it('contains admin URL as a link', async () => {
    const html = await render(AdminDocumentEscalatedEmail(baseProps))
    expect(html).toContain('https://example.com/en/admin/orders/test-order-2')
  })
})

describe('AdminOrderReadyEmail', () => {
  const baseProps = {
    orderId: 'test-order-3',
    customerName: 'Maria Santos',
    tier: 'express',
    adminOrderUrl: 'https://example.com/en/admin/orders/test-order-3',
  }

  it('renders without throwing', async () => {
    await expect(render(AdminOrderReadyEmail(baseProps))).resolves.not.toThrow()
  })

  it('contains customerName in output', async () => {
    const html = await render(AdminOrderReadyEmail(baseProps))
    expect(html).toContain('Maria Santos')
  })

  it('contains orderId in output', async () => {
    const html = await render(AdminOrderReadyEmail(baseProps))
    expect(html).toContain('test-order-3')
  })

  it('contains tier label in output', async () => {
    const html = await render(AdminOrderReadyEmail(baseProps))
    // TIER_LABELS maps 'express' → 'Express'
    expect(html).toContain('Express')
  })

  it('contains admin URL as a link', async () => {
    const html = await render(AdminOrderReadyEmail(baseProps))
    expect(html).toContain('https://example.com/en/admin/orders/test-order-3')
  })
})
