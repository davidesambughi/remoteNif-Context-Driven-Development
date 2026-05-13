'use server'


import { CheckoutSessionSchema } from '@/lib/validations/checkout'
import { getCurrentUser } from '@/lib/auth/session'
import { TIERS } from '@/lib/pricing'
import { stripe } from '@/lib/stripe/client'
import { env } from '@/lib/env'
import type { ActionResult } from '@/lib/types'

export async function createCheckoutSession(
  input: unknown
): Promise<ActionResult<{ url: string }>> {
  const parsed = CheckoutSessionSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'checkout.errors.generic' }
  }

  const { tier } = parsed.data
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: 'checkout.errors.unauthorized' }
  }

  const tierConfig = TIERS[tier]
  if (!tierConfig) {
    return { success: false, error: 'checkout.errors.generic' }
  }

  try {
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
      success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
        tier: tierConfig.id,
      },
    })

    if (!session.url) {
      throw new Error('No session URL returned from Stripe')
    }

    return { success: true, data: { url: session.url } }
  } catch (error) {
    console.error('[createCheckoutSession] Error:', error)
    return { success: false, error: 'checkout.errors.generic' }
  }
}
