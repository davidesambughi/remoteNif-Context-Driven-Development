import { z } from 'zod'
import { routing } from '@/i18n/routing'

// ---------------------------------------------------------------------------
// Initial order checkout schema (Feature 07a)
// ---------------------------------------------------------------------------

export const CheckoutSessionSchema = z.object({
  tier: z.enum(['essential', 'standard', 'express']),
  // Locale passed by the client so Stripe redirect URLs land on the correct language.
  locale: z.enum(['en', 'fr', 'es', 'de']),
})

// ---------------------------------------------------------------------------
// Renewal checkout schemas (Feature 18a)
// ---------------------------------------------------------------------------

/**
 * Input validated by createRenewalCheckoutSession Server Action.
 * locale is derived from routing.locales — adding a new locale to i18n/routing.ts
 * automatically extends this validation (same pattern as updateLanguagePreferenceSchema).
 */
export const RenewalCheckoutSchema = z.object({
  orderId: z.string().uuid(),
  locale: z.enum([...routing.locales] as [string, ...string[]]),
})

export type RenewalCheckoutInput = z.infer<typeof RenewalCheckoutSchema>

/**
 * Validates Stripe metadata before any DB write inside handleRenewalCheckoutCompleted.
 * Kept in lib/validations/ so all Zod schemas live in one layer (not scattered in lib/stripe/).
 */
export const RenewalWebhookMetadataSchema = z.object({
  type: z.literal('fiscal_rep_renewal'),
  orderId: z.string().uuid(),
  userId: z.string().uuid(),
  // tier is stored in metadata so the webhook can write a valid Payment row
  // without a second DB read.
  tier: z.enum(['essential', 'standard', 'express']),
})

export type RenewalWebhookMetadata = z.infer<typeof RenewalWebhookMetadataSchema>
