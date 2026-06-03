> **NOT IMPLEMENTED YET**

# 23 — Google OAuth Sign-In (Customer Only)

<!-- Read before starting: AGENTS.md, context/progress-tracker.md, context/architecture-context.md,
     context/user-flows.md (Flow 2, Flow 6a), context/code-standards.md -->

Add "Continue with Google" to the customer sign-in and sign-up screens only.
Admin and operator auth remain email/password only.

---

## Constraints

### Tokens (UI features only)

| Purpose | Token | Tailwind utility |
|---------|-------|-----------------|
| Button background | `var(--bg-surface)` | `bg-surface` |
| Button hover | `var(--bg-subtle)` | `hover:bg-subtle` |
| Button border | `var(--border-default)` | `border-border-default` |
| Button text | `var(--text-primary)` | `text-text-primary` |
| Divider text | `var(--text-muted)` | `text-text-muted` |
| Divider line | `var(--border-subtle)` | `border-border-subtle` |
| Error text | `var(--status-error)` | `text-error` |

Rules that always apply:
- No raw Tailwind color classes (`zinc-*`, `slate-*`, `blue-*`). Tokens only.
- No hardcoded hex or rgb values.
- Mobile-first. Add breakpoint variants only where layout actually changes.
- Border radius from scale — use `--radius-md` for the button (matches form inputs).
- Shadcn `Button` with `variant="outline"` as the base.

### Architecture

- `signInWithOAuth` must **not** be called directly from the client component.
  Use a Server Action (`app/actions/auth.ts`) that returns a URL. The client component
  calls the Server Action, receives the URL, then does `window.location.href = url`.
  This keeps the project's "mutations go through Server Actions" invariant intact.
- The Server Action passes `skipBrowserRedirect: true` to `signInWithOAuth` so supabase-js
  returns the OAuth URL instead of triggering an internal browser redirect. The client drives
  the navigation after receiving the URL.
- OAuth callback route goes in `app/auth/callback/route.ts` — outside `[locale]`, same level
  as the existing `app/auth/confirm/route.ts`.
- The matcher in `proxy.ts` (`/((?!api|auth|_next|_vercel|.*\\..*).*) `) already excludes
  any path starting with `/auth/`, so `/auth/callback` is already excluded from next-intl
  interception. **`proxy.ts` does not need to be modified.**
- The `handle_new_user` trigger (`lib/db/migrations/0001_handle_new_user.sql`) fires on every
  `auth.users` insert regardless of provider — the `public.users` row is created automatically.
  However, Google OAuth does not pass a `language` field in `raw_user_meta_data`, so the trigger
  defaults to `'en'`. The callback route must patch the language after session exchange.
- Tier preservation: pass `tier` as a query param on `redirectTo` into the callback.
  The callback redirects to `/dashboard?checkout_tier=${tier}`. The existing `CheckoutResumer`
  handles it from there — no new checkout logic needed.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- Infer types from Zod schemas with `z.infer<typeof Schema>` — no duplicate type definitions.
- Use `interface` for props. Use `type` for unions.

### Validation

```typescript
// lib/validations/auth.ts — add this schema
export const googleSignInSchema = z.object({
  locale: z.enum(['en', 'fr', 'es', 'de']).default('en'),
  tier: z.enum(['essential', 'standard', 'express']).optional(),
})
export type GoogleSignInInput = z.infer<typeof googleSignInSchema>
```

### i18n

- All user-facing strings under `auth.google.*` in all 4 locale files.
- Use `useTranslations('auth.google')` in `GoogleSignInButton`.
- No hardcoded English strings in JSX.
- Add the same keys (English values) to `fr.json`, `es.json`, `de.json`.

Keys needed:
```json
"auth": {
  "google": {
    "button": "Continue with Google",
    "divider": "or",
    "error": "Google sign-in failed. Please try again."
  }
}
```

---

## Design

**Placement:** Google button → divider ("or") → existing email/password form.
Social option appears first (industry convention). Placed on both `/signin` and `/signup`.

**Divider:**
```tsx
<div className="relative flex items-center gap-3">
  <div className="flex-1 border-t border-border-subtle" />
  <span className="text-[length:var(--text-xs)] text-text-muted">{t('divider')}</span>
  <div className="flex-1 border-t border-border-subtle" />
</div>
```

**Google button:**
- Full width (`w-full`), `variant="outline"`, border `border-border-default`, rounded-md
- Standard Google "G" logo SVG (inline, 4-color, `h-5 w-5`) on the left — use the official
  4-color SVG, do not replace with a Lucide icon or apply token colors to the SVG paths
- Text: `"Continue with Google"`, `text-sm`, `font-medium`, `text-text-primary`
- Loading state: replace the Google logo with `Loader2` spinner (`animate-spin h-5 w-5`),
  disable the button, keep the text
- Error state: small red inline message below the button (`text-error text-sm mt-2`)

---

## Manual prerequisite (complete before running implementation steps)

These are external configuration steps — not code changes:

1. Supabase dashboard → Authentication → Providers → Google → enable
2. Paste Google OAuth Client ID and Client Secret (from Google Cloud Console)
3. Copy the **Supabase Callback URL** shown in the Supabase dashboard
   (format: `https://<project-ref>.supabase.co/auth/v1/callback`)
4. In Google Cloud Console → Credentials → OAuth 2.0 Client ID → Authorized redirect URIs:
   add the Supabase Callback URL from step 3.
   **Note:** Google redirects to Supabase, not to the app. The app's `/auth/callback` route
   is where Supabase redirects after it processes Google's response — Google never sees it.
5. Supabase dashboard → Authentication → URL Configuration → Redirect URLs:
   add `http://localhost:3000/**` (dev) and `https://remotenif.com/**` (prod).
   The `**` wildcard covers `/auth/callback?locale=fr&tier=express` and all variants.

---

## Implementation

### Step 1 — Add `signInWithGoogle` Server Action to `app/actions/auth.ts`

Add this export at the bottom of the file:

```typescript
export async function signInWithGoogle(
  input: unknown,
): Promise<ActionResult<{ url: string }>> {
  const parsed = googleSignInSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'auth.signIn.errors.generic' }

  const { locale, tier } = parsed.data
  const supabase = await createClient()

  // Build callback URL — locale and optional tier are passed as query params
  // so the callback route can restore the correct post-auth destination.
  const callbackUrl = new URL(`${env.NEXT_PUBLIC_APP_URL}/auth/callback`)
  callbackUrl.searchParams.set('locale', locale)
  if (tier) callbackUrl.searchParams.set('tier', tier)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl.toString(),
      // skipBrowserRedirect: true — returns the OAuth URL instead of auto-redirecting.
      // Required when calling from a Server Action: the client component drives navigation.
      skipBrowserRedirect: true,
      queryParams: {
        // Store refresh token so session survives browser close
        access_type: 'offline',
        // Force account picker on every sign-in (better UX for multi-account users)
        prompt: 'consent',
      },
    },
  })

  if (error || !data.url) {
    return { success: false, error: 'auth.signIn.errors.generic' }
  }

  return { success: true, data: { url: data.url } }
}
```

Also import `googleSignInSchema` at the top of the file:
```typescript
import { signUpSchema, signInSchema, requestPasswordResetSchema, updatePasswordSchema, googleSignInSchema } from '@/lib/validations/auth'
```

### Step 2 — Add `googleSignInSchema` to `lib/validations/auth.ts`

```typescript
export const googleSignInSchema = z.object({
  locale: z.enum(['en', 'fr', 'es', 'de']).default('en'),
  tier: z.enum(['essential', 'standard', 'express']).optional(),
})
export type GoogleSignInInput = z.infer<typeof googleSignInSchema>
```

### Step 3 — Create `app/auth/callback/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// OAuth callback: Supabase redirects here after Google's OAuth flow completes.
// Outside [locale] so next-intl middleware does not intercept or prefix it.
// The proxy.ts matcher already excludes /auth/* — no matcher change needed.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')
  const locale = searchParams.get('locale') ?? 'en'
  const tier = searchParams.get('tier')

  // No code — user cancelled or Google returned an error
  if (!code) {
    return NextResponse.redirect(`${origin}/signin?error=oauth_failed`)
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(`${origin}/signin?error=oauth_failed`)
  }

  // Workaround for supabase-js >=v2.91.0 issue: exchangeCodeForSession defers the
  // SIGNED_IN event via setTimeout, which may not fire before the Route Handler returns.
  // Yielding the event loop ensures cookies are written before the redirect response.
  await new Promise((resolve) => setTimeout(resolve, 0))

  // Patch the user's language preference in public.users.
  // The handle_new_user trigger defaults language to 'en' for OAuth users since Google
  // does not pass a language field in raw_user_meta_data. Only overwrite if still default.
  const validLocales = ['en', 'fr', 'es', 'de'] as const
  type Locale = (typeof validLocales)[number]
  const safeLocale: Locale = (validLocales as readonly string[]).includes(locale)
    ? (locale as Locale)
    : 'en'

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase
      .from('users')
      .update({ language: safeLocale })
      .eq('id', user.id)
      .eq('language', 'en') // only patch if still the trigger default
  }

  // Build post-auth destination — respects localePrefix: 'as-needed' (en has no prefix)
  const validTiers = ['essential', 'standard', 'express']
  const hasTier = tier && validTiers.includes(tier)
  const destination = hasTier ? '/dashboard?checkout_tier=' + tier : '/dashboard'
  const localePath = safeLocale === 'en' ? destination : `/${safeLocale}${destination}`

  return NextResponse.redirect(`${origin}${localePath}`)
}
```

### Step 4 — Create `components/auth/GoogleSignInButton.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signInWithGoogle } from '@/app/actions/auth'
import type { Tier } from '@/lib/pricing'

export default function GoogleSignInButton() {
  const t = useTranslations('auth.google')
  const locale = useLocale()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Preserve tier from URL for the checkout funnel (same logic as SignInForm/SignUpForm)
  const tierParam = searchParams.get('tier')
  const tier: Tier | undefined =
    tierParam === 'essential' || tierParam === 'standard' || tierParam === 'express'
      ? tierParam
      : undefined

  async function handleClick() {
    setIsLoading(true)
    setError(null)

    const result = await signInWithGoogle({ locale, tier })

    if (!result.success || !result.data?.url) {
      setError(t('error'))
      setIsLoading(false)
      return
    }

    // Navigate to Google's OAuth page — browser takes over from here
    window.location.href = result.data.url
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={isLoading}
        className="w-full bg-surface border-border-default hover:bg-subtle text-text-primary"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
        ) : (
          // Standard Google "G" logo SVG — official 4-color, do not restyle
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        <span className="ml-2">{t('button')}</span>
      </Button>

      {error && (
        <p className="mt-2 text-[length:var(--text-sm)] text-error">{error}</p>
      )}
    </div>
  )
}
```

### Step 5 — Update `components/auth/SignInForm.tsx`

- Import `GoogleSignInButton` and `useTranslations` for `auth.google`.
- Wrap the entire return with an outer `<div className="space-y-[length:var(--space-4)]">`.
- Before the `<Form>` element, render:
  1. `<GoogleSignInButton />`
  2. The "or" divider (see Design section above, using `t('divider')` from `useTranslations('auth.google')`)
- No changes to any existing form field, validation, or submission logic.

### Step 6 — Update `components/auth/SignUpForm.tsx`

- Same changes as Step 5: import `GoogleSignInButton`, add it + divider above the `<Form>`.
- No changes to any existing form field, validation, or submission logic.

### Step 7 — Add i18n keys to all 4 locale files

Add under the existing `"auth"` key in each file:
```json
"google": {
  "button": "Continue with Google",
  "divider": "or",
  "error": "Google sign-in failed. Please try again."
}
```

Files: `messages/en.json`, `messages/fr.json`, `messages/es.json`, `messages/de.json`.
Use English values in all 4 for now.

---

## Dependencies

No new packages. All required packages are already installed:
- `@supabase/supabase-js` — `signInWithOAuth`, `exchangeCodeForSession`
- `@supabase/ssr` — server-side Supabase client (already in `lib/supabase/server.ts`)
- Shadcn `Button` — already installed

---

## Scope Limits

- **`InternalSignInForm.tsx` is not touched** — admin and operator sign-in get no Google button.
- **No account-linking UI** — if a Google email matches an existing email/password account,
  Supabase handles identity linking automatically. No custom UI or logic needed.
- **No new DB queries or Server Actions** beyond `signInWithGoogle` — the trigger handles
  `public.users` creation, the callback patches `language`, `CheckoutResumer` handles tier.
- **No unit tests for `signInWithGoogle` or the callback route** — the OAuth redirect loop
  and `exchangeCodeForSession` cannot be meaningfully unit-tested without E2E. Add a comment
  in the callback route noting this. Do not write empty test files.
- **No changes to `AuthCard`, `auth/layout.tsx`, or any other auth component** beyond
  `SignInForm` and `SignUpForm`.
- **No changes to `proxy.ts`** — the existing matcher already excludes `/auth/*`.
- **No changes to the `handle_new_user` trigger** — it works correctly as-is.

---

## Check When Done

- `lib/validations/auth.ts` exports `googleSignInSchema` and `GoogleSignInInput`.
- `app/actions/auth.ts` exports `signInWithGoogle`.
- `app/auth/callback/route.ts` exists, handles `code` exchange via `exchangeCodeForSession`,
  includes the `setTimeout(resolve, 0)` workaround comment, patches `public.users.language`.
- `components/auth/GoogleSignInButton.tsx` exists, is `'use client'`, calls `signInWithGoogle`
  Server Action, navigates via `window.location.href`.
- Google button + divider appear **above** the email/password form on `/signin` and `/signup`.
- `InternalSignInForm.tsx` is unchanged — verify no Google import was added.
- All 4 locale files have `auth.google.button`, `auth.google.divider`, `auth.google.error`.
- Manual prerequisite (Supabase dashboard + Google Cloud Console) is noted as a blocker in
  `progress-tracker.md` if not yet completed.
- `npm run build` passes.
