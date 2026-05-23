# 19d — Admin Storage Utility, Text-2xs Token & Audit Annotations

<!-- Read before starting: context/AGENTS.md, context/progress-tracker.md, context/ui-context.md, context/architecture-context.md, context/code-standards.md -->

Fix four remaining quality-audit findings: extract the Supabase Storage signed-URL call out of a UI component into a shared utility, add a missing micro-text design token and replace its hardcoded usages, and annotate two silent code gaps with explicit comments so their behavior is no longer ambiguous.

---

## Constraints

### Tokens

| Purpose | Token | CSS custom property | Tailwind utility |
|---------|-------|--------------------|-----------------:|
| New: sub-xs badge / caption text | `--text-2xs` | `var(--text-2xs)` | `text-2xs` |
| (Reference only — all other tokens already exist) | | | |

Rules that always apply to UI work in this project:
- No raw Tailwind color classes (`zinc-*`, `slate-*`, `blue-*`). Tokens only.
- No hardcoded px values in className — use token utilities. The only exception already in the codebase is `text-[8px]` in `OrderTimeline.tsx`, which has a comment; do not touch it.
- Mobile-first. Add breakpoint variants only where layout actually changes.
- Border radius from scale: `--radius-sm` / `md` / `lg` / `xl` / `2xl` / `full`.

### Architecture

- New utility file: `lib/supabase/documents.ts` — server-side, no `'use client'`. Exports a single async function `getSignedDocumentUrl`. This is a **read** operation; it does not go through a Server Action.
- `DocumentReviewCard.tsx` is a Server Component — it already does async work. After the refactor it imports `getSignedDocumentUrl` from `@/lib/supabase/documents` instead of calling Supabase directly. The component itself does not change shape.
- `app/actions/admin.ts` — the `if (validated.note)` block receives a comment, not a logic change. `'use server'` stays. No Server Action signature changes.
- `globals.css` — two separate additions: one in the `:root {}` block (the CSS custom property), one in the `@theme inline {}` block (the Tailwind utility mapping). Follow the exact pattern already in the file.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- `getSignedDocumentUrl` signature: `async function getSignedDocumentUrl(filePath: string): Promise<string | null>` — returns `null` on error, the signed URL string on success. The function handles its own error internally (no throws to callers).
- The 60-minute expiry (3600 seconds) currently hardcoded in `DocumentReviewCard.tsx` becomes the default parameter or a constant inside `lib/supabase/documents.ts`. Do not expose it as a parameter — callers always want 60 minutes for admin document viewing.

### Validation

No Zod schema changes.

### i18n

No translation changes.

---

## Design

**Token addition only — no visual change.**

`text-[10px]` currently renders at 10px across all admin badge labels. The new `text-2xs` utility resolves to the same 10px via `--text-2xs: 0.625rem`. The rendered output is pixel-identical; the only change is that the value is now named and centrally defined.

No layout, color, or spacing changes in this unit.

---

## Implementation

Work through each finding in order. They are independent — no cross-finding dependencies.

---

### Finding 4c — Extract Supabase Storage signed URL into a utility

**Current state:** `components/admin/DocumentReviewCard.tsx` imports `createClient` from `@/lib/supabase/server` and calls `supabase.storage.from('documents').createSignedUrl(doc.filePath, 3600)` directly inside the component body.

**Target state:** The component imports and calls `getSignedDocumentUrl(filePath)` from a new utility. The component body no longer references Supabase or its storage API.

1. **Create `lib/supabase/documents.ts`.**

   ```typescript
   import { createClient } from '@/lib/supabase/server'

   // 60-minute expiry for admin document viewing sessions
   const SIGNED_URL_EXPIRY_SECONDS = 3600

   /**
    * Generates a short-lived signed URL for a document stored in Supabase Storage.
    * Returns null if the file does not exist or an error occurs — callers should
    * handle null by rendering a disabled/unavailable state rather than throwing.
    */
   export async function getSignedDocumentUrl(filePath: string): Promise<string | null> {
     const supabase = await createClient()
     const { data, error } = await supabase.storage
       .from('documents')
       .createSignedUrl(filePath, SIGNED_URL_EXPIRY_SECONDS)
     if (error || !data?.signedUrl) return null
     return data.signedUrl
   }
   ```

2. **Update `components/admin/DocumentReviewCard.tsx`.**

   - Remove `import { createClient } from '@/lib/supabase/server'`.
   - Add `import { getSignedDocumentUrl } from '@/lib/supabase/documents'`.
   - Replace the `createClient` call and the `supabase.storage...createSignedUrl` call with `const signedUrl = await getSignedDocumentUrl(doc.filePath)`.
   - The rest of the component is unchanged — `signedUrl` is still used in the same places.

---

### Finding 3c — Add `--text-2xs` design token and replace `text-[10px]` usages

**Step 1 — Add token to `app/globals.css`.**

In the `:root {}` block, directly after the `--text-xs` line, add:
```css
--text-2xs: 0.625rem;
/* 10px — admin badge labels and micro-captions; below the standard token floor */
```

In the `@theme inline {}` block, directly after the existing font-family entries (or in a logical position among any size mappings), add:
```css
/* text-2xs utility — generates the text-2xs Tailwind class */
--font-size-2xs: var(--text-2xs);
```

**Step 2 — Update `ui-context.md`.**

In the Type Scale table, add a row above `--text-xs`:

| Token | Size | Usage |
|-------|------|-------|
| `--text-2xs` | 0.625rem (10px) | Admin badge labels, micro-captions — below the standard floor |

**Step 3 — Replace all `text-[10px]` occurrences with `text-2xs`.**

Files affected (confirmed via grep — do not touch `text-[8px]` in `OrderTimeline.tsx`):

- `components/admin/DocumentReviewCard.tsx` — 5 occurrences
- `components/admin/OrderDetailHeader.tsx` — 2 occurrences
- `components/admin/ApproveOrderSection.tsx` — 2 occurrences
- `components/admin/DocumentOverrideButtons.tsx` — 2 occurrences
- `components/admin/StatusUpdateSection.tsx` — 1 occurrence

Replace every `text-[10px]` with `text-2xs` in all five files. Do not change any other part of those class strings.

---

### Finding 3f — Document UUID fragment in `DocumentReviewCard.tsx` as an accepted limitation

**File:** `components/admin/DocumentReviewCard.tsx` — the line rendering the admin override attribution.

Current code (approximately):
```tsx
By {doc.adminOverrideBy?.split('-')[0]} on {doc.adminOverrideAt?.toLocaleDateString()}
```

**Change:** Add a comment on the line above explaining the limitation. Do not change the rendering logic.

```tsx
{/* KNOWN LIMITATION: adminOverrideBy is a User.id UUID. Showing the first UUID segment
    is a cosmetic workaround — admins can identify themselves from the timestamp context.
    A proper fix requires joining to the users table in getAdminOrderDetail to fetch
    the admin's email or display name. Deferred — acceptable for internal-only admin UI. */}
By {doc.adminOverrideBy?.split('-')[0]} on {doc.adminOverrideAt?.toLocaleDateString()}
```

No logic or visual change.

---

### Finding 6b — Make the silent `note` drop in `adminUpdateOrderStatus` explicit

**File:** `app/actions/admin.ts` — inside `adminUpdateOrderStatus`.

Current code (approximately):
```typescript
if (validated.note) {
  // TODO: implement status_update_with_note template in Feature 12b
}
```

**Change:** Replace the vague TODO with a clear behavioral comment. The note IS already saved to the audit log (in the `db.insert(auditLog)` call below). What is missing is the customer-facing email.

```typescript
if (validated.note) {
  // NOTE: The note is saved to the audit log below but is NOT emailed to the customer.
  // Until a status_update_with_note email template is implemented, admins who write a
  // note expecting the customer to see it must contact them manually via support email.
  // When implementing: send a transactional email here using sendEmail() with the note
  // content and the new status label in the customer's language preference.
}
```

No logic change — the `if` block remains empty of executable code. The audit log insert below it is unchanged.

---

### Final step — Update progress tracker

After all four findings are applied and `npm run build` passes:

1. Update `context/progress-tracker.md` — mark 19d complete in the Completed section.
2. Note that findings 4c, 3c, 3f, 6b from the quality audit are now resolved.
3. Record that `--text-2xs` was added to the design token scale and `ui-context.md` was updated.

---

## Dependencies

No new packages.

---

## Scope Limits

- Do not refactor `DocumentReviewCard.tsx` beyond extracting the signed-URL call. The component structure, props, and rendering logic are unchanged.
- Do not add `text-[8px]` to the token scale — that value in `OrderTimeline.tsx` already has a comment; it is a single intentional exception and does not warrant a token.
- Do not change any logic in `adminUpdateOrderStatus` — the note handling comment is documentation only; the audit log insert is untouched.
- Do not implement the `status_update_with_note` email template — that is a future feature, explicitly out of scope here.
- Do not change the UUID fragment rendering in `DocumentReviewCard.tsx` — the fix is the comment, not a logic change.
- Do not add tests — no logic changes in this unit. The 423 existing tests cover all affected modules.
- Do not touch any operator, customer dashboard, or auth components — this unit is admin-panel and shared-lib only (plus `globals.css` and `ui-context.md`).

---

## Check When Done

- `lib/supabase/documents.ts` exists and exports `getSignedDocumentUrl(filePath: string): Promise<string | null>`.
- `components/admin/DocumentReviewCard.tsx` does not import `createClient` from Supabase. It imports and calls `getSignedDocumentUrl` instead.
- `app/globals.css` — `:root {}` contains `--text-2xs: 0.625rem;` and `@theme inline {}` contains `--font-size-2xs: var(--text-2xs);`.
- `context/ui-context.md` Type Scale table includes a `--text-2xs` row.
- No `text-[10px]` remains in any file under `components/admin/`. (`grep -r "text-\[10px\]" components/admin/` returns no results.)
- `text-[8px]` in `OrderTimeline.tsx` is untouched.
- `components/admin/DocumentReviewCard.tsx` has a `KNOWN LIMITATION` comment above the `adminOverrideBy?.split('-')[0]` render — no logic change.
- `app/actions/admin.ts` — the `if (validated.note) {}` block contains the `NOTE:` comment explaining the behavioral gap — no logic change, no empty TODO remains.
- `npm run build` passes.
- `npx vitest run` passes (423 tests).
