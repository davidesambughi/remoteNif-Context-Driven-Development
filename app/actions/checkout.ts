'use server'

/**
 * Server Action to create a Stripe Checkout Session for NIF acquisition.
 * Validates the selected tier and ensures the user is authenticated.
 */


import { CheckoutSessionSchema } from '@/lib/validations/checkout'
import { getCurrentUser } from '@/lib/auth/session'
import { TIERS } from '@/lib/pricing'
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

    if (!session.url) {
      throw new Error('No session URL returned from Stripe')
    }

    // 5. Return redirect URL to the client
    return { success: true, data: { url: session.url } }
  } catch {
    return { success: false, error: 'checkout.errors.generic' }
  }
}
