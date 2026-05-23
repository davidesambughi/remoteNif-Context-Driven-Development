# 20a — SEO Foundation & Localization

Read before starting: `context/AGENTS.md`, `context/architecture-context.md`,
`context/ui-context.md`, `context/progress-tracker.md`.

Establish canonical URLs, hreflang alternates, and baseline metadata across all public
and protected pages so search engines index exactly the right content.

---

## Constraints

### Tokens (UI features only)

_No UI components in this feature — metadata only. Skip._

### Architecture

- `lib/seo.ts` — new shared utility. Contains `buildAlternates(locale, href)` only.
  No business logic, no DB queries. Pure path computation.
- Metadata exports (`metadata` object or `generateMetadata` function) live in
  `layout.tsx` or `page.tsx` files — never in components.
- `generateMetadata` is Server Component only — no `"use client"` in any file touched here.
- Use `env.NEXT_PUBLIC_APP_URL` from `lib/env.ts` (never `process.env.*` directly in lib/).
- Use `getPathname` from `@/i18n/navigation` (locale-aware, respects `as-needed` prefix config).
- `generateMetadata` in pages that need locale receives `params: Promise<{ locale: Locale }>`;
  await it to extract `locale` before calling `buildAlternates`.

### TypeScript

- Strict mode. No `any`. No type assertions.
- Infer types from Zod schemas with `z.infer<typeof Schema>` — no duplicate type definitions.
- Use `Metadata` and `ResolvingMetadata` types from `'next'` for all metadata objects.
- Return type of `buildAlternates` must be an explicit `interface`, not inferred.

### Validation

_No new Zod schemas. `env.NEXT_PUBLIC_APP_URL` is already validated in `lib/env.ts`._

### i18n

- **English-only titles and descriptions are sufficient for 20a.**
  Locale-translated metadata is a stretch goal deferred to 21 (UI Polish).
- No new translation keys in this feature.
- hreflang language tags use short locale codes (`'en'`, `'fr'`, `'es'`, `'de'`),
  not region codes (`'en-US'`, `'de-DE'`), to match the routing config.

---

## Design

_No UI. Metadata lives in `<head>` — invisible to users._

---

## Background: How hreflang Works in This Project

The routing config uses `localePrefix: 'as-needed'`:

| Locale | Homepage path | Pricing path |
|--------|--------------|--------------|
| `en`   | `/`          | `/pricing`   |
| `fr`   | `/fr`        | `/fr/pricing`|
| `es`   | `/es`        | `/es/pricing`|
| `de`   | `/de`        | `/de/pricing`|

Google's required pattern (per page, all locales must declare all alternates):

```html
<!-- On /fr/pricing -->
<link rel="canonical"  href="https://remotenif.com/fr/pricing" />
<link rel="alternate"  hreflang="en" href="https://remotenif.com/pricing" />
<link rel="alternate"  hreflang="fr" href="https://remotenif.com/fr/pricing" />
<link rel="alternate"  hreflang="es" href="https://remotenif.com/es/pricing" />
<link rel="alternate"  hreflang="de" href="https://remotenif.com/de/pricing" />
<link rel="alternate"  hreflang="x-default" href="https://remotenif.com/pricing" />
```

`canonical` = the current locale's own URL (self-referencing — Google's recommendation).
`x-default` = English URL (no prefix) — signals the fallback for unmatched locales.

---

## Implementation

### Step 1 — Create `lib/seo.ts` (shared alternates utility)

Create `lib/seo.ts`:

```typescript
import { getPathname } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'
import { env } from '@/lib/env'

// Shape returned by buildAlternates — used directly in Metadata.alternates
export interface PageAlternates {
  canonical: string
  languages: Record<string, string>
}

/**
 * Build canonical + hreflang alternates for a public page.
 *
 * @param locale - current page locale (determines canonical URL)
 * @param href   - locale-neutral path, e.g. '/' or '/pricing'
 *
 * canonical is the current locale's own URL (self-referencing per Google spec).
 * x-default points to the default locale (en, no URL prefix).
 * All four locale variants are always included in languages.
 */
export function buildAlternates(locale: Locale, href: string): PageAlternates {
  const base = env.NEXT_PUBLIC_APP_URL
  const languages: Record<string, string> = {}

  // Add an entry for every supported locale
  for (const l of routing.locales) {
    const path = getPathname({ locale: l, href })
    languages[l] = `${base}${path}`
  }

  // x-default = default locale (en, no prefix)
  const defaultPath = getPathname({ locale: routing.defaultLocale, href })
  languages['x-default'] = `${base}${defaultPath}`

  // Self-referencing canonical for the current locale
  const currentPath = getPathname({ locale, href })
  return {
    canonical: `${base}${currentPath}`,
    languages,
  }
}
```

> **Note:** `getPathname` from `@/i18n/navigation` is a pure synchronous function — no request
> context needed. Safe to call from any server-side module.

---

### Step 2 — Homepage: add `generateMetadata`

File: `app/[locale]/(marketing)/page.tsx`

Add `generateMetadata` above the existing default export. The page component itself is
unchanged — do not remove `use(params)` or `setRequestLocale(locale)`.

```typescript
import type { Metadata } from 'next'
import { buildAlternates } from '@/lib/seo'
import type { Locale } from '@/i18n/routing'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const { canonical, languages } = buildAlternates(locale, '/')

  return {
    title: 'Get Your Portuguese NIF Online — Fast & Fully Remote',
    description:
      'Apply for a Portuguese NIF (Tax Identification Number) from anywhere. ' +
      'Choose Essential, Standard, or Express. No hidden fees.',
    alternates: { canonical, languages },
  }
}
```

> The root layout's `title.template: '%s | RemoteNIF'` wraps this title automatically,
> producing: `Get Your Portuguese NIF Online — Fast & Fully Remote | RemoteNIF`.

---

### Step 3 — Pricing page: add `generateMetadata`

File: `app/[locale]/(marketing)/pricing/page.tsx`

Add `generateMetadata` above the existing `PricingPage` default export.
The page component itself is unchanged.

```typescript
import type { Metadata } from 'next'
import { buildAlternates } from '@/lib/seo'
import type { Locale } from '@/i18n/routing'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const { canonical, languages } = buildAlternates(locale, '/pricing')

  return {
    title: 'Pricing — NIF Application Plans',
    description:
      'Compare Essential (€79), Standard (€129), and Express (€179) plans. ' +
      'All include AI document review and admin verification.',
    alternates: { canonical, languages },
  }
}
```

---

### Step 4 — Protected route groups: add `robots: noindex` via layouts

Add a static `metadata` export to each of the four authenticated/auth-only layouts.
**Do not change any other code in these files.**

**`app/[locale]/(auth)/layout.tsx`** — customer auth pages (signin, signup, reset-password, new-password):

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}
```

**`app/[locale]/(dashboard)/layout.tsx`** — customer dashboard (dashboard, settings, renewal):

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}
```

**`app/[locale]/admin/(panel)/layout.tsx`** — admin panel (order list, order detail):

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}
```

**`app/[locale]/(operator)/layout.tsx`** — operator panel (queue, submitted, preferences):

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}
```

---

### Step 5 — Standalone sign-in pages: add `metadata` with title + noindex

These sign-in pages are NOT under a route group layout that covers them — add metadata
directly on each page. **Do not change any other code in these files.**

**`app/[locale]/admin/signin/page.tsx`** — admin sign-in:

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Sign In',
  robots: { index: false, follow: false },
}
```

**`app/[locale]/operator/signin/page.tsx`** — operator sign-in:

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Operator Sign In',
  robots: { index: false, follow: false },
}
```

---

### Step 6 — Verify root layout `metadataBase`

Open `app/layout.tsx`. Confirm `metadataBase` already reads from `NEXT_PUBLIC_APP_URL`.
**No code changes needed** — this step is a verification only.

The current root layout already exports:
```typescript
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://remotenif.com'),
  title: {
    template: '%s | RemoteNIF',
    default: 'RemoteNIF — Get Your Portuguese NIF Online',
  },
  description: '...',
}
```

This is correct. Leave it exactly as is.

---

## Dependencies

No new packages required. `next`, `next-intl`, `zod` already installed.

---

## Scope Limits

- **Do not add OG images** — that is Feature 20b.
- **Do not add JSON-LD structured data** — that is Feature 20c.
- **Do not add `robots.ts`, `sitemap.ts`, or `llms.txt`** — that is Feature 20d.
- **Do not translate titles or descriptions** — English only for 20a; locale-specific
  metadata is a stretch goal for Feature 21.
- **Do not touch `components/ui/*`** — no UI changes in this feature.
- **Do not add metadata to dashboard, admin, or operator individual pages** — the
  layout-level `robots: noindex` in Step 4 covers those pages via metadata inheritance.
- **Do not change any page component logic, layout structure, or i18n keys** — metadata
  exports only.
- **Do not add `google-site-verification` or other verification tags** — out of scope.

---

## Check When Done

- [ ] `lib/seo.ts` exists and exports `buildAlternates(locale, href): PageAlternates`.
- [ ] `buildAlternates('fr', '/pricing')` returns:
  - `canonical: 'https://remotenif.com/fr/pricing'`
  - `languages.en: 'https://remotenif.com/pricing'`
  - `languages.fr: 'https://remotenif.com/fr/pricing'`
  - `languages['x-default']: 'https://remotenif.com/pricing'`
- [ ] Homepage (`/`) renders `<link rel="canonical" href="https://remotenif.com/" />` in `<head>`.
- [ ] Homepage (`/fr`) renders `<link rel="canonical" href="https://remotenif.com/fr" />` and four `hreflang` alternates.
- [ ] Pricing page (`/pricing`) has a distinct `<title>` tag (not just the root default).
- [ ] `/fr/pricing` renders `<link rel="canonical" href="https://remotenif.com/fr/pricing" />`.
- [ ] `/signin` renders `<meta name="robots" content="noindex, nofollow" />`.
- [ ] `/signup` renders `<meta name="robots" content="noindex, nofollow" />`.
- [ ] `/dashboard` renders `<meta name="robots" content="noindex, nofollow" />`.
- [ ] `/admin` renders `<meta name="robots" content="noindex, nofollow" />`.
- [ ] `/admin/signin` renders `<meta name="robots" content="noindex, nofollow" />` and title `Admin Sign In | RemoteNIF`.
- [ ] `/operator/signin` renders `<meta name="robots" content="noindex, nofollow" />` and title `Operator Sign In | RemoteNIF`.
- [ ] No new Zod schemas, no new i18n keys, no UI component changes.
- [ ] `npm run build` passes.
