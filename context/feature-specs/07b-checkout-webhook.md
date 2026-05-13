# 07b — Checkout Webhook

Read `context/AGENTS.md`, `context/progress-tracker.md`, `context/architecture-context.md`, `context/tech-spec.md` before starting.

Implement Stripe webhook processing to reliably finalize order and payment records after a successful checkout.

---

## Constraints

### Architecture

- Webhook endpoint goes in `app/api/webhooks/stripe/route.ts`.
- The webhook handler MUST read the raw body using `await request.text()` to accurately verify the `Stripe-Signature` header (a 2026 Stripe best practice for Next.js App Router).
- Webhook business logic and DB mutations go in `lib/stripe/webhooks.ts`.
- Idempotency is required: check the database before inserting to ensure the `stripeCheckoutSessionId` hasn't already been processed.
- DB updates must be wrapped in a transaction using `db.transaction()` to ensure `Order` and `Payment` records are created together.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- Use `Stripe.Event` type from the Stripe SDK for the webhook payload.

### Validation

- No complex Zod schema for input, as the payload is strictly verified via the Stripe cryptographic signature using `env.STRIPE_WEBHOOK_SECRET`.

### i18n

- Add new user-facing strings for the post-checkout confirmation page in `messages/en.json` under a new `dashboard` key (e.g., `dashboard.checkoutSuccess.title`, `dashboard.checkoutSuccess.description`), and mirror to `fr`, `es`, `de`.

---

## Implementation

1. Create the webhook business logic handler.
   - Create `lib/stripe/webhooks.ts`.
   - Implement `handleCheckoutSessionCompleted(session: Stripe.Checkout.Session)`.
   - Extract `userId` and `tier` from `session.metadata`.
   - Ensure idempotency: query the `payments` table to check if a record with `stripeCheckoutSessionId === session.id` already exists. If it does, return early.
   - Wrap the following inserts in a DB transaction:
     - Insert a new `Order` with `status: 'documents_pending'`, `stripeCheckoutSessionId: session.id`, `stripePaymentIntentId: session.payment_intent as string`, `userId`, and `tier`.
     - Insert a new `Payment` record tied to the new `orderId`, marking `status: 'succeeded'`, storing the `amount: session.amount_total`, `currency: session.currency`, and `tier`.

2. Set up the webhook route.
   - Create `app/api/webhooks/stripe/route.ts`.
   - Implement a `POST` handler that reads the raw body (`await request.text()`) and extracts the `Stripe-Signature` header.
   - Use `stripe.webhooks.constructEvent()` to verify the event.
   - If the event type is `checkout.session.completed`, call `handleCheckoutSessionCompleted`.
   - Return a `200 OK` response quickly.

3. Implement the post-payment success screen.
   - Create `app/[locale]/(dashboard)/dashboard/page.tsx` (the dashboard shell).
   - Require authentication.
   - If `searchParams.session_id` is present, display a generic "Payment Successful! We are preparing your workspace." message (using next-intl).
   - This screen is a placeholder shell for Feature 08, but must exist so the user doesn't hit a 404 after Stripe redirects them.

---

## Dependencies

No new dependencies required.

---

## Scope Limits

- Do not implement the document upload UI yet (that belongs to Feature 10).
- Do not build the full interactive customer dashboard yet (that belongs to Feature 08).
- Do not send order confirmation emails (that belongs to Feature 12).
- Keep this focused strictly on reliably receiving the webhook, verifying the signature, and writing the correct initial records to the database.

---

## Check When Done

- `app/api/webhooks/stripe/route.ts` successfully reads raw body and verifies the Stripe signature.
- `checkout.session.completed` event creates both `Order` and `Payment` records in a transaction.
- The webhook handler checks for existing records before inserting (idempotency).
- User landing on the `success_url` (`/dashboard?session_id=...`) after checkout sees a success message instead of a 404.
- `npm run build` passes.
