import { z } from 'zod'

export const CheckoutSessionSchema = z.object({
  tier: z.enum(['essential', 'standard', 'express']),
  // Locale is passed by the client so Stripe redirect URLs land on the correct language.
  locale: z.enum(['en', 'fr', 'es', 'de']),
})
