import { z } from 'zod'
import { env } from '@/lib/env'
import { getOrdersForRenewalReminders } from '@/lib/db/queries'
import { sendEmail } from '@/lib/email/send'
import type { RenewalReminderInterval } from '@/lib/email/templates/renewal-reminder'

// Validates that the Authorization header matches the expected Bearer token.
// Reject immediately with 401 if missing or incorrect — cron routes must be
// unreachable without the secret even if accidentally exposed to the internet.
const CronHeaderSchema = z
  .string()
  .refine((val) => val === `Bearer ${env.CRON_SECRET}`, {
    message: 'Invalid cron secret',
  })

/**
 * Renewal reminder cron handler.
 *
 * Triggered daily (schedule configured in vercel.json — see Feature 22).
 * Sends three cohorts of reminder emails based on days until fiscal rep expiry:
 *  - 30 days remaining  (≈ 11 months after NIF delivery)
 *  - 15 days remaining  (≈ 11.5 months after NIF delivery)
 *  - 0 days remaining   (expiry day — final warning)
 *
 * NOTE: no dedup guard — known limitation, acceptable at current scale.
 * If the cron fires twice on the same day a customer may receive a duplicate
 * reminder. Add a sent-flag column to orders if volume grows.
 *
 * Authentication: Bearer token in the Authorization header must match CRON_SECRET.
 */
export async function GET(request: Request): Promise<Response> {
  // 1. Authenticate — reject anything that doesn't carry the correct secret
  const authHeader = request.headers.get('Authorization') ?? ''
  const authResult = CronHeaderSchema.safeParse(authHeader)
  if (!authResult.success) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Define the three reminder cohorts to process in this run
  const cohorts: Array<{ daysFromNow: number; interval: RenewalReminderInterval }> = [
    { daysFromNow: 30, interval: '30_days' },
    { daysFromNow: 15, interval: '15_days' },
    { daysFromNow: 0,  interval: 'expired' },
  ]

  let processed = 0

  // 3. Process each cohort — fetch eligible orders and fire reminder emails
  for (const { daysFromNow, interval } of cohorts) {
    let targets
    try {
      targets = await getOrdersForRenewalReminders(daysFromNow)
    } catch (err) {
      // Log and skip this cohort — do not abort the entire run for one failing query
      console.error(`[cron/renewals] DB query failed for daysFromNow=${daysFromNow}`, err)
      continue
    }

    for (const target of targets) {
      // Build the locale-aware renewal URL so the CTA lands on the right-language page
      const renewalUrl = `${env.NEXT_PUBLIC_APP_URL}/${target.language}/renewal?orderId=${target.orderId}`

      // Fire-and-forget — sendEmail swallows errors internally; we still count the attempt
      void sendEmail(target.email, target.language, {
        template: 'renewal_reminder',
        interval,
        // Fall back to the email local-part if no name has been saved yet
        customerName: target.fullName ?? target.email.split('@')[0] ?? 'there',
        renewalUrl,
      })

      processed++
    }
  }

  return Response.json({ success: true, processed })
}
