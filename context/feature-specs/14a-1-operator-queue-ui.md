# 14a-1 — Operator Queue UI & Submission Action

<!-- Read before starting: AGENTS.md, progress-tracker.md, user-flows.md (Flow 8), architecture-context.md, ui-context.md -->

Build the operator shell, priority queue page, SLA countdown, and "Mark as submitted" action — the full queue workflow excluding the ZIP package download (covered in 14a-2).

---

## Constraints

### Tokens

Two valid ways to reference tokens in this project (both compile correctly in Tailwind v4):
- **Raw CSS var** — `bg-[var(--bg-base)]` — always safe, always unambiguous.
- **`@theme` shorthand** — `bg-surface` — only works for tokens registered in `@theme inline` in `globals.css`.

⚠️ **Do NOT use** `text-primary` (resolves to `--color-primary` = brand blue, not the text token). Use `text-text-primary` (shorthand) or `text-[var(--text-primary)]` (raw var). `bg-base` has no shorthand by design — use `bg-[var(--bg-base)]` only.

| Purpose | CSS variable | Raw var utility | `@theme` shorthand |
|---------|-------------|-----------------|-------------------|
| Page canvas | `--bg-base` | `bg-[var(--bg-base)]` | *(no shorthand — use raw var)* |
| Section cards | `--bg-surface` | `bg-[var(--bg-surface)]` | `bg-surface` |
| Card border | `--border-default` | `border-[var(--border-default)]` | `border-border-default` |
| Section divider | `--border-subtle` | `border-[var(--border-subtle)]` | `border-border-subtle` |
| Primary heading | `--text-primary` | `text-[var(--text-primary)]` | `text-text-primary` |
| Supporting text | `--text-secondary` | `text-[var(--text-secondary)]` | `text-text-secondary` |
| Muted / metadata | `--text-muted` | `text-[var(--text-muted)]` | `text-text-muted` |
| Text on colored bg | `--text-on-accent` | `text-[var(--text-on-accent)]` | `text-on-accent` |
| Primary button bg | `--brand-primary` | `bg-[var(--brand-primary)]` | `bg-brand-primary` |
| Hover / dim bg | `--brand-primary-dim` | `bg-[var(--brand-primary-dim)]` | `bg-brand-primary-dim` |
| SLA safe text (> 24 h) | `--status-success` | `text-[var(--status-success)]` | `text-success` |
| SLA warning text (8–24 h) | `--status-warning` | `text-[var(--status-warning)]` | `text-warning` |
| SLA danger text (< 8 h) | `--status-error` | `text-[var(--status-error)]` | `text-error` |
| SLA danger row bg tint | `--status-error-subtle` | `bg-[var(--status-error-subtle)]` | `bg-error-subtle` |
| Express badge bg | `--status-warning` | `bg-[var(--status-warning)]` | `bg-warning` |
| Card shadow | `--shadow-md` | `shadow-[var(--shadow-md)]` | *(no shorthand — use raw var)* |
| Card radius | `--radius-lg` | `rounded-[length:var(--radius-lg)]` | *(no shorthand — use raw var)* |
| Button radius | `--radius-md` | `rounded-[length:var(--radius-md)]` | *(no shorthand — use raw var)* |

Rules that always apply:
- No raw Tailwind color classes (`slate-*`, `amber-*`, etc.). Tokens only.
- No hardcoded hex or rgb values.
- Mobile-first. Add breakpoint variants only where layout actually changes.
- shadcn components when possible. See Dependencies section for which must be installed first.

### Architecture

- Operator shell layout: `app/[locale]/(operator)/layout.tsx` — Server Component, calls `requireRole('operator')`, redirects to `/operator/signin` on failure.
- Queue page: `app/[locale]/(operator)/operator/page.tsx` — Server Component, fetches queue data, passes to client components.
- DB query: `getOperatorQueue()` added to `lib/db/queries.ts` — returns only `documents_approved` orders, Express sorted by SLA urgency first (least time remaining), Standard sorted by `createdAt ASC`.
- Server Action: `markOrderAsSubmitted(orderId)` in `app/actions/operator.ts` — thin: validate → auth → act → return `ActionResult`.
- Components live in `components/operator/`.
- `SlaCountdown` must be a Client Component (`"use client"`) — it ticks in real time.
- All other operator components are Server Components unless they specifically need browser state.
- `requireRole` comes from `lib/auth/permissions.ts` — same pattern used in the admin shell.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment.
- Infer types from Zod schemas with `z.infer<typeof Schema>` — no duplicate type definitions.
- Export a `OperatorQueueItem` interface from `lib/db/queries.ts` alongside the query function.

### Validation

```typescript
// app/actions/operator.ts
const MarkAsSubmittedSchema = z.object({
  orderId: z.string().uuid(),
})
```

### i18n

- All user-facing strings go in `messages/en.json` under the `operator` key.
- Use `getTranslations('operator')` (server components) or `useTranslations('operator')` (client components).
- No hardcoded English strings in JSX.
- Add the same keys (untranslated) to `fr.json`, `es.json`, `de.json`.

Suggested key structure:
```json
"operator": {
  "queue": {
    "title": "Submission Queue",
    "expressSection": "Express Orders",
    "standardSection": "Standard Orders",
    "emptyExpress": "No express orders pending submission.",
    "emptyStandard": "No standard orders pending submission.",
    "columns": {
      "customer": "Customer",
      "ordered": "Ordered",
      "sla": "Time remaining",
      "actions": "Actions"
    },
    "actions": {
      "downloadPackage": "Download package",
      "markSubmitted": "Mark as submitted",
      "submitting": "Submitting…"
    },
    "sla": {
      "hoursRemaining": "{hours}h {minutes}m remaining",
      "expired": "SLA expired"
    },
    "submitConfirm": {
      "title": "Mark as submitted?",
      "description": "Confirm that you have submitted this application to ebalcão. This cannot be undone.",
      "confirm": "Yes, mark as submitted",
      "cancel": "Cancel"
    },
    "submitSuccess": "Order marked as submitted.",
    "submitError": "Failed to mark order as submitted. Please try again."
  }
}
```

---

## Design

**Layout:**
- Full-width page within the operator shell (`max-w-5xl mx-auto`).
- Two stacked sections separated by a visible label — no tabs, no toggle. Express always on top.
- Each section is a card (`bg-surface`, `border-default`, `rounded-lg`, `shadow-md`) with a section heading inside.
- Rows inside each section are separated by `border-subtle` dividers, not individual cards.

**Express section rows** (4 columns on desktop, stacked on mobile):
- Customer name (primary text)
- Tier badge — "Express" in amber/warning tones (`bg-[var(--status-warning)] text-[var(--text-on-accent)]`)
- SLA countdown — large, color-coded text (see token table above). Format: `{Xh Ym remaining}` or `SLA EXPIRED` in red.
- Action buttons: "Download package" (secondary button — placeholder `<a>` tag, not wired until 14a-2) + "Mark as submitted" (primary button, opens confirmation dialog before firing).

**Standard section rows** (3 columns on desktop, stacked on mobile):
- Customer name (primary text)
- Date ordered (`text-muted`, relative date — "3 days ago")
- Action buttons: "Download package" (placeholder) + "Mark as submitted" (primary button).

**SLA countdown color thresholds:**
- > 24 h remaining → `text-[var(--status-success)]`
- 8–24 h remaining → `text-[var(--status-warning)]`
- < 8 h remaining → `text-[var(--status-error)]`
- Expired → `text-[var(--status-error)]` + bold + "SLA EXPIRED" label

**"Mark as submitted" confirmation:** use shadcn `AlertDialog` — do NOT use `window.confirm`. Dialog opens inline, operator confirms, action fires, row disappears from queue on success (trigger `revalidatePath`).

**Empty states:** if a section has no orders, show a short muted message inside the section card — do not hide the section heading.

---

## Implementation

1. **Add `getOperatorQueue()` to `lib/db/queries.ts`.**

   - Query: `orders` joined with `users` (for `email`), filtered to `status = 'documents_approved'` only.
   - Return shape:
     ```typescript
     export interface OperatorQueueItem {
       id: string
       tier: 'essential' | 'standard' | 'express'
       fullName: string | null
       email: string
       createdAt: Date
       documentsApprovedAt: Date  // guaranteed non-null at this status
     }
     ```
   - Sort: Express rows first (`CASE WHEN tier = 'express' THEN 0 ELSE 1 END ASC`), then within Express sort by `documentsApprovedAt ASC` (oldest approval = least SLA time remaining = most urgent). Standard rows sort by `createdAt ASC` (FIFO).

2. **Create `app/actions/operator.ts`.**

   - `markOrderAsSubmitted(orderId: string): Promise<ActionResult<void>>`
   - Steps: parse with `MarkAsSubmittedSchema` → `requireRole('operator')` → verify order exists and is `documents_approved` (return error if not) → update `status` to `submitted`, set `submittedToFinancasAt = new Date()` → insert `AuditLog` record (`action: 'order.submitted'`, `orderId`, `userId`) → `revalidatePath('/operator')` → return `{ success: true }`.
   - Import `ActionResult` from `lib/types.ts`.

3. **Create `app/[locale]/(operator)/layout.tsx`.**

   - Server Component. Call `requireRole('operator')` — on failure redirect to `/${locale}/operator/signin`.
   - Minimal shell: just a `<div>` wrapper with `min-h-screen bg-[var(--bg-base)]` and a simple top bar showing "Operator Panel" label + sign-out link.
   - Sign-out link: use `<Button variant="ghost" asChild><Link href="/operator/signin">Sign out</Link></Button>` — not a raw anchor.
   - No sidebar — the operator panel is intentionally minimal.

4. **Create `components/operator/SlaCountdown.tsx`.**

   - `"use client"` — ticks every 60 seconds with `setInterval`.
   - Props: `documentsApprovedAt: string` (ISO string, serialized from server), `className?: string`.
   - Derives deadline: `documentsApprovedAt + 48 hours`.
   - Returns a `<span>` with the formatted remaining time and the correct color token class based on thresholds defined in the Design section.
   - If deadline is in the past: renders "SLA EXPIRED" in `text-[var(--status-error)] font-bold`.

5. **Create `components/operator/QueueRow.tsx`.**

   - Client Component (`"use client"`) — needs `useState` for the `AlertDialog` open state.
   - Props: `item: OperatorQueueItem`, `isExpress: boolean`.
   - Renders one row (not a `<tr>` — use flex/grid divs for mobile-friendliness).
   - "Download package" renders as `<a href={`/api/operator/package/${item.id}`} download>` wrapped in a shadcn `Button` with `asChild`. The endpoint does not exist yet (built in 14a-2) — that is expected; the link is a placeholder.
   - "Mark as submitted" opens a shadcn `AlertDialog` for confirmation. On confirm, calls `markOrderAsSubmitted(item.id)` via `useTransition`. Shows loading state on the confirm button during the call (disable + "Submitting…" label).
   - On **success**: close the dialog, fire a `toast.success(t('queue.submitSuccess'))`. The row disappears automatically because `revalidatePath` re-renders the queue without that order.
   - On **error**: keep the dialog open, show the error message inline below the description (do not close on failure). Use a `<p className="text-error text-sm mt-2">` for the error — the toast is for success only; errors stay in-context inside the dialog so the operator can retry without losing their place.

6. **Create `components/operator/OperatorQueue.tsx`.**

   - Server Component.
   - Props: `items: OperatorQueueItem[]`.
   - Splits items into `expressItems` (tier === 'express') and `standardItems`.
   - Renders two section cards with their headings, rows via `QueueRow`, and empty state messages.

7. **Create `app/[locale]/(operator)/operator/page.tsx`.**

   - Server Component.
   - Calls `getOperatorQueue()`.
   - Passes result to `<OperatorQueue items={queue} />`.
   - Add page-level translations: `const t = await getTranslations('operator.queue')`.

8. **Add i18n keys** to `messages/en.json` under `operator.queue` (see suggested structure in i18n section). Add matching untranslated keys to `fr.json`, `es.json`, `de.json`.

---

## Dependencies

**shadcn components to add** (run `npx shadcn@latest add <name>` for each):
- `alert-dialog` — confirmation dialog for "Mark as submitted". Built on Radix UI Dialog — fully keyboard accessible (focus trap, Esc to close, screen reader announcements via `aria-labelledby` / `aria-describedby`).
- `badge` — "Express" tier label on queue rows. Semantic `<span>` with role-appropriate styling.
- `separator` — visual divider between Express and Standard sections. Renders as `<hr role="separator">` for correct screen reader semantics.
- `sonner` — toast notifications for success feedback. shadcn's default toast library. Renders an ARIA live region (`role="status"` / `aria-live="polite"`) so screen readers announce the success message without interrupting the user.

**After installing `sonner`:** add `<Toaster />` from `@/components/ui/sonner` to the operator layout (`app/[locale]/(operator)/layout.tsx`) so toasts render inside the operator shell. Import `toast` from `sonner` in `QueueRow.tsx` to fire success toasts.

---

## Scope Limits

- Do NOT implement ZIP generation or the `/api/operator/package/[orderId]` route — that is 14a-2.
- Do NOT implement the submitted orders archive (`/operator/submitted`) — that is 14b.
- Do NOT implement operator notification preferences — that is 14b.
- Do NOT send any customer emails from `markOrderAsSubmitted` — the "submitted" status email is not yet assigned to a feature spec. Note it as an open question in `progress-tracker.md`.
- Do NOT add a sign-out button with full auth logic — a plain link to `/operator/signin` is sufficient for this sprint. Full account management is out of scope.
- The "Download package" button must render as a valid `<a>` element pointing to the future API route — do not disable it or mark it as "coming soon" in the UI.

---

## Check When Done

- `app/[locale]/(operator)/layout.tsx` exists and redirects unauthenticated users to `/operator/signin`.
- Visiting `/en/operator` as a non-operator user redirects to `/en/operator/signin`.
- Visiting `/en/operator` as an operator shows the queue with two sections.
- Express orders (status `documents_approved`, tier `express`) appear in the top section sorted by least SLA time remaining.
- Standard orders appear in the bottom section sorted by oldest first.
- `SlaCountdown` shows green / amber / red based on time remaining thresholds.
- "Mark as submitted" button opens an `AlertDialog` — NOT a `window.confirm`.
- Confirming "Mark as submitted" on an order transitions its status to `submitted`, sets `submittedToFinancasAt`, writes an `AuditLog` row, and removes the order from the visible queue.
- An open question for the "submitted" customer email is added to `progress-tracker.md`.
- `messages/en.json` has an `operator.queue` namespace. `fr.json`, `es.json`, `de.json` have matching keys.
- `npm run build` passes.
