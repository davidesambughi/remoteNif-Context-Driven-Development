# 09a — Personal Details Form

Read `context/AGENTS.md`, `context/progress-tracker.md` before starting.

Collect the customer's legal personal details via a validated form on the dashboard, persist them to the active `Order` record, and enforce the upload-gate that keeps document slots disabled until the form has been saved successfully.

---

## Constraints

### Tokens (UI features only)

| Purpose | Token | Tailwind utility |
|---------|-------|-----------------|
| Page canvas | `var(--bg-base)` | `bg-base` |
| Card / panel background | `var(--bg-surface)` | `bg-surface` |
| Muted section background | `var(--bg-subtle)` | `bg-subtle` |
| Primary body text | `var(--text-primary)` | `text-primary` |
| Supporting labels | `var(--text-secondary)` | `text-secondary` |
| Placeholder / disabled text | `var(--text-muted)` | `text-muted` |
| Text on accent backgrounds | `var(--text-on-accent)` | `text-on-accent` |
| Standard card border | `var(--border-default)` | `border-default` |
| Light divider | `var(--border-subtle)` | `border-subtle` |
| Primary CTA | `var(--brand-primary)` | `bg-brand-primary` |
| Hover / dim | `var(--brand-primary-dim)` | `bg-brand-primary-dim` |
| Error state | `var(--status-error)` | `text-status-error` / `border-status-error` |
| Success state | `var(--status-success)` | `text-status-success` |
| Card shadow | `var(--shadow-md)` | `shadow-md` |
| Card radius | `var(--radius-lg)` | `rounded-lg` |
| Input radius | `var(--radius-md)` | `rounded-md` |
| Base transition | `var(--transition-base)` | `transition-base` |

Rules that always apply to UI work in this project:
- No raw Tailwind color classes (`zinc-*`, `slate-*`, `blue-*`). Tokens only.
- No hardcoded hex or rgb values.
- Mobile-first. Add breakpoint variants only where layout actually changes.
- Border radius from scale: `--radius-sm` / `md` / `lg` / `xl` / `2xl` / `full`.
- Shadows from scale: `--shadow-sm` / `md` / `lg` / `xl`.

### Architecture

- The personal details form is a **Client Component** (`"use client"`) — it uses `react-hook-form` hooks and `useState` for the save-state banner.
- The save mutation is a **Server Action** in `app/actions/orders.ts` — name it `savePersonalDetails`. Thin: validate → auth → ownership check → update → return `ActionResult<void>`.
- DB query helper goes in `lib/db/queries.ts` — add `updateOrderPersonalDetails(orderId: string, userId: string, data: PersonalDetailsData)`. The `userId` parameter is used to enforce ownership (only update if `orders.userId === userId`).
- The form component lives at `components/dashboard/PersonalDetailsForm.tsx`.
- The dashboard page (`app/[locale]/(dashboard)/dashboard/page.tsx`) is a **Server Component** — it passes the active order's existing personal details as props to `PersonalDetailsForm` so fields are pre-filled on return visits.
- The upload-gate (disabled document slots) is already stubbed in the dashboard shell from Feature 08a. This feature wires the real gate condition: slots stay disabled when `order.fullName === null` (i.e. personal details not yet saved). The gate is a display rule on the server — `PersonalDetailsForm` receives a `detailsSaved` prop that unlocks the slots after a successful save (via optimistic client state or router refresh).
- Zod schema for the form lives in `lib/validations/orders.ts`.
- Return type for Server Actions: `ActionResult<void>` from `lib/types.ts`.
- No `revalidatePath` abuse — after a successful save, call `router.refresh()` from the Client Component to re-fetch the server page, which re-renders the dashboard with the new state.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- Infer types from Zod schemas with `z.infer<typeof Schema>` — no duplicate type definitions.
- Use `interface` for component props. Use `type` for unions.
- The `Order` fields being populated here are already defined in `lib/db/schema.ts` — do not redefine them.

### Validation

```typescript
// lib/validations/orders.ts  (add alongside any existing schemas in this file)
const PersonalDetailsSchema = z.object({
  fullName: z.string().min(2, { message: 'validation.fullName.required' }).max(150),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'validation.dateOfBirth.invalid' }),
  nationality: z.string().length(2, { message: 'validation.nationality.invalid' }), // ISO 3166-1 alpha-2
  passportNumber: z.string().min(3).max(20, { message: 'validation.passportNumber.invalid' }),
  passportExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'validation.passportExpiry.invalid' }),
  address: z.string().min(5, { message: 'validation.address.required' }).max(500),
})
```

- Validation error messages must be i18n keys, not raw English strings.
- The `dateOfBirth` and `passportExpiry` fields are stored as ISO date strings (`YYYY-MM-DD`) in the form and converted to `Date` before writing to the DB.
- `nationality` is a 2-letter ISO country code — the UI presents a `<Select>` of countries, not a free-text field.

### i18n

- All user-facing strings go in `messages/en.json` under the `personalDetails` key.
- Use `useTranslations('personalDetails')` in the component.
- No hardcoded English strings in JSX.
- Add the same keys (English values only for now) to `fr.json`, `es.json`, `de.json`.
- Validation error keys live under `personalDetails.validation.*`.
- Success/error banner keys live under `personalDetails.save.*`.

---

## Design

The form is rendered inside the existing dashboard card layout (established in Feature 08a). It sits **above** the three document upload slots, matching the layout described in `user-flows.md` Flow 4 State 1.

**Form layout:**

- Single-column on mobile, two-column grid (`md:grid-cols-2`) on tablet and above.
- Field order (left-to-right, top-to-bottom on two-column):
  1. Full legal name (full width, `col-span-2`)
  2. Date of birth | Nationality
  3. Passport number | Passport expiry date
  4. Current address (full width, `col-span-2`, `<textarea>` or multi-line `<Input>`)
- Each field: shadcn `FormField` → `FormItem` → `FormLabel` + `FormControl` + `FormMessage`.
- The **"Save details"** button is primary, full-width on mobile, auto-width on desktop, right-aligned.
- On save success: show an inline success banner (green, using `--status-success` token) above the button — "Your details have been saved." Do not navigate away.
- On save error: show an inline error banner (red, using `--status-error` token) — "Something went wrong. Please try again."
- While saving: button shows a spinner and is disabled. No layout shift.

**Upload-gate state:**

- When `detailsSaved === false`: the three document upload slot cards (rendered below the form) are visually disabled — `opacity-50 cursor-not-allowed` — and each shows a tooltip on hover: "Complete your personal details first to unlock document upload."
- When `detailsSaved === true`: slots render normally. (Actual upload UI is built in Feature 10 — for now the slots remain as placeholders.)
- This state is derived server-side from `order.fullName !== null`. After a successful save, `router.refresh()` updates this without a full navigation.

**Nationality select:**

- Use a shadcn `Select` with a static list of ISO 3166-1 alpha-2 country codes and English names.
- Include at minimum: US, GB, FR, DE, ES, IT, NL, PT, BE, CH, AU, CA, BR, AR, MX — and the full ISO list if feasible.
- Display the country name in the dropdown; store the 2-letter code.

---

## Implementation

1. **Add the Zod schema** to `lib/validations/orders.ts` — define `PersonalDetailsSchema` as specified in the Validation section above. Export both the schema and its inferred type `PersonalDetailsData`.

2. **Add the DB query helper** to `lib/db/queries.ts`:
   - `updateOrderPersonalDetails(orderId: string, userId: string, data: PersonalDetailsData): Promise<void>`
   - Uses Drizzle `update(orders).set({...}).where(and(eq(orders.id, orderId), eq(orders.userId, userId)))`.
   - Converts `dateOfBirth` and `passportExpiry` strings to `Date` before the update.
   - Throws if no row was updated (ownership check failed or order not found).

3. **Add the Server Action** `savePersonalDetails` to `app/actions/orders.ts`:
   - Signature: `savePersonalDetails(orderId: string, data: PersonalDetailsData): Promise<ActionResult<void>>`
   - Steps: validate input with `PersonalDetailsSchema` → `requireAuth()` → call `updateOrderPersonalDetails` → return `{ success: true }` or `{ success: false, error: 'personalDetails.save.error' }`.
   - On validation failure: return `{ success: false, error: 'personalDetails.save.validationError' }`.
   - Never throw to the client — always return `ActionResult`.

4. **Create the country list utility** at `lib/utils/countries.ts`:
   - Export `COUNTRIES: { code: string; name: string }[]` — ISO 3166-1 alpha-2 codes with English names, sorted alphabetically by name.
   - Static data, no external dependency.

5. **Create the Client Component** `components/dashboard/PersonalDetailsForm.tsx`:
   - Props: `orderId: string`, `initialValues: Partial<PersonalDetailsData> | null`, `detailsSaved: boolean`.
   - Uses `react-hook-form` with `zodResolver(PersonalDetailsSchema)`.
   - Pre-fills fields from `initialValues` when provided (return visit scenario).
   - Renders the two-column form layout described in Design.
   - Nationality field: shadcn `Select` populated from `COUNTRIES`.
   - On submit: calls `savePersonalDetails(orderId, data)`. While submitting, button is disabled with spinner. On success: shows success banner + calls `router.refresh()`. On error: shows error banner.
   - Upload gate: renders the three document upload slot placeholder cards below the form. When `detailsSaved === false`, applies `opacity-50 cursor-not-allowed` and a tooltip. After `router.refresh()`, the server page re-renders with `detailsSaved === true` and the slots are re-enabled.
   - Add comments to all non-trivial logic blocks.

6. **Update the dashboard page** `app/[locale]/(dashboard)/dashboard/page.tsx`:
   - Pass `order.fullName` (or `null`) and `order.id` down to `PersonalDetailsForm`.
   - Derive `detailsSaved = order.fullName !== null`.
   - Render `<PersonalDetailsForm>` in the `documents_pending` state view (which was stubbed in 08a).
   - Keep the existing pending-state shell card as the outer wrapper.

7. **Add i18n keys** to `messages/en.json` under the `personalDetails` namespace:
   - Field labels: `fullName`, `dateOfBirth`, `nationality`, `passportNumber`, `passportExpiry`, `address`.
   - Placeholders where helpful.
   - Validation errors under `personalDetails.validation.*`.
   - Save states: `personalDetails.save.success`, `personalDetails.save.error`, `personalDetails.save.validationError`.
   - Upload gate tooltip: `personalDetails.uploadGate.tooltip`.
   - Section heading (e.g. "Your personal details").
   - CTA button label: "Save details".
   - Copy the same keys to `fr.json`, `es.json`, `de.json` — English values are acceptable for now.

8. **Verify** that the email-confirmation gate from Feature 04 notes does not apply to form save (it applies to POA generation in 09b only). No additional email-verification check is needed in this feature.

---

## Dependencies

No new packages required. `react-hook-form`, `@hookform/resolvers`, and `zod` are already installed from Feature 04.

Check that shadcn `Select` and `Textarea` are installed; if not, add them via the shadcn CLI before starting:
- `npx shadcn@latest add select`
- `npx shadcn@latest add textarea`

---

## Scope Limits

- **Do not build POA generation** — that is Feature 09b. The "Save and generate my POA" label from `user-flows.md` reflects the combined 09a + 09b experience; for this feature the button label is "Save details" only.
- **Do not build document upload UI** — that is Feature 10. The upload slots remain as disabled placeholder cards.
- **Do not run AI review** — that belongs to Feature 11.
- **Do not send any email** — no email triggers in this feature.
- **Do not add a loading.tsx** to the dashboard route — it was added in Feature 08a.
- **Do not modify** `components/ui/*` (shadcn primitives).
- **Do not change order status** — saving personal details does not transition `documents_pending`. Status transitions only when all three documents are uploaded and approved (Feature 10 → 11).
- **Do not implement the POA download link** — that appears after 09b completes.
- Keep this focused on: form → validate → save → persist to DB → unlock upload gate.

---

## Check When Done

- `PersonalDetailsSchema` is exported from `lib/validations/orders.ts` and validates all six fields correctly (tested manually or via unit test).
- `updateOrderPersonalDetails` in `lib/db/queries.ts` only updates rows where `orders.userId` matches the authenticated user's ID.
- `savePersonalDetails` Server Action returns `{ success: false }` (not a thrown error) when validation fails or when ownership check fails.
- Dashboard page renders the `PersonalDetailsForm` for an order in `documents_pending` status.
- Filling in all fields and clicking "Save details" persists the data to the `orders` table (verify in Supabase dashboard or Drizzle Studio).
- On return visit, the form pre-fills with the previously saved values.
- Document upload slot placeholders are disabled (`opacity-50`, `cursor-not-allowed`) before save; they become enabled after a successful save and page refresh.
- All visible strings on the form are translation keys — no hardcoded English in JSX.
- `personalDetails` namespace exists with identical keys in `en.json`, `fr.json`, `es.json`, `de.json`.
- `npm run build` passes.
