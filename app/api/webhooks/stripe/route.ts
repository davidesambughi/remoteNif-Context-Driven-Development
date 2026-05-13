import { headers } from 'next/headers'

/**
 * Public endpoint for Stripe Webhooks.
 * Uses raw body verification to ensure events are genuinely from Stripe.
 */
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { env } from '@/lib/env'
import { handleCheckoutSessionCompleted } from '@/lib/stripe/webhooks'
import Stripe from 'stripe'

export async function POST(req: Request) {
  // 1. Capture raw body and signature for verification
  const body = await req.text()
  const signature = (await headers()).get('Stripe-Signature')

  if (!signature) {
    return new NextResponse('Missing Stripe signature', { status: 400 })
  }

  let event: Stripe.Event

  try {
    // 2. Verify that the event is authentic and hasn't been tampered with
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error(`[stripe-webhook] Verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    return new NextResponse('Invalid signature', { status: 400 })
  }

  try {
    // 3. Route the event based on its type
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        // Pass the session to our dedicated handler for business logic
        await handleCheckoutSessionCompleted(session)
        break
      }
      default:
        console.warn(`[stripe-webhook] Unhandled event type: ${event.type}`)
    }

    return new NextResponse('Success', { status: 200 })
  } catch (err) {
    console.error('[stripe-webhook] Handler failed:', err)
    return new NextResponse('Webhook handler failed', { status: 500 })
  }
}
