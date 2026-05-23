import Stripe from 'stripe'

/**
 * Business logic for processing Stripe webhook events.
 * Handles order creation and payment persistence after successful checkout,
 * and fiscal rep renewal extension after renewal checkout.
 */
import { db } from '@/lib/db'
import { orders, payments } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getUserLanguage, extendFiscalRepExpiry, getOrderFullName } from '@/lib/db/queries'
import { sendEmail } from '@/lib/email/send'
import { RenewalWebhookMetadataSchema } from '@/lib/validations/checkout'

export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // 1. Extract metadata passed during session creation
  const userId = session.metadata?.userId
  const tier = session.metadata?.tier

  if (!userId || !tier) {
    return
  }

  // Idempotency: return early if this session was already processed
  const existingPayment = await db.query.payments.findFirst({
    where: eq(payments.stripeCheckoutSessionId, session.id),
  })

  if (existingPayment) {
    return
  }

  // Webhooks always return the payment_intent as a string ID (never the expanded object)
  const stripePaymentIntentId = session.payment_intent as string | null

  if (!stripePaymentIntentId) {
    return
  }

  // Capture the created order ID outside the transaction so we can use it after commit
  let createdOrderId: string | null = null

  try {
    // 2. Persist Order and Payment records in a single atomic transaction
    await db.transaction(async (tx) => {
      // Create the Order record (status defaults to 'documents_pending')
      const [newOrder] = await tx
        .insert(orders)
        .values({
          userId,
          // metadata.tier is string — cast to enum union after validation above
          tier: tier as 'essential' | 'standard' | 'express',
          status: 'documents_pending',
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId,
        })
        .returning()

      if (!newOrder) {
        throw new Error('Failed to create order record')
      }

      createdOrderId = newOrder.id

      // Create the Payment record as an audit trail for the transaction
      await tx.insert(payments).values({
        orderId: newOrder.id,
        userId,
        stripePaymentIntentId,
        stripeCheckoutSessionId: session.id,
        amount: session.amount_total ?? 0,
        currency: session.currency ?? 'eur',
        status: session.payment_status === 'paid' ? 'succeeded' : 'pending',
        // metadata.tier is string — cast to enum union after validation above
        tier: tier as 'essential' | 'standard' | 'express',
        isRenewal: false,
      })
    })
  } catch (error) {
    // Re-throw so the webhook route returns 500 and Stripe retries the event
    throw error
  }

  // 3. Send order confirmation email after the transaction commits (fire-and-forget)
  //    sendEmail swallows its own errors so this never throws back to the webhook handler
  if (createdOrderId) {
    const customerEmail =
      session.customer_details?.email ?? session.customer_email ?? null

    if (customerEmail) {
      const locale = await getUserLanguage(userId)

      // Format amount: cents → euros, no decimals for round amounts
      const euros = (session.amount_total ?? 0) / 100
      const amountEur = Number.isInteger(euros) ? `€${euros}` : `€${euros.toFixed(2)}`

      await sendEmail(customerEmail, locale, {
        template: 'order_confirmation',
        orderId: createdOrderId,
        tier,
        amountEur,
      })
    }
  }
}

/**
 * Handles a completed Stripe Checkout Session for fiscal rep renewal.
 * Validates metadata, guards idempotency, atomically inserts a Payment row and
 * extends the order's fiscalRepExpiresAt, then sends a confirmation email.
 *
 * Called from the webhook route when session.metadata.type === 'fiscal_rep_renewal'.
 * Any thrown error causes the route to return 500 so Stripe retries the event.
 */
export async function handleRenewalCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  // 1. Validate metadata — return early if the session lacks the expected shape.
  //    This guards against misconfigured sessions rather than retryable errors.
  const parsed = RenewalWebhookMetadataSchema.safeParse(session.metadata)
  if (!parsed.success) {
    console.error('[handleRenewalCheckoutCompleted] Invalid metadata', session.metadata)
    return
  }

  const { orderId, userId, tier } = parsed.data

  // 2. Idempotency guard — if this session was already processed, skip silently.
  //    Stripe may deliver the same event more than once; the payments table is the
  //    source of truth for whether a session has been processed.
  const existingPayment = await db.query.payments.findFirst({
    where: eq(payments.stripeCheckoutSessionId, session.id),
  })
  if (existingPayment) {
    return
  }

  // payment_intent is always a string ID on webhook delivery (never the expanded object)
  const stripePaymentIntentId = session.payment_intent as string | null
  if (!stripePaymentIntentId) {
    return
  }

  // 3. Atomic transaction: insert Payment row AND extend fiscal rep expiry together.
  //    extendFiscalRepExpiry accepts the tx object so both writes share the same transaction.
  let newExpiresAt: Date | null = null

  await db.transaction(async (tx) => {
    // Insert a renewal Payment record for audit trail
    await tx.insert(payments).values({
      orderId,
      userId,
      stripePaymentIntentId,
      stripeCheckoutSessionId: session.id,
      amount: session.amount_total ?? 0,
      currency: session.currency ?? 'eur',
      status: session.payment_status === 'paid' ? 'succeeded' : 'pending',
      tier,
      isRenewal: true,
    })

    // Extend the order's fiscal rep expiry by 12 months (from GREATEST of current expiry or NOW)
    newExpiresAt = await extendFiscalRepExpiry(orderId, tx)
  })

  // 4. Send renewal confirmation email after the transaction commits (fire-and-forget).
  //    Resolve the customer email and the user's language preference before sending.
  if (newExpiresAt) {
    const customerEmail =
      session.customer_details?.email ?? session.customer_email ?? null

    if (customerEmail) {
      const locale = await getUserLanguage(userId)
      // Fallback chain: DB full name → email local part → full email address
      const customerName =
        (await getOrderFullName(orderId)) ??
        customerEmail.split('@')[0] ??
        customerEmail

      // Format the new expiry date in the user's locale
      const localeMap: Record<string, string> = {
        en: 'en-GB',
        fr: 'fr-FR',
        es: 'es-ES',
        de: 'de-DE',
      }
      const newExpiresAtFormatted = new Date(newExpiresAt).toLocaleDateString(
        localeMap[locale] ?? 'en-GB',
        { day: 'numeric', month: 'long', year: 'numeric' },
      )

      void sendEmail(customerEmail, locale, {
        template: 'fiscal_rep_renewal_confirmation',
        customerName,
        newExpiresAt: newExpiresAtFormatted,
      })
    }
  }
}
