'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import {
  getAdminOrderDetail,
  getOperatorUsers,
  adminSetDocumentApproved,
  adminSetDocumentFlagged,
  adminTransitionOrderToApproved,
  adminUpdateOrderStatusQuery,
  insertAuditLog,
  insertOperatorNotification,
} from '@/lib/db/queries'
import type { SelectOrder } from '@/lib/db/schema'
import { requireRole } from '@/lib/auth/session'
import { sendEmail } from '@/lib/email/send'

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

const FlagDocumentSchema = z.object({
  documentId: z.string().uuid(),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
})

const ApproveOrderSchema = z.object({
  orderId: z.string().uuid(),
})

const UpdateOrderStatusSchema = z.object({
  orderId: z.string().uuid(),
  newStatus: z.enum([
    'documents_pending',
    'documents_under_review',
    'documents_approved',
    'submitted',
    'delivered',
  ]),
  note: z.string().max(1000).optional(),
})

const ResendEmailSchema = z.object({
  orderId: z.string().uuid(),
  emailType: z.enum(['order_confirmation', 'documents_approved_customer']),
})

// ---------------------------------------------------------------------------
// Response Type
// ---------------------------------------------------------------------------

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/** Approves a document via admin override. */
export async function adminApproveDocument(documentId: string): Promise<ActionResult> {
  try {
    const admin = await requireRole('admin')
    
    if (!z.string().uuid().safeParse(documentId).success) {
      return { success: false, error: 'invalid_id' }
    }

    await adminSetDocumentApproved(documentId, admin.id)
    
    await insertAuditLog({
      userId: admin.id,
      action: 'document.admin_approved',
      details: { documentId },
    })

    revalidatePath('/admin/orders/[id]', 'page')
    return { success: true }
  } catch (error) {
    console.error('[adminApproveDocument] Error:', error)
    return { success: false, error: 'unexpected_error' }
  }
}

/** Flags a document via admin override. */
export async function adminFlagDocument(documentId: string, reason: string): Promise<ActionResult> {
  try {
    const admin = await requireRole('admin')
    
    const validated = FlagDocumentSchema.parse({ documentId, reason })

    await adminSetDocumentFlagged(validated.documentId, admin.id, validated.reason)
    
    await insertAuditLog({
      userId: admin.id,
      action: 'document.admin_flagged',
      details: { documentId: validated.documentId, reason: validated.reason },
    })

    revalidatePath('/admin/orders/[id]', 'page')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'validation_error' }
    }
    console.error('[adminFlagDocument] Error:', error)
    return { success: false, error: 'unexpected_error' }
  }
}

/** Approves the full order once all docs are ready. */
export async function adminApproveOrder(orderId: string): Promise<ActionResult> {
  try {
    const admin = await requireRole('admin')
    
    if (!z.string().uuid().safeParse(orderId).success) {
      return { success: false, error: 'invalid_id' }
    }

    const order = await getAdminOrderDetail(orderId)
    if (!order) return { success: false, error: 'order_not_found' }

    if (order.status !== 'documents_under_review') {
      return { success: false, error: 'invalid_status' }
    }

    const allApproved = order.documents.length === 3 && order.documents.every(d => d.approved)
    if (!allApproved) {
      return { success: false, error: 'not_all_approved' }
    }

    await adminTransitionOrderToApproved(orderId)

    // Notify operators
    const operators = await getOperatorUsers()
    const operatorIds = operators.map(o => o.id)
    
    const slaNote = order.tier === 'express' 
      ? '48h SLA has started — submit as soon as possible' 
      : undefined

    for (const operator of operators) {
      await insertOperatorNotification({
        orderId,
        operatorId: operator.id,
        type: 'email',
        status: 'pending',
      })
      
      // Fire-and-forget email
      sendEmail(operator.email, 'en', {
        template: 'operator_submission_ready',
        customerName: order.fullName || 'Customer',
        tier: order.tier,
        orderId,
        slaNote,
      }).catch(err => console.error(`Failed to notify operator ${operator.email}:`, err))
    }

    // Notify customer
    sendEmail(order.customerEmail, order.customerLanguage, {
      template: 'documents_approved_customer',
      customerName: order.fullName || 'Customer',
      tier: order.tier,
    }).catch(err => console.error(`Failed to notify customer ${order.customerEmail}:`, err))

    await insertAuditLog({
      userId: admin.id,
      orderId,
      action: 'order.approved',
      details: { operatorsNotified: operatorIds },
    })

    revalidatePath('/admin/orders/[id]', 'page')
    return { success: true }
  } catch (error) {
    console.error('[adminApproveOrder] Error:', error)
    return { success: false, error: 'unexpected_error' }
  }
}

/** Manually updates order status. */
export async function adminUpdateOrderStatus(
  orderId: string, 
  newStatus: 'documents_pending' | 'documents_under_review' | 'documents_approved' | 'submitted' | 'delivered', 
  note?: string
): Promise<ActionResult> {
  try {
    const admin = await requireRole('admin')
    
    const validated = UpdateOrderStatusSchema.parse({ orderId, newStatus, note })

    const order = await getAdminOrderDetail(orderId)
    if (!order) return { success: false, error: 'order_not_found' }

    const statusOrder = [
      'documents_pending',
      'documents_under_review',
      'documents_approved',
      'submitted',
      'delivered',
    ]
    
    const currentIndex = statusOrder.indexOf(order.status)
    const newIndex = statusOrder.indexOf(validated.newStatus)
    
    if (newIndex < currentIndex && !validated.note) {
      return { success: false, error: 'note_required_for_backward_move' }
    }

    const timestamps: Partial<Pick<SelectOrder, 'documentsApprovedAt' | 'submittedToFinancasAt' | 'deliveredAt'>> = {}
    if (validated.newStatus === 'documents_approved' && !order.documentsApprovedAt) {
      timestamps.documentsApprovedAt = new Date()
    } else if (validated.newStatus === 'submitted') {
      timestamps.submittedToFinancasAt = new Date()
    } else if (validated.newStatus === 'delivered') {
      timestamps.deliveredAt = new Date()
    }

    await adminUpdateOrderStatusQuery(orderId, validated.newStatus, timestamps)

    if (validated.note) {
      // TODO: implement status_update_with_note template in Feature 12b
    }

    await insertAuditLog({
      userId: admin.id,
      orderId,
      action: 'order.status_updated',
      details: { 
        previousStatus: order.status, 
        newStatus: validated.newStatus, 
        note: validated.note 
      },
    })

    revalidatePath('/admin/orders/[id]', 'page')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'validation_error' }
    }
    console.error('[adminUpdateOrderStatus] Error:', error)
    return { success: false, error: 'unexpected_error' }
  }
}

/** Resends an email to the customer. */
export async function adminResendEmail(orderId: string, emailType: 'order_confirmation' | 'documents_approved_customer'): Promise<ActionResult> {
  try {
    const admin = await requireRole('admin')
    
    const validated = ResendEmailSchema.parse({ orderId, emailType })

    const order = await getAdminOrderDetail(orderId)
    if (!order) return { success: false, error: 'order_not_found' }

    if (validated.emailType === 'order_confirmation') {
      const amountEur = order.paymentAmountCents 
        ? (order.paymentAmountCents / 100).toFixed(2).replace('.', ',') + '€'
        : '0,00€'
        
      await sendEmail(order.customerEmail, order.customerLanguage, {
        template: 'order_confirmation',
        orderId: order.id,
        tier: order.tier,
        amountEur,
      })
    } else if (validated.emailType === 'documents_approved_customer') {
      await sendEmail(order.customerEmail, order.customerLanguage, {
        template: 'documents_approved_customer',
        customerName: order.fullName || 'Customer',
        tier: order.tier,
      })
    }

    await insertAuditLog({
      userId: admin.id,
      orderId,
      action: 'email.resent',
      details: { emailType: validated.emailType },
    })

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'validation_error' }
    }
    console.error('[adminResendEmail] Error:', error)
    return { success: false, error: 'unexpected_error' }
  }
}
