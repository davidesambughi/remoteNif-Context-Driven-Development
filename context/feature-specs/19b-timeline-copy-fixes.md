# 19b — Dashboard Timeline & Copy Fixes

<!-- Read before starting: context/AGENTS.md, context/progress-tracker.md, context/ui-context.md, context/architecture-context.md -->

Insert a permanent "Payment received" first step into the order timeline, and remove the 4-hour SLA promise from the manual review copy.

---

## Constraints

### Tokens (UI features only)

| Purpose | Token | Tailwind utility |
|---------|-------|-----------------|
| Completed step circle fill | `var(--success)` | `bg-success` |
| Completed step text | `var(--success)` | `text-success` |
| Current step border | `var(--brand-primary)` | `border-brand-primary` |
| Current step dot | `var(--brand-primary)` | `bg-brand-primary` |
| Inactive step border | `var(--border-subtle)` | `border-border-subtle` |
| Inactive step dot | `var(--border-subtle)` | `bg-border-subtle` |
| Base background | `var(--bg-base)` | `bg-[var(--bg-base)]` |
| Text on accent | `var(--on-accent)` | `text-on-accent` |
| Muted text | `var(--text-muted)` | `text-text-muted` |
| Progress line (inactive) | `var(--border-subtle)` | `bg-border-subtle` |
| Progress line (active) | `var(--success)` | `bg-success` |

Rules that always apply to UI work in this project:
- No raw Tailwind color classes (`zinc-*`, `slate-*`, `blue-*`). Tokens only.
- No hardcoded hex or rgb values.
- Mobile-first. Add breakpoint variants only where layout actually changes.
- Border radius from scale: `--radius-sm` / `md` / `lg` / `xl` / `2xl` / `full`.
- Shadows from scale: `--shadow-sm` / `md` / `lg` / `xl`.
- Shadcn components when possible.

### Architecture

- `OrderTimeline` is a **Server Component** (`async function`) — do not add `'use client'`.
- `getTranslations('dashboard')` is already the translation namespace in use — all new keys go under `dashboard.*`.
- The `steps` array is defined at module level as a `const` with `as const` — extend it in place.
- The progress-line width calculation (`currentStepIndex / (steps.length - 1)`) must stay correct after adding the new step.
- i18n: keys go in `messages/en.json` under the `dashboard.timeline` namespace; placeholder English values in `fr.json`, `es.json`, `de.json`.
- Copy-only change to `documents.states.manualReview` — same key, different value. No JSX changes needed.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- The `steps` array uses `as const` — the new step must follow the same shape: `{ id: string, labelKey: string }`.
- The `id` field on the payment step is a literal string constant used only for keying — it does not map to a `SelectOrder['status']` value (payment is a synthetic step, always completed).

### i18n

- All user-facing strings go in `messages/en.json` under the relevant existing namespace.
- New key: `dashboard.timeline.payment` — label for the new payment step.
- Updated key: `documents.states.manualReview` — new value, no new key needed.
- Add the same keys/values (English placeholder) to `fr.json`, `es.json`, `de.json`.
- No hardcoded English strings in JSX.

---

## Design

The timeline currently has 5 steps. After this change it has 6. The "Payment received" step is always in `completed` state — it never shows as current or inactive, because by the time any user reaches the dashboard, payment has already been processed by Stripe.

Visual behavior:
- Step 0 (Payment received): always renders with `isCompleted = true`, `isCurrent = false`.
- The progress line starting point stays at `left-0` — it grows from Payment to the right as order status advances.
- Label: short, uppercase, fits mobile. Suggested: **"Payment"** (matches the brevity of "Upload", "Review", etc.).
- No new visual states, icons, or styling variants needed — re-use the existing `isCompleted` rendering exactly.

The 4-hour manual review copy is a document slot state label — no UI change, text value only.

---

## Implementation

1. **Add `dashboard.timeline.payment` key to all 4 locale files.**

   In `messages/en.json`, inside `dashboard.timeline`:
   ```json
   "payment": "Payment"
   ```
   Add the same key with the same English value to `messages/fr.json`, `messages/es.json`, `messages/de.json`.

2. **Update `documents.states.manualReview` in all 4 locale files.**

   New value (all 4 locales, English placeholder for non-English):
   ```
   "Our team has been notified and will review your document manually."
   ```
   Old value being replaced: `"Our team will review your document within 4 hours"`

3. **Prepend the payment step to the `steps` array in `components/dashboard/OrderTimeline.tsx`.**

   New step (insert at index 0, before `documents_pending`):
   ```typescript
   { id: 'payment_received', labelKey: 'timeline.payment' },
   ```

4. **Update the `isCompleted` and `isCurrent` logic to make the payment step always completed.**

   The payment step has `id: 'payment_received'`, which is not a value of `SelectOrder['status']`. This means `currentStepIndex` will never equal 0 for a real order, and `steps.findIndex` will always return ≥ 1 (matching a real status) or -1 (unknown status).

   The current logic:
   ```typescript
   const isCompleted = index < currentStepIndex || status === 'delivered'
   const isCurrent = index === currentStepIndex && status !== 'delivered'
   ```

   After inserting the payment step at index 0, `currentStepIndex` for a `documents_pending` order will be 1 (not 0). So `index < currentStepIndex` will be `0 < 1 = true` for the payment step — it will naturally render as completed. **No logic change is needed.** Verify this is correct for all statuses before marking done.

5. **Verify the progress-line width calculation is still correct.**

   Current formula: `(currentStepIndex / (steps.length - 1)) * 100`%

   With 6 steps (`steps.length - 1 = 5`) and `documents_pending` at index 1:
   - `(1 / 5) * 100 = 20%` — correct (one step completed out of five gaps).

   Run through all statuses mentally to confirm:
   - `documents_pending` → index 1 → 20%
   - `documents_under_review` → index 2 → 40%
   - `documents_approved` → index 3 → 60%
   - `submitted` → index 4 → 80%
   - `delivered` → index 5 → 100% (also all steps completed via `status === 'delivered'` check)

   No formula change needed. The 6-step array is self-consistent.

6. **Update `context/progress-tracker.md`** — mark 19b as complete.

---

## Scope Limits

- Do not change the visual styling of any existing timeline step.
- Do not add new order statuses to `SelectOrder['status']` — the payment step is synthetic (display-only).
- Do not add any new component files — all changes are in the existing `OrderTimeline.tsx` and locale files.
- Do not touch the progress-line animation or transition styles.
- Do not add partial upload progress indicators within the `documents_pending` state — that is out of scope for 19b.
- Keep this focused on the two targeted changes: payment step insertion and manual review copy update.

---

## Check When Done

- `components/dashboard/OrderTimeline.tsx` has 6 entries in the `steps` array, with `{ id: 'payment_received', labelKey: 'timeline.payment' }` at index 0.
- Visiting the dashboard as a `documents_pending` user shows "Payment" as the first step, rendered as completed (green check circle).
- All other existing steps still render correctly with no visual regressions.
- `messages/en.json` has `dashboard.timeline.payment: "Payment"` and `documents.states.manualReview` no longer contains "4 hours".
- All 4 locale files (`en`, `fr`, `es`, `de`) have both the new `timeline.payment` key and the updated `manualReview` value.
- `npm run build` passes.
- `npx vitest run` passes (423 tests).
