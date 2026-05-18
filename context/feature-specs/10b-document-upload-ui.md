# 10b — Document Upload UI

Read `context/AGENTS.md`, `context/progress-tracker.md`, `context/ui-context.md` before starting.

Build the three document upload slots on the customer dashboard — the UI that lets a user select, upload, and track the review status of their passport, proof of address, and signed POA.

---

## Constraints

### Tokens

| Purpose | Token | Tailwind utility |
|---------|-------|-----------------|
| Slot card background | `var(--bg-surface)` | `bg-[var(--bg-surface)]` |
| Slot border (default) | `var(--border-default)` | `border-[var(--border-default)]` |
| Slot border (approved) | `var(--status-success)` | `border-[var(--status-success)]` |
| Slot border (flagged) | `var(--status-error)` | `border-[var(--status-error)]` |
| Approved text/icon | `var(--status-success)` | `text-[var(--status-success)]` |
| Flagged text/icon | `var(--status-error)` | `text-[var(--status-error)]` |
| Warning (manual review) | `var(--status-warning)` | `text-[var(--status-warning)]` |
| Muted labels | `var(--text-muted)` | `text-[var(--text-muted)]` |
| Body text | `var(--text-primary)` | `text-[var(--text-primary)]` |
| Primary button | `var(--brand-primary)` | `bg-[var(--brand-primary)]` |
| Disabled opacity | — | `opacity-50 cursor-not-allowed` |
| Card radius | `var(--radius-lg)` | `rounded-[length:var(--radius-lg)]` |
| Card shadow | `var(--shadow-md)` | `shadow-[var(--shadow-md)]` |

Rules that always apply:
- No raw Tailwind color classes. Tokens only.
- Mobile-first. Add breakpoint variants only where layout actually changes.
- Border radius and shadows from the scale above only.

### Architecture

- `DocumentUploadSlot` is a Client Component (`"use client"`) — it handles file input state, upload progress, and server action calls.
- It lives in `components/dashboard/DocumentUploadSlot.tsx`.
- The dashboard page (`app/[locale]/(dashboard)/dashboard/page.tsx`) passes slot state as props — it does not manage upload logic itself.
- Upload flow (in the component): call `createUploadSignedUrl` → `fetch` PUT to signed URL → call `uploadDocument` → update local state.
- Both `createUploadSignedUrl` and `uploadDocument` are already implemented in `app/actions/documents.ts`.
- File validation (size, type) runs client-side before the signed URL request — do not skip it.
- No direct Supabase client calls from the component. Storage access goes through the signed URL only.
- `router.refresh()` after a successful upload to sync server-rendered order state.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- Infer types from Zod schemas with `z.infer<typeof Schema>` — no duplicate type definitions.
- Define a local `SlotStatus` union type for the component's internal state machine.

### Validation

Client-side pre-flight before calling `createUploadSignedUrl`:
- File size ≤ 10 MB — show inline error if exceeded, do not proceed.
- MIME type must be `application/pdf`, `image/jpeg`, or `image/png` — show inline error otherwise.
- These checks mirror `UploadDocumentSchema` (already in `lib/validations/documents.ts`) — no duplication, just early feedback.

### i18n

- All user-facing strings under the `documents` namespace in `messages/*.json`.
- Use `useTranslations('documents')` in the component.
- No hardcoded English strings in JSX.
- Add the same keys (English content, untranslated) to `fr.json`, `es.json`, `de.json`.

---

## Design

Three stacked cards on the dashboard (one per document type), rendered below the personal details summary card. Each card has a left icon column and a right content column.

**Slot states and what the user sees:**

| State | Border | Content |
|-------|--------|---------|
| `idle` | default | Label + description + upload button |
| `disabled` | default + opacity 50% | Label + description + disabled upload button + tooltip text |
| `uploading` | default | Label + spinner + "Uploading…" |
| `pending_review` | default | Label + "Under review" badge (neutral) |
| `approved` | success | Label + checkmark icon + "Approved" |
| `flagged` | error | Label + specific reason text + re-upload button |
| `manual_review` | warning | Label + "Our team will review within 4 hours" |

**Gating rules (from user-flows.md):**
- Passport and proof of address slots: disabled until `detailsSaved === true`.
- Signed POA slot: disabled until `poaGeneratedPath` is set (POA has been generated).
- Disabled slots show tooltip on hover: "Complete your personal details first" (or "Generate your POA first" for the POA slot).

**Layout:** single column on mobile, stays single column on all screen sizes (three cards stacked). No grid needed — documents are uploaded sequentially by intent.

**Signed POA slot specifics:** after a successful upload, transitions immediately to `approved` (no `pending_review` step — it is approved instantly by the backend).

**Flagged state:** only the flagged slot shows a re-upload button. The other slots that already passed remain in their current state and are not locked or disabled (the user flows spec says "all other document slots that passed are locked" but this is complex state to manage without the AI review data — defer the locking behavior to Feature 11 when AI results exist in the DB).

---

## Implementation

1. Add `documents` i18n keys to `messages/en.json` (and same keys to `fr.json`, `es.json`, `de.json`):
   - Slot labels and descriptions for each of the three document types
   - Button labels: upload, re-upload
   - State labels: uploading, pending review, approved, flagged, manual review
   - Disabled tooltip strings for details-not-saved and poa-not-generated
   - Client-side validation errors: file too large, unsupported file type

2. Build `components/dashboard/DocumentUploadSlot.tsx` as a Client Component:
   - Props: `orderId`, `type` (`'passport' | 'proof_of_address' | 'signed_poa'`), `disabled`, `disabledReason` (`'details' | 'poa' | null`), `initialStatus` (`SlotStatus`), `initialFlagReason` (`string | null`)
   - Internal `SlotStatus` union: `'idle' | 'uploading' | 'pending_review' | 'approved' | 'flagged' | 'manual_review'`
   - Hidden `<input type="file">` triggered by the upload button click
   - On file select: validate size and MIME type client-side → call `createUploadSignedUrl` → PUT to signed URL → call `uploadDocument` → set local state to `approved` (signed_poa) or `pending_review` (others)
   - On action error: show inline error message, return to `idle` state
   - Call `router.refresh()` on successful upload

3. Update the dashboard page (`app/[locale]/(dashboard)/dashboard/page.tsx`) to render three `DocumentUploadSlot` components below the personal details section when `order.status === 'documents_pending'`.
   - Pass `detailsSaved` and `poaGeneratedPath` from the existing order data to derive `disabled` and `disabledReason` per slot.
   - `initialStatus` for each slot: `'idle'` for now (Feature 11 will hydrate this from DB document records).

---

## Scope Limits

- Do NOT fetch existing document records from the DB to hydrate slot state — that is Feature 11 (AI review), which will add the document query and map AI review results to slot states.
- Do NOT implement the cross-slot locking on flagged state — requires AI review data from Feature 11.
- Do NOT add any AI review logic or badge animation (Uploading → Reviewing → result) — Feature 11.
- Do NOT trigger order status transition to `documents_under_review` — Feature 11.
- Do NOT build upload slots for any status other than `documents_pending`.

---

## Check When Done

- Three upload slots render on the dashboard when `order.status === 'documents_pending'`.
- Passport and proof of address slots are disabled (visually and functionally) when personal details have not been saved.
- Signed POA slot is disabled until the POA has been generated.
- A user can select a file, and the slot transitions through `uploading` → `pending_review` (passport/proof_of_address) or `uploading` → `approved` (signed_poa).
- Files over 10 MB or with unsupported MIME types are rejected client-side with an inline error before any network call is made.
- A server action error is shown inline without crashing the page.
- All user-facing strings use translation keys — no hardcoded English in JSX.
- `npm run build` passes.
