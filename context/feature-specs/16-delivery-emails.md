# 16 — Delivery Emails

<!-- Read before starting: context/AGENTS.md, context/progress-tracker.md, context/architecture-context.md, context/tech-spec.md, context/code-standards.md -->

Send the NIF delivery email immediately after `adminDeliverNif` runs, including the customer's NIF number and the post-NIF journey guide content, in the customer's stored language preference.

---

## Constraints

### Architecture

- `adminDeliverNif` in `app/actions/admin.ts` is the only hook point — fire email **after** `deliverNifNumber` succeeds, before the audit log / revalidatePath, as a fire-and-forget (`void sendEmail(...)`).
- `sendEmail` is the only permitted email sending path — never call `resendClient` directly.
- Email is fire-and-forget: errors are caught and logged inside `sendEmail`; they must never cause `adminDeliverNif` to return `{ success: false }`.
- The template lives in `lib/email/templates/nif-delivered.tsx` — same file structure as every other template.
- All copy is defined **inside the template file** as a `copy` object (keyed by locale). Email templates cannot use `next-intl` (no request context).
- DB queries live in `lib/db/queries.ts`. The action stays thin — validate → auth → query → act → email → audit → revalidate → return.
- No API routes — this is an internal mutation, Server Action only.

### TypeScript

- Strict mode. No `any`. No type assertions without an explanatory comment.
- Infer types from Zod schemas with `z.infer<typeof Schema>` — no duplicate type definitions.
- Use `interface` for props and DB model shapes; `type` for unions.
- The new `EmailPayload` union member must be added to `lib/email/send.ts` — the exhaustive switch already enforces this at compile time.

### Validation

```typescript
// No new Zod schema needed for this feature.
// adminDeliverNif already validates via DeliverNifSchema in app/actions/admin.ts.
// The query extension does not need a new schema.
```

### i18n

- Email templates do **not** use `next-intl`. All copy is a static `copy` object inside the template file, keyed by `EmailLocale` (`'en' | 'fr' | 'es' | 'de'`).
- No new `messages/*.json` keys are needed for this feature — the delivery email is not rendered in the app UI.

---

## Design

Email template visual structure (same styling conventions as `order-submitted-customer.tsx`):

```
[ RemoteNIF wordmark ]
────────────────────
[ Heading: "Your NIF has arrived." ]
[ Greeting: "Hello [name], your Portuguese NIF has been issued." ]

[ NIF block — visually prominent ]
  ┌─────────────────────┐
  │   NIF: 123 456 789  │  ← large, monospace, brand-tinted background block
  └─────────────────────┘

[ "View your NIF on your dashboard" CTA button ]
────────────────────
[ Guide heading: "What comes next?" ]
[ Three guide sections — plain body text, no sales pitch ]
  1. Opening a Portuguese bank account (Wise / N26 referral links as plain <Link> tags)
  2. Registering a property (brief paragraph)
  3. NHR / IFICI — what it is, who qualifies (brief paragraph, honest framing)
────────────────────
[ Footer: RemoteNIF · remotenif.com ]
```

**Rules:**
- NIF number must be visually distinct from surrounding text — use a `Section` wrapper with a light brand-tinted background (`#eff6ff`) and monospace font, large size.
- Guide sections are informational paragraphs only — no bold CTAs, no sales language.
- Referral links (Wise / N26) appear as plain inline `<Link>` (or `<a>`) elements inside the guide paragraph — not as styled `<Button>` components.
- Use the same inline `styles` object pattern as every other template (`fontStack`, `styles.body`, `styles.container`, `styles.button`, etc.) — no external CSS, no Tailwind in email templates.
- Match the existing template visual language: white card on `#f8fafc` base, `8px` border radius, `#3b82f6` brand color.

---

## Implementation

### 1. Extend `getOrderNifAndTier` in `lib/db/queries.ts`

The action currently calls this query for the immutability check. Extend it to also return the three fields needed for the delivery email: `customerEmail`, `customerLanguage`, and `fullName`.

Change the return type from:
```typescript
{ nifNumber: string | null; tier: 'essential' | 'standard' | 'express' } | null
```
to:
```typescript
{
  nifNumber: string | null
  tier: 'essential' | 'standard' | 'express'
  customerEmail: string
  customerLanguage: 'en' | 'fr' | 'es' | 'de'
  fullName: string | null
} | null
```

Add a `leftJoin` on the `users` table (already joined in `getAdminOrderDetail`) to pull `users.email` and `users.language`. Guard against null email with `?? ''` and null language with `?? 'en'`.

> **Note:** Do not replace `getOrderNifAndTier` with a call to the heavier `getAdminOrderDetail` — `getAdminOrderDetail` joins documents and payments and is 3× the query cost. A targeted join extension is the right approach.

---

### 2. Create `lib/email/templates/nif-delivered.tsx`

New React Email template. Export:
- `NifDeliveredEmail` — the React component
- `getNifDeliveredSubject(locale: EmailLocale): string` — returns the subject line from the `copy` object

**Props interface:**
```typescript
interface NifDeliveredEmailProps {
  locale: EmailLocale
  customerName: string   // order.fullName ?? 'there'
  nifNumber: string      // 9-digit NIF — always set at this point
  dashboardUrl: string
}
```

**`copy` object — define for all four locales (`en`, `fr`, `es`, `de`):**

Each locale entry needs:
| Key | Purpose |
|-----|---------|
| `subject` | Email subject line |
| `preview` | Preheader text (shown in inbox before email is opened) |
| `heading` | Main heading — e.g. "Your NIF has arrived." |
| `body(name)` | Opening paragraph with customer name interpolated |
| `nifLabel` | Small label above the NIF number — e.g. "Your NIF number" |
| `cta` | Dashboard button label — e.g. "View My Dashboard" |
| `guideHeading` | Section heading — e.g. "What comes next?" |
| `bankSection` | Guide paragraph about opening a Portuguese bank account — mention Wise and N26 as options, include referral placeholder URLs (see Open Questions) |
| `propertySection` | Guide paragraph about property registration after purchase |
| `nhrSection` | Guide paragraph about NHR/IFICI — what it is, who might qualify; honest framing ("consult a tax adviser") |

**English reference copy (use as-is; translate for other locales):**

```
subject:  "Your Portuguese NIF has been issued"
preview:  "Your NIF number is ready — log in to your dashboard to see it."
heading:  "Your NIF has arrived."
body:     "Hello [name], your Portuguese Tax Identification Number (NIF) has been officially issued by Finanças."
nifLabel: "Your NIF number"
cta:      "View My Dashboard"
guideHeading: "What comes next?"

bankSection:
  "Opening a Portuguese bank account is straightforward as a non-resident. Wise and N26 both allow you to open accounts online without visiting a branch — useful if you need to receive or send money in Portugal."
  (Wise URL: https://wise.com — N26 URL: https://n26.com — use as plain inline links)

propertySection:
  "If you are purchasing property in Portugal, your NIF is required to sign the promissory contract (Contrato-Promessa de Compra e Venda) and complete the deed (Escritura). Your notary will request it at the time of signing."

nhrSection:
  "Portugal's NHR (Non-Habitual Resident) regime — now updated to IFICI for 2024 applications — offers significant tax benefits for qualifying new residents. Eligibility depends on your income type and residency history. If you are planning to move to Portugal, consult a licensed tax adviser to understand whether you qualify before filing your first tax return."
```

---

### 3. Register `nif_delivered` in `lib/email/send.ts`

Make three additions:

**a. Add to `EmailTemplateName`:**
```typescript
| 'nif_delivered'
```

**b. Add to `EmailPayload` union:**
```typescript
| { template: 'nif_delivered'; customerName: string; nifNumber: string }
```

**c. Add a `case` in the `switch` statement:**
```typescript
case 'nif_delivered': {
  subject = getNifDeliveredSubject(locale)
  reactElement = NifDeliveredEmail({
    locale,
    customerName: payload.customerName,
    nifNumber: payload.nifNumber,
    dashboardUrl,
  })
  break
}
```

Import `NifDeliveredEmail` and `getNifDeliveredSubject` from `./templates/nif-delivered` at the top of the file, alongside the other template imports.

---

### 4. Wire delivery email into `adminDeliverNif` in `app/actions/admin.ts`

After the `await deliverNifNumber(...)` call succeeds, add the fire-and-forget email send:

```typescript
// Fire delivery email — fire-and-forget, errors caught inside sendEmail
void sendEmail(order.customerEmail, order.customerLanguage, {
  template: 'nif_delivered',
  customerName: order.fullName ?? 'there',
  nifNumber: validated.nifNumber,
})
```

`order` is the result of `getOrderNifAndTier` — now returns `customerEmail`, `customerLanguage`, and `fullName` after step 1.

**Placement:** after `deliverNifNumber`, before `insertAuditLog`. Full flow:
1. `requireRole('admin')` ✓
2. `DeliverNifSchema.parse(...)` ✓
3. `getOrderNifAndTier(...)` → immutability check ✓
4. `deliverNifNumber(...)` ← NIF is now set in DB
5. **`void sendEmail(...)` ← new line**
6. `insertAuditLog(...)` ✓
7. `revalidatePath(...)` ✓
8. `return { success: true }` ✓

---

### 5. Add unit tests

Add to `tests/unit/email/templates.test.tsx`:

- Smoke test `NifDeliveredEmail` renders without throwing in all 4 locales (same pattern as existing template tests)
- Assert the NIF number appears in the rendered output
- Assert `getNifDeliveredSubject` returns a non-empty string for all 4 locales (and each is unique — no copy-paste error)

Add to `tests/unit/email/send.test.ts`:

- `sendEmail` with `template: 'nif_delivered'` dispatches with the correct subject and calls `resendClient.emails.send` once (same mock pattern as existing `order_submitted_customer` tests)
- Cover `en` and `de` locales (sufficient to confirm locale routing)

Add to `tests/unit/actions/admin.test.ts` (existing file):

- `adminDeliverNif` success path — verify `sendEmail` is called once with `template: 'nif_delivered'`, the correct `nifNumber`, and the customer's email + locale from the `getOrderNifAndTier` mock
- Existing immutability guard test (`nif_already_set` path) — verify `sendEmail` is **not** called on that path

---

## Scope Limits

- **No scheduled / delayed emails.** Both emails (NIF delivery notification + guide content) are combined into a single `nif_delivered` email fired immediately. Time-delayed follow-ups (e.g. "send guide email 24h after delivery") require a Vercel Cron job — that is a separate feature, not part of Feature 16.
- **No in-app guide copy changes.** The delivered-state dashboard view (`components/dashboard/DeliveredState.tsx` or equivalent) already shows "What comes next?" content (Feature 08b). Do not modify it as part of this feature.
- **No new `adminResendEmail` type.** The `ResendEmailSchema` in `admin.ts` currently supports `order_confirmation` and `documents_approved_customer`. Do not add `nif_delivered` to the resend action — that belongs in a future admin polish pass.
- **No `fiscalRepExpiresAt` logic.** Already handled atomically inside `deliverNifNumber` (Feature 15). Do not touch it here.
- **No new DB migrations.** No schema changes required.
- **No referral link tracking / UTM parameters.** Use plain URLs. Analytics is out of scope.

---

## Open Questions

- **OQ-16-1 — Referral link URLs**: The spec uses `https://wise.com` and `https://n26.com` as placeholder links. Confirm the final affiliate / referral URLs before launch (or confirm plain links are intentional). This does not block implementation — placeholder URLs are fine for now.
- **OQ-16-2 — NHR/IFICI copy review**: The NHR/IFICI section involves regulatory framing. Confirm the English copy above is acceptable before translating it into the other three locales.

---

## Check When Done

- `lib/email/templates/nif-delivered.tsx` exists and exports `NifDeliveredEmail` and `getNifDeliveredSubject`.
- `getNifDeliveredSubject` returns a distinct, non-empty string for all four locales.
- `lib/email/send.ts` — `EmailPayload` union includes `nif_delivered`; the switch has a matching case; exhaustive check still compiles.
- `getOrderNifAndTier` in `lib/db/queries.ts` returns `customerEmail`, `customerLanguage`, and `fullName` in addition to `nifNumber` and `tier`.
- `adminDeliverNif` in `app/actions/admin.ts` fires `void sendEmail(...)` with `template: 'nif_delivered'` after a successful `deliverNifNumber` call.
- Existing `adminDeliverNif` behavior is unchanged — immutability guard, audit log, and `revalidatePath` still run as before.
- Unit tests: all new tests pass, and the full suite (`npm run test` or `npx vitest run`) reports 0 failures.
- `npm run build` passes.
