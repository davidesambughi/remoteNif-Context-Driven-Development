# 14d — Performance: Loading States & Auth Caching


Add `loading.tsx` skeleton screens to every operator and auth page that currently has none,
export `unstable_instant` from each of those pages so navigations are genuinely instant
(Next.js 16.2 requirement), and wrap `getCurrentUser()` in React `cache()` so the layout
and page share one DB call per request instead of two.

---

## Constraints

### Tokens

All tokens registered in `globals.css` `@theme inline`. Use the Tailwind shorthand utility —
never the raw `var()` form in class strings.

Documented exceptions to the raw-var rule:
- `bg-[var(--bg-base)]` — Tailwind shorthand absent (would collide with `text-base` size utility)
- `transition-[var(--transition-base)]` — no Tailwind shorthand for custom transitions

| Purpose | CSS variable | Tailwind utility |
|---------|-------------|-----------------|
| Page canvas | `--bg-base` | `bg-[var(--bg-base)]` (exception) |
| Skeleton blocks | shadcn `<Skeleton>` | — (component handles its own bg) |
| Horizontal padding | `--space-6` | `px-6` |
| Vertical padding | `--space-12` | `py-12` |
| Section gap | `--space-8` | `space-y-8` |
| Field gap | `--space-4` | `space-y-4` |
| Card radius | `--radius-lg` | `rounded-lg` |
| Large card radius | `--radius-xl` | `rounded-xl` |
| Input / button radius | `--radius-md` | `rounded-md` |

Rules that always apply:
- No raw Tailwind color classes (`zinc-*`, `slate-*`, `blue-*`). Tokens only.
- No hardcoded hex values.
- No inline `style={{}}` — Tailwind classes only.
- Mobile-first. `md:` breakpoint variants only where layout visibly changes.
- Use shadcn `<Skeleton>` for all loading placeholders — no custom shimmer CSS.

### Architecture

- Each `loading.tsx` is a **Server Component** (default — no `"use client"`) with no props,
  no data fetching, and no imports beyond shadcn `<Skeleton>`.
- File placement: `loading.tsx` must sit in the **same folder** as the `page.tsx` it covers.
  Next.js automatically wraps that `page.tsx` in a `<Suspense>` boundary — it does **not**
  cover the `layout.tsx` in the same segment. This is expected behaviour: the layout renders
  first (auth guard runs), then the skeleton shows while the page data loads.
- `unstable_instant` export goes in each `page.tsx` alongside its new `loading.tsx` — one
  line only, no other changes to those files. Per Next.js 16.2 docs: `loading.tsx` alone
  does not guarantee instant client-side navigations; `unstable_instant` is what validates
  and enforces the instant shell at dev time and build time.
- `getCurrentUser()` in `lib/auth/session.ts` is wrapped with React `cache()` (imported from
  `'react'`). This deduplicates the DB call within a single server render — layout and page
  share one result. The cache is **per-request** and clears automatically between requests.
- Do **not** wrap `requireAuth()` or `requireRole()` separately — they call `getCurrentUser()`
  internally and benefit automatically.

### TypeScript

- Strict mode. No `any`.
- `loading.tsx` exports: `export default function [Name]Loading()` — no props, return type
  inferred.
- `unstable_instant` is typed as `{ prefetch: 'static' }` — use the literal object, not a
  bare boolean.
- The `cache()` wrapper preserves the original return type: `Promise<SelectUser | null>`. No
  type changes to callers.

### Validation

No form inputs. No Zod schemas needed for this feature.

### i18n

No user-facing strings. Skeleton screens contain no text. No translation keys needed.

---

## Design

### Skeleton philosophy

Skeletons mirror the **rough shape** of the real page — same number of major blocks, similar
heights. Not pixel-perfect. Goal: prevent layout shift and signal responsiveness.

All operator skeletons share the same outer wrapper used by the existing dashboard skeleton:

```
min-h-[calc(100vh-3.5rem)]   ← subtracts the sticky h-14 header
flex flex-col
bg-[var(--bg-base)]
```

Inner container widths match each page's real container:
- Operator pages: `max-w-5xl mx-auto px-6 py-12`
- Auth pages: centered card `flex min-h-screen items-center justify-center bg-[var(--bg-base)]`
  with inner `w-full max-w-md px-6`

### Operator queue skeleton (`/operator`)

Two sections (Express + Standard). Each: heading skeleton + 2 row skeletons.

```
┌────────────────────────────────────┐
│  [heading]  h-5 w-32               │
│  [row]      h-16 w-full rounded-lg │
│  [row]      h-16 w-full rounded-lg │
│                                    │
│  [heading]  h-5 w-32               │
│  [row]      h-16 w-full rounded-lg │
│  [row]      h-16 w-full rounded-lg │
└────────────────────────────────────┘
```

### Operator submitted skeleton (`/operator/submitted`)

One section: heading skeleton + 4 row skeletons.

```
┌────────────────────────────────────┐
│  [heading]  h-5 w-48               │
│  [row]      h-12 w-full rounded-lg │  × 4
└────────────────────────────────────┘
```

### Operator preferences skeleton (`/operator/preferences`)

One section: heading skeleton + 2 toggle row skeletons.

```
┌────────────────────────────────────┐
│  [heading]  h-6 w-40               │
│  [row]      h-12 w-full rounded-lg │
│  [row]      h-12 w-full rounded-lg │
└────────────────────────────────────┘
```

### Auth skeletons (`/signin`, `/signup`)

Centered card. Title + 2 input skeletons + 1 button skeleton.

```
┌────────────────┐
│  [title]  h-7 w-40  │
│  [input]  h-10 w-full rounded-md │
│  [input]  h-10 w-full rounded-md │
│  [button] h-10 w-full rounded-md │
└────────────────┘
```

---

## Implementation

**Steps are sequential — do not reorder.**

---

### Step 1 — Wrap `getCurrentUser()` in React `cache()`

Edit `lib/auth/session.ts`:

- Add `import { cache } from 'react'` at the top.
- Wrap the `getCurrentUser` async function in `cache()`. Exported name stays the same.

```ts
import { cache } from 'react'

// cache() deduplicates this call within a single server render.
// Both layout.tsx (auth guard) and page.tsx (data fetching) share one DB round-trip.
// Cache is per-request — cleared automatically between requests.
export const getCurrentUser = cache(async (): Promise<SelectUser | null> => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims?.sub) return null
  return getUserById(data.claims.sub)
})
```

Do not change `requireAuth()` or `requireRole()` — no other edits in this file.

---

### Step 2 — Operator queue: `loading.tsx` + `unstable_instant`

**2a.** Create `app/[locale]/(operator)/operator/loading.tsx`:

```tsx
import { Skeleton } from '@/components/ui/skeleton'

/** Operator queue skeleton — shown while Express/Standard order data loads. */
export default function OperatorQueueLoading() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col bg-[var(--bg-base)]">
      <main className="max-w-5xl mx-auto w-full px-6 py-12 space-y-8">
        {/* Express section */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
        {/* Standard section */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </main>
    </div>
  )
}
```

**2b.** In `app/[locale]/(operator)/operator/page.tsx`, add at the top of the file (before
any imports):

```ts
// Next.js 16.2 — validates and enforces an instant navigation shell at dev + build time.
// loading.tsx alone does not guarantee instant client-side navigations without this export.
export const unstable_instant = { prefetch: 'static' }
```

No other changes to `page.tsx`.

---

### Step 3 — Operator submitted: `loading.tsx` + `unstable_instant`

**3a.** Create `app/[locale]/(operator)/operator/submitted/loading.tsx`:

```tsx
import { Skeleton } from '@/components/ui/skeleton'

/** Operator submitted archive skeleton — shown while submitted order list loads. */
export default function OperatorSubmittedLoading() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col bg-[var(--bg-base)]">
      <main className="max-w-5xl mx-auto w-full px-6 py-12 space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </main>
    </div>
  )
}
```

**3b.** In `app/[locale]/(operator)/operator/submitted/page.tsx`, add at the top:

```ts
// Next.js 16.2 — instant navigation shell validation.
export const unstable_instant = { prefetch: 'static' }
```

---

### Step 4 — Operator preferences: `loading.tsx` + `unstable_instant`

**4a.** Create `app/[locale]/(operator)/operator/preferences/loading.tsx`:

```tsx
import { Skeleton } from '@/components/ui/skeleton'

/** Operator preferences skeleton — shown while notification settings load. */
export default function OperatorPreferencesLoading() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col bg-[var(--bg-base)]">
      <main className="max-w-5xl mx-auto w-full px-6 py-12 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </main>
    </div>
  )
}
```

**4b.** In `app/[locale]/(operator)/operator/preferences/page.tsx`, add at the top:

```ts
// Next.js 16.2 — instant navigation shell validation.
export const unstable_instant = { prefetch: 'static' }
```

---

### Step 5 — Sign-in: `loading.tsx`

Create `app/[locale]/(auth)/signin/loading.tsx`:

```tsx
import { Skeleton } from '@/components/ui/skeleton'

/** Sign-in page skeleton — shown while the auth page hydrates. */
export default function SignInLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
      <div className="w-full max-w-md px-6 space-y-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  )
}
```

No `unstable_instant` for auth pages — they are not navigated to via client-side links in
normal flow (always a full redirect after signout or from an external URL).

---

### Step 6 — Sign-up: `loading.tsx`

Create `app/[locale]/(auth)/signup/loading.tsx`:

```tsx
import { Skeleton } from '@/components/ui/skeleton'

/** Sign-up page skeleton — shown while the auth page hydrates. */
export default function SignUpLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
      <div className="w-full max-w-md px-6 space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  )
}
```

---

### Step 7 — Verify and build

```bash
npx vitest run      # all 292 existing tests still pass — no logic changed
npm run build       # zero TypeScript errors, unstable_instant validation passes
```

---

## Dependencies

No new packages. `react` is already installed; `cache` is a named export from React 19
(already in use). `unstable_instant` is a built-in Next.js 16.2 route segment config export.

---

## Scope Limits

- Do **not** add `loading.tsx` to any page that already has one —
  `(dashboard)/dashboard/` and `admin/(panel)/orders/[id]/` are covered; do not touch them.
- Do **not** add `loading.tsx` to the admin order list (`/admin`) — not in scope for this unit.
- Do **not** add `loading.tsx` to `/operator/signin` or `/admin/signin` — internal sign-in
  pages are not client-navigated to; skeleton adds no value.
- Do **not** add `unstable_instant` to auth pages (`/signin`, `/signup`) — they are reached
  via full redirects, not client-side Link navigation; the export has no effect there.
- The only edits to existing `page.tsx` files are the single `unstable_instant` export line —
  no other logic, layout, or import changes in those files.
- Do **not** change the skeleton design of the existing dashboard `loading.tsx`.
- Do **not** use `unstable_cache` — that persists data across requests. `React cache()` is
  correct here because auth data must be fresh per request.
- Do **not** add `loading.tsx` to `(marketing)` routes — static pages have no async data
  fetching and no perceived navigation latency.
- Keep this focused on the three named problems: missing skeletons, non-instant navigations,
  and duplicate DB calls.

---

## Check When Done

- `lib/auth/session.ts` imports `cache` from `'react'` and `getCurrentUser` is wrapped with it.
- `requireAuth()` and `requireRole()` are **unchanged** — no other edits in `session.ts`.
- `app/[locale]/(operator)/operator/loading.tsx` exists, exports `OperatorQueueLoading`, uses only Tailwind shorthand tokens (no raw `var()` except `bg-[var(--bg-base)]`).
- `app/[locale]/(operator)/operator/submitted/loading.tsx` exists, exports `OperatorSubmittedLoading`.
- `app/[locale]/(operator)/operator/preferences/loading.tsx` exists, exports `OperatorPreferencesLoading`.
- `app/[locale]/(auth)/signin/loading.tsx` exists, exports `SignInLoading`.
- `app/[locale]/(auth)/signup/loading.tsx` exists, exports `SignUpLoading`.
- `unstable_instant = { prefetch: 'static' }` is exported from the three operator `page.tsx` files.
- No `loading.tsx` file contains `"use client"`, data fetching, or any import beyond `Skeleton`.
- No `loading.tsx` file uses raw `var(--*)` syntax in class strings (except the `bg-[var(--bg-base)]` exception).
- No `loading.tsx` file uses inline `style={{}}`.
- All 292 existing unit tests pass (`npx vitest run`).
- `npm run build` passes with zero errors.
