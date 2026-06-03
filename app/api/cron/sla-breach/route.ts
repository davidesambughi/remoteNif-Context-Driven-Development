import { z } from 'zod'
import { env } from '@/lib/env'
import { getOverdueExpressOrders, markSlaBreachAlertSent } from '@/lib/db/queries'
import { sendEmail } from '@/lib/email/send'

// Validates that the Authorization header matches the expected Bearer token.
// Reject immediately with 401 if missing or incorrect.
const CronHeaderSchema = z
  .string()
  .refine((val) => val === `Bearer ${env.CRON_SECRET}`, {
    message: 'Invalid cron secret',
  })

/**
 * SLA breach alert cron handler.
 *
 * Triggered daily (schedule configured in vercel.json — see Feature 22).
 * Finds Express orders that have been in `documents_approved` status for more than
 * 48 hours and have not yet received a breach alert. Sends one alert per order to
 * the admin and stamps `slaBreachAlertSentAt` to prevent re-alerting.
 *
 * Authentication: Bearer token in the Authorization header must match CRON_SECRET.
 */
export async function GET(request: Request): Promise<Response> {
  // 1. Authenticate — reject anything without the correct secret
  const authHeader = request.headers.get('Authorization') ?? ''
  const authResult = CronHeaderSchema.safeParse(authHeader)
  if (!authResult.success) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Fetch all Express orders past the 48h SLA that haven't been alerted yet
  let overdueOrders
  try {
    overdueOrders = await getOverdueExpressOrders()
  } catch (err) {
    console.error('[cron/sla-breach] DB query failed', err)
    return Response.json({ success: false, error: 'db_query_failed' }, { status: 500 })
  }

  let processed = 0

  // 3. Alert the admin for each breached order and stamp the dedup column
  for (const order of overdueOrders) {
    const hoursOverdue = Math.floor(
      (Date.now() - order.documentsApprovedAt.getTime()) / (1000 * 60 * 60),
    )

    // Fire-and-forget — sendEmail swallows errors internally
    void sendEmail(env.ADMIN_EMAIL, 'en', {
      template: 'admin_sla_breach',
      orderId: order.id,
      customerName: order.fullName ?? 'Unknown',
      hoursOverdue,
    })

    // Mark alert sent — if this fails, log and continue rather than aborting the loop
    try {
      await markSlaBreachAlertSent(order.id)
    } catch (err) {
      console.error(`[cron/sla-breach] Failed to mark alert sent for order ${order.id}`, err)
    }

    processed++
  }

  return Response.json({ success: true, processed })
}
