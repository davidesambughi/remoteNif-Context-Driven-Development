# Quality Audit — RemoteNIF v2

**Date:** 2026-05-21  
**Scope:** Features 01–13b (all completed code)  
**Branch:** `tests-and-quality-checkpoint`  
**Auditor:** Claude Code  

This audit checks the codebase against the rules in `context/code-standards.md` and `context/architecture-context.md`. Every finding is classified as one of:

- 🔴 **Violation** — breaks a hard rule; must be fixed before the feature it blocks is built
- 🟡 **Smell** — degrades maintainability but is not a hard rule break; fix when convenient
- 🟢 **Intentional / Justified** — breaks a rule for a documented reason; accepted as-is

---

## Section 1 — TypeScript: `any` Types

### 1a — `lib/email/send.ts:59` — `let reactElement: any` 🟡

```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let reactElement: any
```

**Why it exists:** `send.ts` is a plain `.ts` file (not `.tsx`). Typing `reactElement` as `React.ReactElement` would require importing React into a non-JSX file and coupling a pure sending module to the UI layer. The eslint-disable comment acknowledges this.

**Assessment:** The trade-off is real and the comment explains it. However, the correct type here is `React.ReactElement` (from `react` package types only — no JSX syntax needed). The import cost is negligible. This could be cleaned up but it is low risk.

**Recommendation:** Replace `any` with `React.ReactElement` — `import type { ReactElement } from 'react'` works in `.ts` files without JSX.

---

### 1b — `lib/env.ts:39` — `as unknown as Env` 🟡

```ts
return process.env as unknown as Env
```

**Why it exists:** The dev fallback path intentionally skips validation so the build passes without all credentials. The double cast is the only way to type-satisfy TypeScript here.

**Assessment:** Justified — this is the dev escape hatch and is scoped behind `NODE_ENV !== 'production'`. The intent is documented with a comment.

---

### 1c — Test files — widespread `as any` usage 🟢

All `as any` occurrences are inside `tests/unit/` and `tests/integration/`. The inline comment in `webhooks.test.ts:51` documents the reasoning: "typing the full Drizzle tx interface adds no value in tests." This is a standard testing pattern.

**Assessment:** Accepted. Test-only `any` is a widely accepted trade-off. No action needed.

---

## Section 2 — Duplicate Types / Interfaces

### 2a — `ActionResult` defined twice 🔴

**File 1:** `lib/types.ts:4`
```ts
export type ActionResult<T = void> =
  | (T extends void ? { success: true } : { success: true; data: T })
  | { success: false; error: string }
```

**File 2:** `app/actions/admin.ts:59`
```ts
export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}
```

These are **semantically different types** with the same name:
- `lib/types.ts` uses a proper discriminated union — `data` is required when `success: true`, impossible when `success: false`.
- `admin.ts` uses a looser interface — all three fields are independently optional, meaning `{ success: true, error: 'oops' }` is valid.

The loose version in `admin.ts` bypasses the discriminated union's key benefit: TypeScript cannot narrow `result.data` after checking `result.success`. Every other action file imports from `lib/types.ts`. This file defines its own and uses neither.

**Impact:** Admin actions return values callers cannot safely narrow. If `adminApproveDocument` is ever called outside an admin component, the result type gives no compile-time safety.

**Fix:** Delete the local `ActionResult` from `admin.ts` and import it from `lib/types.ts`. Return types for admin actions must change from `ActionResult` (the local one) to `ActionResult` (from `lib/types.ts`) — which requires adjusting their signatures to match the discriminated union's constraints.

---

### 2b — `DocumentRecord` interface in `PersonalDetailsForm.tsx:37` 🟡

```tsx
interface DocumentRecord {
  id: string
  type: 'passport' | 'proof_of_address' | 'signed_poa'
  aiReviewStatus: 'pending' | 'clear' | 'flagged' | 'error' | 'manual_review' | null
  aiReviewReason: string | null
  approved: boolean
}
```

This manually replicates a subset of `SelectDocument` (from the Drizzle schema). The comment says: "avoids importing the full DB type into a client component."

**Assessment:** The comment explains the reason — `SelectDocument` includes DB-layer types that can cause serialisation warnings when imported into client components. However, if `SelectDocument` changes (e.g. a new status value is added to the enum), this interface silently goes stale. A better approach would be `Pick<SelectDocument, 'id' | 'type' | 'aiReviewStatus' | 'aiReviewReason' | 'approved'>` — same isolation, zero duplication risk.

**Recommendation:** Replace the hand-written interface with a `Pick<SelectDocument, ...>` — imports only a type (zero runtime cost), avoids drift.

---

### 2c — `SlotStatus` type duplicated in two files 🟡

**File 1:** `components/dashboard/DocumentUploadSlot.tsx:19`
```ts
type SlotStatus = 'idle' | 'uploading' | 'pending_review' | 'approved' | 'flagged' | 'manual_review'
```

**File 2:** `components/dashboard/PersonalDetailsForm.tsx:45`
```ts
type SlotStatus = 'idle' | 'uploading' | 'pending_review' | 'approved' | 'flagged' | 'manual_review'
```

Identical definitions in two files. If a new state is added to `DocumentUploadSlot`, `PersonalDetailsForm` must be updated separately or it silently lags behind.

**Fix:** Export `SlotStatus` from `DocumentUploadSlot.tsx` and import it in `PersonalDetailsForm.tsx`. (This type is already `feature-specs/19` known — it is part of the `useDocumentUpload` refactor item.)

---

### 2d — `AdminOrderFiltersSchema` in `app/[locale]/admin/(panel)/page.tsx` duplicates enum values 🟡

The page defines its own Zod schema for `status` and `tier` values that are already defined as `pgEnum` in `lib/db/schema.ts`. Any new status value added to the DB schema must also be added here manually.

**Fix:** Drive the Zod schema from the DB enum values: `z.enum(orderStatusEnum.enumValues)` — Drizzle exposes `.enumValues` on every `pgEnum`.

---

## Section 3 — Design Tokens / Hardcoded Styles

### 3a — Mixed token syntax in `PersonalDetailsForm.tsx` 🔴

This file uses two different token syntaxes on the same screen:

**Correct (semantic shorthand):**
```tsx
<CardTitle className="text-text-primary">{t('title')}</CardTitle>
<CardDescription className="text-text-secondary">
```

**Incorrect (raw shadcn/Tailwind alias, not our semantic tokens):**
```tsx
<h3 className="text-sm font-semibold text-primary">{t('poa.sectionTitle')}</h3>
<p className="text-sm text-muted mb-4">{t('poa.sectionDescription')}</p>
<p className="text-sm text-muted mb-3 italic">{t('poa.regenerateNote')}</p>
<span className="text-sm text-primary">{t('poa.ready')}</span>
```

`text-primary` resolves to `--color-primary` (which is the **brand blue** via the shadcn mapping `--color-primary: var(--primary)` → `var(--brand-primary)`), not `--text-primary` (which is near-black). Similarly, `text-muted` resolves to `--color-muted` (the subtle blue background), not `--text-muted` (gray).

These classes render the wrong color. The POA section heading and description text will appear blue instead of the intended gray, and the "POA ready" span will appear brand-blue.

**Fix:** Replace:
- `text-primary` → `text-text-primary`
- `text-muted` → `text-text-muted`

Lines affected: `PersonalDetailsForm.tsx:269,271,275,282`.

---

### 3b — `DocumentReviewCard.tsx` uses raw `var()` alongside shorthand tokens inconsistently 🟡

The file mixes three token access patterns on the same component:

```tsx
// Pattern 1 — raw var() (correct but verbose)
className="text-[var(--text-muted)]"

// Pattern 2 — semantic shorthand (correct, preferred)
className="text-brand-primary"
className="bg-success-subtle text-success"

// Pattern 3 — font-mono class (correct, Tailwind resolves via @theme)
<span className="font-mono">{doc.fileName}</span>
```

The raw `var()` calls are valid but they create visual noise and are inconsistent with the rest of the admin panel which uses shorthand. Not a violation — but it makes the file harder to maintain.

**Recommendation:** Unify to shorthand where a shorthand exists. `text-[var(--text-muted)]` → `text-text-muted`, `border-[var(--border-default)]` → `border-border-default`.

---

### 3c — `OrderDetailHeader.tsx` and `DocumentReviewCard.tsx` use hardcoded `text-[10px]` 🟡

```tsx
<span className="... text-[10px] font-bold ...">
<p className="text-[10px] text-[var(--text-muted)]">
```

`10px` is below `--text-xs` (12px), which is the smallest defined token. The `[8px]` in `OrderTimeline.tsx` is the same pattern and has a comment acknowledging it ("no token exists below --text-xs"). The admin files use `[10px]` without comment.

**Assessment:** The token gap is real — badge labels genuinely need something between 8px and 12px. This is a design-system gap, not a bug. The fix is to either add a `--text-2xs: 0.625rem` token to `globals.css` and reference it consistently, or accept `[10px]` as a known exception and document it.

**Recommendation:** Add `--text-2xs: 0.625rem` to `globals.css` and wire it via `@theme`. Then replace all `text-[10px]` with `text-2xs`.

---

### 3d — `OrderDetailHeader.tsx:39` — raw status label bypasses i18n 🟡

```tsx
{order.status.replace(/_/g, ' ')}
```

This converts `documents_under_review` → `"documents under review"` without going through next-intl. The admin order list page and `OrderFilters` both use `t('statuses.documents_under_review')` correctly. This one badge in the order detail header is inconsistent.

Same pattern in `StatusUpdateSection.tsx:70` for the Select option labels.

**Fix:** Use the same `statusLabels` map pattern that already exists in the order list page.

---

### 3e — `DocumentReviewCard.tsx:59,94` — raw AI status label bypasses i18n 🟡

```tsx
{doc.aiReviewStatus?.replace(/_/g, ' ') || 'Pending'}
{doc.aiReviewStatus?.toUpperCase() || 'PENDING'}
```

These two renders produce different text formats for the same field on the same component (one titlecase, one uppercase). Both bypass i18n.

---

### 3f — `DocumentReviewCard.tsx:129` — partial UUID and unformatted date exposed to admin UI 🟡

```tsx
By {doc.adminOverrideBy?.split('-')[0]} on {doc.adminOverrideAt?.toLocaleDateString()}
```

`split('-')[0]` shows the first segment of a UUID as an admin identifier. This is not a user-facing bug (admins understand it) but it is fragile. If the admin system ever uses non-UUID IDs this breaks. The override-by field should show a human name, not a UUID fragment. (No i18n issue here since it's admin-only, but worth noting for Feature 14+.)

---

## Section 4 — Architecture / System Boundaries

### 4a — `app/actions/checkout.ts:57` — locale-unaware success and cancel URLs 🔴

```ts
success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
cancel_url: `${env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
```

Both URLs are locale-unaware — `/dashboard` and `/pricing` are not valid routes. The actual routes are `/en/dashboard`, `/fr/dashboard`, etc. (the `[locale]` prefix is required by the App Router structure with `as-needed` prefix strategy).

The `proxy.ts` will handle the redirect for `/dashboard` → `/en/dashboard` in many cases, but this depends on browser language detection at redirect time, which may not match the user's selected language. A German user who chose DE during signup may land on the EN dashboard after payment.

**Fix:** The `createCheckoutSession` action should accept the current locale as a parameter (passed from the `CheckoutButton` client component, which has access to `useLocale()`) and inject it into both URLs.

---

### 4b — `app/actions/admin.ts` — `throw new Error` not caught in one path 🟡

All five admin actions wrap their body in `try/catch` and return `{ success: false, error }`. However, `adminFlagDocument` calls `FlagDocumentSchema.parse()` (throwing Zod validation), which IS caught. But `adminApproveOrder` calls `getAdminOrderDetail` which itself can `throw new Error('Order not found or ownership check failed')` from `updateOrderPersonalDetails` — a different query function — not applicable here.

More relevant: the `requireRole('admin')` call in `OrderDetailPage` uses `.catch(() => redirect(...))` — this is a valid pattern for route-level auth. No violation.

---

### 4c — `DocumentReviewCard.tsx` is an async Server Component that calls Supabase Storage directly 🟡

```tsx
const supabase = await createClient()
const { data } = await supabase.storage.from('documents').createSignedUrl(doc.filePath, 3600)
```

This is technically fine — the architecture allows Server Components to call Supabase directly for reads (only mutations must go through Server Actions). However, this means the signed URL generation lives inside a UI component, not in a query function in `lib/db/` or a utility in `lib/supabase/`.

**Assessment:** Minor boundary fuzzing. Not a hard invariant violation (invariant 1 covers mutations only). The signed URL generation is a read operation. Consider extracting to a utility function `lib/supabase/documents.ts → getSignedDocumentUrl(filePath)` so the component is not coupled to the Storage client shape.

---

### 4d — Admin action responses not narrowing safely — consequence of finding 2a 🔴

Because `admin.ts` defines its own loose `ActionResult<T>` (finding 2a), components calling admin actions cannot safely narrow the result:

```tsx
// In ApproveOrderSection.tsx
const result = await adminApproveOrder(orderId)
if (result.success) {
  // result.data is available but TypeScript cannot guarantee it
  // result.error is also technically available here (loose interface)
}
```

With the discriminated union from `lib/types.ts`, TypeScript narrows `error` away on the `success: true` branch. With the loose interface, both `data?` and `error?` are always potentially present.

---

## Section 5 — Single Responsibility

### 5a — `PersonalDetailsForm.tsx` — form + upload + POA generation in one component 🟡

The component renders:
1. A personal details form (react-hook-form)
2. A POA generation control with its own state (`poaUrl`, `isGenerating`, `poaError`, `hadPoaBefore`)
3. Three `DocumentUploadSlot` instances with cross-slot locking logic

This is a `528-line` client component managing 9 distinct state variables. The upload slots have their own 339-line component, but the form contains the upload orchestration + POA UI as well.

**Known / Planned:** This matches what `feature-spec/19` already notes — the `useDocumentUpload` hook extraction is a planned structural refactor. No surprise here, but the size is confirmed.

**Assessment:** Not blocking. Accepted as a known debt item in Feature 19.

---

### 5b — `app/[locale]/admin/(panel)/page.tsx` — inline `TierBadge` and `StatusBadge` sub-components 🟢

```tsx
function TierBadge({ tier, label }: { tier: string; label: string }) { ... }
function StatusBadge({ status, label }: { status: SelectOrder['status']; label: string }) { ... }
```

Inline sub-components with a comment: "inline since they're only used here." The code-standards rule is "extract a component if the same pattern appears in 3+ places." Both badges currently appear only in this one page.

**Assessment:** Justified. The comment is honest and correct. If these badges appear in the operator queue (Feature 14), extract then.

---

### 5c — `app/actions/admin.ts` — `statusOrder` array hardcoded in the action 🟡

```ts
const statusOrder = [
  'documents_pending',
  'documents_under_review',
  'documents_approved',
  'submitted',
  'delivered',
]
```

This array is also present in `StatusUpdateSection.tsx:18-24` (identical) and implicitly in `OrderFilters.tsx` and the admin list page. The canonical sequence is defined in `user-flows.md` and the DB schema enum. Having it scattered across three files means any future status change requires edits in multiple places.

**Fix:** Export a `ORDER_STATUS_SEQUENCE` constant from `lib/pricing.ts` (or a new `lib/constants.ts`) and import it everywhere. This is a two-line change with zero logic changes.

---

## Section 6 — Other Rules

### 6a — `lib/email/send.ts` — `'use server'` directive on an email-sending helper 🟡

```ts
'use server'
```

`send.ts` is a utility module, not a Server Action. The `'use server'` directive makes sense only on files that expose individual exported functions as callable Server Actions from the client. `sendEmail` is an internal helper called by Server Actions — it is never called from client components directly.

Having `'use server'` on this module is harmless (the function only runs server-side regardless) but architecturally misleading. It implies the module participates in the Server Action boundary, which it does not.

**Assessment:** Low risk but worth removing. Remove `'use server'` from `send.ts` — it is not a Server Action, it is a server-side utility.

---

### 6b — `app/actions/admin.ts:232` — empty TODO block in production code 🟡

```ts
if (validated.note) {
  // TODO: implement status_update_with_note template in Feature 12b
}
```

This block accepts a `note` parameter, validates it, logs it to the audit log, but then does nothing with it for the customer. A note passed by the admin is silently dropped. The customer never receives it.

**Assessment:** This is a planned feature stub (Feature 12b), documented in the feature list. It is not a bug for the current scope, but it is a silent no-op that could confuse an admin who writes a note expecting the customer to see it. Should be clearly tracked.

---

### 6c — `app/actions/checkout.ts:66` — `throw new Error` inside a `try` block that catches all errors 🟡

```ts
try {
  const session = await stripe.checkout.sessions.create({ ... })
  if (!session.url) {
    throw new Error('No session URL returned from Stripe')  // caught 3 lines below
  }
  return { success: true, data: { url: session.url } }
} catch {
  return { success: false, error: 'checkout.errors.generic' }
}
```

The throw is caught by the surrounding `catch` and converted to a generic error. The throw is effectively a `return { success: false }` but with extra steps. This is not wrong, but it is misleading — it looks like an escalating error when it is actually a controlled early exit. Replacing the throw with an early `return` makes the intent clearer.

---

### 6d — Stripe webhook handler and `adminApproveOrder` both send operator notification emails — different templates 🟢

The webhook fires `order_confirmation` to the customer. The admin `approveOrder` action fires `operator_submission_ready` to operators and `documents_approved_customer` to the customer. These are distinct events with distinct templates. No duplication.

---

### 6e — `SlaCountdown.tsx` — status badge colors defined both here and in `OrderDetailHeader.tsx` 🟡

Both the `SlaCountdown` (via `formatCountdown`) and `OrderDetailHeader` define their own color-coding for urgency states:

- `SlaCountdown`: `text-success`, `text-warning`, `text-error`
- `OrderDetailHeader`: separate `statusColors` and `tierColors` maps

These are different concepts (SLA time remaining vs order status label) so the color maps are not the same — but both components express urgency via the same three semantic colors. No duplication issue per se; just a note that the SLA visual language should remain consistent across queue and detail views when the operator panel (Feature 14) is built.

---

## Summary Table

| # | File | Rule | Severity | Action |
|---|------|------|----------|--------|
| 2a | `app/actions/admin.ts:59` | Duplicate `ActionResult` type (different semantics) | 🔴 | Delete local def, import from `lib/types.ts` |
| 4a | `app/actions/checkout.ts:57–58` | Locale-unaware Stripe redirect URLs | 🔴 | Pass locale into action, inject into URLs |
| 3a | `components/dashboard/PersonalDetailsForm.tsx:269,271,275,282` | `text-primary`/`text-muted` resolve to wrong token (brand blue/subtle blue, not text colors) | 🔴 | Replace with `text-text-primary` / `text-text-muted` |
| 1a | `lib/email/send.ts:59` | `any` type for React element | 🟡 | Replace with `import type { ReactElement } from 'react'` |
| 2b | `components/dashboard/PersonalDetailsForm.tsx:37` | Manual `DocumentRecord` interface duplicates `SelectDocument` | 🟡 | Replace with `Pick<SelectDocument, ...>` |
| 2c | `DocumentUploadSlot.tsx:19` + `PersonalDetailsForm.tsx:45` | `SlotStatus` type duplicated | 🟡 | Export from one file, import in the other |
| 2d | `app/[locale]/admin/(panel)/page.tsx:10` | Filter schema duplicates DB enum values | 🟡 | Use `orderStatusEnum.enumValues` |
| 3b | `components/admin/DocumentReviewCard.tsx` | Mixed token syntax (raw var vs shorthand) | 🟡 | Unify to shorthand |
| 3c | `components/admin/DocumentReviewCard.tsx`, `OrderDetailHeader.tsx` | `text-[10px]` below smallest token | 🟡 | Add `--text-2xs` token or document exception |
| 3d | `components/admin/OrderDetailHeader.tsx:39`, `StatusUpdateSection.tsx:70` | Status labels bypass i18n (`.replace(/_/g, ' ')`) | 🟡 | Use `t('statuses.*')` map |
| 3e | `components/admin/DocumentReviewCard.tsx:59,94` | AI status label bypasses i18n, inconsistent casing | 🟡 | Add to translation map |
| 3f | `components/admin/DocumentReviewCard.tsx:129` | UUID fragment used as admin name | 🟡 | Cosmetic — note for Feature 14+ |
| 4c | `components/admin/DocumentReviewCard.tsx` | Supabase Storage call inside UI component | 🟡 | Extract to `lib/supabase/` utility |
| 5c | `app/actions/admin.ts:205` + `StatusUpdateSection.tsx:18` | `statusOrder` array duplicated | 🟡 | Extract to shared constant |
| 6a | `lib/email/send.ts:1` | `'use server'` on a utility module (not a Server Action) | 🟡 | Remove the directive |
| 6b | `app/actions/admin.ts:232` | Empty TODO block — note param silently dropped | 🟡 | Document clearly; add a visible no-op message or stub return |
| 6c | `app/actions/checkout.ts:66` | `throw` caught immediately by its own wrapper | 🟡 | Replace throw with early `return` |
| 1b | `lib/env.ts:39` | `as unknown as Env` dev escape hatch | 🟢 | Accepted |
| 1c | `tests/**` | `as any` in test mocks | 🟢 | Accepted |
| 5a | `PersonalDetailsForm.tsx` | 528-line multi-responsibility client component | 🟢 | Tracked in Feature 19 |
| 5b | `admin/(panel)/page.tsx` | Inline badge sub-components | 🟢 | Justified (single use) |
| 6d | Webhook vs admin action email sends | Different events, different templates | 🟢 | No duplication |

---

## Recommended Fix Order

Fix the three 🔴 items before Feature 14a begins — they affect live paths:

1. **2a** (duplicate `ActionResult`) — affects all admin action consumers
2. **3a** (`text-primary`/`text-muted` in `PersonalDetailsForm`) — renders wrong colors right now
3. **4a** (checkout locale URLs) — can strand users on wrong locale after payment

The 🟡 items are grouped by effort:

- **Low effort (1–5 min each):** 1a, 6a, 6c, 3d, 3e, 2d
- **Medium effort (15–30 min each):** 2b, 2c, 5c, 3b, 4c
- **Tracker only (no code change needed now):** 3c, 3f, 6b
