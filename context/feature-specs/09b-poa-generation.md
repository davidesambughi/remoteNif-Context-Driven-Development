Generate a pre-filled Power of Attorney PDF from the customer's saved personal details, store it in Supabase Storage, and display a persistent download link on the dashboard — with automatic invalidation and regeneration when details are edited.

---

## Constraints

### Tokens

| Purpose                   | Token                      | Tailwind utility                    |
| ------------------------- | -------------------------- | ----------------------------------- |
| Card background           | `var(--bg-surface)`        | `bg-surface`                        |
| Page background           | `var(--bg-base)`           | `bg-base`                           |
| Brand accent background   | `var(--brand-primary-dim)` | `bg-brand-primary-dim`              |
| Primary button background | `var(--brand-primary)`     | `bg-brand-primary`                  |
| Button text               | `var(--text-on-accent)`    | `text-on-accent`                    |
| Body text                 | `var(--text-primary)`      | `text-text-primary`                 |
| Supporting text           | `var(--text-secondary)`    | `text-text-secondary`               |
| Muted text                | `var(--text-muted)`        | `text-text-muted`                   |
| Default border            | `var(--border-default)`    | `border-border-default`             |
| Success state             | `var(--status-success)`    | `text-[var(--status-success)]`      |
| Error state               | `var(--status-error)`      | `text-[var(--status-error)]`        |
| Card shadow               | `var(--shadow-md)`         | `shadow-[var(--shadow-md)]`         |
| Card radius               | `var(--radius-xl)`         | `rounded-[length:var(--radius-xl)]` |
| Button radius             | `var(--radius-md)`         | `rounded-[length:var(--radius-md)]` |

Rules that always apply to UI work in this project:

- No raw Tailwind color classes (`zinc-*`, `slate-*`, `blue-*`). Tokens only.
- No hardcoded hex or rgb values.
- Mobile-first. Add breakpoint variants only where layout actually changes.
- Border radius from scale: `--radius-sm` / `md` / `lg` / `xl` / `2xl` / `full`.
- Shadows from scale: `--shadow-sm` / `md` / `lg` / `xl`.

### Architecture

- PDF template lives in `lib/pdf/poa-template.tsx` — a React PDF component (`@react-pdf/renderer`). No UI logic here, only document layout.
- `generatePoa` Server Action goes in `app/actions/orders.ts` — thin: validate → auth → fetch → generate → upload → update DB → return signed URL.
- All DB queries (fetch order details, update `poaGeneratedPath`, clear `poaGeneratedPath`) go in `lib/db/queries.ts`.
- Storage operations (upload, delete, sign URL) use the Supabase server client from `lib/supabase/server.ts` directly inside the Server Action — no separate storage helper needed at this scale.
- Dashboard page (`app/[locale]/(dashboard)/dashboard/page.tsx`) is an RSC — it fetches the signed URL server-side when `poaGeneratedPath` is set and passes it as a prop to `PersonalDetailsForm`.
- `PersonalDetailsForm` is already a Client Component — extend it with the POA section inside the saved summary view.
- No API route — this is an internal mutation, Server Action only.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- Infer types from Zod schemas with `z.infer<typeof Schema>` — no duplicate type definitions.
- Use `interface` for props and DB model shapes. Use `type` for unions.
- The `generatePoa` action returns `ActionResult<{ signedUrl: string }>` — use the existing `ActionResult<T>` type from `lib/types.ts`.

### Validation

No new Zod schema is required for the generate action — `orderId` is validated by the auth and ownership check in the action. Personal details are already validated by `PersonalDetailsSchema` when saved. The action must verify all required personal detail fields are non-null before generating (return early with an error if any are missing — this should not happen in normal flow but is a safety check).

### i18n

- All new user-facing strings go in `messages/en.json` under the existing `personalDetails` key, in a new `poa` sub-key.
- Use `useTranslations('personalDetails')` (already set up in the component).
- No hardcoded English strings in JSX.
- Add the same keys (untranslated for now — copy English values) to `fr.json`, `es.json`, `de.json`.

New keys required:

```json
"personalDetails": {
  "poa": {
    "sectionTitle": "Power of Attorney",
    "sectionDescription": "Download your pre-filled POA, sign it by hand, then upload the signed copy below.",
    "generateButton": "Generate my POA",
    "generating": "Generating…",
    "downloadButton": "Download POA",
    "ready": "Your POA is ready to download.",
    "regenerateNote": "You edited your details — generate a new POA to reflect the changes.",
    "error": "POA generation failed. Please try again."
  }
}
```

---

## Design

The POA section lives at the bottom of the summary card (saved state in `PersonalDetailsForm`), below the details grid and above the divider. It is not a separate card.

**Three states:**

1. **No POA generated yet** (default after first save):
   - Section heading "Power of Attorney" + description copy
   - Primary "Generate my POA" button (full-width on mobile, auto-width on md+)

2. **Generating** (button clicked, action in flight):
   - Button replaced by spinner + "Generating…" text
   - No other content changes

3. **POA ready** (action returned a signed URL):
   - Green checkmark icon + "Your POA is ready to download." text
   - "Download POA" link styled as a secondary button (`variant="outline"`), `target="_blank"` to open in new tab
   - No regenerate button — the user re-triggers generation by editing details and re-saving

**Regenerate needed state** (user edited details, re-saved, `poaSignedUrl` is null but `poaNeedsRegeneration` is true):

- Show a muted notice: "You edited your details — generate a new POA to reflect the changes." above the generate button
- Generate button is shown again

The PDF itself (internal layout — not visible in the UI):

- Single page, A4
- Header: "PROCURAÇÃO / POWER OF ATTORNEY" — bold, centered
- Sub-header: "Draft — Pending Legal Review" — small, muted, centered (clearly marks it as placeholder)
- Client identification block — all personal detail fields
- Authorization paragraph — draft placeholder text in English and Portuguese
- Representative line — "Fiscal Representative: [TO BE CONFIRMED]"
- Signature block — place, date line (blank), signature line, client full name below
- Footer — "Generated by RemoteNIF · remotenif.com · This document requires physical signature"

---

## Implementation

1. Add `poaGeneratedPath` column to the `orders` table in `lib/db/schema.ts`:
   - Type: `text` (Supabase Storage path string)
   - Nullable: yes (null = not yet generated)
   - Default: null

2. Generate and apply the migration:
   - Run `npm run db:generate` then `npm run db:migrate`

3. Install `@react-pdf/renderer`.

4. Create `lib/pdf/poa-template.tsx`:
   - Export a React PDF `Document` component — `PoaDocument`
   - Props: `PersonalDetailsData & { generatedDate: string }` (pass all personal detail fields + the generation date as a pre-formatted string)
   - Layout: A4 page, sections described in Design above
   - Use only the built-in `@react-pdf/renderer` fonts (Helvetica) — no custom font loading
   - All draft placeholder copy is hardcoded in this file — no i18n (PDF is not user-locale-specific; it is a legal document)
   - Mark draft sections clearly with "[DRAFT — REPLACE WITH LEGAL COPY]" inline

5. Add two queries to `lib/db/queries.ts`:
   - `updateOrderPoaPath(orderId: string, userId: string, path: string | null): Promise<void>` — updates `poaGeneratedPath` on the order, with ownership check (`and(eq(orders.id, orderId), eq(orders.userId, userId))`)
   - `getOrderPersonalDetails(orderId: string, userId: string)` — fetches the order's personal detail fields needed for PDF generation (fullName, dateOfBirth, nationality, passportNumber, passportExpiry, address); returns null if not found or not owned by user

6. Add `generatePoa` Server Action to `app/actions/orders.ts`:
   - Signature: `generatePoa(orderId: string): Promise<ActionResult<{ signedUrl: string }>>`
   - Steps:
     a. Auth check via `requireAuth()`
     b. Fetch order personal details via `getOrderPersonalDetails(orderId, user.id)`
     c. Return `{ success: false, error: 'not_found' }` if order not found
     d. Validate all required fields are non-null — return `{ success: false, error: 'incomplete_details' }` if any are missing
     e. Render PDF to buffer: `await renderToBuffer(<PoaDocument {...details} generatedDate={...} />)`
     f. Upload buffer to Supabase Storage: `supabase.storage.from('documents').upload('poa/{orderId}/poa-draft.pdf', buffer, { contentType: 'application/pdf', upsert: true })`
     g. On storage error: return `{ success: false, error: 'storage_error' }`
     h. Update `orders.poaGeneratedPath` via `updateOrderPoaPath(orderId, user.id, 'poa/{orderId}/poa-draft.pdf')`
     i. Generate a 1-hour signed URL: `supabase.storage.from('documents').createSignedUrl('poa/{orderId}/poa-draft.pdf', 3600)`
     j. Return `{ success: true, data: { signedUrl } }`

7. Update `savePersonalDetails` Server Action in `app/actions/orders.ts`:
   - After successfully updating the order's personal details, check if the order has a non-null `poaGeneratedPath`
   - If yes: delete the file from Storage (`supabase.storage.from('documents').remove(['poa/{orderId}/poa-draft.pdf'])`) and call `updateOrderPoaPath(orderId, user.id, null)` to clear the path
   - This forces regeneration after any edit — the existing download link becomes stale

8. Update `app/[locale]/(dashboard)/dashboard/page.tsx`:
   - After fetching the active order, if `order.poaGeneratedPath` is non-null, call `supabase.storage.from('documents').createSignedUrl(order.poaGeneratedPath, 3600)` server-side
   - Pass the resulting `poaSignedUrl: string | null` as a prop to `PersonalDetailsForm`
   - If signing fails (storage error), pass `null` — the component will show the generate button as fallback

9. Update `PersonalDetailsFormProps` in `components/dashboard/PersonalDetailsForm.tsx`:
   - Add `poaSignedUrl: string | null` prop
   - Add local state: `const [poaUrl, setPoaUrl] = useState(poaSignedUrl)` — initialises from server-fetched URL, updates after client-side generation
   - Add local state: `const [isGenerating, setIsGenerating] = useState(false)`
   - Add local state: `const [poaError, setPoaError] = useState(false)`
   - In the saved summary view, below the `<dl>` grid, add a divider and the POA section (three states described in Design)
   - `generateHandler`: sets `isGenerating = true`, calls `generatePoa(orderId)`, on success sets `poaUrl` to the returned signed URL, on failure sets `poaError = true`
   - When `isSaved` flips back to `false` (user clicks Edit): clear `poaUrl` to null — the stale URL will not be shown after re-save (the server also clears the path)

10. Add the new `poa` i18n keys to `messages/en.json`, `fr.json`, `es.json`, `de.json` under `personalDetails` (see i18n section for the key shape — use English values in all four files for now).

---

## Dependencies

Install: `@react-pdf/renderer`, `@types/react-pdf` (if available — skip if not found, the package ships its own types)

---

## Scope Limits

- Do not build document upload slots — that is Feature 10.
- Do not send any emails related to POA generation — that is Feature 12.
- Do not set up Supabase Storage RLS policies — the service role key bypasses RLS for server-side operations; full RLS setup is Feature 10.
- Do not finalize the legal copy in the PDF — all authorization text is draft placeholder, marked clearly. Real copy comes from the fiscal rep before launch.
- Do not add a signed POA upload slot — that is Feature 10.
- Do not make the POA locale-aware — it is a legal document, English/Portuguese draft only.
- Do not add progress polling or webhooks — generation is synchronous within the Server Action.

---

## Check When Done

- `poaGeneratedPath` column exists in the `orders` table (verify via `npm run db:studio` or Supabase dashboard).
- `generatePoa` Server Action generates a PDF, stores it at `poa/{orderId}/poa-draft.pdf` in the `documents` bucket, and returns a signed URL.
- Dashboard shows the "Generate my POA" button when details are saved and no POA exists.
- Clicking "Generate my POA" transitions through the loading state and ends with a working "Download POA" link.
- The downloaded PDF contains the customer's actual details (not empty fields).
- The PDF is clearly marked as a draft ("Draft — Pending Legal Review").
- Refreshing the dashboard after generation still shows the "Download POA" link (URL is re-fetched server-side from the stored path).
- Clicking "Edit details", changing any field, and re-saving removes the download link and shows the generate button again.
- `npm run build` passes.
