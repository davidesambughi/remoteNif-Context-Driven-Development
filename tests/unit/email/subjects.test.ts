import { describe, it, expect } from 'vitest'
import { getOrderConfirmationSubject } from '@/lib/email/templates/order-confirmation'
import { getAdminDocumentEscalatedSubject } from '@/lib/email/templates/admin-document-escalated'
import { getAdminOrderReadySubject } from '@/lib/email/templates/admin-order-ready'

describe('getOrderConfirmationSubject', () => {
  const orderId = 'abc-123'

  it('returns English subject', () => {
    expect(getOrderConfirmationSubject('en', orderId)).toBe(
      `Your NIF application is confirmed — Order #${orderId}`,
    )
  })

  it('returns French subject', () => {
    expect(getOrderConfirmationSubject('fr', orderId)).toBe(
      `Votre demande de NIF est confirmée — Commande #${orderId}`,
    )
  })

  it('returns Spanish subject', () => {
    expect(getOrderConfirmationSubject('es', orderId)).toBe(
      `Su solicitud de NIF está confirmada — Pedido #${orderId}`,
    )
  })

  it('returns German subject', () => {
    expect(getOrderConfirmationSubject('de', orderId)).toBe(
      `Ihr NIF-Antrag wurde bestätigt — Bestellung #${orderId}`,
    )
  })

  it('includes the orderId in every locale', () => {
    const locales = ['en', 'fr', 'es', 'de'] as const
    for (const locale of locales) {
      expect(getOrderConfirmationSubject(locale, orderId)).toContain(orderId)
    }
  })
})

describe('getAdminDocumentEscalatedSubject', () => {
  it('returns correct subject', () => {
    expect(getAdminDocumentEscalatedSubject('João Silva', 'ord-999')).toBe(
      'Manual review required — João Silva, Order #ord-999',
    )
  })

  it('includes customerName and orderId', () => {
    const subject = getAdminDocumentEscalatedSubject('Test User', 'xyz-456')
    expect(subject).toContain('Test User')
    expect(subject).toContain('xyz-456')
  })
})

describe('getAdminOrderReadySubject', () => {
  it('returns correct subject', () => {
    expect(getAdminOrderReadySubject('Maria Santos', 'ord-777')).toBe(
      'Documents approved — Maria Santos ready for review, Order #ord-777',
    )
  })

  it('includes customerName and orderId', () => {
    const subject = getAdminOrderReadySubject('Test User', 'xyz-789')
    expect(subject).toContain('Test User')
    expect(subject).toContain('xyz-789')
  })
})
