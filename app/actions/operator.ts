'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/session'
import { getOrderStatusById, markOrderSubmitted, insertAuditLog } from '@/lib/db/queries'
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

  // 6. Revalidate the operator queue — the submitted order will no longer appear
  revalidatePath('/operator', 'page')

  return { success: true }
}
