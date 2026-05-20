# 13a — Admin Panel: Order List


Build the admin order list screen at `/admin` — an authenticated, read-only table showing all orders with status badges, tier badges, date ordered, and a live SLA countdown for Express orders in `documents_approved` status. Also build the surrounding admin shell (layout with header and sign-out).

---

## Constraints

### Tokens (UI features only)

| Purpose | Token | Tailwind utility |
|---------|-------|-----------------|
| Page canvas | `var(--bg-base)` | `bg-[var(--bg-base)]` |
| Card / table surface | `var(--bg-surface)` | `bg-surface` |
| Row hover / muted area | `var(--bg-subtle)` | `bg-subtle` |
| Brand dim background | `var(--brand-primary-dim)` | `bg-brand-primary-dim` |
| Primary text | `var(--text-primary)` | `text-[var(--text-primary)]` |
| Secondary text | `var(--text-secondary)` | `text-[var(--text-secondary)]` |
| Muted text | `var(--text-muted)` | `text-[var(--text-muted)]` |
| On-accent text | `var(--text-on-accent)` | `text-on-accent` |
| Brand text / badge | `var(--brand-primary)` | `text-brand-primary` |
| Standard border | `var(--border-default)` | `border-[var(--border-default)]` |
| Subtle border | `var(--border-subtle)` | `border-[var(--border-subtle)]` |
| Success state | `var(--status-success)` | `text-success` / `bg-success` |
| Success tint bg | `var(--status-success-subtle)` | `bg-success-subtle` |
| Warning state | `var(--status-warning)` | `text-warning` / `bg-warning` |
| Warning tint bg | `var(--status-warning-subtle)` | `bg-warning-subtle` |
| Error state | `var(--status-error)` | `text-error` / `bg-error` |
| Error tint bg | `var(--status-error-subtle)` | `bg-error-subtle` |
| Info state | `var(--status-info)` | `text-info` / `bg-info` |
| Card radius | `var(--radius-lg)` | `rounded-lg` |
| Card shadow | `var(--shadow-md)` | `shadow-[var(--shadow-md)]` |

Rules that always apply to UI work in this project:
- No raw Tailwind color classes (`zinc-*`, `slate-*`, `blue-*`). Tokens only.
- No hardcoded hex or rgb values.
- Mobile-first. Add breakpoint variants only where layout actually changes.
- Border radius from scale: `--radius-sm` / `md` / `lg` / `xl` / `2xl` / `full`.
- Shadows from scale: `--shadow-sm` / `md` / `lg` / `xl`.

### Architecture

- Admin layout: `app/[locale]/(admin)/layout.tsx` — Server Component. Calls `requireRole('admin')`; on failure, redirect to `/${locale}/admin/signin`. Fetches the current admin's email for the header.
- Admin sign-out button: `components/admin/AdminSignOutButton.tsx` — `"use client"` wrapper that calls the existing `signOut` Server Action from `app/actions/auth.ts`.
- Order list page: `app/[locale]/(admin)/page.tsx` — Server Component. Reads `searchParams.status` and `searchParams.tier`, validates them, calls `getAdminOrderList`.
- DB query: add `getAdminOrderList` to `lib/db/queries.ts`. Joins `orders` with `users`. Accepts optional `status` and `tier` filter params. Returns `AdminOrderListItem[]`.
- Filter controls: `components/admin/OrderFilters.tsx` — `"use client"`. Reads current URL search params and updates them on `<select>` change via `router.push`. No Server Actions needed — purely URL state.
- SLA countdown: `components/admin/SlaCountdown.tsx` — `"use client"`. Receives `documentsApprovedAt: string` (ISO string). Uses `useState` + `setInterval` (60s) to recompute remaining time. Color-coded display.
- No Server Actions in this feature — read-only.
- All mutations live in other features. Do not add approve/override/resend actions here.
- Use `Link` from `@/i18n/navigation` (not `next/link`) for locale-aware row links.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- Infer types from Zod schemas with `z.infer<typeof Schema>` — no duplicate type definitions.
- Use `interface` for props and DB query return shapes. Use `type` for unions.
- Define `AdminOrderListItem` as the return type for `getAdminOrderList` — exported from `lib/db/queries.ts`.

### Validation

URL search params are validated inline in the page before being passed to the query:

```typescript
// In app/[locale]/(admin)/page.tsx
const AdminOrderFiltersSchema = z.object({
  status: z.enum([
    'documents_pending',
    'documents_under_review',
    'documents_approved',
    'submitted',
    'delivered',
  ]).optional(),
  tier: z.enum(['essential', 'standard', 'express']).optional(),
})
```

Use `safeParse` — silently discard invalid values rather than throwing.

### i18n

- All user-facing strings go in `messages/en.json` under the `admin` namespace.
- Use `getTranslations('admin')` in Server Components, `useTranslations('admin')` in Client Components.
- No hardcoded English strings in JSX.
- Add the same keys (untranslated for now) to `fr.json`, `es.json`, `de.json`.

---

## Design

The admin panel is an internal tool — functional and dense, not decorative. No gradients, no hero sections, no marketing copy.

**Admin shell (layout):**
- Full-width top bar: `bg-surface border-b border-[var(--border-default)] px-6 h-14 flex items-center justify-between`.
  - Left: "RemoteNIF Admin" in `text-[var(--text-primary)] font-semibold text-sm`.
  - Right: admin email in `text-[var(--text-muted)] text-sm mr-4`, then `AdminSignOutButton` as a ghost-style button.
- Content area: `bg-[var(--bg-base)] min-h-[calc(100vh-3.5rem)]`.

**Order list page:**
- Inner container: `max-w-7xl mx-auto px-6 py-8`.
- Page heading: `text-[var(--text-primary)] text-2xl font-bold mb-6` — translation key `admin.title`.
- Filter bar: `flex gap-3 mb-6` — two compact `<select>` elements (status filter, tier filter). Style: `bg-surface border border-[var(--border-default)] rounded-md px-3 py-1.5 text-sm text-[var(--text-primary)]`.
- Orders table wrapper: `bg-surface border border-[var(--border-default)] rounded-lg overflow-hidden shadow-[var(--shadow-md)]`.
- `<table className="w-full text-sm">` with `<thead>` and `<tbody>`.
- Header row: `bg-subtle text-[var(--text-muted)] text-xs font-medium uppercase tracking-wide`.
- Columns (left to right): **Customer** (name + email), **Tier**, **Status**, **Ordered**, **SLA**.
- Body rows: `border-t border-[var(--border-subtle)] hover:bg-subtle cursor-pointer transition-[var(--transition-fast)]` — entire row is a `<Link>` to `/admin/orders/[id]`.
- `<td>` padding: `px-4 py-3`.

**Express SLA rows** (tier = `express` AND status = `documents_approved`):
- Add `border-l-4` to the row: green if >24h remaining, amber if 8–24h, red if <8h or overdue.
- SLA column shows `<SlaCountdown />`.
- All other rows: SLA column shows `—` in `text-[var(--text-muted)]`.

**Tier badges** (inline `<span>` elements, `px-2 py-0.5 rounded-full text-xs font-medium`):
- Essential: `bg-subtle text-[var(--text-secondary)]`
- Standard: `bg-brand-primary-dim text-brand-primary`
- Express: `bg-warning-subtle text-warning`

**Status badges** (same shape as tier badges):
- `documents_pending`: `bg-subtle text-[var(--text-muted)]`
- `documents_under_review`: `bg-[var(--bg-subtle)] text-info` (use info color, no bg-info as that is the full color)
- `documents_approved`: `bg-warning-subtle text-warning`
- `submitted`: `bg-success-subtle text-success`
- `delivered`: `bg-success text-on-accent`

**SLA countdown** (`SlaCountdown` component):
- Computes `deadline = documentsApprovedAt + 48 hours`, then `remaining = deadline - now`.
- Display format: `"Xh Ym"` (e.g., `"36h 14m"`).
- Color rules:
  - `> 24h remaining`: `text-success font-medium`
  - `8–24h remaining`: `text-warning font-medium`
  - `< 8h remaining`: `text-error font-medium`
  - Overdue: `"OVERDUE"` in `text-error font-semibold`
- Updates every 60 seconds via `setInterval`.

**Empty state** (no orders match filter):
- Centered within the table area: `text-[var(--text-muted)] text-sm py-12 text-center`.
- Text: translation key `admin.emptyState`.

---

## Implementation

1. Add `AdminOrderListItem` interface and `getAdminOrderList` query to `lib/db/queries.ts`:
   - Join `orders` inner join `users` on `orders.userId = users.id`.
   - Select: `orders.id`, `orders.tier`, `orders.status`, `orders.fullName`, `orders.createdAt`, `orders.documentsApprovedAt`, `users.email`.
   - Accept `filters?: { status?: string; tier?: string }` and apply `and(...)` where clause when values are present.
   - Sort order: Express `documents_approved` rows first (raw SQL `CASE WHEN tier='express' AND status='documents_approved' THEN 0 ELSE 1 END`), then `documentsApprovedAt ASC NULLS LAST`, then `createdAt DESC`.
   - Return type: `AdminOrderListItem[]`.

   ```typescript
   export interface AdminOrderListItem {
     id: string
     tier: 'essential' | 'standard' | 'express'
     status: string
     fullName: string | null
     email: string
     createdAt: Date
     documentsApprovedAt: Date | null
   }
   ```

2. Create `components/admin/AdminSignOutButton.tsx` — `"use client"`:
   - Renders a ghost-style `<button>` labeled with translation key `admin.signOut`.
   - On click, calls the `signOut` Server Action imported from `app/actions/auth.ts`.

3. Create `app/[locale]/(admin)/layout.tsx` — Server Component:
   - Import `requireRole` from `lib/auth/session.ts`.
   - Call `requireRole('admin')` inside a try/catch — on error, `redirect(`/${locale}/admin/signin`)`.
   - Fetch the authenticated user's email via `getCurrentUser()` for the header display.
   - Render the admin top bar (brand label + email + `<AdminSignOutButton />`).
   - Render `{children}` below the bar.

4. Create `components/admin/OrderFilters.tsx` — `"use client"`:
   - Accepts `currentStatus?: string` and `currentTier?: string` props.
   - Renders two `<select>` elements: status filter (options: all + 5 statuses) and tier filter (options: all + 3 tiers).
   - Uses `useRouter` from `@/i18n/navigation` and `usePathname` from `next/navigation`.
   - On `onChange`, builds new `URLSearchParams` preserving both filter values and calls `router.push(pathname + '?' + params)`.
   - Label strings come from `useTranslations('admin')` keys `filters.allStatuses`, `filters.allTiers`, status keys, and tier keys.

5. Create `components/admin/SlaCountdown.tsx` — `"use client"`:
   - Accepts `documentsApprovedAt: string` prop.
   - Computes `deadline = new Date(documentsApprovedAt).getTime() + 48 * 60 * 60 * 1000`.
   - On mount: compute initial remaining, set state, start `setInterval(60_000)`.
   - On unmount: clear interval.
   - Renders formatted string with the appropriate color class.

6. Create `app/[locale]/(admin)/page.tsx` — Server Component:
   - Parse `searchParams` (note: in Next.js 16 App Router, `searchParams` is a `Promise<...>` — `await` it before accessing properties).
   - Validate with `AdminOrderFiltersSchema.safeParse()` — use only the parsed values.
   - Call `getAdminOrderList(filters)`.
   - Render: page heading, `<OrderFilters currentStatus={...} currentTier={...} />`, table.
   - Table rows: wrap each in a `<Link href={`/${locale}/admin/orders/${order.id}`}>` using `asChild` on a `<tr>` — or render as a styled `<tr>` with an `onClick` that calls `router.push` from a Client Component wrapper if `<tr>` as link is problematic. Prefer the simpler approach: make each `<td>` contain a partial `<Link>` covering the full cell, or use a `<tr onClick>` in a thin Client Component `OrderRow`.
   - For Express rows with `status === 'documents_approved'`: render `<SlaCountdown documentsApprovedAt={order.documentsApprovedAt!.toISOString()} />` in the SLA column and apply the `border-l-4` color class.
   - If `orders.length === 0`: render the empty state.

7. Add `admin` i18n namespace to all 4 locale files:

   ```json
   "admin": {
     "title": "Orders",
     "signOut": "Sign out",
     "columns": {
       "customer": "Customer",
       "tier": "Tier",
       "status": "Status",
       "ordered": "Ordered",
       "sla": "SLA"
     },
     "filters": {
       "allStatuses": "All statuses",
       "allTiers": "All tiers"
     },
     "tiers": {
       "essential": "Essential",
       "standard": "Standard",
       "express": "Express"
     },
     "statuses": {
       "documents_pending": "Awaiting documents",
       "documents_under_review": "Under review",
       "documents_approved": "Approved",
       "submitted": "Submitted",
       "delivered": "Delivered"
     },
     "sla": {
       "overdue": "OVERDUE"
     },
     "emptyState": "No orders yet."
   }
   ```

   Add the same keys to `fr.json`, `es.json`, `de.json` (untranslated — copy English values for now).

---

## Scope Limits

- Don't build the order detail page (`/admin/orders/[id]`) — that's Feature 13b.
- Don't add document review, status overrides, admin approve actions, or email resend — all Feature 13b.
- Don't add real-time updates (Supabase subscriptions) — the list is server-rendered per page load; admin refreshes manually.
- Don't add pagination — order volume at launch is small; add it later if needed.
- Don't build the operator panel — that's a separate feature track (14a+).
- Keep this focused on the read-only admin shell and order list only.

---

## Check When Done

- Visiting `/admin` (any locale) without an admin session redirects to `/[locale]/admin/signin`.
- Visiting `/admin` with a valid admin session renders the order list with all orders from the database.
- The admin top bar shows the signed-in admin's email and a working "Sign out" button that clears the session and redirects to the homepage.
- Status filter: selecting a status updates `?status=...` in the URL and the table re-renders with only matching orders.
- Tier filter: selecting a tier updates `?tier=...` in the URL and the table re-renders with only matching orders.
- Both filters work together (`?status=documents_approved&tier=express` returns only Express approved orders).
- Clearing a filter back to "All" removes that search param from the URL.
- Express rows with `status === 'documents_approved'` display a live SLA countdown in the last column; all other rows show `—`.
- SLA countdown is color-coded correctly: green (>24h), amber (8–24h), red (<8h), `"OVERDUE"` when past 48h.
- Express `documents_approved` rows have a `border-l-4` accent matching the SLA color.
- Clicking a table row navigates to `/admin/orders/[id]` (404 is acceptable until Feature 13b).
- Empty state renders the correct message when no orders match the active filters.
- `admin` namespace keys are present in all 4 locale files (`en.json`, `fr.json`, `es.json`, `de.json`).
- `npm run build` passes.
