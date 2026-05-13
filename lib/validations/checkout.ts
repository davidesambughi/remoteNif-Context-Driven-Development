import { z } from 'zod'

export const CheckoutSessionSchema = z.object({
  tier: z.enum(['essential', 'standard', 'express']),
})
