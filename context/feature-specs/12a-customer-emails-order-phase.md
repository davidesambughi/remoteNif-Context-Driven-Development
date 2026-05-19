Read `context/AGENTS.md`, `context/progress-tracker.md`, `context/user-flows.md` before starting.

Bootstrap the transactional email infrastructure and deliver the order confirmation email — the only customer-facing email that belongs to the order phase. The infrastructure built here (Resend client, `sendEmail` helper, template pattern) is the foundation all subsequent email features (12b, 16) will use.

---

## Constraints

### Architecture

- `lib/email/` is the email infrastructure layer — create it in this feature. Nothing inside it is route-specific.
- `lib/email/resend.ts` — initialise and export the Resend client. Import `env.RESEND_API_KEY` from `lib/env.ts`.
- `lib/email/send.ts` — export typed `sendEmail(to, locale, payload)` helper. All email sending in the app goes through this function. Never call Resend directly from actions or route handlers.
- `lib/email/templates/` — one `.tsx` file per email template. Templates are React Email components. No UI logic, no Tailwind — use React Email primitives only (imported from `react-email`).
- Email sending is always fire-and-forget from the caller's perspective — `sendEmail` logs errors internally but never throws to the caller, so email failures never crash a user-facing request.
- The order confirmation trigger lives in the existing `app/api/webhooks/stripe/route.ts` — do not add new API routes. Hook into `handleCheckoutSessionCompleted`.
- Password reset email: Supabase already sends this via the configured Custom SMTP (Resend). Do **not** re-implement it here. Confirm it works end-to-end but do not change the trigger mechanism.
- No background queues. Email is sent with `await` after the transaction commits, but errors are swallowed (log, don't throw).

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- Infer types from Zod schemas with `z.infer<typeof Schema>` — no duplicate type definitions.
- Use `interface` for template prop shapes. Use `type` for the locale union and template name union.
- Define a `EmailLocale` type alias: `type EmailLocale = 'en' | 'fr' | 'es' | 'de'`.
- Define a `EmailTemplateName` union type for the template registry — start with `'order_confirmation'` only. Future features will extend this union.

### Validation

No new Zod schemas are required for this feature. The triggering data (order ID, user email, tier, amount) is already validated upstream by existing schemas before being passed to `sendEmail`.

### i18n

- Email templates do **not** use `next-intl` — they are server-side React components that receive locale as a prop and switch on it internally.
- Each template file exports a React Email component that accepts `{ locale: EmailLocale }` alongside its data props, and renders the correct language using a plain object lookup inside the file — no i18n library.
- All copy for each language is hardcoded as string literals inside the template file — no JSON translation files needed for emails.
- The locale passed to `sendEmail` is derived from the customer's `users.language` preference stored in the database. Fetch it before calling `sendEmail`.

---

## Packages (May 2026)

**React Email 6.0** unified all sub-packages into a single `react-email` package. The old `@react-email/components` and `@react-email/render` packages are deprecated and must not be used.

- Install: `npm install resend react-email`
- All React Email primitives (`Html`, `Head`, `Body`, `Container`, `Section`, `Text`, `Button`, `Hr`, `Link`, `Preview`) are imported from `'react-email'`.
- The `render()` function is also in `'react-email'` but is **not needed** in this feature — Resend accepts a React element directly via its `react:` prop and handles rendering internally (see send pattern below).

If `@react-email/components` or `@react-email/render` are present in `package.json`, remove them.

---

## Design

Email templates use React Email primitives only. No Tailwind. No design tokens — email clients don't support CSS variables.

**Shared visual rules for all templates:**

- Background: `#f8fafc` (page), `#ffffff` (content container)
- Content container: max-width `560px`, centered, `border-radius: 8px`, `padding: 40px`
- Brand accent: `#3b82f6` (matches `--brand-primary` — hardcoded for email)
- Body text: `#1e293b` (matches `--text-primary`)
- Secondary text: `#64748b` (matches `--text-secondary`)
- Font: system font stack — `"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"` — no Google Fonts (email client compatibility)
- Footer: muted text, RemoteNIF name + remotenif.com

**Template: Order Confirmation (`order_confirmation`)**

Triggered immediately after a successful Stripe checkout webhook fires and the order is created.

Content:
- Subject line (localized): `"Your NIF application is confirmed — Order #{orderId}"`
- Heading: `"Your order is confirmed."`
- Body paragraph: explains payment received, what happens next (upload documents to dashboard)
- Prominent CTA button: `"Upload your documents"` → deep link to `{APP_URL}/{locale}/dashboard`
- Order summary section: tier name, order ID, amount paid
- Footer

---

## Implementation

1. **Install packages:**
   ```bash
   npm install resend react-email
   ```
   Remove `@react-email/components` and `@react-email/render` from `package.json` if present.

2. **Create `lib/email/resend.ts`:**
   - Import `Resend` from `'resend'` and `env` from `lib/env.ts`
   - Export `const resendClient = new Resend(env.RESEND_API_KEY)`

3. **Create `lib/email/send.ts`:**
   - Export `type EmailLocale = 'en' | 'fr' | 'es' | 'de'`
   - Export `type EmailTemplateName = 'order_confirmation'`
   - Export a discriminated union `EmailPayload` keyed on `template`:
     ```typescript
     type EmailPayload =
       | { template: 'order_confirmation'; orderId: string; tier: string; amountEur: string }
     ```
   - Export async `sendEmail(to: string, locale: EmailLocale, payload: EmailPayload): Promise<void>`:
     - Builds `dashboardUrl` as `${env.NEXT_PUBLIC_APP_URL}/${locale}/dashboard`
     - Gets the subject from the template's colocated subject helper
     - Passes the React element directly to Resend via the `react:` prop — **do not call `render()` manually**:
       ```typescript
       await resendClient.emails.send({
         from: env.RESEND_FROM_EMAIL,
         to,
         subject,
         react: OrderConfirmationEmail({ locale, orderId, tier, amountEur, dashboardUrl }),
       })
       ```
       Resend renders the component to HTML internally. The component is called as a plain function (not JSX) so this file stays `.ts`, not `.tsx`.
     - Wrap the entire send in try/catch: `console.error('[sendEmail]', error)` on failure — never throws

4. **Create `lib/email/templates/order-confirmation.tsx`:**
   - Import React Email primitives from `'react-email'` (not `@react-email/components`)
   - Export `OrderConfirmationEmail` as a React Email component
   - Props interface: `{ locale: EmailLocale; orderId: string; tier: string; amountEur: string; dashboardUrl: string }`
   - Export `getOrderConfirmationSubject(locale: EmailLocale, orderId: string): string` from the same file — `sendEmail` calls this to get the subject line
   - Implement full localized copy for EN, FR, ES, DE using a `const copy = { en: {...}, fr: {...}, es: {...}, de: {...} }` lookup inside the file
   - Localized tier names: Essential/Essentiel/Esencial/Grundlegend, Standard stays the same, Express stays the same
   - Design: follows shared visual rules above

5. **Add `getUserLanguage` query to `lib/db/queries.ts`:**
   - Signature: `getUserLanguage(userId: string): Promise<'en' | 'fr' | 'es' | 'de'>`
   - Fetches `users.language` for the given `userId`; returns `'en'` if not found or null
   - Return type matches `EmailLocale` exactly — the caller casts as needed

6. **Update `lib/stripe/webhooks.ts`** (inside `handleCheckoutSessionCompleted`):
   - After the transaction commits, capture `newOrder.id` outside the transaction block
   - Fetch the user's language: `const locale = await getUserLanguage(userId)`
   - Derive `customerEmail`: `session.customer_details?.email ?? session.customer_email ?? null`
   - Derive `amountEur`: `session.amount_total` is in cents — divide by 100, format as `€79` / `€129` / `€179` (no decimals for round amounts, `.toFixed(2)` otherwise)
   - If `customerEmail` is non-null, call `await sendEmail(customerEmail, locale, { template: 'order_confirmation', orderId: newOrder.id, tier, amountEur })`
   - The `sendEmail` call goes **after** the transaction — never inside it

---

## Dependencies

Install: `resend`, `react-email`
Remove if present: `@react-email/components`, `@react-email/render`

---

## Scope Limits

- Do not build the document-phase emails (flagged, manual review, approved) — those are Feature 12b.
- Do not build NIF delivery or post-NIF guide emails — those are Feature 16.
- Do not add a `sendNifDeliveredEmails` helper — that belongs in Feature 16.
- Do not add an email preview route or dev UI — not needed at this stage.
- Do not re-implement the password reset email trigger — Supabase handles it via Custom SMTP (Resend). Confirm it still works end-to-end but do not change the trigger mechanism.
- Do not add i18n translation keys to `messages/*.json` — email copy lives inside the template files, not in the next-intl translation system.
- Do not add email tracking, unsubscribe links, or any marketing email infrastructure.
- Keep this feature focused on: the infrastructure layer (`lib/email/`) and one triggered email (order confirmation).

---

## Check When Done

- `lib/email/resend.ts` exports an initialised Resend client.
- `lib/email/send.ts` exports `sendEmail`, `EmailLocale`, and `EmailTemplateName`. File is `.ts` (not `.tsx`).
- `lib/email/templates/order-confirmation.tsx` imports from `'react-email'` and renders without error when passed valid props.
- `getUserLanguage` query exists in `lib/db/queries.ts` and returns `'en'` as a safe default when the field is null.
- Stripe webhook handler calls `sendEmail` for `order_confirmation` after the transaction commits — verify by completing a test checkout and confirming the email is received at the test address.
- `sendEmail` errors are caught and logged — a Resend API failure does not return a 500 from the webhook endpoint.
- `npm run build` passes.
