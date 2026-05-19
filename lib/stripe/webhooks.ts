import Stripe from 'stripe'

/**
 * Business logic for processing Stripe webhook events.
 * Handles order creation and payment persistence after successful checkout.
 */
import { db } from '@/lib/db'
import { orders, payments } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getUserLanguage } from '@/lib/db/queries'
import { sendEmail } from '@/lib/email/send'

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
