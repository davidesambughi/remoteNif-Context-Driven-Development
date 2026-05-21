# 14b — Operator Archive, Preferences & Submission Email


This unit adds the three missing pieces of the operator panel: a customer email sent when an order is marked as submitted, a read-only archive of submitted orders, and a preferences form where operators can toggle email and SMS notification channels.

---

## Design

### Operator header nav

The operator layout currently has no navigation between sections. Add a nav bar below the top bar with three links: **Queue** (`/operator`), **Archive** (`/operator/submitted`), **Preferences** (`/operator/preferences`). The active link is visually distinct (use `--brand-primary` underline or border, match the admin panel pattern). Nav is hidden on mobile behind a simple word list, not a hamburger — keep it minimal.

### Archive page

Simple table layout matching the admin order list style:

| Column | Content |
|--------|---------|
| Customer | `order.fullName` |
| Tier | Badge (Essential / Standard / Express) |
| Submitted | `submittedToFinancasAt` formatted as date + time |
| Order ID | Short ID (first 8 chars of UUID), monospace |

- Newest first (descending `submittedToFinancasAt`).
- Empty state: "No submitted orders yet." centered, muted text.
- Read-only — no action buttons on any row.

### Preferences page

Card with two toggle sections:

1. **Email notifications** — `Switch` (shadcn) defaulting to `true`. Label: "Email me when a new order is ready to submit." Subtext: "Applies to all orders — Express and Standard."
2. **SMS notifications** — `Switch` defaulting to `true`. Label: "Send me an SMS for Express orders." Subtext: "Express orders only — you must provide a phone number."
   - When SMS is toggled ON: a phone number `Input` appears below the switch (required, validated as non-empty string). When toggled OFF: input hides and phone number is not required.
3. A single **Save preferences** `Button` (primary) at the bottom. Show a success toast on save. Show an inline error message if the server returns one.
4. On page load, the form pre-fills with the operator's existing preferences (or defaults if none exist yet).

No page reload on save — use a Server Action with `useActionState` (or `useTransition` + direct call). Toast from Sonner (already installed).

---

## Implementation

### Step 1 — DB queries (lib/db/queries.ts)

Add four new query functions:

**`getOrderDataForSubmissionEmail(orderId: string)`**
- Joins `orders` + `users`.
- Returns `{ customerEmail: string; customerLanguage: 'en'|'fr'|'es'|'de'; fullName: string | null; tier: string } | null`.
- Used by `markOrderAsSubmitted` to look up the customer before sending the email.

**`getSubmittedOrders()`**
- Selects from `orders` joined to `users` where `status = 'submitted'`.
- Returns `Array<{ id: string; fullName: string | null; tier: string; submittedToFinancasAt: Date }>`.
- Ordered by `submittedToFinancasAt DESC`.

**`getOperatorPreferencesOrDefaults(userId: string)`**
- Selects from `operator_preferences` where `userId` matches.
- If no row exists, returns the schema defaults: `{ emailNotifications: true, smsNotifications: true, phoneNumber: null }`.
- Does NOT insert — returns defaults as a plain object if missing. Name reflects this: no "Create".

**`upsertOperatorPreferences(userId: string, data: Pick<InsertOperatorPreferences, 'emailNotifications' | 'smsNotifications' | 'phoneNumber'>)`**
- Import `InsertOperatorPreferences` from `@/lib/db/schema` — do not write a duplicate inline type.
- Upserts into `operator_preferences` (insert or update on conflict `userId`).
- Sets `updatedAt: new Date()`.

---

### Step 2 — "Submitted to Finanças" customer email template

Create `lib/email/templates/order-submitted-customer.tsx`.

Template props:
```ts
interface OrderSubmittedCustomerEmailProps {
  locale: EmailLocale
  customerName: string       // fallback to "there" if null
  tier: string               // 'essential' | 'standard' | 'express'
  dashboardUrl: string
}
```

Content (English reference — other locales via translation keys in the template):
- Subject: **"Your NIF application has been submitted"**
- Body: Confirm the application has been sent to Finanças. Include the delivery estimate copy: *"Typically 5–10 business days from submission. This is an estimate — Finanças processing times are outside our control."* Include a link to the dashboard. Keep the tone informational, not salesy.
- Follow the same structure as `documents-approved-customer.tsx` (import pattern, locale switch, React Email primitives).

Export: `OrderSubmittedCustomerEmail` component + `getOrderSubmittedCustomerSubject(locale: EmailLocale): string`.

---

### Step 3 — Wire the new template into send.ts

In `lib/email/send.ts`:

1. Import `OrderSubmittedCustomerEmail` and `getOrderSubmittedCustomerSubject` from the new template.
2. Add `'order_submitted_customer'` to `EmailTemplateName`.
3. Add to `EmailPayload` discriminated union:
   ```ts
   | { template: 'order_submitted_customer'; customerName: string; tier: string }
   ```
4. Add the matching `case` in the `switch` — builds `dashboardUrl` from `env.NEXT_PUBLIC_APP_URL + '/' + locale + '/dashboard'`, calls subject and component functions.

---

### Step 4 — Wire email into markOrderAsSubmitted action

In `app/actions/operator.ts`, after `markOrderSubmitted(orderId)` succeeds:

1. Call `getOrderDataForSubmissionEmail(orderId)` — if it returns null, skip email silently (order data missing, not a blocking error).
2. Fire-and-forget `sendEmail(customerEmail, customerLanguage, { template: 'order_submitted_customer', customerName: fullName ?? 'there', tier })`. Do not `await` — same pattern as all other email sends in the codebase.

---

### Step 5 — updateOperatorPreferences Server Action

Add to `app/actions/operator.ts` (same file as `markOrderAsSubmitted`, new export):

Define the Zod schema first, then infer the parameter type from it — do not write a duplicate inline object type:

```ts
const UpdatePreferencesSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  phoneNumber: z.string().nullable(),
})

export async function updateOperatorPreferences(
  formData: z.infer<typeof UpdatePreferencesSchema>
): Promise<ActionResult>
```

Steps inside: `UpdatePreferencesSchema.safeParse(formData)` → `requireRole('operator')` → if `smsNotifications === true` and `phoneNumber` is empty/null, return `{ success: false, error: 'phoneNumber required when SMS is enabled.' }` → `upsertOperatorPreferences(operator.id, validated.data)` → audit log (`'operator.preferences.updated'`) → return `{ success: true }`.

---

### Step 6 — Add translation keys

In all four locale files (`messages/en.json`, `fr.json`, `es.json`, `de.json`), add two new namespaces under `"operator"`:

**`operator.submitted`:**
- `title`: "Submitted Orders"
- `empty`: "No submitted orders yet."
- `columns.customer`: "Customer"
- `columns.tier`: "Tier"
- `columns.submitted`: "Submitted"
- `columns.orderId`: "Order ID"

**`operator.preferences`:**
- `title`: "Notification Preferences"
- `emailLabel`: "Email notifications"
- `emailDescription`: "Email me when a new order is ready to submit."
- `smsLabel`: "SMS notifications"
- `smsDescription`: "Express orders only — you must provide a phone number."
- `phoneLabel`: "Phone number"
- `phonePlaceholder`: "+351 912 345 678"
- `save`: "Save preferences"
- `saveSuccess`: "Preferences saved."
- `saveError`: "Failed to save preferences. Please try again."

Add email template subject lines under the existing `emails` namespace (or create `emails.orderSubmittedCustomer.subject` if that namespace exists). English: `"Your NIF application has been submitted"`. Translate for all four locales.

---

### Step 7 — Operator nav component

Create `components/operator/OperatorNav.tsx` (Client Component — needs `usePathname` to mark active link).

- Three `Link` items: Queue (`/operator`), Archive (`/operator/submitted`), Preferences (`/operator/preferences`).
- Active detection: `pathname.startsWith(href)`, with `/operator` matching exactly (not prefix, to avoid matching `/operator/submitted`).
- Styled as a horizontal tab-like row: `border-b border-[var(--border-default)]`, active link gets `border-b-2 border-[var(--brand-primary)] text-[var(--text-primary)]`, inactive is `text-[var(--text-secondary)] hover:text-[var(--text-primary)]`.
- Use `Link` from `next-intl/navigation` for locale-aware routing (existing pattern in the codebase).

Update `app/[locale]/(operator)/layout.tsx` to render `<OperatorNav />` between the `<header>` and `<main>` elements.

---

### Step 8 — Archive page

Create `app/[locale]/(operator)/operator/submitted/page.tsx`.

- Server Component.
- Calls `getSubmittedOrders()` and `getTranslations('operator.submitted')`.
- Renders the table. Tier shown as a `Badge` (neutral variant for Essential/Standard, colored for Express — match queue row pattern from `QueueRow.tsx`).
- `submittedToFinancasAt` formatted via a utility function — add `formatSubmissionDate(date: Date): string` to `lib/utils/dates.ts` that calls `date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })`. Do not format inline in the component.
- Order ID column: first 8 characters of UUID, monospace font (`font-mono`).

---

### Step 9 — Preferences page

Create `app/[locale]/(operator)/operator/preferences/page.tsx`.

- Server Component shell: calls `requireRole('operator')`, then `getOperatorPreferencesOrDefaults(operator.id)`.
- Passes the preferences object as props to `<PreferencesForm />`. Do NOT pass `getTranslations` output or the `t()` function as props — they are not serializable.

Create `components/operator/PreferencesForm.tsx` (Client Component).

- Calls `useTranslations('operator.preferences')` internally — it is a Client Component and this is the correct pattern.
- Uses `useTransition` + direct Server Action call (not `useActionState` — simpler pattern for this form).
- Two `Switch` components (shadcn) bound to local state initialized from the passed props.
- Phone number `Input` conditionally rendered when `smsEnabled === true`.
- On submit: calls `updateOperatorPreferences(...)`, shows success toast via `toast()` from Sonner on `result.success`, or inline `<p>` error text on `result.error`.
- Disable the Save button while the transition is pending (`isPending` from `useTransition`).

---

## Dependencies

Install `npx shadcn@latest add switch` if `components/ui/switch.tsx` does not already exist. No other new packages.

---

## Scope Limits

- **No SMS delivery.** The preferences UI saves the toggle and phone number, but no SMS messages are actually sent anywhere in this feature. SMS sending infrastructure is out of scope.
- **No operator notification wiring changes.** The `insertOperatorNotification` calls in the admin approval flow (`app/actions/admin.ts`) are not touched — they are a future concern once SMS delivery is built.
- **No pagination on the archive.** Simple full list. Pagination is not needed at current expected volume.
- **No per-order detail view** from the archive. Read-only list only.
- **No changes to QueueRow, SlaCountdown, or OperatorQueue components.** Touch only what's listed.
- **No new shadcn components** beyond `Switch` — see Dependencies section above.

---

## Check When Done

- `lib/db/queries.ts` exports `getOrderDataForSubmissionEmail`, `getSubmittedOrders`, `getOperatorPreferencesOrDefaults`, `upsertOperatorPreferences`.
- `lib/email/templates/order-submitted-customer.tsx` exists and exports `OrderSubmittedCustomerEmail` + `getOrderSubmittedCustomerSubject`.
- `lib/email/send.ts` handles `'order_submitted_customer'` in the switch — TypeScript exhaustive check still compiles.
- `app/actions/operator.ts` exports `updateOperatorPreferences` and fires the submission email inside `markOrderAsSubmitted`.
- `app/[locale]/(operator)/operator/submitted/page.tsx` renders a table of submitted orders; shows empty state when none exist.
- `app/[locale]/(operator)/operator/preferences/page.tsx` loads existing preferences and renders `PreferencesForm`.
- `components/operator/OperatorNav.tsx` exists and is rendered in the operator layout.
- All four locale files have `operator.submitted` and `operator.preferences` keys.
- Toggling SMS on shows the phone number input; toggling off hides it.
- Saving preferences with SMS enabled and no phone number returns an error (not a crash).
- `npm run build` passes.
