import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SERVICE_SECRET_KEY: z.string().min(1),
  DATABASE_URL: z.string().url(),

  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),

  RESEND_API_KEY: z.string().startsWith('re_'),
  RESEND_FROM_EMAIL: z.string().email(),

  GEMINI_API_KEY: z.string().min(1),

  CRON_SECRET: z.string().min(1),
})

export type Env = z.infer<typeof envSchema>

// Production always throws on missing/invalid vars. Dev falls back with a warning
// so the build passes before all third-party credentials exist.
export const env: Env =
  process.env.NODE_ENV === 'production'
    ? envSchema.parse(process.env)
    : (() => {
        try {
          return envSchema.parse(process.env)
        } catch {
          console.warn('[env] Missing env vars — running with partial config (dev only)')
          return process.env as unknown as Env
        }
      })()
