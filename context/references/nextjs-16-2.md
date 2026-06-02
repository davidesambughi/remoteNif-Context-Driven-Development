# Next.js 16.2 — Reference (June 2026)

> Verified against Next.js 16.2 release notes and official docs.
> This is a decision-and-gotcha reference for this project — not a tutorial.

---

## Caching — Default Changed

The default caching behavior **flipped** from Next.js 15:

| | Next.js 14/15 | Next.js 16 |
|---|---|---|
| `fetch()` default | `force-cache` (cached) | `no-store` (dynamic) |
| Opt-in to caching | Nothing needed | Explicit `cache: 'force-cache'` or `revalidate` |

**What this means for this project:**
- API calls and `fetch()` inside Server Components are dynamic by default — correct for order/document data.
- If any static content was relying on implicit caching, it is now dynamic. Check pricing page and homepage.

---

## `use cache` — Now Stable

`use cache` directive, `cacheLife()`, and `cacheTag()` are **stable** as of Next.js 16. No longer prefixed with `unstable_`.

```typescript
// ✅ Current (Next.js 16)
'use cache'
import { cacheLife, cacheTag } from 'next/cache'

export async function getStaticData() {
  cacheTag('static-data')
  cacheLife('hours')
  // ...
}

// ❌ Old (Next.js 14/15)
import { unstable_cache } from 'next/cache'
```

**Enable via `next.config.ts`:**
```typescript
const nextConfig = {
  experimental: {
    cacheComponents: true, // required to use `use cache`
  },
}
```

**Note:** This project deferred `cacheComponents: true` in Feature 14d because it was unstable at the time. It is now safe to enable. Relevant for any future static or semi-static data fetching.

---

## `revalidateTag` — Signature Changed

```typescript
// ✅ Current (Next.js 16)
revalidateTag('products', { expire: 0 })

// Or use the new API
import { updateTag } from 'next/cache'
updateTag('products')

// ❌ Old single-argument form — broken in Next.js 16
revalidateTag('products')
```

**Check:** Search the codebase for `revalidateTag(` calls using a single string argument — they are silently broken.

---

## `proxy.ts` — Correct (Already Done)

Next.js 16 renamed `middleware.ts` → `proxy.ts` and `middleware()` → `proxy()`. This project already uses `proxy.ts`. No action needed.

**Runtime note:** `proxy.ts` runs on the **Node.js runtime only**. Edge runtime is no longer supported.

---

## Turbopack — Stable and Default

Turbopack is the default bundler for both `next dev` and `next build` in Next.js 16.

- ~400–900% faster compile times in real apps
- Server Fast Refresh: ~67–100% faster
- SRI (Subresource Integrity) support added in 16.2
- `postcss.config.ts` now supported (TypeScript config)

No action needed — already configured by default.

---

## Server Components — Default

All components in `app/` are Server Components unless marked `'use client'`. This has not changed.

**When to add `'use client'`:**
- Browser APIs (`window`, `localStorage`, etc.)
- Event handlers (`onClick`, `onChange`, etc.)
- React hooks (`useState`, `useEffect`, `useRef`, etc.)
- Third-party libraries that require client rendering

**URL-based conditional logic** (e.g., "is this the homepage?") requires `'use client'` and `usePathname()`. No Server Component alternative — this is intentional in Next.js 16.

---

## React `cache()` — Request-Level Deduplication

Use `cache()` from React to deduplicate calls within a single request (e.g., `getCurrentUser()` called in both layout and page):

```typescript
import { cache } from 'react'

export const getCurrentUser = cache(async () => {
  // runs once per request even if called multiple times
})
```

This project already applies this in `lib/auth/session.ts` (Feature 14d).

---

## Data Fetching Pattern

```typescript
// ✅ Preferred — fetch in Server Component, pass as prop
export default async function Page() {
  const data = await getData() // runs on server
  return <ClientComponent data={data} />
}

// ❌ Avoid — fetching inside Client Components when Server Component can do it
'use client'
export default function Page() {
  const [data, setData] = useState(null)
  useEffect(() => { fetch('/api/data').then(...) }, []) // unnecessary roundtrip
}
```

---

## Sources

- https://nextjs.org/blog/next-16
- https://nextjs.org/blog/next-16-2
- https://nextjs.org/docs/app/guides/upgrading/version-16
- https://nextjs.org/docs/app/getting-started/caching
