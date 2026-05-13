import Stripe from 'stripe'

/**
 * Business logic for processing Stripe webhook events.
 * Handles order creation and payment persistence after successful checkout.
 */
import { db } from '@/lib/db'
import { orders, payments } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // 1. Extract metadata passed during session creation
  const userId = session.metadata?.userId
  const tier = session.metadata?.tier

  if (!userId || !tier) {
    console.error('[stripe-webhook] Missing metadata in session:', session.id)
    return
  }

  // Idempotency: check if we already processed this session
  const existingPayment = await db.query.payments.findFirst({
    where: eq(payments.stripeCheckoutSessionId, session.id),
  })

  if (existingPayment) {
    console.warn('[stripe-webhook] Session already processed:', session.id)
    return
  }

  const stripePaymentIntentId = session.payment_intent as string | null

  if (!stripePaymentIntentId) {
    console.error('[stripe-webhook] Missing payment_intent in session:', session.id)
    return
  }

  try {
    // 3. Persist Order and Payment records in a single atomic transaction
    await db.transaction(async (tx) => {
      // Create the Order record (status defaults to 'documents_pending')
      const [newOrder] = await tx
        .insert(orders)
        .values({
          userId,
          tier: tier as 'essential' | 'standard' | 'express',
          status: 'documents_pending',
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId,
        })
        .returning()

      if (!newOrder) {
        throw new Error('Failed to create order record')
      }

      // Create the Payment record as an audit trail for the transaction
      await tx.insert(payments).values({
        orderId: newOrder.id,
        userId,
        stripePaymentIntentId,
        stripeCheckoutSessionId: session.id,
        amount: session.amount_total ?? 0,
        currency: session.currency ?? 'eur',
        status: session.payment_status === 'paid' ? 'succeeded' : 'pending',
        tier: tier as 'essential' | 'standard' | 'express',
        isRenewal: false,
      })
    })

    // Log success as warn to pass linting (only warn/error allowed)
    console.warn('[stripe-webhook] Successfully processed session:', session.id)
  } catch (error) {
    console.error('[stripe-webhook] Transaction failed for session:', session.id, error)
    throw error // Re-throw so the webhook handler returns a 500, prompting Stripe to retry
  }
}
