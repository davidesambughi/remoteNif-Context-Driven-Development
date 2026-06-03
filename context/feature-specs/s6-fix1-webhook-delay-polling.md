# S6-Fix1 — Webhook-Delay Polling on Dashboard

<!-- Context files to read before implementing: AGENTS.md, progress-tracker.md,
     architecture-context.md, code-standards.md -->

After Stripe redirects the customer back to `/dashboard?session_id=...`, the checkout
webhook may not have fired yet; this fix detects that param, shows a "processing…"
overlay, polls every 2.5 seconds for up to 30 seconds, and shows the correct timeout
error message if the order still doesn't exist.

---

## Constraints

### Tokens (UI features only)

| Purpose | Token | Tailwind utility |
|---------|-------|-----------------|
| Overlay backdrop | `var(--color-surface)` | `bg-surface/80` |
| Spinner / CTA | `var(--color-brand-primary)` | `text-brand-primary` |
| Body text | `var(--color-text-primary)` | `text-text-primary` |
| Secondary text | `var(--color-text-secondary)` | `text-text-secondary` |
| Error heading | `var(--color-error)` | `text-error` |
| Card background | `var(--color-surface)` | `bg-surface` |
| Card border (error state) | `var(--color-error)` | `border-error/20` |
| Border radius (card) | `var(--radius-lg)` | `rounded-[length:var(--radius-lg)]` |
| Shadow (card) | `var(--shadow-xl)` | `shadow-[var(--shadow-xl)]` |

Rules that always apply to UI work in this project:
- No raw Tailwind color classes (`zinc-*`, `slate-*`, `blue-*`). Tokens only.
- No hardcoded hex or rgb values.
- Mobile-first. Add breakpoint variants only where layout actually changes.
- Border radius from scale: `--radius-sm` / `md` / `lg` / `xl` / `2xl` / `full`.
- Shadows from scale: `--shadow-sm` / `md` / `lg` / `xl`.
- Shadcn components when possible.

### Architecture

- New client component lives at `components/dashboard/WebhookPoller.tsx` — `'use client'`, detects `?session_id=` via `useSearchParams()`, runs the polling loop.
- New Server Action `checkHasActiveOrder` added to `app/actions/orders.ts` — called from the client poller. Returns `ActionResult<{ hasOrder: boolean }>`.
- `DashboardPage` mounts `<WebhookPoller />` inside its own `<Suspense>` boundary (same pattern as `CheckoutResumer`). No other changes to the page.
- `DashboardContent` is unchanged — it continues to render whatever the DB returns. The overlay covers it while polling.
- On order detected: call `router.replace(pathname)` using `useRouter()` and `usePathname()` from `@/i18n/navigation`. `usePathname()` returns the path without the locale prefix (always `/dashboard`), and `router.replace` is locale-aware — French users land on `/fr/dashboard`, English on `/dashboard`. The navigation re-runs the Server Component tree so `DashboardContent` refetches with the order now in the DB.
- Do NOT use `window.location.replace('/dashboard')` — it is locale-unaware and breaks for FR/ES/DE users.
- Do NOT use `router.refresh()` — `router.replace(pathname)` already triggers a full Server Component re-render for the new route, so a separate refresh is redundant.
- DB query reuse: `checkHasActiveOrder` uses the existing `getUserActiveOrder` query. Do not add a new query.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- Infer types from Zod schemas with `z.infer<typeof Schema>` — no duplicate type definitions.
- The poller's internal state should be typed explicitly: `'idle' | 'polling' | 'timeout'`.

### Validation

No form or user input. No Zod schema needed for this feature — `session_id` is only used as a boolean signal (present / absent); its value is never sent to the server.

### i18n

- All user-facing strings go in `messages/en.json` under the `dashboard.processing` key.
- Use `useTranslations('dashboard')` in `WebhookPoller` (same namespace as the dashboard).
- No hardcoded English strings in JSX.
- Add the same keys (untranslated for now) to `fr.json`, `es.json`, `de.json`.

Keys to add under `dashboard.processing`:

```json
"processing": {
  "title": "Processing your payment…",
  "subtitle": "We're confirming your order. This usually takes a few seconds.",
  "timeout": {
    "title": "Still processing",
    "message": "Your payment was successful, but we're still processing your order. Check your email for confirmation, or contact support if you don't receive it within 10 minutes.",
    "dismiss": "Got it"
  }
}
```

The support email (`support@remotenif.com`) can be hardcoded in the timeout message via the existing `common.support` pattern — check how `DashboardContent` renders it (the `<a href="mailto:...">` link). Replicate the same pattern inline in the timeout card rather than composing from a separate component.

---

## Design

**Polling overlay** (state = `'polling'`):
- Full-screen fixed overlay: `fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface/80 backdrop-blur-sm p-4 text-center`
- `Loader2` icon from lucide-react, `animate-spin`, `h-10 w-10 text-brand-primary mb-4`
- Heading: `text-[length:var(--text-xl)] font-[number:var(--font-bold)] text-text-primary` — `t('processing.title')`
- Sub-text: `mt-2 text-[length:var(--text-sm)] text-text-secondary` — `t('processing.subtitle')`

**Timeout card** (state = `'timeout'`):
- Same fixed overlay backdrop as above
- Centred card: `max-w-md bg-surface p-6 rounded-[length:var(--radius-lg)] shadow-[var(--shadow-xl)] border border-error/20`
- Heading: `text-[length:var(--text-xl)] font-[number:var(--font-bold)] text-error` — `t('processing.timeout.title')`
- Body text: `mt-2 text-[length:var(--text-sm)] text-text-secondary` — `t('processing.timeout.message')`
- Support link inline in body text: `<a href="mailto:support@remotenif.com" className="text-brand-primary font-[number:var(--font-medium)] hover:underline">support@remotenif.com</a>`
- Dismiss button: `mt-6 px-4 py-2 bg-brand-primary text-on-accent rounded-[length:var(--radius-md)] font-[number:var(--font-semibold)]` — clicking dismisses the overlay (sets state to `'idle'`) so the user can see the empty state and the support email below it.

This matches the visual language of `CheckoutResumer` (same overlay pattern, same card shape).

---

## Implementation

1. Add `checkHasActiveOrder` to `app/actions/orders.ts`:
   - `'use server'` file already has this directive.
   - Call `getCurrentUser()`. If no user, return `{ success: false, error: 'auth.required' }`.
   - Call `getUserActiveOrder(user.id)`. Return `{ success: true, data: { hasOrder: order !== null } }`.
   - Return type: `Promise<ActionResult<{ hasOrder: boolean }>>`.

2. Add i18n keys under `dashboard.processing` to all four locale files (`messages/en.json`, `fr.json`, `es.json`, `de.json`). English keys are specified above; the other three locales get the same English strings for now (untranslated placeholder, same pattern used elsewhere in the project).

3. Create `components/dashboard/WebhookPoller.tsx`:
   - `'use client'`
   - Imports: `useEffect`, `useRef`, `useState` from React; `useSearchParams` from `next/navigation` (next-intl does not wrap this hook); `useRouter`, `usePathname` from `@/i18n/navigation`; `useTranslations` from `next-intl`; `Loader2` from `lucide-react`; `checkHasActiveOrder` from `@/app/actions/orders`.
   - State: `status: 'idle' | 'polling' | 'timeout'` — initialise to `'idle'`.
   - `sessionId = useSearchParams().get('session_id')` — if `null`, render nothing (`return null`).
   - `useEffect` runs when `sessionId` is truthy:
     - Set status to `'polling'`.
     - Track poll count with a `useRef` counter. Max polls = 12 (12 × 2500ms = 30s).
     - Start an interval with `setInterval` at 2500ms.
     - Each tick: call `checkHasActiveOrder()`. If `result.success && result.data.hasOrder`, clear the interval, then call `router.replace(pathname)` — locale-aware navigation strips `?session_id=` and re-runs `DashboardContent` with the order in DB. If poll count reaches max, clear the interval, set status to `'timeout'`.
     - Clear interval on cleanup (`useEffect` return function).
   - Render nothing when status is `'idle'`.
   - Render polling overlay when status is `'polling'`.
   - Render timeout card when status is `'timeout'`. Dismiss button sets status to `'idle'`.

4. Wire `<WebhookPoller />` into `app/[locale]/(dashboard)/dashboard/page.tsx`:
   - Import `WebhookPoller` from `@/components/dashboard/WebhookPoller`.
   - Add a second `<Suspense>` block immediately after the existing `<CheckoutResumer>` one:
     ```tsx
     <Suspense>
       <WebhookPoller />
     </Suspense>
     ```
   - No other changes to `DashboardPage` — do not alter `isResuming` logic or the main content block.

---

## Scope Limits

- Do not modify `CheckoutResumer` — it handles an entirely separate flow (`?checkout_tier=`).
- Do not modify `DashboardContent` — it remains a pure Server Component with no awareness of `session_id`.
- Do not add retry logic, exponential backoff, or configurable intervals — fixed 2.5s is sufficient.
- Do not write the `session_id` to the DB or audit log — it is Stripe's token and has no internal meaning beyond presence/absence.
- Do not add the `'status_update_with_note'` or any other email flow — this fix is UI-only.
- Do not change the empty state rendering — it will show briefly under the overlay; that is acceptable.
- Keep this focused on the single responsibility: detecting a post-Stripe redirect and polling until the webhook-created order is visible.

---

## Check When Done

- Navigating to `/dashboard?session_id=anything` while the user has no order shows the polling overlay immediately.
- After `getUserActiveOrder` returns a non-null order (simulate by logging in as a user who already has an order and hitting the URL directly), `router.replace(pathname)` fires and the URL is clean (no `?session_id=`).
- A French user at `/fr/dashboard?session_id=...` is redirected to `/fr/dashboard` (not `/dashboard`).
- After 30 seconds with no order, the timeout card appears with the correct copy and support link.
- Clicking "Got it" on the timeout card dismisses the overlay and reveals the underlying empty state.
- `?session_id=` is absent from the URL after a successful redirect (because `window.location.replace` was used).
- No console errors in the polling loop.
- All four locale files have the `dashboard.processing` keys.
- `npm run build` passes.
