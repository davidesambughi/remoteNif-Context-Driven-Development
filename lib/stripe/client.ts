/**
 * Singleton Stripe client instance.
 * Shared across the app for server-side payments logic.
 */
import Stripe from 'stripe'
import { env } from '@/lib/env'

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  // @ts-expect-error - Stripe types may not match the pinned apiVersion exactly
  apiVersion: '2023-10-16',
  typescript: true,
})
