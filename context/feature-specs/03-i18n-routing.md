# 03 — i18n Routing + Proxy

Read `context/AGENTS.md`, `context/progress-tracker.md`, `context/architecture-context.md`, `context/ui-context.md` before starting.

Set up locale-aware routing for all four languages (EN/FR/ES/DE), load the correct fonts, and wire up `proxy.ts` with both next-intl locale detection and session-cookie-based protection for authenticated routes — so that every subsequent feature can be built inside the correct `[locale]` segment with translations ready.

---

## Constraints

### Tokens (UI — font loading)

| Purpose | Token | Value |
|---------|-------|-------|
| Sans-serif font | `--font-sans` (via `--font-inter`) | Inter |
| Monospace font | `--font-mono` (via `--font-jetbrains-mono`) | JetBrains Mono |

Font loading rules:
- Load via `next/font/google` — never via `<link>` or `@import`
- Font CSS variables in next/font must use distinct names (`--font-inter`, `--font-jetbrains-mono`) to avoid cascade conflicts with the `--font-sans` / `--font-mono` definitions already in `globals.css`
- `globals.css` `--font-sans` and `--font-mono` must be updated to reference the injected variables as first value, with the existing fallback stacks kept

### Architecture

- `i18n/routing.ts` — `defineRouting` config (locales, defaultLocale, localePrefix). Single source of truth for locale config, shared by proxy and navigation.
- `i18n/request.ts` — `getRequestConfig` (next-intl v4: `requestLocale` is a Promise, must be awaited; `hasLocale` for validation; `messages` field is required in the return).
- `i18n/navigation.ts` — `createNavigation(routing)` exports. All navigation in the app must use these locale-aware wrappers — never `next/link` or `next/navigation` directly.
- `proxy.ts` at project root — routing only. No business logic, no DB queries. Compose next-intl i18n routing with a session cookie presence check for protected paths.
- `app/layout.tsx` — becomes a minimal pass-through (`return children`). No `<html>` or `<body>` — those move to the locale layout so `lang={locale}` is set correctly.
- `app/[locale]/layout.tsx` — renders `<html lang={locale}>` and `<body>`. Loads fonts. Imports `globals.css`. Wraps content with `NextIntlClientProvider` (required in next-intl v4). Calls `setRequestLocale(locale)` before any translation function.
- `next.config.ts` — wrapped with `createNextIntlPlugin('./i18n/request.ts')`.
- `app/page.tsx` — delete. Content moves to `app/[locale]/(marketing)/page.tsx` (minimal placeholder, replaced by Feature 05).
- Server Components by default — no `'use client'` in any file created here.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- `params` is `Promise<{ locale: string }>` in Next.js 16 — always `await params` before accessing `locale`.
- Infer locale type from `routing.locales` — never use raw `string` for locale values.

### Validation

No Zod schemas in this feature — locale validation uses next-intl's `hasLocale` utility against `routing.locales`.

### i18n

- Translation files live in `messages/[locale].json`.
- This feature creates those files with one structural placeholder key only — actual copy is added per feature spec.
- All four files (`en.json`, `fr.json`, `es.json`, `de.json`) must have identical key structure.
- No hardcoded English strings in JSX — even the placeholder page must use a translation key.

---

## Implementation

### Step 1 — Install next-intl

Install: `next-intl`

### Step 2 — `i18n/routing.ts`

```typescript
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'fr', 'es', 'de'],
  defaultLocale: 'en',
  // Default locale (en) has no prefix: /pricing not /en/pricing
  // Other locales are prefixed: /fr/pricing, /es/pricing, /de/pricing
  localePrefix: 'as-needed',
})

export type Locale = (typeof routing.locales)[number]
```

### Step 3 — `i18n/request.ts`

next-intl v4 requirements:
- `requestLocale` is a Promise — must be `await`ed
- `hasLocale` replaces manual `routing.locales.includes()` checks
- `messages` field is required in the return object

```typescript
import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
```

### Step 4 — `i18n/navigation.ts`

```typescript
import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
```

These are the only navigation primitives used anywhere in the app — never import from `next/link` or `next/navigation` directly.

### Step 5 — Translation files (`messages/`)

Create all four files with identical structure. French, Spanish, and German values are left in English for now — copy is translated per feature spec.

`messages/en.json`:
```json
{
  "common": {
    "appName": "RemoteNIF"
  }
}
```

`messages/fr.json`, `messages/es.json`, `messages/de.json`: same structure, same values for now.

### Step 6 — Update `next.config.ts`

Wrap the existing config with the next-intl plugin. The plugin path must match where `i18n/request.ts` lives:

```typescript
import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  // existing options stay here
}

export default withNextIntl(nextConfig)
```

### Step 7 — Update `globals.css` font tokens

The two font token definitions in `globals.css` `:root` must be updated to reference the next/font CSS variables as the first value, with the existing system fallbacks kept:

```css
--font-sans: var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: var(--font-jetbrains-mono), 'SFMono-Regular', Menlo, Monaco, Consolas, monospace;
```

### Step 8 — `app/layout.tsx` (root — pass-through)

Replace the entire file. The root layout becomes a minimal pass-through. `<html>` and `<body>` move to the locale layout so `lang={locale}` is applied correctly:

```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

No imports, no metadata, no fonts here.

### Step 9 — `app/[locale]/layout.tsx` (locale layout)

This is where `<html>`, `<body>`, fonts, `globals.css`, and next-intl setup live:

- Import `Inter` and `JetBrains_Mono` from `next/font/google`
  - Inter: `variable: '--font-inter'`, `subsets: ['latin']`
  - JetBrains Mono: `variable: '--font-jetbrains-mono'`, `subsets: ['latin']`, weights `['400', '500', '600', '700']`
- Import `globals.css` from `@/app/globals.css`
- Import `NextIntlClientProvider` from `next-intl`
- Import `hasLocale` from `next-intl`
- Import `notFound` from `next/navigation`
- Import `setRequestLocale` from `next-intl/server`
- Import `routing` from `@/i18n/routing`

`generateStaticParams` must return all supported locales so Next.js can statically generate each locale variant:
```typescript
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}
```

Props type: `{ children: React.ReactNode; params: Promise<{ locale: string }> }`

In the component body:
1. `const { locale } = await params`
2. Validate: `if (!hasLocale(routing.locales, locale)) notFound()`
3. `setRequestLocale(locale)` — must be called before any translation function
4. Return:
```tsx
<html lang={locale} className={`${inter.variable} ${jetbrainsMono.variable}`}>
  <body>
    <NextIntlClientProvider>
      {children}
    </NextIntlClientProvider>
  </body>
</html>
```

### Step 10 — `proxy.ts` (i18n routing + session guard)

Two responsibilities, in order:
1. For protected routes: check Supabase session cookie presence — redirect to locale-aware sign-in if missing
2. For all requests: delegate to next-intl's `createMiddleware` for locale routing

**Protected route pattern:** `/\/(dashboard|admin|operator)(\/|$)/` — matches regardless of locale prefix.

**Session check:** look for any cookie matching `/^sb-.+-auth-token/`. This is a cookie presence check only — JWT validation happens in layouts and Server Actions.

**Locale detection for redirect:** find the first path segment that matches a known locale. If none found, use `routing.defaultLocale`. With `localePrefix: 'as-needed'`, the default locale has no prefix in the URL — so the redirect for English is `/signin`, for French `/fr/signin`.

```typescript
import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const handleI18n = createMiddleware(routing)

const PROTECTED = /\/(dashboard|admin|operator)(\/|$)/

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PROTECTED.test(pathname)) {
    const hasSession = request.cookies
      .getAll()
      .some(({ name }) => /^sb-.+-auth-token/.test(name))

    if (!hasSession) {
      const localeFromPath = routing.locales.find(
        (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`,
      )
      const locale = localeFromPath ?? routing.defaultLocale
      const signinPath =
        locale === routing.defaultLocale ? '/signin' : `/${locale}/signin`

      return NextResponse.redirect(new URL(signinPath, request.url))
    }
  }

  return handleI18n(request)
}

export const config = {
  // Exclude API routes, Next.js internals, Vercel internals, and static files
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
}
```

### Step 11 — Delete `app/page.tsx`

Delete the scaffold placeholder. It is replaced in the next step.

### Step 12 — `app/[locale]/(marketing)/page.tsx` (placeholder)

Minimal placeholder — replaced entirely by Feature 05:

```typescript
import { useTranslations } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { use } from 'react'

export default function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = use(params)
  setRequestLocale(locale)

  const t = useTranslations('common')

  return <p>{t('appName')}</p>
}
```

### Step 13 — Update `progress-tracker.md`

Mark Feature 03 complete. Update "Current Goal" to Feature 04.

---

## Dependencies

Install: `next-intl`

---

## Scope Limits

- Do not build any actual page content — the homepage and pricing page are Feature 05 and 06.
- Do not set up Supabase auth session refresh in `proxy.ts` — that belongs in a dedicated auth middleware step within the auth feature (Feature 04). Proxy does cookie presence check only.
- Do not add locale-specific metadata (`generateMetadata`) — added per page in each feature spec.
- Do not add a language switcher UI component — that is a shared component built in Feature 04 or 05.
- Do not translate any copy beyond the `common.appName` placeholder — translations are added per feature spec.
- Do not set up `not-found.tsx` locale-awareness — out of scope for MVP.
- Keep this focused on: routing infrastructure, font loading, proxy, translation file skeleton.

---

## Check When Done

- `i18n/routing.ts`, `i18n/request.ts`, `i18n/navigation.ts` all exist.
- `messages/en.json`, `messages/fr.json`, `messages/es.json`, `messages/de.json` all exist with identical key structure.
- `proxy.ts` exists at project root with correct matcher.
- `app/layout.tsx` is a pass-through (returns `children` only).
- `app/[locale]/layout.tsx` exists with `generateStaticParams`, locale validation, `setRequestLocale`, `NextIntlClientProvider`, and correct font variables on `<html>`.
- `app/page.tsx` is deleted.
- `app/[locale]/(marketing)/page.tsx` exists and renders `t('common.appName')`.
- `next.config.ts` wraps config with `createNextIntlPlugin('./i18n/request.ts')`.
- `globals.css` font tokens reference `var(--font-inter)` and `var(--font-jetbrains-mono)`.
- Navigating to `http://localhost:3000` renders "RemoteNIF" without errors.
- Navigating to `http://localhost:3000/fr` renders "RemoteNIF" without errors.
- `npm run build` passes.
