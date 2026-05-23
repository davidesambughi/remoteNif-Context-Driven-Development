'use server'

/**
 * Server Actions for Stripe Checkout Session creation.
 * Covers both initial NIF order checkout and fiscal rep renewal checkout.
 */

import { CheckoutSessionSchema, RenewalCheckoutSchema } from '@/lib/validations/checkout'
import { getCurrentUser } from '@/lib/auth/session'
import { TIERS, RENEWAL_PRICE_EUR_CENTS } from '@/lib/pricing'
import { getRenewalOrderInfo } from '@/lib/db/queries'
import { stripe } from '@/lib/stripe/client'
import { env } from '@/lib/env'
import type { ActionResult } from '@/lib/types'

export async function createCheckoutSession(
  input: unknown
): Promise<ActionResult<{ url: string }>> {
  // 1. Validate input tier against the checkout schema
  const parsed = CheckoutSessionSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'checkout.errors.generic' }
  }

  const { tier, locale } = parsed.data

  // 2. Auth check — only authenticated users can proceed to checkout
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: 'checkout.errors.unauthorized' }
  }

  // 3. Lookup tier configuration (price, description)
  const tierConfig = TIERS[tier]
  if (!tierConfig) {
    return { success: false, error: 'checkout.errors.generic' }
  }

  try {
    // 4. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `RemoteNIF - ${tierConfig.id.charAt(0).toUpperCase() + tierConfig.id.slice(1)} Tier`,
              description: tierConfig.deliveryDescription,
            },
            unit_amount: tierConfig.priceEurCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Locale-prefixed URLs so the user lands in their chosen language after payment.
      success_url: `${env.NEXT_PUBLIC_APP_URL}/${locale}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/${locale}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
        tier: tierConfig.id,
      },
    })

    // Guard: Stripe always returns a URL for hosted checkout; if missing, treat as failure
    if (!session.url) {
      return { success: false, error: 'checkout.errors.generic' }
    }

    // 5. Return redirect URL to the client
    return { success: true, data: { url: session.url } }
  } catch {
    return { success: false, error: 'checkout.errors.generic' }
  }
}

/**
 * Server Action to create a Stripe Checkout Session for fiscal rep renewal.
 * Only Standard and Express orders with an existing fiscalRepExpiresAt are eligible.
 * The actual expiry extension happens in the Stripe webhook (handleRenewalCheckoutCompleted).
 */
export async function createRenewalCheckoutSession(
  input: unknown,
): Promise<ActionResult<{ url: string }>> {
  // 1. Validate input shape
  const parsed = RenewalCheckoutSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'renewal.errors.generic' }
  }

  const { orderId, locale } = parsed.data

  // 2. Auth check — must be signed in to access order data
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: 'renewal.errors.unauthorized' }
  }

  // 3. Ownership + existence check — returns null if wrong userId or order missing
  const order = await getRenewalOrderInfo(orderId, user.id)
  if (!order) {
    return { success: false, error: 'renewal.errors.notFound' }
  }

  // 4. Eligibility guard — Essential tier has no fiscal rep to renew
  if (order.tier === 'essential' || order.fiscalRepExpiresAt === null) {
    return { success: false, error: 'renewal.errors.notEligible' }
  }

  try {
    // 5. Create a new Stripe Checkout Session for the renewal payment
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Fiscal Representation Renewal — 12 months',
            },
            unit_amount: RENEWAL_PRICE_EUR_CENTS, // 8900 (€89.00)
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // On success, land on dashboard. The renewal=success param can be read by 18b.
      success_url: `${env.NEXT_PUBLIC_APP_URL}/${locale}/dashboard?renewal=success`,
      // On cancel, return to the renewal page so the user can retry.
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/${locale}/renewal?orderId=${orderId}&canceled=true`,
      metadata: {
        type: 'fiscal_rep_renewal',
        orderId,
        userId: user.id,
        // tier stored in metadata so the webhook writes a valid Payment row without
        // a second DB read inside the transaction.
        tier: order.tier,
      },
    })

    // Guard: Stripe always returns a URL for hosted checkout; if missing, treat as failure
    if (!session.url) {
      return { success: false, error: 'renewal.errors.generic' }
    }

    return { success: true, data: { url: session.url } }
  } catch {
    return { success: false, error: 'renewal.errors.generic' }
  }
}
