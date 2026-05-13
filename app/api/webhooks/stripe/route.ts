import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { env } from '@/lib/env'
import { handleCheckoutSessionCompleted } from '@/lib/stripe/webhooks'
import Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get('Stripe-Signature')

  if (!signature) {
    return new NextResponse('Missing Stripe signature', { status: 400 })
  }

  let event: Stripe.Event

  try {
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
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
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
