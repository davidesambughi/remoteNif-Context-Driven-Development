'use server'

import { resendClient } from './resend'
import { env } from '@/lib/env'
import {
  OrderConfirmationEmail,
  getOrderConfirmationSubject,
} from './templates/order-confirmation'
import {
  AdminDocumentEscalatedEmail,
  getAdminDocumentEscalatedSubject,
} from './templates/admin-document-escalated'
import {
  AdminOrderReadyEmail,
  getAdminOrderReadySubject,
} from './templates/admin-order-ready'

export type EmailLocale = 'en' | 'fr' | 'es' | 'de'
export type EmailTemplateName =
  | 'order_confirmation'
  | 'admin_document_escalated'
  | 'admin_order_ready'

// Discriminated union — add a new member here when a new template is introduced,
// then add a matching case in the switch below.
export type EmailPayload =
  | { template: 'order_confirmation'; orderId: string; tier: string; amountEur: string }
  | { template: 'admin_document_escalated'; orderId: string; customerName: string; documentType: string; escalationReason: string }
  | { template: 'admin_order_ready'; orderId: string; customerName: string; tier: string }

/**
 * Central email sending helper. All outbound emails go through here — never call
 * resendClient directly from actions or route handlers.
 * Fire-and-forget from the caller's perspective: errors are logged, never thrown.
 */
export async function sendEmail(
  to: string,
  locale: EmailLocale,
  payload: EmailPayload,
): Promise<void> {
  try {
    const dashboardUrl = `${env.NEXT_PUBLIC_APP_URL}/${locale}/dashboard`

    let subject: string
    // Typed as unknown so send.ts stays .ts (no JSX); Resend accepts ReactElement via react: prop
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let reactElement: any

    switch (payload.template) {
      case 'order_confirmation': {
        subject = getOrderConfirmationSubject(locale, payload.orderId)
        reactElement = OrderConfirmationEmail({
          locale,
          orderId: payload.orderId,
          tier: payload.tier,
          amountEur: payload.amountEur,
          dashboardUrl,
        })
        break
      }
      case 'admin_document_escalated': {
        const adminOrderUrl = `${env.NEXT_PUBLIC_APP_URL}/en/admin/orders/${payload.orderId}`
        subject = getAdminDocumentEscalatedSubject(payload.customerName, payload.orderId)
        reactElement = AdminDocumentEscalatedEmail({
          orderId: payload.orderId,
          customerName: payload.customerName,
          documentType: payload.documentType,
          escalationReason: payload.escalationReason,
          adminOrderUrl,
        })
        break
      }
      case 'admin_order_ready': {
        const adminOrderUrl = `${env.NEXT_PUBLIC_APP_URL}/en/admin/orders/${payload.orderId}`
        subject = getAdminOrderReadySubject(payload.customerName, payload.orderId)
        reactElement = AdminOrderReadyEmail({
          orderId: payload.orderId,
          customerName: payload.customerName,
          tier: payload.tier,
          adminOrderUrl,
        })
        break
      }
      default: {
        // Exhaustive check — TypeScript errors here if a new EmailPayload member is added
        // without a corresponding case above
        const _exhaustive: never = payload
        return
      }
    }

    const { error } = await resendClient.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to,
      subject,
      react: reactElement,
    })

    if (error) {
      console.error('[sendEmail] Resend API error', error)
    }
  } catch (error) {
    console.error('[sendEmail] Unexpected error', error)
  }
}
