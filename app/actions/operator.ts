'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/session'
import {
  getOrderStatusById,
  markOrderSubmitted,
  insertAuditLog,
  getOrderDataForSubmissionEmail,
  getOperatorPreferencesOrDefaults,
  upsertOperatorPreferences,
} from '@/lib/db/queries'
import { sendEmail } from '@/lib/email/send'
import type { ActionResult } from '@/lib/types'

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const MarkAsSubmittedSchema = z.object({
  orderId: z.string().uuid(),
})

// ---------------------------------------------------------------------------
// markOrderAsSubmitted
// Transitions a documents_approved order to submitted. Operator only.
// ---------------------------------------------------------------------------

export async function markOrderAsSubmitted(orderId: string): Promise<ActionResult> {
  // 1. Validate the order ID format
  const parsed = MarkAsSubmittedSchema.safeParse({ orderId })
  if (!parsed.success) return { success: false, error: 'Invalid order ID.' }

  // 2. Auth — redirects automatically if not authenticated or wrong role
  const operator = await requireRole('operator')

  // 3. Verify the order exists and is in the correct state
  const order = await getOrderStatusById(orderId)
  if (!order) return { success: false, error: 'Order not found.' }
  if (order.status !== 'documents_approved') {
    return { success: false, error: 'Order is not awaiting submission.' }
  }

  // 4. Transition the order status
  await markOrderSubmitted(orderId)

  // 5. Append-only audit log entry
  await insertAuditLog({
    userId: operator.id,
    orderId,
    action: 'order.submitted',
    details: { operatorId: operator.id, previousStatus: 'documents_approved' },
    ipAddress: null,
    userAgent: null,
  })

  // 6. Fire-and-forget customer notification email — do not await, never block the response
  void getOrderDataForSubmissionEmail(orderId).then((emailData) => {
    if (!emailData) return // order data missing — skip silently, not a blocking error
    sendEmail(emailData.customerEmail, emailData.customerLanguage, {
      template: 'order_submitted_customer',
      customerName: emailData.fullName ?? 'there',
      tier: emailData.tier,
    })
  })

  // 7. Revalidate both the operator queue and archive pages
  revalidatePath('/operator', 'page')
  revalidatePath('/operator/submitted', 'page')

  return { success: true }
}

// ---------------------------------------------------------------------------
// Validation schema for updateOperatorPreferences
// ---------------------------------------------------------------------------

const UpdatePreferencesSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  phoneNumber: z.string().nullable(),
})

// ---------------------------------------------------------------------------
// updateOperatorPreferences
// Upserts the operator's notification channel preferences. Operator only.
// ---------------------------------------------------------------------------

export async function updateOperatorPreferences(
  formData: z.infer<typeof UpdatePreferencesSchema>,
): Promise<ActionResult> {
  // 1. Validate input — prevents bad data from reaching the DB
  const parsed = UpdatePreferencesSchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: 'Invalid preferences data.' }

  // 2. Auth — operator role required
  const operator = await requireRole('operator')

  // 3. Business rule: phone number is required when SMS is enabled
  if (parsed.data.smsNotifications && !parsed.data.phoneNumber?.trim()) {
    return { success: false, error: 'A phone number is required when SMS notifications are enabled.' }
  }

  // 4. Upsert preferences — insert on first save, update on conflict.
  //    Null the phone number when SMS is off to avoid retaining a stale value.
  await upsertOperatorPreferences(operator.id, {
    emailNotifications: parsed.data.emailNotifications,
    smsNotifications: parsed.data.smsNotifications,
    phoneNumber: parsed.data.smsNotifications ? parsed.data.phoneNumber : null,
  })

  // 5. Audit log — preferences changes are security-relevant
  await insertAuditLog({
    userId: operator.id,
    orderId: null,
    action: 'operator.preferences.updated',
    details: {
      emailNotifications: parsed.data.emailNotifications,
      smsNotifications: parsed.data.smsNotifications,
      phoneNumberSet: !!parsed.data.phoneNumber,
    },
    ipAddress: null,
    userAgent: null,
  })

  return { success: true }
}
