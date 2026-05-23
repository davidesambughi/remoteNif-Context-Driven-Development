# 18a — Renewal Flow (Checkout & Extension)

<!-- Context files to read before starting:
     AGENTS.md, progress-tracker.md, architecture-context.md, tech-spec.md,
     user-flows.md (Flow 11b), lib/pricing.ts, lib/db/schema.ts -->

Add the fiscal representation renewal checkout flow: a Stripe-hosted payment page that a customer reaches via a link in their renewal email, which extends `fiscalRepExpiresAt` by 12 months on successful payment and sends a confirmation email.

---

## Constraints

### Tokens (UI features only)

| Purpose | Token | Tailwind utility |
|---------|-------|-----------------|
| Page canvas | `var(--bg-base)` | `bg-[var(--bg-base)]` ⚠️ no shorthand — `bg-base` omitted from `@theme` to avoid conflicting with Tailwind's built-in `text-base` font-size utility (see `globals.css` line 253) |
| Card surface | `var(--bg-surface)` | `bg-[var(--bg-surface)]` |
| Skeleton / muted fills | `var(--bg-subtle)` | `bg-[var(--bg-subtle)]` |
| Card border | `var(--border-default)` | `border-[var(--border-default)]` |
| Primary body text | `var(--text-primary)` | `text-[var(--text-primary)]` |
| Secondary text | `var(--text-secondary)` | `text-[var(--text-secondary)]` |
| Muted / caption text | `var(--text-muted)` | `text-[var(--text-muted)]` |
| Primary button bg | `var(--brand-primary)` | `bg-[var(--brand-primary)]` |
| Text on accent bg | `var(--text-on-accent)` | `text-[var(--text-on-accent)]` |
| Error feedback | `var(--status-error)` | `text-[var(--status-error)]` |
| Page heading size | `var(--text-2xl)` | `text-[length:var(--text-2xl)]` |
| Body / sub-line size | `var(--text-base)` | `text-[length:var(--text-base)]` |
| Small / error text size | `var(--text-sm)` | `text-[length:var(--text-sm)]` |
| Heading weight | `var(--font-bold)` | `font-[number:var(--font-bold)]` |
| Card / panel radius | `var(--radius-lg)` | `rounded-[length:var(--radius-lg)]` |
| Input / skeleton radius | `var(--radius-md)` | `rounded-[length:var(--radius-md)]` |
| Card shadow | `var(--shadow-md)` | `shadow-[var(--shadow-md)]` |

Rules that always apply:
- No raw Tailwind color classes (`zinc-*`, `slate-*`, `blue-*`). Tokens only.
- No hardcoded hex or RGB values.
- Mobile-first. Add `md:`/`lg:` breakpoint variants only where the layout actually changes.
- Border radius from scale: `--radius-sm / md / lg / xl / 2xl / full`.
- Shadcn components for all interactive elements (Button). Card layout uses plain divs with token classes.

---

### Architecture

- **New Server Action** `createRenewalCheckoutSession` → `app/actions/checkout.ts` (same file as existing `createCheckoutSession`). Pattern: validate → auth → ownership → Stripe → return `ActionResult`.
- **New Zod schemas** → `lib/validations/checkout.ts` (alongside existing `CheckoutSessionSchema`). All validation at the boundary before any business logic.
- **New DB queries** → `lib/db/queries.ts`: `getRenewalOrderInfo` and `extendFiscalRepExpiry`.
- **New webhook handler** `handleRenewalCheckoutCompleted` → `lib/stripe/webhooks.ts`.
- **Webhook route update** → `app/api/webhooks/stripe/route.ts`. Discriminate renewal vs initial-order sessions using `session.metadata.type`. Route is thin: verify signature → switch on type → delegate to handler.
- **New page** → `app/[locale]/(dashboard)/renewal/page.tsx`. Server Component. Lives inside `(dashboard)` — the proxy auth guard already protects it.
- **New Client Component** → `components/dashboard/renewal/RenewalCheckoutButton.tsx`. Uses `useEffect` and `useRouter` hooks — `"use client"` is required. This is the only component in this feature that is a Client Component.
- **New email template** → `lib/email/templates/fiscal-rep-renewal-confirmation.tsx`. Uses locale-mapped string literals (same as all other templates) — does NOT use next-intl.
- **Extend `lib/email/send.ts`** with a new `fiscal_rep_renewal_confirmation` union member and switch case.
- **All Server Actions return `ActionResult<T>`** from `lib/types.ts` — never throw to the client.
- **Email send is fire-and-forget** (using `void sendEmail(...)`) after the DB transaction commits.
- **No business logic in the page or the webhook route** — logic lives in `lib/`.

---

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- Infer all types from Zod schemas: `export type RenewalCheckoutInput = z.infer<typeof RenewalCheckoutSchema>`. Do not write a separate TypeScript interface or type that duplicates a schema's shape.
- DB query return shapes that are partial selects of an existing table use `Pick<SelectOrder, ...>` — not a new `interface`. This derives from the existing Drizzle-inferred type and avoids duplication.
- `interface` only for props and shapes with no corresponding Zod schema or Drizzle type.

---

### Validation

All new schemas go in `lib/validations/checkout.ts`, exported alongside the existing `CheckoutSessionSchema`.

```typescript
// lib/validations/checkout.ts
import { routing } from '@/i18n/routing'

// Used by createRenewalCheckoutSession Server Action.
// locale is derived from routing.locales — adding a new locale to i18n/routing.ts
// automatically extends this validation (same pattern as updateLanguagePreferenceSchema).
export const RenewalCheckoutSchema = z.object({
  orderId: z.string().uuid(),
  locale: z.enum([...routing.locales] as [string, ...string[]]),
})

export type RenewalCheckoutInput = z.infer<typeof RenewalCheckoutSchema>

// Used inside handleRenewalCheckoutCompleted to validate Stripe metadata
// before any DB write. Keeping it in lib/validations/ ensures all Zod
// schemas are in one layer, not scattered across lib/stripe/.
export const RenewalWebhookMetadataSchema = z.object({
  type: z.literal('fiscal_rep_renewal'),
  orderId: z.string().uuid(),
  userId: z.string().uuid(),
  tier: z.enum(['essential', 'standard', 'express']),
})

export type RenewalWebhookMetadata = z.infer<typeof RenewalWebhookMetadataSchema>
```

---

### i18n

- All user-facing strings that appear in the **page UI** go in `messages/en.json` under the `renewal` key.
- Use `getTranslations('renewal')` in the Server Component page. Use `useTranslations('renewal')` in `RenewalCheckoutButton` (Client Component).
- No hardcoded English strings in JSX.
- Add the same keys to `fr.json`, `es.json`, `de.json` (English values are acceptable for now — translated in a later pass).

**Email template strings are NOT in `messages/*.json`** — they live as locale-mapped string literals inside `fiscal-rep-renewal-confirmation.tsx`, following the exact same pattern as every other email template in this project (`nif-delivered.tsx`, `order-submitted-customer.tsx`, etc.).

Required `messages/*.json` keys (page UI only):

```json
{
  "renewal": {
    "pageTitle": "Renew Fiscal Representation",
    "pageDescription": "12 months fiscal representation · €89",
    "preparingCheckout": "Preparing your checkout…",
    "notEligible": "This order is not eligible for renewal.",
    "backToDashboard": "Back to dashboard",
    "errorTitle": "Something went wrong",
    "errorDescription": "We couldn't start your checkout. Please try again or contact support.",
    "canceledDescription": "Your payment was cancelled. You can try again below.",
    "retryButton": "Try again"
  }
}
```

---

## Design

The renewal page is a minimal interstitial — not a marketing page. Its sole job is to confirm the context and kick off Stripe checkout automatically.

**Page layout (mobile-first):**
```
min-h-screen bg-[var(--bg-base)]
  └─ max-w-md w-full mx-auto px-4 py-16
       └─ card: bg-[var(--bg-surface)] border border-[var(--border-default)]
                rounded-[length:var(--radius-lg)] shadow-[var(--shadow-md)] p-8
```

At `md:` nothing changes — `max-w-md` already constrains the card on larger screens, and the inner layout has no breakpoint variants.

**Card content (top to bottom):**
1. Heading — `text-[length:var(--text-2xl)] font-[number:var(--font-bold)] text-[var(--text-primary)] mb-1` — translation key `renewal.pageTitle`
2. Sub-line — `text-[length:var(--text-base)] text-[var(--text-secondary)] mb-8` — translation key `renewal.pageDescription`
3. `<RenewalCheckoutButton>` fills the remaining area

**`RenewalCheckoutButton` visual states:**

| State | What renders |
|-------|-------------|
| Loading (default on mount) | Shadcn `Button` full-width, `disabled`, `Loader2 animate-spin h-4 w-4 mr-2` + `renewal.preparingCheckout` label |
| Canceled (from `?canceled=true`) | Error copy block (see below) + shadcn `Button` labeled `renewal.retryButton` |
| Error (action failed) | Same error copy block + `renewal.retryButton` button |

Error copy block:
```
p: text-[length:var(--text-sm)] text-[var(--status-error)] mb-4
  renewal.errorTitle (bold) — renewal.errorDescription or renewal.canceledDescription
```

**Not-eligible state** (rendered by the page, not the button):
- A plain paragraph: `text-[length:var(--text-base)] text-[var(--text-secondary)]` with `renewal.notEligible` + a ghost `Button asChild` link back to the dashboard using `renewal.backToDashboard`.

**What NOT to include:**
- No marketing content, no tier comparison, no FAQ, no price breakdown table.
- No animation beyond the `Loader2` spinner.
- No layout changes at any breakpoint — the `max-w-md` card is correct at all sizes.

---

## Implementation

### Step 1 — DB query: `getRenewalOrderInfo`

Add to `lib/db/queries.ts`.

Return type — use `Pick` from the existing Drizzle-inferred `SelectOrder`, not a new interface:

```typescript
// Derived from SelectOrder — no duplicate definition needed.
type RenewalOrderInfo = Pick<SelectOrder, 'id' | 'userId' | 'tier' | 'fiscalRepExpiresAt' | 'status'>

export async function getRenewalOrderInfo(
  orderId: string,
  userId: string,
): Promise<RenewalOrderInfo | null>
```

Implementation:
- `SELECT id, user_id, tier, fiscal_rep_expires_at, status FROM orders WHERE id = $orderId AND user_id = $userId`
- Return the first row or `null` if not found.
- `type RenewalOrderInfo` is declared at module scope in `lib/db/queries.ts` (not exported — it's used only by the query function's return type annotation and the action that calls it).

---

### Step 2 — DB query: `extendFiscalRepExpiry`

Add to `lib/db/queries.ts`.

```typescript
export async function extendFiscalRepExpiry(orderId: string): Promise<Date>
```

SQL logic (in Drizzle):
```typescript
// Extends by 12 months from the LATER of: current expiry or right now.
// Handles late renewals: if expiry already passed, extension starts from today.
// GREATEST(fiscal_rep_expires_at, NOW()) + INTERVAL '12 months'
.set({
  fiscalRepExpiresAt: sql`GREATEST(${orders.fiscalRepExpiresAt}, NOW()) + INTERVAL '12 months'`,
  updatedAt: new Date(),
})
.where(eq(orders.id, orderId))
.returning({ fiscalRepExpiresAt: orders.fiscalRepExpiresAt })
```

Return the new `fiscalRepExpiresAt` value (non-null — we just set it). Cast via `.returning()` and return `result[0].fiscalRepExpiresAt!`.

---

### Step 3 — Validation schemas

Add `RenewalCheckoutSchema`, `RenewalCheckoutInput`, `RenewalWebhookMetadataSchema`, and `RenewalWebhookMetadata` to `lib/validations/checkout.ts` as shown in the Validation section above.

---

### Step 4 — Server Action: `createRenewalCheckoutSession`

Add to `app/actions/checkout.ts` (below the existing `createCheckoutSession`).

```typescript
export async function createRenewalCheckoutSession(
  input: unknown
): Promise<ActionResult<{ url: string }>>
```

Steps:
1. `RenewalCheckoutSchema.safeParse(input)` — return `{ success: false, error: 'renewal.errors.generic' }` if invalid.
2. `getCurrentUser()` — return `{ success: false, error: 'renewal.errors.unauthorized' }` if null.
3. `getRenewalOrderInfo(orderId, user.id)` — return `{ success: false, error: 'renewal.errors.notFound' }` if null.
4. Guard: if `order.tier === 'essential'` or `order.fiscalRepExpiresAt === null` → return `{ success: false, error: 'renewal.errors.notEligible' }`.
5. Create Stripe Checkout session:
   ```typescript
   await stripe.checkout.sessions.create({
     customer_email: user.email,
     line_items: [{
       price_data: {
         currency: 'eur',
         product_data: { name: 'Fiscal Representation Renewal — 12 months' },
         unit_amount: RENEWAL_PRICE_EUR_CENTS, // 8900, from lib/pricing.ts
       },
       quantity: 1,
     }],
     mode: 'payment',
     success_url: `${env.NEXT_PUBLIC_APP_URL}/${locale}/dashboard?renewal=success`,
     cancel_url:  `${env.NEXT_PUBLIC_APP_URL}/${locale}/renewal?orderId=${orderId}&canceled=true`,
     metadata: {
       type:    'fiscal_rep_renewal',
       orderId: orderId,
       userId:  user.id,
       tier:    order.tier,          // needed by webhook to write Payment.tier
     },
   })
   ```
   `tier` is included in metadata so the webhook handler can write a valid `Payment` row without a second DB read.
6. Return `{ success: true, data: { url: session.url } }`.

---

### Step 5 — Webhook handler: `handleRenewalCheckoutCompleted`

Add to `lib/stripe/webhooks.ts`.

```typescript
export async function handleRenewalCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void>
```

Import `RenewalWebhookMetadataSchema` from `lib/validations/checkout.ts`.

Steps:
1. Parse `session.metadata` with `RenewalWebhookMetadataSchema.safeParse(session.metadata)`. If invalid, `return` early — no write.
2. Idempotency: query `payments` for an existing row with `stripeCheckoutSessionId = session.id`. If found, `return` early.
3. Extract `stripePaymentIntentId = session.payment_intent as string | null`. If null, `return` early.
4. **DB transaction** (single atomic write):
   - INSERT into `payments`:
     ```typescript
     {
       orderId:                 meta.orderId,
       userId:                  meta.userId,
       stripePaymentIntentId:   stripePaymentIntentId,
       stripeCheckoutSessionId: session.id,
       amount:                  session.amount_total ?? 0,
       currency:                session.currency ?? 'eur',
       status:                  'succeeded',
       tier:                    meta.tier,
       isRenewal:               true,
     }
     ```
   - Call `extendFiscalRepExpiry(meta.orderId)` inside the same transaction. Capture the returned `newExpiresAt`.
5. After transaction commits: fire-and-forget `sendEmail` for `fiscal_rep_renewal_confirmation`.
   - `customerEmail`: `session.customer_details?.email ?? session.customer_email ?? null` — skip if null.
   - `locale`: call `getUserLanguage(meta.userId)`.
   - Payload: `{ template: 'fiscal_rep_renewal_confirmation', customerName: ..., newExpiresAt }`.
   - Customer name is not in the session — query `getUserFullNameForEmail(meta.orderId)` (see Step 6 note).

> **Note on customer name**: the renewal confirmation email needs the customer's `fullName` from `orders`. Add a lightweight query `getOrderFullName(orderId): Promise<string | null>` to `lib/db/queries.ts` — SELECT `full_name` WHERE `id = orderId`. If null, fall back to the customer email local part (same pattern as `adminDeliverNif` in Feature 16).

---

### Step 6 — Update webhook route

Update `app/api/webhooks/stripe/route.ts`.

In the `checkout.session.completed` case, inspect `session.metadata?.type` to route to the correct handler:

```typescript
import { handleCheckoutSessionCompleted, handleRenewalCheckoutCompleted } from '@/lib/stripe/webhooks'

// inside the switch:
case 'checkout.session.completed': {
  const session = event.data.object as Stripe.Checkout.Session
  if (session.metadata?.type === 'fiscal_rep_renewal') {
    await handleRenewalCheckoutCompleted(session)
  } else {
    await handleCheckoutSessionCompleted(session)
  }
  break
}
```

No other changes to this file.

---

### Step 7 — Email template: `fiscal-rep-renewal-confirmation.tsx`

Create `lib/email/templates/fiscal-rep-renewal-confirmation.tsx`.

Follows the exact same structure as `nif-delivered.tsx`:
- Props: `{ locale: EmailLocale; customerName: string; newExpiresAt: Date; dashboardUrl: string }`
- Subject function (locale-mapped string literals, NOT next-intl):
  ```typescript
  export function getFiscalRepRenewalConfirmationSubject(locale: EmailLocale): string {
    const subjects: Record<EmailLocale, string> = {
      en: 'Your fiscal representation has been renewed',
      fr: 'Votre représentation fiscale a été renouvelée',
      es: 'Tu representación fiscal ha sido renovada',
      de: 'Ihre steuerliche Vertretung wurde verlängert',
    }
    return subjects[locale]
  }
  ```
- Format `newExpiresAt` as a localised date string using:
  ```typescript
  const localeMap: Record<EmailLocale, string> = {
    en: 'en-GB', fr: 'fr-FR', es: 'es-ES', de: 'de-DE',
  }
  const formattedExpiry = newExpiresAt.toLocaleDateString(localeMap[locale], {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  ```
- Email body: brief confirmation + the new expiry date in a brand-tinted monospace block (same visual treatment as the NIF number in `nif-delivered.tsx`) + a single CTA button to the dashboard. No marketing content.

---

### Step 8 — Extend `lib/email/send.ts`

- Add `'fiscal_rep_renewal_confirmation'` to `EmailTemplateName`.
- Add to `EmailPayload` discriminated union:
  ```typescript
  | { template: 'fiscal_rep_renewal_confirmation'; customerName: string; newExpiresAt: Date }
  ```
- Import `FiscalRepRenewalConfirmationEmail` and `getFiscalRepRenewalConfirmationSubject` from the new template.
- Add `case 'fiscal_rep_renewal_confirmation':` to the switch. Format `newExpiresAt` with the locale map defined in Step 7 and pass `formattedExpiry` as a prop. The `newExpiresAt` field is on the payload, not `dashboardUrl` — the `dashboardUrl` is already computed at the top of `sendEmail`.

---

### Step 9 — Renewal page

Create `app/[locale]/(dashboard)/renewal/page.tsx`.

This is a **Server Component**. `"use client"` must NOT appear in this file.

```typescript
// app/[locale]/(dashboard)/renewal/page.tsx
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ orderId?: string; canceled?: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'renewal' })
  return { title: t('pageTitle') }
}

export default async function RenewalPage({ params, searchParams }: Props) {
  // Next.js 16: both params and searchParams are Promises — must await before use.
  const { locale } = await params
  const { orderId, canceled } = await searchParams

  const user = await getCurrentUser()
  // Proxy already redirects unauthenticated users — this is a defensive check only.
  if (!user) redirect(`/${locale}/signin`)

  if (!orderId) {
    // No orderId in URL — render not-eligible state
    return <NotEligibleCard locale={locale} />
  }

  const order = await getRenewalOrderInfo(orderId, user.id)

  if (!order || order.tier === 'essential' || order.fiscalRepExpiresAt === null) {
    return <NotEligibleCard locale={locale} />
  }

  return (
    <RenewalCard
      locale={locale}
      orderId={orderId}
      isCanceled={canceled === 'true'}
    />
  )
}
```

`NotEligibleCard` and `RenewalCard` are small, co-located sub-components in the same file (or in `components/dashboard/renewal/`). Both are Server Components.

`RenewalCard` renders the heading, sub-line, and `<RenewalCheckoutButton>`.

---

### Step 10 — `RenewalCheckoutButton` (Client Component)

Create `components/dashboard/renewal/RenewalCheckoutButton.tsx`.

```typescript
'use client'
// "use client" required: uses useEffect (auto-trigger on mount) and useRouter (redirect to Stripe URL).
```

Props:
```typescript
interface RenewalCheckoutButtonProps {
  orderId: string
  locale: string
  isCanceled: boolean
}
```

`interface` is correct here — this is a props shape with no corresponding Zod schema.

Behaviour:
- `isCanceled === true` on mount → skip auto-trigger, go straight to error state showing `renewal.canceledDescription` + `renewal.retryButton`.
- `isCanceled === false` on mount → immediately call `createRenewalCheckoutSession({ orderId, locale })` inside a `useEffect`. Show spinner/disabled button while pending.
- On success → `router.push(data.url)`. Keep spinner visible while Stripe loads (no state change needed).
- On error → set error state, render error block + retry button. Retry button re-fires the action via a `handleRetry` callback.

State machine (single `useState`):
```typescript
type ButtonState = 'loading' | 'error' | 'canceled'
```
- Initial: `isCanceled ? 'canceled' : 'loading'`
- After action error: `'error'`
- After action success: stays `'loading'` (page is navigating away)

No additional boolean flags — all UI variations derive from this single state.

---

### Step 11 — Loading skeleton

Create `app/[locale]/(dashboard)/renewal/loading.tsx`.

Single centred card matching the page layout. Use the same skeleton pattern as other dashboard `loading.tsx` files:

```tsx
// Skeleton: heading line + sub-line + button placeholder
<div className="min-h-screen bg-[var(--bg-base)]">
  <div className="max-w-md w-full mx-auto px-4 py-16">
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)]
                    rounded-[length:var(--radius-lg)] shadow-[var(--shadow-md)] p-8
                    animate-pulse">
      <div className="h-7 w-48 rounded-[length:var(--radius-md)] bg-[var(--bg-subtle)] mb-2" />
      <div className="h-5 w-32 rounded-[length:var(--radius-md)] bg-[var(--bg-subtle)] mb-8" />
      <div className="h-10 w-full rounded-[length:var(--radius-md)] bg-[var(--bg-subtle)]" />
    </div>
  </div>
</div>
```

---

### Step 12 — i18n keys

Add the `renewal` namespace keys listed in the i18n section above to all four locale files:
`messages/en.json`, `messages/fr.json`, `messages/es.json`, `messages/de.json`.

FR/ES/DE values may be the same as EN for now.

---

### Step 13 — Unit tests

New test files follow the project convention (`tests/unit/`). Use `vi.mock` — no live DB or Stripe.

**`tests/unit/actions/checkout.test.ts`** (append to existing file or create if absent):

`createRenewalCheckoutSession`:
- Returns `{ success: false }` when `orderId` is not a valid UUID.
- Returns `{ success: false }` when `getCurrentUser()` returns `null`.
- Returns `{ success: false }` when `getRenewalOrderInfo` returns `null`.
- Returns `{ success: false }` when `order.tier === 'essential'`.
- Returns `{ success: false }` when `order.fiscalRepExpiresAt === null`.
- Returns `{ success: true, data: { url } }` on the happy path — Stripe mock returns `{ url: 'https://checkout.stripe.com/...' }`.
- Stripe session metadata includes `{ type: 'fiscal_rep_renewal', orderId, userId, tier }`.

**`tests/unit/lib/stripe/webhooks.test.ts`** (append or create):

`handleRenewalCheckoutCompleted`:
- Returns early (no DB write, no email) when `session.metadata` fails `RenewalWebhookMetadataSchema`.
- Returns early (no DB write) when a Payment row already exists for the session ID (idempotency).
- Returns early when `session.payment_intent` is null.
- Calls `extendFiscalRepExpiry` and `sendEmail` on the happy path.
- Does NOT call `extendFiscalRepExpiry` or `sendEmail` if the DB transaction throws.

**`tests/unit/email/templates.test.tsx`** (append):
- `FiscalRepRenewalConfirmationEmail` renders without errors in all 4 locales.
- `getFiscalRepRenewalConfirmationSubject` returns a unique string per locale (no two locales share the same subject).

**`tests/unit/email/send.test.ts`** (append):
- `sendEmail` with `template: 'fiscal_rep_renewal_confirmation'` calls `resendClient.emails.send` with the correct subject for `'en'` and `'fr'`.

---

## Dependencies

No new packages. All dependencies (`stripe`, `drizzle-orm`, `zod`, `react-email`, `resend`) are already installed.

---

## Scope Limits

- **Do not build renewal reminder emails** (11-month, 11.5-month, 12-month sequences) — Feature 18b.
- **Do not build the expired-state dashboard banner** — Feature 18b.
- **Do not build the `fiscalRepDismissedAt` dismissal flow** — Feature 18b.
- **Do not add a "Renew fiscal representation" link to Account Settings** — Feature 18b.
- **Do not modify any existing email** to include renewal links — renewal emails are authored in 18b.
- **Do not implement duplicate-payment refund automation** — the idempotency check (same `stripeCheckoutSessionId`) prevents double-processing a single session. Two separate completed sessions from two browser tabs is an operational edge case handled manually (out of scope for launch).
- **Do not touch `proxy.ts`** — the `(dashboard)` route group auth guard already covers the renewal page.
- Keep this focused on: Stripe session creation → payment → DB extension → confirmation email.

---

## Check When Done

- `RenewalCheckoutSchema` and `RenewalWebhookMetadataSchema` both live in `lib/validations/checkout.ts` and are exported with their inferred types.
- No `interface` or `type` in this feature duplicates the shape of a Zod schema.
- `getRenewalOrderInfo` returns `null` for a wrong `userId` and returns the correct shape for a valid Standard/Express order.
- `extendFiscalRepExpiry` sets `fiscalRepExpiresAt` to `GREATEST(current_expiry, NOW()) + 12 months`. Verified against: (a) an order with a future expiry — new expiry = current + 12 months; (b) an order with a past expiry — new expiry = NOW() + 12 months.
- `createRenewalCheckoutSession` returns `{ success: false }` for Essential-tier orders and for orders belonging to another user.
- `createRenewalCheckoutSession` returns `{ success: true, data: { url } }` for an eligible Standard/Express order; Stripe session metadata contains `{ type: 'fiscal_rep_renewal', orderId, userId, tier }`.
- Webhook route dispatches to `handleRenewalCheckoutCompleted` when `metadata.type === 'fiscal_rep_renewal'` and to `handleCheckoutSessionCompleted` otherwise — verified by reading the updated route file.
- `handleRenewalCheckoutCompleted` is idempotent: calling it twice with the same `session.id` produces exactly one `payments` row and fires `sendEmail` exactly once.
- `fiscal_rep_renewal_confirmation` email renders without errors in all 4 locales; subjects are unique per locale.
- Renewal page at `/en/renewal?orderId=<valid-standard-order-id>` (dev): renders the card and auto-redirects to Stripe.
- Renewal page with `?canceled=true` renders the error state without auto-triggering checkout.
- Renewal page with no `orderId` param renders the not-eligible card.
- `loading.tsx` uses only token classes — no raw color utilities.
- All unit tests pass (`npx vitest run`).
- `npm run build` passes with no TypeScript errors.
