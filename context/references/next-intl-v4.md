# next-intl v4 — Reference (June 2026)

> Verified against next-intl v4.12.0 (May 2026) and official docs at next-intl.dev.
> This is a decision-and-gotcha reference for this project — not a tutorial.

---

## Current Version

**v4.12.0** (May 2026). The v4 API is stable and mature. No major breaking changes expected in minor releases.

---

## Translation Hooks — Server vs Client

| Context | Hook | Import |
|---|---|---|
| Server Component | `getTranslations('namespace')` | `'next-intl/server'` |
| Client Component | `useTranslations('namespace')` | `'next-intl'` |

```typescript
// Server Component
import { getTranslations } from 'next-intl/server'
export default async function Page() {
  const t = await getTranslations('dashboard')
  return <h1>{t('title')}</h1>
}

// Client Component
'use client'
import { useTranslations } from 'next-intl'
export default function Button() {
  const t = useTranslations('dashboard')
  return <button>{t('submit')}</button>
}
```

**Rule:** Prefer `getTranslations` in Server Components — messages never leave the server. Use `useTranslations` only when the component must be `'use client'` for other reasons.

---

## `NextIntlClientProvider` — Mandatory in v4

In v4, `NextIntlClientProvider` **must** wrap any tree that contains client components using `useTranslations()`. It auto-inherits messages and formats from `i18n/request.ts` — no props required.

```typescript
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl'

export default async function Layout({ children }) {
  return (
    <NextIntlClientProvider>
      {children}
    </NextIntlClientProvider>
  )
}
```

If `NextIntlClientProvider` is missing, client components throw "No intl context found." This was a known issue discovered in Feature 17a (`settings/page.tsx` had to call `setRequestLocale(locale)` to fix a related "No intl context" error).

---

## `setRequestLocale()` — Still Required

Must be called in every layout and page that uses translations, to make the locale available to Server Components:

```typescript
import { setRequestLocale } from 'next-intl/server'

export default async function Page({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale) // ← required
  const t = await getTranslations('page')
  // ...
}
```

This has not changed in v4. Still required even when using the App Router.

---

## Server-Side `redirect` — Correct Pattern

`redirect` from `createNavigation` does **not** return `never` in TypeScript's control-flow analysis. Always use `return redirect(...)` so TypeScript narrows correctly after the guard:

```typescript
// ✅ Correct — TypeScript narrows after this block
import { redirect } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'
import type { Locale } from '@/i18n/routing'

const locale = await getLocale() as Locale
if (!user) return redirect({ href: '/signin', locale })

// TypeScript now knows user is non-null here
const data = await fetchData(user.id)
```

```typescript
// ❌ Wrong — user is still possibly null after this line
if (!user) redirect({ href: '/signin', locale })
const data = await fetchData(user.id) // TS error: user is possibly null
```

**Signature:** `redirect({ href: string | { pathname, params? }, locale: Locale, forcePrefix?: boolean })`
- `locale` is always required — there is no implicit locale from context
- No bare-string form: `redirect('/dashboard')` is a TypeScript error
- No `redirect` export from `'next-intl/server'` — only from `@/i18n/navigation`

**In layouts without `params`:** use `getLocale()` from `'next-intl/server'` to get the current locale:
```typescript
const locale = await getLocale() as Locale
if (!user) return redirect({ href: '/signin', locale })
```

---

## Routing — `defineRouting` + `createNavigation`

Current standard pattern:

```typescript
// i18n/routing.ts
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'fr', 'es', 'de'],
  defaultLocale: 'en',
  localePrefix: 'as-needed', // en has no prefix; /fr/..., /es/..., /de/...
})
```

```typescript
// i18n/navigation.ts
import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

export const { Link, redirect, useRouter, usePathname } = createNavigation(routing)
```

**Always import from `@/i18n/navigation`, never from `next/navigation`:**

```typescript
// ✅ Correct — locale-aware
import { useRouter, usePathname, Link } from '@/i18n/navigation'

// ❌ Wrong — locale-unaware, causes double-locale URLs and broken locale switching
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
```

---

## Locale Switching

```typescript
'use client'
import { useRouter, usePathname } from '@/i18n/navigation'

const router = useRouter()
const pathname = usePathname() // returns path WITHOUT locale prefix: '/', '/pricing', etc.

// Switch locale, stay on current page
router.replace(pathname, { locale: 'de' })
```

---

## Homepage Detection

`usePathname()` from `@/i18n/navigation` strips the locale prefix:

```typescript
const pathname = usePathname()
const isHome = pathname === '/' || pathname === ''
```

No `useLocale()` needed. No string length tricks. No regex.

---

## `localePrefix: 'as-needed'`

- English (`en`) → no prefix → `/`, `/pricing`, `/dashboard`
- French (`fr`) → `/fr/`, `/fr/pricing`, `/fr/dashboard`
- Spanish (`es`) → `/es/`, `/es/pricing`, `/es/dashboard`
- German (`de`) → `/de/`, `/de/pricing`, `/de/dashboard`

When building locale-aware redirect URLs in Server Actions or API routes:
```typescript
const localePath = locale === 'en' ? '/dashboard' : `/${locale}/dashboard`
```

---

## v4 Breaking Changes (from v3)

1. **ESM-only** — CommonJS `require()` imports no longer work.
2. **`NextIntlClientProvider` is mandatory** — v3 had fallback behavior; v4 does not.
3. **Deprecated navigation helpers removed** — use `createNavigation` exclusively. Old `createSharedPathnamesNavigation` and `createLocalizedPathnamesNavigation` are gone.
4. **`getRequestConfig` must return `locale`** — the return signature changed slightly.

---

## Sources

- https://next-intl.dev/docs/getting-started/app-router
- https://next-intl.dev/blog/next-intl-4-0
- https://next-intl.dev/docs/routing/configuration
- https://next-intl.dev/docs/environments/server-client-components
