import Stripe from 'stripe'
import { db } from '@/lib/db'
import { orders, payments } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
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
    console.log('[stripe-webhook] Session already processed:', session.id)
    return
  }

  const stripePaymentIntentId = session.payment_intent as string | null

  if (!stripePaymentIntentId) {
    console.error('[stripe-webhook] Missing payment_intent in session:', session.id)
    return
  }

  try {
    await db.transaction(async (tx) => {
      // 1. Create Order
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

      // 2. Create Payment
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

    console.log('[stripe-webhook] Successfully processed session:', session.id)
  } catch (error) {
    console.error('[stripe-webhook] Transaction failed for session:', session.id, error)
    throw error // Re-throw so the webhook handler returns a 500, prompting Stripe to retry
  }
}
