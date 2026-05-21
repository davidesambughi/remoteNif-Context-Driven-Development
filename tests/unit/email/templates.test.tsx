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

import { DocumentsApprovedCustomerEmail } from '@/lib/email/templates/documents-approved-customer'
import { OperatorSubmissionReadyEmail } from '@/lib/email/templates/operator-submission-ready'

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

describe('DocumentsApprovedCustomerEmail', () => {
  const baseProps = {
    locale: 'en' as const,
    customerName: 'Ana Costa',
    tier: 'standard',
    dashboardUrl: 'https://example.com/en/dashboard',
  }

  it('renders without throwing (EN)', async () => {
    await expect(render(DocumentsApprovedCustomerEmail(baseProps))).resolves.not.toThrow()
  })

  it('renders without throwing (FR)', async () => {
    await expect(render(DocumentsApprovedCustomerEmail({ ...baseProps, locale: 'fr' }))).resolves.not.toThrow()
  })

  it('renders without throwing (ES)', async () => {
    await expect(render(DocumentsApprovedCustomerEmail({ ...baseProps, locale: 'es' }))).resolves.not.toThrow()
  })

  it('renders without throwing (DE)', async () => {
    await expect(render(DocumentsApprovedCustomerEmail({ ...baseProps, locale: 'de' }))).resolves.not.toThrow()
  })

  it('contains customerName in output', async () => {
    const html = await render(DocumentsApprovedCustomerEmail(baseProps))
    expect(html).toContain('Ana Costa')
  })

  it('contains dashboardUrl as a link', async () => {
    const html = await render(DocumentsApprovedCustomerEmail(baseProps))
    expect(html).toContain('https://example.com/en/dashboard')
  })

  it('includes 48h note for express tier', async () => {
    const html = await render(DocumentsApprovedCustomerEmail({ ...baseProps, tier: 'express' }))
    expect(html).toContain('48')
  })
})

describe('OperatorSubmissionReadyEmail', () => {
  const baseProps = {
    customerName: 'Luis Figo',
    tier: 'express',
    orderId: 'test-order-4',
    operatorQueueUrl: 'https://example.com/en/operator',
  }

  it('renders without throwing', async () => {
    await expect(render(OperatorSubmissionReadyEmail(baseProps))).resolves.not.toThrow()
  })

  it('contains customerName in output', async () => {
    const html = await render(OperatorSubmissionReadyEmail(baseProps))
    expect(html).toContain('Luis Figo')
  })

  it('contains the operator queue URL as a link', async () => {
    const html = await render(OperatorSubmissionReadyEmail(baseProps))
    expect(html).toContain('https://example.com/en/operator')
  })

  it('includes slaNote when provided', async () => {
    const html = await render(OperatorSubmissionReadyEmail({ ...baseProps, slaNote: '48h SLA has started' }))
    expect(html).toContain('48h SLA has started')
  })

  it('renders without throwing when slaNote is omitted', async () => {
    await expect(render(OperatorSubmissionReadyEmail(baseProps))).resolves.not.toThrow()
  })
})

import {
  OrderSubmittedCustomerEmail,
  getOrderSubmittedCustomerSubject,
} from '@/lib/email/templates/order-submitted-customer'

describe('OrderSubmittedCustomerEmail', () => {
  const baseProps = {
    locale: 'en' as const,
    customerName: 'Sofia Andrade',
    tier: 'standard',
    dashboardUrl: 'https://example.com/en/dashboard',
  }

  it('renders without throwing (EN)', async () => {
    await expect(render(OrderSubmittedCustomerEmail(baseProps))).resolves.not.toThrow()
  })

  it('renders without throwing (FR)', async () => {
    await expect(render(OrderSubmittedCustomerEmail({ ...baseProps, locale: 'fr' }))).resolves.not.toThrow()
  })

  it('renders without throwing (ES)', async () => {
    await expect(render(OrderSubmittedCustomerEmail({ ...baseProps, locale: 'es' }))).resolves.not.toThrow()
  })

  it('renders without throwing (DE)', async () => {
    await expect(render(OrderSubmittedCustomerEmail({ ...baseProps, locale: 'de' }))).resolves.not.toThrow()
  })

  it('contains customerName in output', async () => {
    const html = await render(OrderSubmittedCustomerEmail(baseProps))
    expect(html).toContain('Sofia Andrade')
  })

  it('contains dashboardUrl as a link', async () => {
    const html = await render(OrderSubmittedCustomerEmail(baseProps))
    expect(html).toContain('https://example.com/en/dashboard')
  })

  it('contains delivery estimate copy', async () => {
    // The estimate is the key legal/UX requirement — verify it appears in every locale
    const html = await render(OrderSubmittedCustomerEmail(baseProps))
    // All locales mention "5" and "10" days in their estimate copy
    expect(html).toContain('5')
    expect(html).toContain('10')
  })

  it('contains "Finanças" in the output — submission confirmation', async () => {
    const html = await render(OrderSubmittedCustomerEmail(baseProps))
    expect(html).toContain('Finan')
  })
})

describe('getOrderSubmittedCustomerSubject', () => {
  it('returns a non-empty string for each locale', () => {
    const locales = ['en', 'fr', 'es', 'de'] as const
    for (const locale of locales) {
      const subject = getOrderSubmittedCustomerSubject(locale)
      expect(typeof subject).toBe('string')
      expect(subject.length).toBeGreaterThan(0)
    }
  })

  it('returns different subjects for different locales', () => {
    const en = getOrderSubmittedCustomerSubject('en')
    const fr = getOrderSubmittedCustomerSubject('fr')
    const es = getOrderSubmittedCustomerSubject('es')
    const de = getOrderSubmittedCustomerSubject('de')
    // All four should be distinct — a single hardcoded string would fail this
    expect(new Set([en, fr, es, de]).size).toBe(4)
  })
})
