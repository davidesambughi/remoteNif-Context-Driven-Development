# 19c — Code Quality: Remaining Yellow Smell Fixes

<!-- Read before starting: context/AGENTS.md, context/progress-tracker.md, context/architecture-context.md, context/code-standards.md -->

Fix six yellow-smell findings from the quality audit (`context/quality-audit.md`) that have not yet been addressed. No user-facing changes — this is a pure code quality pass.

---

## Constraints

### Tokens

Not applicable — no UI changes in this unit.

### Architecture

- `lib/email/send.ts` is a server-side utility module, not a Server Action. It is called by Server Actions, not by client components.
- All type fixes use TypeScript's type-only import syntax (`import type { ... }`). No new runtime dependencies.
- `SlotStatus` is currently defined identically in two files. After this fix it is defined once in `DocumentUploadSlot.tsx` and imported in `PersonalDetailsForm.tsx`. The type shape must not change — only the ownership of the definition moves.
- `DocumentRecord` in `PersonalDetailsForm.tsx` is a hand-written interface. Replace it with `Pick<SelectDocument, ...>` — a type-only change. The field names and types must remain identical after the change.
- All admin-panel i18n keys live under `admin.*` namespaces in the locale files. The status label keys (`admin.statuses.*`) already exist — confirm before adding duplicates.
- `app/actions/checkout.ts` is a Server Action file — keep `'use server'` at the top; only the logic inside `createCheckoutSession` changes.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- `import type { ReactElement } from 'react'` is valid in a `.ts` file — no JSX syntax required.
- `Pick<SelectDocument, 'id' | 'type' | 'aiReviewStatus' | 'aiReviewReason' | 'approved'>` is the exact replacement for the `DocumentRecord` interface — verify current field names against `lib/db/schema.ts` before applying.
- Exporting `SlotStatus` from `DocumentUploadSlot.tsx`: change `type SlotStatus = ...` to `export type SlotStatus = ...`. In `PersonalDetailsForm.tsx`: add `import type { SlotStatus } from './DocumentUploadSlot'` and delete the local definition.

### Validation

No Zod schema changes in this unit.

### i18n

- Audit finding 3d affects `OrderDetailHeader.tsx` and `StatusUpdateSection.tsx`. Both call `.replace(/_/g, ' ')` on an order status string instead of using `t('statuses.*')`.
- The `admin.statuses.*` translation keys already exist in all 4 locale files (added during Feature 13a). Verify the exact key path before patching the components.
- No new translation keys are added in this unit.

---

## Implementation

Work through each finding independently. They are listed in audit order, not dependency order — all six are safe to implement in any sequence.

### Finding 1a — `any` type in `lib/email/send.ts`

**File:** `lib/email/send.ts`

1. Add `import type { ReactElement } from 'react'` at the top of the file (type-only import, no runtime cost).
2. Replace `let reactElement: any` with `let reactElement: ReactElement`.
3. Remove the `// eslint-disable-next-line @typescript-eslint/no-explicit-any` comment above it — it is no longer needed.
4. Verify TypeScript still compiles (`npm run build` or `tsc --noEmit`).

---

### Finding 6a — `'use server'` on a utility module in `lib/email/send.ts`

**File:** `lib/email/send.ts`

1. Delete the `'use server'` directive at the top of the file.
2. `send.ts` is called from Server Actions and API routes — it is a server-side utility, not itself a Server Action. The directive was architecturally misleading and is not required for server-only execution.
3. Confirm nothing imports `sendEmail` from a client component — it must not. A quick `grep` for `from.*send` in `components/` and `app/[locale]/` should confirm.

> Note: Findings 1a and 6a are both in `send.ts` — make both changes in a single edit.

---

### Finding 6c — `throw` immediately caught by its own wrapper in `app/actions/checkout.ts`

**File:** `app/actions/checkout.ts` — inside `createCheckoutSession`

Current pattern:
```typescript
try {
  const session = await stripe.checkout.sessions.create({ ... })
  if (!session.url) {
    throw new Error('No session URL returned from Stripe')
  }
  return { success: true, data: { url: session.url } }
} catch {
  return { success: false, error: 'checkout.errors.generic' }
}
```

Replace with an early return:
```typescript
try {
  const session = await stripe.checkout.sessions.create({ ... })
  // Guard: Stripe always returns a URL for hosted checkout; if missing, treat as failure
  if (!session.url) {
    return { success: false, error: 'checkout.errors.generic' }
  }
  return { success: true, data: { url: session.url } }
} catch {
  return { success: false, error: 'checkout.errors.generic' }
}
```

No behaviour change — both paths return the same `{ success: false }` result. This makes the intent clearer: the `if (!session.url)` block is a controlled guard, not an escalating error.

---

### Finding 3d — Status labels bypass i18n in two admin components

**Files:** `components/admin/OrderDetailHeader.tsx`, `components/admin/StatusUpdateSection.tsx`

Before touching either file, confirm the exact translation key path for order statuses:

1. Open `messages/en.json` and find the `admin.statuses` key (or equivalent). Note the exact namespace path and key names (e.g. `admin.statuses.documents_under_review`, etc.). If the keys live under a different path, use that exact path throughout.

2. **`OrderDetailHeader.tsx`** — find the line using `.replace(/_/g, ' ')` on `order.status`. Replace it with `t('statuses.<status_value>')` using the pattern already in use on the admin order list page. The component is a Server Component — `getTranslations` or `useTranslations` is already available; extend the existing `t` call.

3. **`StatusUpdateSection.tsx`** — find the Select option labels that use `.replace(/_/g, ' ')`. Replace each option's display text with the same `t('statuses.*')` map. The component already imports translations; add the status key lookups.

4. Verify that all five status values have entries in all 4 locale files before completing.

---

### Finding 2b — `DocumentRecord` hand-written interface in `PersonalDetailsForm.tsx`

**File:** `components/dashboard/PersonalDetailsForm.tsx`

1. Open `lib/db/schema.ts` and confirm the exact field names currently on `SelectDocument` for: `id`, `type`, `aiReviewStatus`, `aiReviewReason`, `approved`. (Field names may use camelCase in the Drizzle inferred type even if the DB column uses snake_case — verify the inferred name.)
2. Add `import type { SelectDocument } from '@/lib/db/schema'` to the imports (type-only — no runtime cost, no serialisation issue because this is a type import only).
3. Replace the hand-written `interface DocumentRecord { ... }` with:
   ```typescript
   type DocumentRecord = Pick<SelectDocument, 'id' | 'type' | 'aiReviewStatus' | 'aiReviewReason' | 'approved'>
   ```
4. Confirm the component still compiles and the props that use `DocumentRecord` are still satisfied.

---

### Finding 2c — `SlotStatus` type duplicated across two files

**Files:** `components/dashboard/DocumentUploadSlot.tsx`, `components/dashboard/PersonalDetailsForm.tsx`

1. In `DocumentUploadSlot.tsx`, change `type SlotStatus = ...` to `export type SlotStatus = ...` (add `export` only — do not modify the type definition itself).
2. In `PersonalDetailsForm.tsx`:
   - Add `import type { SlotStatus } from './DocumentUploadSlot'` (or the correct relative path).
   - Delete the local `type SlotStatus = ...` definition entirely.
3. Confirm the type shape in both files was identical before the change (they should be — the quality audit confirmed this). If they differ, surface the discrepancy as an open question in `progress-tracker.md` before proceeding.
4. Verify the component compiles.

---

### Final step — Update progress tracker

After all six fixes are applied and `npm run build` passes:

1. Update `context/progress-tracker.md` — mark 19c complete in the Completed section.
2. Note that 4 yellow smells are now resolved: 1a, 6a, 6c, 3d, 2b, 2c (quality audit IDs).

---

## Dependencies

No new packages.

---

## Scope Limits

- Do not refactor `PersonalDetailsForm.tsx` into smaller components — that is Finding 5a, deferred to a future feature.
- Do not extract the Supabase Storage signed-URL call from `DocumentReviewCard.tsx` — that is Finding 4c, also deferred.
- Do not add `--text-2xs` token or fix `text-[10px]` occurrences — Finding 3c is tracker-only (no code change).
- Do not fix Finding 3f (UUID fragment as admin identifier) or Finding 6b (empty TODO block) — both are tracker-only.
- Do not change any Zod schemas, Server Action signatures, or database queries.
- Do not add or update any i18n keys — this unit only wires up existing keys that are already in all 4 locale files.
- Do not add new tests — these are type and code structure fixes with no logic changes. Existing 423 tests fully cover the affected modules.
- Keep each fix isolated to its named file(s). Do not touch adjacent files.

---

## Check When Done

- `lib/email/send.ts` has no `'use server'` directive at the top.
- `lib/email/send.ts` declares `reactElement` as `ReactElement` (imported from `'react'`) — no `any`, no eslint-disable comment.
- `app/actions/checkout.ts` — `if (!session.url)` block uses an early `return { success: false, ... }` instead of `throw new Error(...)`. No behaviour change.
- `components/admin/OrderDetailHeader.tsx` — no `.replace(/_/g, ' ')` on any status value; uses `t('statuses.*')` instead.
- `components/admin/StatusUpdateSection.tsx` — no `.replace(/_/g, ' ')` on any status value; uses `t('statuses.*')` instead.
- `components/dashboard/PersonalDetailsForm.tsx` — no hand-written `interface DocumentRecord`; uses `Pick<SelectDocument, ...>` type alias instead. `SelectDocument` is imported as a type.
- `components/dashboard/DocumentUploadSlot.tsx` — `SlotStatus` is exported.
- `components/dashboard/PersonalDetailsForm.tsx` — `SlotStatus` is imported from `DocumentUploadSlot`; no local definition remains.
- `npx tsc --noEmit` reports no new errors (run before and after to confirm).
- `npm run build` passes.
- `npx vitest run` passes (423 tests — this feature adds no new tests).
