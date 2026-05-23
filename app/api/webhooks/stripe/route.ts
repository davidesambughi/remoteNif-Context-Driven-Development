import { headers } from 'next/headers'

/**
 * Public endpoint for Stripe Webhooks.
 * Uses raw body verification to ensure events are genuinely from Stripe.
 */
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { env } from '@/lib/env'
import { handleCheckoutSessionCompleted, handleRenewalCheckoutCompleted } from '@/lib/stripe/webhooks'
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
  } catch {
    return new NextResponse('Invalid signature', { status: 400 })
  }

  try {
    // 3. Route the event based on its type
    switch (event.type) {
      case 'checkout.session.completed': {
        // event.data.object is a union of all Stripe object types — narrowed by the switch case
        const session = event.data.object as Stripe.Checkout.Session
        // Discriminate on metadata.type: renewal sessions have type='fiscal_rep_renewal';
        // all other sessions (initial orders) fall through to handleCheckoutSessionCompleted.
        if (session.metadata?.type === 'fiscal_rep_renewal') {
          await handleRenewalCheckoutCompleted(session)
        } else {
          await handleCheckoutSessionCompleted(session)
        }
        break
      }
      default:
        break
    }

    return new NextResponse('Success', { status: 200 })
  } catch {
    return new NextResponse('Webhook handler failed', { status: 500 })
  }
}
