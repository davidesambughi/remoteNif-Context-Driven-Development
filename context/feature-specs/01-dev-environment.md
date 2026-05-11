# 01 — Dev Environment

Read `context/AGENTS.md`, `context/progress-tracker.md` before starting.

Set up the project's foundational config layer — TypeScript strict settings, ESLint rules, Zod env validation, and the hardcoded pricing config — so every subsequent feature starts from a consistent, type-safe base.

---

## Constraints

### Architecture

- `lib/env.ts` is the single point of env var access across the entire app. No feature ever reads `process.env` directly — it imports from `lib/env.ts`.
- `lib/pricing.ts` is a pure config file: no imports from external packages, no async logic. Just typed constants.
- Both files live in `lib/` (shared infrastructure). No route-specific logic goes here.
- `globals.css` already contains the design tokens and the `@theme inline` block. This step verifies correctness — it is not a rewrite.
- No new Supabase clients, no database access, no API routes in this feature.

### TypeScript

- Strict mode is already on in `tsconfig.json`. Verify `"strict": true` is present, then add `"noUncheckedIndexedAccess": true` and `"noImplicitReturns": true` to catch common bugs early.
- No `any`. No type assertions without an inline comment explaining why.
- Infer types from Zod schemas with `z.infer<typeof Schema>` — no duplicate type definitions.
- Use `interface` for object shapes (props, config entries). Use `type` for unions and derived types.

### Validation

Zod env schema lives in `lib/env.ts`. The exact schema is defined in `context/tech-spec.md` under "Zod Schema (`lib/env.ts`)". Reproduce it exactly — do not add, remove, or rename fields.

```typescript
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().url(),

  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),

  RESEND_API_KEY: z.string().startsWith('re_'),
  RESEND_FROM_EMAIL: z.string().email(),

  GEMINI_API_KEY: z.string().min(1),

  CRON_SECRET: z.string().min(1),
})

export const env = envSchema.parse(process.env)
export type Env = z.infer<typeof envSchema>
```

**Dev behavior:** `env` will throw at startup if any required variable is missing or malformed. This is intentional — fail fast, not silently.

**During this feature only:** `SUPABASE_*`, `STRIPE_*`, `RESEND_*`, `GEMINI_API_KEY`, and `DATABASE_URL` do not exist yet. Wrap `envSchema.parse(process.env)` in a try/catch that logs a clear warning and exports a partial object in development only, so `npm run build` can pass while the credentials don't exist yet. Production must always throw.

```typescript
// Development-only fallback (remove once all env vars are real)
export const env = process.env.NODE_ENV === 'production'
  ? envSchema.parse(process.env)
  : (() => {
      try {
        return envSchema.parse(process.env)
      } catch {
        console.warn('[env] Missing env vars — running with partial config (dev only)')
        return process.env as unknown as Env
      }
    })()
```

---

## Implementation

1. **Verify and extend `tsconfig.json`.**

   Confirm `"strict": true` is present (it already is). Add these two options inside `"compilerOptions"`:
   - `"noUncheckedIndexedAccess": true`
   - `"noImplicitReturns": true`

   Do not change any other `tsconfig.json` setting.

2. **Extend `eslint.config.mjs` with project-specific rules.**

   Add a rules object after the spread of `nextVitals` and `nextTs`:

   ```js
   {
     rules: {
       '@typescript-eslint/no-explicit-any': 'error',
       '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
       'no-console': ['warn', { allow: ['warn', 'error'] }],
     },
   }
   ```

   Keep the existing `globalIgnores` block exactly as-is.

3. **Install `zod`.**

   ```bash
   npm install zod
   ```

4. **Create `lib/env.ts`.**

   Use the exact schema from the Validation section above. Export `env` and `Env`. Include the dev-only fallback.

   Create a `.env.local` file in the project root using the template from `context/tech-spec.md` under `.env.local Template`. Populate `NEXT_PUBLIC_APP_URL=http://localhost:3000` and `NODE_ENV=development`. Leave all other values as placeholder comments — they will be filled in when Supabase, Stripe, Resend, and Gemini are set up in later features.

   Confirm `.env.local` is listed in `.gitignore`. It already is — do not add a duplicate entry.

5. **Create `lib/pricing.ts`.**

   Hardcoded config for all tiers and the renewal price. All amounts in euro cents.

   ```typescript
   // lib/pricing.ts

   export type Tier = 'essential' | 'standard' | 'express'

   export interface TierConfig {
     id: Tier
     priceEurCents: number
     deliveryDescription: string
     includesFiscalRep: boolean
     fiscalRepMonths: number | null
   }

   export const TIERS: Record<Tier, TierConfig> = {
     essential: {
       id: 'essential',
       priceEurCents: 7900,
       deliveryDescription: '5 business days',
       includesFiscalRep: false,
       fiscalRepMonths: null,
     },
     standard: {
       id: 'standard',
       priceEurCents: 12900,
       deliveryDescription: '5 business days',
       includesFiscalRep: true,
       fiscalRepMonths: 12,
     },
     express: {
       id: 'express',
       priceEurCents: 17900,
       deliveryDescription: 'Submitted within 48h of document approval',
       includesFiscalRep: true,
       fiscalRepMonths: 12,
     },
   }

   export const TIER_ORDER: Tier[] = ['essential', 'standard', 'express']

   export const RENEWAL_PRICE_EUR_CENTS = 8900
   ```

   No dynamic logic. No imports. This file is imported by checkout, pricing page, and any other feature that needs pricing data.

6. **Verify `globals.css` `@theme inline` block.**

   Open `app/globals.css`. Confirm the `@theme inline` block exists and maps all semantic tokens to Tailwind color utilities. The current file already has this block. Check that the following mappings are present:
   - Backgrounds: `--color-base`, `--color-surface`, `--color-elevated`, `--color-subtle`
   - Text: `--color-primary`, `--color-secondary`, `--color-muted`, `--color-on-accent`
   - Borders: `--color-border-default`, `--color-border-subtle`, `--color-border-strong`
   - Brand: `--color-brand-primary`, `--color-brand-primary-dim`, `--color-brand-secondary`
   - Status: `--color-success`, `--color-warning`, `--color-error`, `--color-info`

   If any mapping is missing, add it. If all are present, no change needed.

---

## Dependencies

Install: `zod`

---

## Scope Limits

- Don't create Supabase clients (`lib/supabase/`) — that's Feature 02.
- Don't create Drizzle schema or config — that's Feature 02.
- Don't set up next-intl or the `[locale]` route segment — that's Feature 03.
- Don't create `proxy.ts` — that's Feature 03.
- Don't write any page, layout, or component — this feature is infrastructure only.
- Don't add feature flags (`lib/flags.ts`) — not needed until a feature explicitly requires one.
- Keep this focused on config and foundational lib files only.

---

## Check When Done

- `tsconfig.json` has `"strict": true`, `"noUncheckedIndexedAccess": true`, and `"noImplicitReturns": true` in `compilerOptions`.
- `eslint.config.mjs` has `@typescript-eslint/no-explicit-any: 'error'` in a rules block.
- `zod` appears in `dependencies` in `package.json`.
- `lib/env.ts` exists, exports `env` and `Env`, and uses the exact schema fields from `tech-spec.md`.
- `lib/pricing.ts` exists, exports `TIERS`, `TIER_ORDER`, `RENEWAL_PRICE_EUR_CENTS`, and `TierConfig`.
- `TIERS.essential.priceEurCents` is `7900`, `TIERS.standard.priceEurCents` is `12900`, `TIERS.express.priceEurCents` is `17900`.
- `RENEWAL_PRICE_EUR_CENTS` is `8900`.
- `.env.local` exists with `NEXT_PUBLIC_APP_URL=http://localhost:3000` and `NODE_ENV=development`.
- `.env.local` is not committed to git (confirmed in `.gitignore`).
- `globals.css` `@theme inline` block contains all mappings listed in step 6.
- `npm run build` passes.
- `npm run lint` passes (or shows only warnings, no errors).
