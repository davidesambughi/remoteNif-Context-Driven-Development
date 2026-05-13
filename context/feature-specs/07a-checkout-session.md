# 07a — Checkout Session

Read `context/AGENTS.md`, `context/progress-tracker.md`, `context/architecture-context.md`, `context/tech-spec.md` before starting.

Implement Stripe checkout session creation triggered from the pricing page tier selection.

---

## Constraints

### Architecture

- Stripe client initialization goes in `lib/stripe/client.ts`.
- Server Action goes in `app/actions/checkout.ts` — thin, validate → auth → act → return.
- `ActionResult<T>` should be moved from `app/actions/auth.ts` to `lib/types.ts` so all action files can share it.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- Infer types from Zod schemas with `z.infer<typeof Schema>` — no duplicate type definitions.

### Validation

```typescript
// lib/validations/checkout.ts
const CheckoutSessionSchema = z.object({
  tier: z.enum(['essential', 'standard', 'express'])
})
```

### i18n

- All user-facing strings go in `messages/en.json` under the `checkout` key.
- Use `useTranslations('checkout')` in components.
- No hardcoded English strings in JSX.
- Add the same keys (untranslated for now) to `fr.json`, `es.json`, `de.json`.

---

## Implementation

1. Install Stripe dependency.

2. Move `ActionResult<T>` from `app/actions/auth.ts` to `lib/types.ts`. Update imports in `auth.ts` and ensure the project still builds.

3. Initialize the Stripe client.
   - Create `lib/stripe/client.ts`.
   - Export an initialized Stripe instance using `STRIPE_SECRET_KEY` from `lib/env.ts`.

4. Create the checkout schema.
   - Create `lib/validations/checkout.ts`.
   - Define and export `CheckoutSessionSchema` to validate the selected tier.

5. Implement the Server Action to create a checkout session.
   - Create `app/actions/checkout.ts`.
   - Implement `createCheckoutSession(formData: FormData)`.
   - Validate the payload with `CheckoutSessionSchema`.
   - Ensure the user is authenticated (via `getCurrentUser`).
   - Look up the price for the selected tier (using `lib/pricing.ts`).
   - Create a Stripe checkout session with `success_url` routing to `/dashboard?session_id={CHECKOUT_SESSION_ID}` and `cancel_url` routing to `/pricing`.
   - Attach `userId` and `tier` as `metadata` to the Stripe session (needed later for webhooks).
   - Return `{ success: true, data: { url: session.url } }`.

6. Update the Tier selection buttons.
   - Update `app/[locale]/(marketing)/pricing/page.tsx` (or related `TierCard` components).
   - If the user is unauthenticated, clicking a tier still routes to `/signup?tier=X`.
   - If authenticated, clicking should call the `createCheckoutSession` action and redirect to the returned Stripe URL.
   - Add loading state to the button while the session is being created.

---

## Dependencies

Install: `stripe`

---

## Scope Limits

- Do not implement Stripe webhook handling — that is covered in 07b-checkout-webhook.md.
- Do not create the `Order` or `Payment` database records in the Server Action — they must be created by the webhook to ensure reliability.
- Do not build the post-checkout dashboard confirmation page yet — it will be built in 07b.
- Keep this focused solely on creating the checkout session and routing the user to Stripe.

---

## Check When Done

- `stripe` package is installed and client is configured.
- `ActionResult<T>` is successfully moved to `lib/types.ts` and imports are updated.
- Authenticated user selecting a tier is redirected to the Stripe-hosted checkout page.
- Unauthenticated user selecting a tier is still routed to the signup flow.
- Stripe session metadata includes the user ID and tier selection.
- `npm run build` passes.
