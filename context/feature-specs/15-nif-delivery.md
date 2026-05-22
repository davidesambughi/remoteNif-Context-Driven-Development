# 15 — NIF Delivery

<!-- Context files to read before starting:
     AGENTS.md, progress-tracker.md, architecture-context.md, tech-spec.md -->

The admin enters the 9-digit NIF number issued by Finanças into the order detail panel,
which transitions the order to `delivered`, records all delivery timestamps, and makes the
NIF immediately visible on the customer's dashboard.

---

## Constraints

### Tokens (UI features only)

| Purpose | Token | Tailwind utility |
|---------|-------|-----------------|
| Page background | `var(--bg-base)` | `bg-[var(--bg-base)]` |
| Card background | `var(--bg-surface)` | `bg-surface` |
| Primary text | `var(--text-primary)` | `text-text-primary` |
| Secondary text | `var(--text-secondary)` | `text-text-secondary` |
| Muted text | `var(--text-muted)` | `text-text-muted` |
| Brand primary | `var(--brand-primary)` | `text-brand-primary` / `bg-brand-primary` |
| Success | `var(--status-success)` | `text-success` / `bg-success` |
| Error | `var(--status-error)` | `text-error` |
| Default border | `var(--border-default)` | `border-border-default` |
| Card radius | `var(--radius-lg)` | `rounded-[length:var(--radius-lg)]` |
| Card shadow | `var(--shadow-md)` | `shadow-[var(--shadow-md)]` |

Rules that always apply to UI work in this project:
- No raw Tailwind color classes (`zinc-*`, `slate-*`, `blue-*`). design Tokens only.
- No hardcoded hex or rgb values.
- Mobile-first. Add breakpoint variants only where layout actually changes.
- Shadcn components when possible.

### Architecture

- **New DB query** `deliverNifNumber` goes in `lib/db/queries.ts` — single atomic `UPDATE` setting `nifNumber`, `status`, `deliveredAt`, and conditionally `fiscalRepExpiresAt`.
- **New Server Action** `adminDeliverNif` goes in `app/actions/admin.ts` — thin: validate → `requireRole('admin')` → immutability guard → call `deliverNifNumber` → write audit log → `revalidatePath` → return `ActionResult`.
- **Extend existing query** `getAdminOrderDetail` in `lib/db/queries.ts`: add `nifNumber` to both the `AdminOrderDetail` interface and the `SELECT` projection. No other changes to that query.
- **New component** `DeliverNifSection` in `components/admin/DeliverNifSection.tsx` — `"use client"` (uses `useTransition`, `useState`). Renders only when `status === 'submitted'`. Uses `shadcn AlertDialog` for confirmation, consistent with `ApproveOrderSection`.
- **Admin order detail page** `app/[locale]/admin/(panel)/orders/[id]/page.tsx` — add `DeliverNifSection` to the aside. Pass `orderId`, `currentStatus`, `existingNifNumber` (from `order.nifNumber`).
- **Customer dashboard** — no changes needed. `getUserActiveOrder` already returns all order fields including `nifNumber`, and the `delivered` state in `app/[locale]/(dashboard)/dashboard/page.tsx` already renders it.
- Server Actions return `ActionResult<T>` from `lib/types.ts` — never throw to the client.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- Infer types from Zod schemas with `z.infer<typeof Schema>` — no duplicate type definitions.
- Use `interface` for props. Use `type` for unions and derived types.

### Validation

```typescript
// Inline in app/actions/admin.ts (alongside other admin schemas)
const DeliverNifSchema = z.object({
  orderId: z.string().uuid(),
  nifNumber: z
    .string()
    .regex(/^\d{9}$/, 'NIF must be exactly 9 digits'),
})
```

### i18n

- All new user-facing strings go in `messages/en.json` under `admin.detail.deliverNif`.
- Use `useTranslations('admin.detail.deliverNif')` in `DeliverNifSection`.
- No hardcoded English strings in JSX.
- Add the same keys (untranslated — copy the English) to `fr.json`, `es.json`, `de.json`.

**Keys to add:**

```json
"admin": {
  "detail": {
    "deliverNif": {
      "sectionTitle": "Deliver NIF",
      "description": "Enter the 9-digit NIF number issued by Finanças.",
      "inputLabel": "NIF Number",
      "inputPlaceholder": "123456789",
      "triggerButton": "Enter NIF",
      "confirmTitle": "Confirm NIF Delivery",
      "confirmDescription": "This will mark the order as delivered. The NIF cannot be changed once it is saved.",
      "confirmButton": "Deliver NIF",
      "cancelButton": "Cancel",
      "successToast": "NIF delivered successfully",
      "alreadyDeliveredLabel": "NIF delivered",
      "immutableError": "This order already has a NIF number and cannot be changed.",
      "invalidFormat": "NIF must be exactly 9 digits."
    }
  }
}
```

---

## Design

**Location in layout:** `DeliverNifSection` is added to the sticky aside in the admin order detail page, below `EmailResendSection` (i.e. at the bottom of the sidebar). It only renders when `currentStatus === 'submitted'`.

**Two visual states:**

1. **Input state** (`status === 'submitted'` and `existingNifNumber` is `null`):
   - Card with title "Deliver NIF" and description text.
   - A single text input for the NIF number (9 numeric digits).
   - A primary "Enter NIF" button that opens a shadcn `AlertDialog` to confirm.
   - AlertDialog shows the NIF the admin entered and a final confirmation button "Deliver NIF".
   - On success: show a Sonner toast ("NIF delivered successfully") and the page revalidates — the component re-renders in delivered state.
   - On error: show inline error text below the input.

2. **Delivered state** (`existingNifNumber` is not `null`):
   - Card with success icon, "NIF delivered" label, and the NIF displayed in monospace — read-only.
   - No edit capability. Matches the immutability rule in `tech-spec.md`.

The card appearance follows the existing aside cards (`ApproveOrderSection`, `StatusUpdateSection`, `EmailResendSection`) — same border, radius, shadow, spacing.

---

## Implementation

1. **Extend `AdminOrderDetail` interface** in `lib/db/queries.ts`:
   - Add `nifNumber: string | null` to the interface.
   - Add `nifNumber: orders.nifNumber` to the `SELECT` projection inside `getAdminOrderDetail`.

2. **Add `deliverNifNumber` query** in `lib/db/queries.ts`:

   ```typescript
   // Sets nifNumber, status = 'delivered', deliveredAt, and fiscalRepExpiresAt
   // (fiscalRepExpiresAt = deliveredAt + 12 months for standard/express; null for essential)
   export async function deliverNifNumber(
     orderId: string,
     nifNumber: string,
   ): Promise<void>
   ```

   - Single `UPDATE` on `orders` WHERE `id = orderId`.
   - `deliveredAt` = `new Date()` (capture once, reuse for both fields).
   - `fiscalRepExpiresAt`: fetch the order's `tier` first (or pass it in), then:
     - If `'standard'` or `'express'`: set to `deliveredAt + 12 months`.
     - If `'essential'`: leave `null`.
   - Set `status = 'delivered'` and `nifNumber = nifNumber` in the same update.
   - The function takes `tier` as a second parameter to avoid a separate fetch:

   ```typescript
   export async function deliverNifNumber(
     orderId: string,
     nifNumber: string,
     tier: 'essential' | 'standard' | 'express',
   ): Promise<void>
   ```

3. **Add `adminDeliverNif` Server Action** in `app/actions/admin.ts`:

   - `'use server'`
   - Validate input with `DeliverNifSchema`.
   - `requireRole('admin')`.
   - Fetch the current order's `nifNumber` and `tier` using a lightweight query (select only those two fields, WHERE `id = orderId`).
   - **Immutability guard**: if the fetched `nifNumber` is not `null`, return `{ success: false, error: t('immutableError') }` (use `getTranslations`).
   - Call `deliverNifNumber(orderId, nifNumber, tier)`.
   - Write an audit log entry: `action = 'order.nif.delivered'`, `details = { nifNumber, tier }`.
   - `revalidatePath` for the admin order detail route.
   - Return `{ success: true }`.

4. **Create `DeliverNifSection` component** at `components/admin/DeliverNifSection.tsx`:

   - `'use client'`
   - Props: `orderId: string`, `currentStatus: SelectOrder['status']`, `existingNifNumber: string | null`.
   - Return `null` if `currentStatus !== 'submitted'`.
   - **Input state** (when `existingNifNumber` is `null`):
     - Local state: `nifInput` (string), `inputError` (string | null), `isOpen` (AlertDialog open state).
     - Use `useTransition` for the Server Action call.
     - On "Enter NIF" click: validate the input client-side with the same regex (`/^\d{9}$/`). If invalid, set `inputError` and return early (don't open dialog).
     - Open `AlertDialog` showing the entered NIF and a final "Deliver NIF" confirm button.
     - On confirm: call `adminDeliverNif`, handle `ActionResult`. On success: `toast.success(t('successToast'))`. On error: close dialog, set `inputError`.
   - **Delivered state** (when `existingNifNumber` is not `null`):
     - Read-only card displaying the NIF in monospace with a success icon and "NIF delivered" label.

5. **Wire `DeliverNifSection` into the admin order detail page** at `app/[locale]/admin/(panel)/orders/[id]/page.tsx`:

   - Import `DeliverNifSection`.
   - Add to the `<aside>` below `<EmailResendSection>`:

   ```tsx
   <DeliverNifSection
     orderId={order.id}
     currentStatus={order.status}
     existingNifNumber={order.nifNumber}
   />
   ```

6. **Add i18n keys** to all four locale files:
   - `messages/en.json` — full English copy as defined in the i18n section above.
   - `messages/fr.json`, `messages/es.json`, `messages/de.json` — same English copy for now (untranslated).
   - Nest under the existing `admin.detail` key.

7. **Verify the customer dashboard delivered state** (no code changes expected):
   - Confirm `getUserActiveOrder` returns `nifNumber` (it uses `SELECT *` on `orders` — it does).
   - Confirm `app/[locale]/(dashboard)/dashboard/page.tsx` renders `order.nifNumber` in the `delivered` block (line 191 already does: `{order.nifNumber || '--- --- ---'}`).
   - No changes needed — this is a verification step only.

---

## Dependencies

No new packages. `sonner` (toasts) and `shadcn AlertDialog` are already installed.

---

## Scope Limits

- **No delivery email** — that belongs to Feature 16 (Delivery Emails). The action must NOT fire any email.
- **No fiscal rep renewal banner** — that belongs to Feature 18b.
- **No NIF edit/correction capability** — the NIF is immutable once set. Admin override requires a manual database fix (intentional, per `tech-spec.md`).
- **No customer-facing copy changes** — the dashboard `delivered` state already has all its copy. Do not modify `dashboard/page.tsx` beyond confirming it works.
- **No changes to `OrderTimeline`** — it already handles the `delivered` status.
- **No new DB migration** — `nifNumber`, `deliveredAt`, and `fiscalRepExpiresAt` columns already exist from Feature 02.

---

## Check When Done

- [ ] `AdminOrderDetail` interface includes `nifNumber: string | null`.
- [ ] `getAdminOrderDetail` query selects `nifNumber` from the `orders` table.
- [ ] `deliverNifNumber(orderId, nifNumber, tier)` query exists in `lib/db/queries.ts` and sets all four fields atomically.
- [ ] `adminDeliverNif` Server Action exists in `app/actions/admin.ts`, validates input, enforces immutability, calls the query, writes an audit log entry, and revalidates the page.
- [ ] `DeliverNifSection` renders in the admin order detail aside only when `status === 'submitted'`.
- [ ] Submitting a valid 9-digit NIF opens an AlertDialog; confirming calls the action; success shows a Sonner toast and the section transitions to the delivered read-only state.
- [ ] Submitting a non-9-digit value shows an inline error and does not open the dialog.
- [ ] When `existingNifNumber` is not null, the component shows the NIF read-only (no input, no button).
- [ ] `deliveredAt` is set when the action runs.
- [ ] `fiscalRepExpiresAt` is set to `deliveredAt + 12 months` for Standard and Express orders; remains `null` for Essential.
- [ ] Customer dashboard `delivered` state shows the real NIF number after delivery (manual verification).
- [ ] All i18n keys exist under `admin.detail.deliverNif` in all four locale files.
- [ ] No hardcoded English strings in `DeliverNifSection`.
- [ ] Add unit tests for `adminDeliverNif` (immutability guard, success path, invalid NIF format) following the existing pattern in `tests/unit/actions/admin.test.ts`.
- [ ] `npm run build` passes.
