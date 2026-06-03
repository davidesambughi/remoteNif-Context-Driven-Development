// Server-side utility — called from Server Actions and API routes, not a Server Action itself.
import type { ReactElement } from 'react'

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
import {
  DocumentsApprovedCustomerEmail,
  getDocumentsApprovedCustomerSubject,
} from './templates/documents-approved-customer'
import {
  OperatorSubmissionReadyEmail,
  getOperatorSubmissionReadySubject,
} from './templates/operator-submission-ready'
import {
  OrderSubmittedCustomerEmail,
  getOrderSubmittedCustomerSubject,
} from './templates/order-submitted-customer'
import {
  NifDeliveredEmail,
  getNifDeliveredSubject,
} from './templates/nif-delivered'
import {
  FiscalRepRenewalConfirmationEmail,
  getFiscalRepRenewalConfirmationSubject,
} from './templates/fiscal-rep-renewal-confirmation'
import {
  RenewalReminderEmail,
  getRenewalReminderSubject,
  type RenewalReminderInterval,
} from './templates/renewal-reminder'
import {
  StatusUpdateWithNoteEmail,
  getStatusUpdateWithNoteSubject,
} from './templates/status-update-with-note'

export type EmailLocale = 'en' | 'fr' | 'es' | 'de'
export type EmailTemplateName =
  | 'order_confirmation'
  | 'admin_document_escalated'
  | 'admin_order_ready'
  | 'documents_approved_customer'
  | 'operator_submission_ready'
  | 'order_submitted_customer'
  | 'nif_delivered'
  | 'fiscal_rep_renewal_confirmation'
  | 'renewal_reminder'
  | 'status_update_with_note'

// Discriminated union — add a new member here when a new template is introduced,
// then add a matching case in the switch below.
export type EmailPayload =
  | { template: 'order_confirmation'; orderId: string; tier: string; amountEur: string }
  | { template: 'admin_document_escalated'; orderId: string; customerName: string; documentType: string; escalationReason: string }
  | { template: 'admin_order_ready'; orderId: string; customerName: string; tier: string }
  | { template: 'documents_approved_customer'; customerName: string; tier: string }
  | { template: 'operator_submission_ready'; customerName: string; tier: string; orderId: string; slaNote?: string }
  | { template: 'order_submitted_customer'; customerName: string; tier: string }
  | { template: 'nif_delivered'; customerName: string; nifNumber: string }
  | { template: 'fiscal_rep_renewal_confirmation'; customerName: string; newExpiresAt: string }
  | { template: 'renewal_reminder'; interval: RenewalReminderInterval; customerName: string; renewalUrl: string }
  | { template: 'status_update_with_note'; customerName: string; note: string; newStatus: string }

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
    // ReactElement: send.ts stays .ts (no JSX); Resend accepts ReactElement via react: prop
    let reactElement: ReactElement

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
      case 'documents_approved_customer': {
        subject = getDocumentsApprovedCustomerSubject(locale)
        reactElement = DocumentsApprovedCustomerEmail({
          locale,
          customerName: payload.customerName,
          tier: payload.tier,
          dashboardUrl,
        })
        break
      }
      case 'operator_submission_ready': {
        const operatorQueueUrl = `${env.NEXT_PUBLIC_APP_URL}/en/operator`
        subject = getOperatorSubmissionReadySubject(payload.customerName)
        reactElement = OperatorSubmissionReadyEmail({
          customerName: payload.customerName,
          tier: payload.tier,
          orderId: payload.orderId,
          operatorQueueUrl,
          slaNote: payload.slaNote,
        })
        break
      }
      case 'order_submitted_customer': {
        // Notify the customer that their application has been submitted to Finanças
        subject = getOrderSubmittedCustomerSubject(locale)
        reactElement = OrderSubmittedCustomerEmail({
          locale,
          customerName: payload.customerName,
          tier: payload.tier,
          dashboardUrl,
        })
        break
      }
      case 'nif_delivered': {
        // Send the NIF number and post-NIF journey guide to the customer
        subject = getNifDeliveredSubject(locale)
        reactElement = NifDeliveredEmail({
          locale,
          customerName: payload.customerName,
          nifNumber: payload.nifNumber,
          dashboardUrl,
        })
        break
      }
      case 'fiscal_rep_renewal_confirmation': {
        // Confirm the renewal to the customer with their new fiscal rep expiry date
        subject = getFiscalRepRenewalConfirmationSubject(locale)
        reactElement = FiscalRepRenewalConfirmationEmail({
          locale,
          customerName: payload.customerName,
          newExpiresAt: payload.newExpiresAt,
          dashboardUrl,
        })
        break
      }
      case 'renewal_reminder': {
        // Automated reminder sent by the daily cron job at 30, 15, and 0 days before expiry
        const renewalUrl = payload.renewalUrl
        subject = getRenewalReminderSubject(locale, payload.interval)
        reactElement = RenewalReminderEmail({
          locale,
          interval: payload.interval,
          customerName: payload.customerName,
          renewalUrl,
        })
        break
      }
      case 'status_update_with_note': {
        subject = getStatusUpdateWithNoteSubject(locale)
        reactElement = StatusUpdateWithNoteEmail({
          locale,
          customerName: payload.customerName,
          note: payload.note,
          newStatus: payload.newStatus,
          dashboardUrl,
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
