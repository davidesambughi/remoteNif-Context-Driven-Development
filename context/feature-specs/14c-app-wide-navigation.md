# 14c — App-Wide Navigation

<!-- Context files to read before starting:
     AGENTS.md, progress-tracker.md, ui-context.md, architecture-context.md -->

Replace the current two-bar operator layout (identity bar + separate tab bar) with a single
`h-14` sticky bar per panel. The dashboard gets its missing header. The admin gets its nav
link. The marketing header is reviewed and left alone. Each panel's header is one visual unit.

---

## Constraints

### Tokens

All tokens registered in `globals.css` `@theme inline`. Use the Tailwind shorthand utility —
never the raw `var()` form in class strings (the sole exception: `bg-[var(--bg-base)]` because
`--color-base` is deliberately absent to avoid a collision with Tailwind's `text-base` size utility).

| Purpose | CSS variable | Tailwind utility |
|---------|-------------|-----------------|
| Header background | `--bg-surface` | `bg-surface` |
| Page canvas | `--bg-base` | `bg-[var(--bg-base)]` |
| Header bottom border | `--border-default` | `border-border-default` |
| Primary text | `--text-primary` | `text-text-primary` |
| Secondary / supporting text | `--text-secondary` | `text-text-secondary` |
| Muted text (email, meta) | `--text-muted` | `text-text-muted` |
| Active nav indicator | `--brand-primary` | `border-brand-primary` |
| Base transition | `--transition-base` | `transition-[var(--transition-base)]` |

Rules that always apply:
- No raw Tailwind color classes (`zinc-*`, `slate-*`, `blue-*`). Tokens only.
- No hardcoded hex values.
- Mobile-first. `md:` / `lg:` breakpoint variants only where layout visibly changes.
- shadcn `Button` for interactive buttons. `Link` from `@/i18n/navigation` for nav links —
  never `<a>` tags.
- No hamburger/drawer. On mobile (< sm), brand labels are hidden so only nav links +
  sign-out remain — this fits at 320 px. On sm+, brand labels are visible alongside nav links.

### Architecture

- `app/[locale]/(dashboard)/layout.tsx` does not exist — create it. Auth guard lives here,
  matching the existing admin/operator layout pattern.
- `DashboardHeader` is a parameterless **async Server Component** — calls `getTranslations`
  directly, no props from the layout.
- `DashboardSignOutButton` is a **Client Component** (calls `signOut` on click). Calls
  `useTranslations('common')` directly — **no label prop** — consistent with `AdminSignOutButton`.
- `OperatorNavLinks` is a **Client Component** (needs `usePathname`). Contains only the
  navigation links — no outer bar, no border. Lives in `components/operator/OperatorNavLinks.tsx`.
- `AdminNavLinks` is a **Client Component** (needs `usePathname`). Contains only the navigation
  link. Lives in `components/admin/AdminNavLinks.tsx`.
- `OperatorNav.tsx` is **deleted** — its role is replaced by `OperatorNavLinks` embedded directly
  in the operator layout header.
- Both `OperatorLayout` and `AdminLayout` remain Server Components — they pass `user.email` to
  the header inline. No new header component files needed for admin/operator; the bar is
  assembled inline in the layout.
- `DashboardHeader` is extracted to a separate file because it is customer-facing and needs
  async `getTranslations`. Admin and operator headers are English-only internal tools — inlining
  in the layout is cleaner.
- All layout changes stay in `layout.tsx` files — never in `page.tsx`.
- The existing inline auth guard in `dashboard/page.tsx` stays as defence-in-depth; do not
  remove it.

### TypeScript

- Strict mode. No `any`.
- `DashboardHeader` — no props. `export async function DashboardHeader()`.
- `DashboardSignOutButton` — no props.
- `OperatorNavLinks` — no props.
- `AdminNavLinks` — no props.

### Validation

No form inputs. No Zod schemas needed.

### i18n

- Dashboard header strings go under `common.nav` in all four locale files.
- Add: `common.nav.signOut`, `common.nav.accountSettings` (placeholder for Feature 17 — route
  does not exist yet; reserve the key now).
- Admin and operator panels are English-only internal tools — no i18n keys.
- Marketing header already uses `common.nav.signIn` — no changes.

---

## Design

### Single-bar anatomy (operator and admin)

```
┌─────────────────────────────────────────────────────────┐  h-14, sticky top-0 z-50
│  [Brand label]  [Nav links — h-14, border-b-2 active]   │  bg-surface
│                                              [email] [x] │  border-b border-border-default
└─────────────────────────────────────────────────────────┘
```

- The bar is `h-14`. Nav links are also `h-14` so their `border-b-2` sits flush with the
  header's bottom edge — the active indicator appears as a coloured underline on the bar itself.
- Inner container: `max-w-5xl mx-auto px-4 md:px-6 flex items-center h-full`.
- Brand label: `hidden sm:block flex-none` — hidden on mobile to prevent overflow.
- Nav links (`OperatorNavLinks` / `AdminNavLinks`): `sm:ml-8` left margin (only meaningful
  when brand is visible; removed on mobile).
- Right actions: `ml-auto flex items-center gap-4` — email (`hidden sm:block`) + sign-out.

### Active link style (both panels)

```
Active:   h-14 flex items-center px-2 mr-4 sm:mr-6 border-b-2 border-brand-primary   text-text-primary   text-sm font-medium
Inactive: h-14 flex items-center px-2 mr-4 sm:mr-6 border-b-2 border-transparent     text-text-secondary text-sm font-medium
          + hover:text-text-primary transition-[var(--transition-base)]
```

- `px-2` (not `px-1`) — ensures minimum 44 px horizontal touch target even on short labels like "Queue".
- `mr-4 sm:mr-6` — tighter gap on mobile preserves space; wider on desktop for breathing room.
- `border-b-2 border-transparent` on inactive links reserves vertical space so no layout shift
  occurs when a link becomes active.

### Dashboard header

Single bar. Same `h-14 sticky top-0 z-50 bg-surface border-b border-border-default`.

```
Left:  Link → /  — brand name (tc('appName')), font-semibold text-sm text-text-primary
Right: LanguageSwitcher  ·  DashboardSignOutButton
```

Inner container `max-w-4xl` — matches the dashboard page content width.  
No nav tabs (dashboard is a single page).  
No email displayed (customer-facing — unnecessary).

### Marketing header

Already correct. Review only — no changes unless a token violation is found.

---

## Implementation

**Steps are sequential — do not reorder.**

### Step 1 — i18n keys

In `messages/en.json`, inside the existing `common.nav` object, add:
```json
"signOut": "Sign out",
"accountSettings": "Account settings"
```
Add the same English-value keys to `fr.json`, `es.json`, `de.json`.

---

### Step 2 — `DashboardSignOutButton`

Create `components/dashboard/DashboardSignOutButton.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

/** Ghost sign-out button for the customer dashboard header. */
export function DashboardSignOutButton() {
  const t = useTranslations('common')
  return (
    <Button variant="ghost" size="sm" onClick={() => signOut()}>
      {t('nav.signOut')}
    </Button>
  )
}
```

---

### Step 3 — `DashboardHeader`

Create `components/dashboard/DashboardHeader.tsx`:
```tsx
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { DashboardSignOutButton } from './DashboardSignOutButton'

/** Sticky customer dashboard header — Server Component. */
export async function DashboardHeader() {
  const t = await getTranslations('common')
  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-border-default">
      <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-semibold text-sm text-text-primary hover:opacity-80 transition-[var(--transition-base)]"
        >
          {t('appName')}
        </Link>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <DashboardSignOutButton />
        </div>
      </div>
    </header>
  )
}
```

---

### Step 4 — `(dashboard)` layout

Create `app/[locale]/(dashboard)/layout.tsx`:
```tsx
import { redirect } from '@/i18n/navigation'   // locale-aware — not next/navigation
import { getCurrentUser } from '@/lib/auth/session'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'

/** Dashboard shell — auth guard + sticky header. */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/signin')

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <DashboardHeader />
      <main>{children}</main>
    </div>
  )
}
```

Notes:
- `redirect` is from `@/i18n/navigation` (preserves locale in the redirect URL).
- No role check beyond `!user` — admins are allowed to view the customer dashboard.
- No `Toaster` — dashboard does not use toasts.

---

### Step 5 — `OperatorNavLinks`

Create `components/operator/OperatorNavLinks.tsx`:
```tsx
'use client'

import { usePathname } from 'next/navigation'  // full path including locale prefix
import { Link } from '@/i18n/navigation'

// Three operator sections in display order
const NAV_ITEMS = [
  { label: 'Queue',       href: '/operator'           },
  { label: 'Archive',     href: '/operator/submitted' },
  { label: 'Preferences', href: '/operator/preferences' },
] as const

/** Operator navigation links — active state via usePathname. No outer wrapper or border. */
export function OperatorNavLinks() {
  const pathname = usePathname()

  function isActive(href: string) {
    // Exact match for /operator to avoid prefix-matching /operator/submitted
    if (href === '/operator') return /\/operator\/?$/.test(pathname)
    return pathname.includes(href)
  }

  return (
    // sm:ml-8 — gap only when brand label is visible (sm+); no gap on mobile
    <nav className="flex items-center sm:ml-8" aria-label="Operator navigation">
      {NAV_ITEMS.map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          className={[
            'h-14 flex items-center px-2 mr-4 sm:mr-6 text-sm font-medium border-b-2',
            'transition-[var(--transition-base)]',
            isActive(href)
              ? 'border-brand-primary text-text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary',
          ].join(' ')}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
```

---

### Step 6 — `AdminNavLinks`

Create `components/admin/AdminNavLinks.tsx`:
```tsx
'use client'

import { usePathname } from 'next/navigation'
import { Link } from '@/i18n/navigation'

const NAV_ITEMS = [
  { label: 'Orders', href: '/admin' },
] as const

/** Admin navigation links — active state via usePathname. No outer wrapper or border. */
export function AdminNavLinks() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/admin') {
      // Active on /admin list AND on /admin/orders/* detail pages
      return /\/admin\/?$/.test(pathname) || pathname.includes('/admin/orders')
    }
    return pathname.includes(href)
  }

  return (
    // sm:ml-8 — gap only when brand label is visible (sm+); no gap on mobile
    <nav className="flex items-center sm:ml-8" aria-label="Admin navigation">
      {NAV_ITEMS.map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          className={[
            'h-14 flex items-center px-2 mr-4 sm:mr-6 text-sm font-medium border-b-2',
            'transition-[var(--transition-base)]',
            isActive(href)
              ? 'border-brand-primary text-text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary',
          ].join(' ')}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
```

---

### Step 7 — Operator layout rewrite

Replace `app/[locale]/(operator)/layout.tsx` with a single-bar header. Preserve the role guard,
`Toaster`, and `OperatorSignOutButton` exactly. Remove the `OperatorNav` import.

```tsx
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { Toaster } from '@/components/ui/sonner'
import { OperatorSignOutButton } from '@/components/operator/OperatorSignOutButton'
import { OperatorNavLinks } from '@/components/operator/OperatorNavLinks'

/** Operator shell — requires operator role. */
export default async function OperatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/operator/signin')
  if (user.role !== 'operator') redirect('/')

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <header className="sticky top-0 z-50 bg-surface border-b border-border-default">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center">
          {/* Brand label — hidden on mobile to prevent overflow; visible sm+ */}
          <span className="hidden sm:block font-semibold text-sm text-text-primary flex-none">
            RemoteNIF Operator
          </span>

          {/* Section nav — Queue / Archive / Preferences */}
          <OperatorNavLinks />

          {/* Right — email + sign out */}
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden sm:block text-sm text-text-muted">
              {user.email}
            </span>
            <OperatorSignOutButton />
          </div>
        </div>
      </header>

      <main>{children}</main>

      {/* Toaster — used by queue submit confirmation */}
      <Toaster richColors position="bottom-right" />
    </div>
  )
}
```

---

### Step 8 — Admin layout rewrite

Replace `app/[locale]/admin/(panel)/layout.tsx` with a single-bar header. Preserve the role
guard and `AdminSignOutButton` exactly.

```tsx
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { AdminSignOutButton } from '@/components/admin/AdminSignOutButton'
import { AdminNavLinks } from '@/components/admin/AdminNavLinks'

/** Admin shell — requires admin role. */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/signin')
  if (user.role !== 'admin') redirect('/')

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <header className="sticky top-0 z-50 bg-surface border-b border-border-default">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center">
          {/* Brand label — hidden on mobile to prevent overflow; visible sm+ */}
          <span className="hidden sm:block font-semibold text-sm text-text-primary flex-none">
            RemoteNIF Admin
          </span>

          {/* Section nav */}
          <AdminNavLinks />

          {/* Right — email + sign out */}
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden sm:block text-sm text-text-muted">
              {user.email}
            </span>
            <AdminSignOutButton />
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  )
}
```

---

### Step 9 — Delete `OperatorNav.tsx`

Delete `components/operator/OperatorNav.tsx`. Its active detection logic lives in
`OperatorNavLinks.tsx`; its outer bar and border are now part of the layout header.

Confirm no other file imports `OperatorNav` before deleting.

---

### Step 10 — Marketing header review

Read `components/shared/MarketingHeader.tsx`. Verify:
- `sticky top-0 z-50` ✓
- `bg-surface` (not raw `var()`) ✓
- `border-border-subtle` (not raw `var()`) ✓
- All links use `Link` from `@/i18n/navigation`, not `<a>` ✓
- No raw color classes ✓

Apply fixes only if a violation is found. No structural changes.

---

### Step 11 — Build and test

```bash
npm run build       # zero TypeScript errors
npx vitest run      # all 292 existing tests still pass
```

---

## Dependencies

No new packages.

---

## Scope Limits

- Do **not** add an account settings link in the dashboard header — route does not exist until
  Feature 17. The i18n key is reserved in Step 1; the link is wired in Feature 17.
- Do **not** add a hamburger / mobile drawer.
- Do **not** modify `components/ui/*`.
- Do **not** modify auth flows, sign-in pages, or Server Actions.
- Do **not** remove the inline auth guard in `dashboard/page.tsx`.
- Do **not** add a footer to any authenticated layout.
- Do **not** add breadcrumbs to admin order detail — Feature 19/21 item.
- Do **not** display the user's email in the dashboard header.
- Keep the marketing header structurally unchanged unless step 10 finds a token violation.

---

## Check When Done

- `app/[locale]/(dashboard)/layout.tsx` exists with auth guard + `DashboardHeader`.
- Visiting `/en/dashboard` unauthenticated redirects to `/en/signin`.
- Dashboard shows one sticky bar: brand link left, language switcher + sign out right.
- Clicking sign out from the dashboard → homepage.
- Operator panel shows **one** sticky bar: brand label · Queue · Archive · Preferences · email · sign out.
- `OperatorNav.tsx` no longer exists in `components/operator/`.
- Operator "Queue" tab is active only on `/operator`; "Archive" only on `/operator/submitted`;
  "Preferences" only on `/operator/preferences`. No false positives.
- Admin panel shows **one** sticky bar: brand label · Orders · email · sign out.
- "Orders" tab is active on `/en/admin` and on `/en/admin/orders/[id]`.
- "Orders" tab is **not** active on `/en/admin/signin`.
- All three headers remain fully visible while scrolling their respective pages.
- No raw `border-[var(--*)]` or `text-[var(--*)]` syntax in any new or modified file.
- `common.nav.signOut` and `common.nav.accountSettings` keys exist in all four locale files.
- Marketing header is visually unchanged.
- All 292 unit tests pass (`npx vitest run`).
- `npm run build` passes with zero errors.
