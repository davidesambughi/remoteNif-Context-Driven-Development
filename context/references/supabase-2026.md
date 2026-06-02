# Supabase — Reference (June 2026)

> Verified against @supabase/ssr v0.10.3 and @supabase/supabase-js current stable.
> This is a decision-and-gotcha reference for this project — not a tutorial.

---

## Package — `@supabase/ssr`

**`@supabase/ssr` is the correct package** for Next.js App Router (v0.10.3 as of May 2026).

Do NOT use the old `@supabase/auth-helpers-nextjs` — it is deprecated and removed.

```typescript
import { createServerClient } from '@supabase/ssr'  // server-side
import { createBrowserClient } from '@supabase/ssr'  // client-side
```

---

## API Keys — New Names (Migration Deadline: End of 2026)

Supabase deprecated the old key names. Migration is required before end of 2026.

| Old name (deprecated) | New name |
|---|---|
| `SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (prefix: `sb_publishable_`) |
| `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SERVICE_SECRET_KEY` (prefix: `sb_secret_`) |

**This project already uses the new names** in `tech-spec.md`, `lib/env.ts`, and client factory files. Verify that actual Supabase dashboard values and `.env.local` use the new format.

---

## Three Client Factories — This Project's Pattern

```
lib/supabase/
├── client.ts   → createBrowserClient()  — client components
├── server.ts   → createServerClient()   — server components, server actions, route handlers
└── admin.ts    → createServerClient() with service_secret key — admin operations only
```

**When to use each:**

| Factory | Use in | Key used |
|---|---|---|
| `client.ts` | `'use client'` components | publishable (anon) |
| `server.ts` | Server Components, Server Actions, Route Handlers | publishable (anon) + cookie access |
| `admin.ts` | Admin actions requiring service role (bypass RLS) | service secret |

**Never expose `admin.ts` to the client.** Never import it from a `'use client'` file.

---

## Auth — Use `getUser()`, Never `getSession()`

```typescript
// ✅ Correct — validates token against Supabase server
const { data: { user } } = await supabase.auth.getUser()

// ❌ Wrong — reads from local cookie only, does not validate token
const { data: { session } } = await supabase.auth.getSession()
```

`getSession()` reads from the cookie without server validation. A tampered or expired token would pass. Always use `getUser()` in server-side code for auth checks.

---

## Session Management in `proxy.ts`

The `updateSession` utility (in `lib/supabase/proxy.ts`) must be called in `proxy.ts` on every request to:
1. Refresh stale JWT tokens before they expire
2. Write updated cookies to the response

```typescript
// proxy.ts — simplified
const { response, hasValidSession } = await updateSession(request)
```

`hasValidSession` is derived from `claims.sub` (the JWT subject), not a cookie regex check.

---

## Row Level Security (RLS)

All tables are locked by default. RLS policies must be explicitly added.

**This project's access model:**
- `customer` role → can only read/write their own rows (enforced via `auth.uid() = user_id` policies)
- `admin` and `operator` roles → use the service-role client (`admin.ts`) which bypasses RLS for admin operations
- Never bypass RLS for customer-facing operations — always use the anon client with policies

---

## Storage — Document Access Pattern

```typescript
// Generate a signed URL for a stored document (60-min expiry)
const { data, error } = await supabase
  .storage
  .from('documents')
  .createSignedUrl(filePath, 3600)
```

This project uses `lib/supabase/documents.ts` (`getSignedDocumentUrl`) as a shared utility for this operation. Do not inline `createSignedUrl` calls in components — use the utility.

---

## OAuth — `signInWithOAuth` Pattern

For server-side OAuth initiation (required by the "mutations go through Server Actions" invariant):

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: callbackUrl,
    skipBrowserRedirect: true, // returns the URL instead of auto-redirecting
  },
})
// data.url is the Google OAuth URL — return it to the client for navigation
```

`skipBrowserRedirect: true` is required when calling from a Server Action. The client component receives the URL and does `window.location.href = url`.

---

## OAuth Callback — `exchangeCodeForSession`

```typescript
// app/auth/callback/route.ts (Route Handler, not a Server Action)
const { error } = await supabase.auth.exchangeCodeForSession(code)

// Known issue (supabase-js >= v2.91.0): SIGNED_IN event fires via setTimeout.
// Yield the event loop to ensure cookies are written before the redirect.
await new Promise((resolve) => setTimeout(resolve, 0))
```

The `setTimeout(resolve, 0)` workaround is documented and intentional. Do not remove it.

---

## Known Issues

- **Session desync in Next.js**: Server Components may read stale session state because of request-level caching. Solution: use React `cache()` on `getCurrentUser()` so it runs once per request (already done in `lib/auth/session.ts`).
- **`handle_new_user` trigger**: Fires on every `auth.users` insert regardless of auth provider. For OAuth users, `language` defaults to `'en'` since Google does not pass it — the OAuth callback must patch this after `exchangeCodeForSession`.

---

## Sources

- https://supabase.com/docs/guides/auth/server-side/nextjs
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://www.npmjs.com/package/@supabase/ssr
- https://github.com/supabase/ssr/releases
