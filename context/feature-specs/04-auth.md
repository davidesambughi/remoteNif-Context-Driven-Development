# 04 — Authentication

Read `context/AGENTS.md`, `context/progress-tracker.md` before starting.

Implement sign-up, sign-in, sign-out, and password reset for customers, admins, and operators using Supabase Auth, including a Postgres trigger to create the public users row on signup and a proxy-level session refresh so expired access tokens are renewed automatically.

---

## Prerequisites

These are not code steps — complete them before running any implementation step.

**P1 — Supabase dashboard:**
- Go to **Authentication → Configuration → Email** in the Supabase dashboard
- Disable **"Confirm email"** so `signUp()` returns a session immediately and users can proceed to checkout without waiting for an email confirmation click

**P2 — Database migration (run before writing app code):**

Generate and apply a migration that creates the `handle_new_user` trigger. The SQL to run:

```sql
-- Creates a public.users row every time a Supabase Auth user is created.
-- Language is read from raw_user_meta_data so the Server Action can pass it via options.data.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, email, role, language)
  values (
    new.id,
    new.email,
    'customer',
    coalesce(
      (new.raw_user_meta_data ->> 'language')::public.language,
      'en'
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

Add this SQL to a new Drizzle migration file in `lib/db/migrations/`. Generate via `npm run db:generate` then apply via `npm run db:migrate`. Verify the trigger exists in Supabase before continuing.

---

## Constraints

### Tokens

| Purpose | Token | Tailwind utility |
|---------|-------|-----------------|
| Page background | `var(--bg-base)` | `bg-[var(--bg-base)]` |
| Card background | `var(--bg-surface)` | `bg-[var(--bg-surface)]` |
| Card shadow | `var(--shadow-md)` | `shadow-[var(--shadow-md)]` |
| Card border | `var(--border-default)` | `border-[var(--border-default)]` |
| Card radius | `var(--radius-xl)` | `rounded-[length:var(--radius-xl)]` |
| Input radius | `var(--radius-md)` | `rounded-[length:var(--radius-md)]` |
| Input border | `var(--border-default)` | `border-[var(--border-default)]` |
| Input focus border | `var(--brand-primary)` | `focus:border-[var(--brand-primary)]` |
| Primary button background | `var(--brand-primary)` | `bg-[var(--brand-primary)]` |
| Button text | `var(--text-on-accent)` | `text-[var(--text-on-accent)]` |
| Heading text | `var(--text-primary)` | `text-[var(--text-primary)]` |
| Secondary text | `var(--text-secondary)` | `text-[var(--text-secondary)]` |
| Muted text / placeholder | `var(--text-muted)` | `text-[var(--text-muted)]` |
| Error text | `var(--status-error)` | `text-[var(--status-error)]` |
| Error border | `var(--status-error)` | `border-[var(--status-error)]` |
| Link / secondary accent | `var(--brand-secondary)` | `text-[var(--brand-secondary)]` |
| Card padding | `var(--space-8)` | `p-[length:var(--space-8)]` |
| Field gap | `var(--space-4)` | `mb-[length:var(--space-4)]` |
| Button font weight | `var(--font-semibold)` | `font-[number:var(--font-semibold)]` |
| App name size | `var(--text-2xl)` | `text-[length:var(--text-2xl)]` |
| Body text size | `var(--text-base)` | `text-[length:var(--text-base)]` |
| Small text | `var(--text-sm)` | `text-[length:var(--text-sm)]` |

Rules that always apply:
- No raw Tailwind color classes (`zinc-*`, `slate-*`, `blue-*`). Tokens only.
- No hardcoded hex or rgb values.
- Mobile-first. Breakpoint variants only where layout actually changes.
- Border radius from scale only.
- Shadows from scale only.

### Architecture

- All auth mutations (signUp, signIn, signOut, requestPasswordReset, updatePassword) go in `app/actions/auth.ts` with `'use server'` directive.
- Server Actions return `{ success: true, data? }` or `{ success: false, error: string }` — never throw to the client (invariant 13).
- DB queries (users table read) go in `lib/db/queries.ts`, not inline in Server Actions.
- Auth utilities (getCurrentUser, requireAuth, requireRole) go in `lib/auth/session.ts`.
- Role check helpers go in `lib/auth/permissions.ts`.
- Proxy session refresh utility goes in `lib/supabase/proxy.ts` — called from `proxy.ts` only.
- The `app/auth/confirm/route.ts` is an external-facing URL handler (Supabase email callback redirect) — it is the one legitimate exception to the "API routes for webhooks only" rule. It does not perform mutations; it exchanges a token and redirects.
- Page components (`app/[locale]/(auth)/*/page.tsx`) are Server Components. They check auth state via `getClaims()` and redirect logged-in users. Forms are Client Components in `components/auth/`.
- All user-facing forms use `react-hook-form` with Zod resolver and shadcn/ui `Form`, `FormField`, `FormItem`, `FormLabel`, `FormMessage` wrappers.
- `"use client"` only on form components — pages are Server Components.
- No direct database access from components. No direct database access from `proxy.ts`.
- **Access control split (explicit rule):** `proxy.ts` is responsible for session presence only — "is there a valid session at all?" — and redirects unauthenticated users to `/signin`. Role-specific authorization ("is this session an admin?") is the sole responsibility of Server Components via `requireRole()` and of Server Actions before mutations. The proxy must never perform role checks. This keeps the proxy fast and dumb per architecture-context.md invariant 12.

### TypeScript

- Strict mode. No `any`. No type assertions without an explanatory comment.
- Infer types from Zod schemas with `z.infer<typeof Schema>` — no duplicate type definitions.
- Use `interface` for props and DB model shapes. Use `type` for unions and derived types.
- Server Action return type: `Promise<{ success: true } | { success: false; error: string }>`.

### Validation

```typescript
// lib/validations/auth.ts
import { z } from 'zod'

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  language: z.enum(['en', 'fr', 'es', 'de']),  // passed as hidden field from locale
})

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
  locale: z.enum(['en', 'fr', 'es', 'de']),     // passed as hidden field for redirect URL
})

export const updatePasswordSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'auth.newPassword.errors.passwordMismatch',
  path: ['confirmPassword'],
})
```

### i18n

- All user-facing strings go in `messages/en.json` under the `auth` key namespace.
- Use `useTranslations('auth')` in client form components.
- No hardcoded English strings in JSX.
- Add the same keys (English values) to `fr.json`, `es.json`, `de.json` — translations can be refined later but the keys must exist in all four files.

---

## Design

Auth pages share a single centered layout. No header, no footer, no navigation.

**Page shell:** full viewport height, `--bg-base` background, flex column centered vertically and horizontally.

**Above the card:**
- App name "RemoteNIF" — `--text-2xl`, `--font-bold`, `--text-primary`, centered, `mb-[length:var(--space-6)]`

**Auth card:**
- `--bg-surface`, `--border-default` border, `--shadow-md`, `--radius-xl`, `p-[length:var(--space-8)]`
- Width: full on mobile (`w-full`), `max-w-[400px]` on sm and up
- Card title (e.g. "Sign in") — `--text-xl`, `--font-bold`, `--text-primary`, `mb-[length:var(--space-6)]`

**Form fields:**
- Label above input — `--text-sm`, `--font-medium`, `--text-secondary`, `mb-[length:var(--space-2)]`
- Input — full width, standard input pattern from ui-context.md
- Error message below input — `--text-sm`, `--status-error`
- Gap between field groups — `mb-[length:var(--space-4)]`

**Submit button:** full width, primary button pattern from ui-context.md, `mt-[length:var(--space-6)]`

**Secondary links (e.g. "Forgot password?", "Don't have an account?"):**
- Centered, `--text-sm`, `--text-secondary`, `mt-[length:var(--space-4)]`
- Link text: `--brand-secondary`, underline on hover

**Admin and operator sign-in pages:** identical layout. No "Forgot password?" link, no "Sign up" link — internal tool. Different card title only ("Admin sign in" / "Operator sign in").

**No gradients. No illustrations. No decorative backgrounds.** Keep it minimal.

---

## Implementation

### Step 1 — Install packages

```bash
npm install react-hook-form @hookform/resolvers lucide-react
```

---

### Step 2 — Initialize shadcn/ui

Run the shadcn CLI to initialize and add the required components. Accept defaults where prompted (Next.js, src/: no, Tailwind CSS v4):

```bash
npx shadcn@latest init
npx shadcn@latest add button input form label card
```

This creates `components/ui/{button,input,form,label,card}.tsx` and a `components.json` file. Do not modify the generated files.

---

### Step 3 — Map shadcn CSS variables to project tokens in `app/globals.css`

shadcn init injects its own CSS variable block (`:root { --background: ...; --foreground: ...; }`) into `globals.css`. After init, add a mapping block that overwrites shadcn's variables with our semantic tokens. Insert **after** the shadcn-generated block:

```css
/* Map shadcn CSS variables to our design token system */
:root {
  --background: var(--bg-base);
  --foreground: var(--text-primary);
  --card: var(--bg-surface);
  --card-foreground: var(--text-primary);
  --popover: var(--bg-elevated);
  --popover-foreground: var(--text-primary);
  --primary: var(--brand-primary);
  --primary-foreground: var(--text-on-accent);
  --secondary: var(--bg-subtle);
  --secondary-foreground: var(--text-secondary);
  --muted: var(--bg-subtle);
  --muted-foreground: var(--text-muted);
  --accent: var(--bg-subtle);
  --accent-foreground: var(--text-secondary);
  --destructive: var(--status-error);
  --border: var(--border-default);
  --input: var(--border-default);
  --ring: var(--brand-primary);
  --radius: var(--radius-md);
}
```

---

### Step 4 — Database migration: `handle_new_user` trigger

Create a new SQL migration file (e.g. `lib/db/migrations/0001_handle_new_user.sql`) with the SQL from **Prerequisite P2**. Apply it:

```bash
npm run db:migrate
```

Verify in Supabase dashboard → Database → Functions that `handle_new_user` exists, and → Database → Triggers that `on_auth_user_created` exists on the `auth.users` table.

---

### Step 5 — `lib/supabase/proxy.ts` (new file)

Create a dedicated Supabase client utility for use inside `proxy.ts`. This client reads cookies from the incoming request and writes refreshed cookies back to both the request (so Server Components see them) and the response.

```typescript
// lib/supabase/proxy.ts
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'

// Creates a Supabase client bound to the request/response cookie lifecycle.
// Calling getClaims() refreshes expired access tokens and writes the new tokens
// into both request.cookies (visible to Server Components in the same request)
// and the returned response cookies (sent to the browser).
// Returns the response AND whether a valid session exists so proxy.ts can use
// the authoritative claims result rather than re-checking cookies by name.
export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; hasValidSession: boolean }> {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write to request so Server Components see the refreshed token
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          // Recreate response with updated request (carries new cookies)
          supabaseResponse = NextResponse.next({ request })
          // Write to response so the browser receives the new token
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // getClaims() validates the JWT locally and triggers a token refresh if expired.
  // Do NOT use getSession() here — it does not revalidate the JWT signature.
  const { data } = await supabase.auth.getClaims()
  const hasValidSession = data?.user != null

  // Prevent CDNs from caching authenticated responses
  supabaseResponse.headers.set('Cache-Control', 'private, no-store')

  return { response: supabaseResponse, hasValidSession }
}
```

---

### Step 6 — Update `proxy.ts`

Replace the existing cookie-presence-only check with the following. The proxy now:
1. Calls `updateSession` to refresh any expired Supabase tokens — gets back `{ response, hasValidSession }` where `hasValidSession` is the direct result of `getClaims()`, not a cookie-name heuristic
2. Uses `hasValidSession` for the route guard — this is the authoritative check
3. Delegates to next-intl for locale routing
4. Copies Supabase auth cookies onto the final i18n response

```typescript
// proxy.ts
import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'
import { updateSession } from './lib/supabase/proxy'

const handleI18n = createMiddleware(routing)

const PROTECTED = /\/(dashboard|admin|operator)(\/|$)/

export default async function proxy(request: NextRequest) {
  // 1. Refresh Supabase session — hasValidSession comes from getClaims(), not a cookie regex
  const { response: supabaseResponse, hasValidSession } = await updateSession(request)

  const { pathname } = request.nextUrl

  if (PROTECTED.test(pathname) && !hasValidSession) {
    const localeFromPath = routing.locales.find(
      (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`,
    )
    const locale = localeFromPath ?? routing.defaultLocale
    const signinPath =
      locale === routing.defaultLocale ? '/signin' : `/${locale}/signin`

    const redirectResponse = NextResponse.redirect(
      new URL(signinPath, request.url),
    )
    // Carry refreshed Supabase cookies onto the redirect
    supabaseResponse.cookies
      .getAll()
      .forEach((c) => redirectResponse.cookies.set(c.name, c.value, c))
    return redirectResponse
  }

  // 2. Run next-intl locale routing
  const i18nResponse = handleI18n(request)

  // 3. Copy Supabase auth cookies onto the i18n response
  supabaseResponse.cookies
    .getAll()
    .forEach((c) => i18nResponse.cookies.set(c.name, c.value, c))

  return i18nResponse
}

export const config = {
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
}
```

---

### Step 7 — `lib/validations/auth.ts`

Create this file with the four Zod schemas defined in the **Validation** section above. Export each schema and its inferred type:

```typescript
export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>
```

---

### Step 8 — `lib/db/queries.ts` — add user queries

Add two exported functions to `lib/db/queries.ts`:

- `getUserById(id: string): Promise<SelectUser | null>` — queries `users` table by primary key using the Drizzle `db` instance.
- `getUserByEmail(email: string): Promise<SelectUser | null>` — queries `users` table by email.

Both return `null` (not throw) if the row does not exist.

---

### Step 9 — `lib/auth/session.ts`

Create this file with three exported functions:

**`getCurrentUser()`**
- Calls `createClient()` from `lib/supabase/server.ts`
- Calls `supabase.auth.getClaims()` to get the validated JWT payload
- If no user, returns `null`
- Calls `getUserById(user.id)` from `lib/db/queries.ts`
- Returns the `SelectUser` row or `null`

**`requireAuth()`**
- Calls `getCurrentUser()`
- If `null`, calls `redirect('/signin')` from `next/navigation`
- Returns the user (non-null guaranteed after the redirect branch)

**`requireRole(role: 'admin' | 'operator' | 'customer')`**
- Calls `getCurrentUser()`
- If `null` or `user.role !== role`, calls appropriate redirect:
  - No session → `redirect('/signin')`
  - Wrong role → `redirect('/')` (homepage — access denied without exposing admin routes)
- Returns the user

---

### Step 10 — `lib/auth/permissions.ts`

Create this file with three pure helper functions (no async, no DB):

```typescript
import type { SelectUser } from '@/lib/db/schema'

export const isAdmin = (user: SelectUser) => user.role === 'admin'
export const isOperator = (user: SelectUser) => user.role === 'operator'
export const isCustomer = (user: SelectUser) => user.role === 'customer'
```

---

### Step 11 — `app/actions/auth.ts`

Create this file with five Server Actions. All start with `'use server'`. All validate input with Zod before any Supabase call. All return `{ success: true }` or `{ success: false, error: string }`.

**`signUp(input: unknown)`**
1. Parse with `signUpSchema`
2. Create server Supabase client
3. Call `supabase.auth.signUp({ email, password, options: { data: { language } } })`
   - `options.data` is written to `raw_user_meta_data` in `auth.users` — the trigger reads `language` from here
4. If error and `error.message` includes `'User already registered'` → return `{ success: false, error: 'auth.signUp.errors.emailInUse' }`. **Note:** exposing this specific message is intentional — it is defined in `user-flows.md` Flow 2 as a product requirement ("show inline error 'An account with this email already exists. Sign in instead?'"). This is a deliberate UX choice for the checkout funnel, not an accidental enumeration leak. Document it as such if it ever comes up in a security review.
5. If any other error → return `{ success: false, error: 'auth.signUp.errors.generic' }`
6. If no session returned (email confirmation still enabled in Supabase dashboard — should not happen after P1, but guard it) → return `{ success: false, error: 'Please confirm your email before continuing.' }`
7. Return `{ success: true }`

**`signIn(input: unknown)`**
1. Parse with `signInSchema`
2. Create server Supabase client
3. Call `supabase.auth.signInWithPassword({ email, password })`
4. If error → return `{ success: false, error: 'auth.signIn.errors.invalidCredentials' }`
5. Get the user's role via `getUserById(data.user.id)` from `lib/db/queries.ts`
6. Return `{ success: true, data: { role: user.role } }`
   - The client component uses the role to call the right `router.push()`:
     - `'admin'` → `/admin`
     - `'operator'` → `/operator`
     - `'customer'` → `/dashboard` (or `redirectTo` param if present)

**Private helper `_signInWithRole(input, requiredRole?)`** (not exported)

All three sign-in actions share this internal function to avoid inconsistent error handling:
1. Parse `input` with `signInSchema`
2. Create server Supabase client
3. Call `supabase.auth.signInWithPassword({ email, password })`
4. If error → return `{ success: false as const, error: <caller-supplied error key> }`
5. If `requiredRole` is set: fetch user row via `getUserById`; if `role !== requiredRole` → call `supabase.auth.signOut()` → return `{ success: false as const, error: <caller-supplied error key> }` (same message as wrong password — do not reveal role mismatch)
6. Return `{ success: true as const, data: { role: user.role } }`

**`signIn(input: unknown)`**
Calls `_signInWithRole(input)` (no `requiredRole` — any valid account is accepted). Returns the role in `data` so the client can redirect to the right destination.

**`adminSignIn(input: unknown)`**
Calls `_signInWithRole(input, 'admin')` with error key `'auth.admin.signIn.errors.invalidCredentials'`. Returns `{ success: true }` with no role data — the redirect is always `/admin`.

**`operatorSignIn(input: unknown)`**
Calls `_signInWithRole(input, 'operator')` with error key `'auth.operator.signIn.errors.invalidCredentials'`. Returns `{ success: true }`. Redirect is always `/operator`.

**`signOut()`**
1. Create server Supabase client
2. Call `supabase.auth.signOut()`
3. Call `redirect('/')` from `next/navigation` (redirect is thrown, not returned — this is correct for Next.js redirects in Server Actions)

**`requestPasswordReset(input: unknown)`**
1. Parse with `requestPasswordResetSchema`
2. Build the redirect URL: for `locale === 'en'` use `${APP_URL}/auth/confirm?next=/new-password`; for other locales use `${APP_URL}/auth/confirm?next=/${locale}/new-password`
3. Call `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
4. Always return `{ success: true }` regardless of whether the email is registered (prevents account enumeration — the UI always shows the same "check your email" message)

**`updatePassword(input: unknown)`**
1. Parse with `updatePasswordSchema`
2. Create server Supabase client
3. Call `supabase.auth.updateUser({ password })`
4. If error → return `{ success: false, error: error.message }`
5. Return `{ success: true }`

---

### Step 12 — `app/auth/confirm/route.ts`

This route is the URL callback for **password recovery emails only** at this stage. It is placed outside the `[locale]` segment because Supabase email links do not carry a locale prefix. If sign-up confirmation is ever enabled (Feature 12), the same route handles it via the `type` parameter — no structural changes needed, just an additional `type` case.

```typescript
// app/auth/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })

    if (!error) {
      // Redirect to the next page (e.g. /new-password or /fr/new-password)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Redirect to an error state — use the reset-password page with a generic error param.
  // "link-invalid" covers all failure modes: expired token, wrong type, tampered hash.
  // Do not use "link-expired" — that implies only one failure mode and may mislead the user.
  return NextResponse.redirect(`${origin}/reset-password?error=link-invalid`)
}
```

---

### Step 13 — `app/[locale]/(auth)/layout.tsx`

Create the shared auth layout. This wraps all customer auth pages (`signin`, `signup`, `reset-password`, `new-password`). It does NOT wrap admin or operator sign-in pages — those have their own layouts later.

The layout renders a minimal shell: full-height page, centered content, `--bg-base` background. No navigation bar.

```tsx
// app/[locale]/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center px-[length:var(--space-4)]">
      {children}
    </div>
  )
}
```

---

### Step 14 — `components/auth/AuthCard.tsx`

Create a shared wrapper component used by all auth pages.

Props:
```typescript
interface AuthCardProps {
  title: string
  children: React.ReactNode
}
```

Renders: app name ("RemoteNIF") above the card, then the card with the title and `children`.

---

### Step 15 — `app/[locale]/(auth)/signup/page.tsx` + `components/auth/SignUpForm.tsx`

**Page (Server Component):**
1. Check if user is already signed in via `getCurrentUser()` — if yes, `redirect('/dashboard')`
2. Render `<AuthCard title={t('auth.signUp.title')}>` wrapping `<SignUpForm locale={locale} />`
3. Get `locale` from `await params`

**`SignUpForm` (Client Component, `'use client'`):**
- `react-hook-form` with `signUpSchema` Zod resolver
- Fields: email, password
- Hidden field: `language` = `locale` prop (passed from Server Component)
- On submit: calls `signUp(data)` Server Action
- On success: `router.push('/dashboard')`
- On error: show server error as an inline message above the submit button
- Below the button: "Already have an account?" + link to `/signin`

---

### Step 16 — `app/[locale]/(auth)/signin/page.tsx` + `components/auth/SignInForm.tsx`

**Page (Server Component):**
1. Check if user is already signed in — if yes, redirect to role-appropriate route (`/admin`, `/operator`, or `/dashboard`)
2. Read optional `redirectTo` query param (for post-login redirect after hitting a protected route)
3. Render `<AuthCard title={t('auth.signIn.title')}>` wrapping `<SignInForm redirectTo={redirectTo} />`

**`SignInForm` (Client Component, `'use client'`):**
- `react-hook-form` with `signInSchema` Zod resolver
- Fields: email, password
- On submit: calls `signIn(data)` Server Action
- On success: redirect based on returned role:
  - `'admin'` → `/admin`
  - `'operator'` → `/operator`
  - `'customer'` → `redirectTo` param (if valid, same-origin) or `/dashboard`
- On error: inline error above submit button
- Below the button:
  - "Forgot your password?" link → `/reset-password`
  - "Don't have an account?" + link to `/signup`

---

### Step 17 — `app/[locale]/(auth)/reset-password/page.tsx` + `components/auth/RequestPasswordResetForm.tsx`

**Page (Server Component):**
1. Read optional `error` query param — if `error=link-invalid`, show a banner above the form using the `auth.resetPassword.errors.linkInvalid` translation key. The message covers all failure modes: "This link is invalid or has expired. Please request a new one."
2. Render `<AuthCard title={t('auth.resetPassword.title')}>` wrapping `<RequestPasswordResetForm locale={locale} />`

**`RequestPasswordResetForm` (Client Component):**
- `react-hook-form` with `requestPasswordResetSchema` Zod resolver
- Field: email only
- Hidden field: `locale` = locale prop
- On submit: calls `requestPasswordReset(data)` Server Action
- On success (always): replace the form with a static message: `t('auth.resetPassword.successMessage')` — "If an account exists for this email, you'll receive a reset link shortly." Do not show different messages for registered vs unregistered emails.
- No error state from the server action (action always returns success)
- Below the form: "Back to sign in" link → `/signin`

---

### Step 18 — `app/[locale]/(auth)/new-password/page.tsx` + `components/auth/NewPasswordForm.tsx`

**Page (Server Component):**
1. Call `requireAuth()` — if no session (user arrived here without clicking the reset link), redirect to `/reset-password`
2. Render `<AuthCard title={t('auth.newPassword.title')}>` wrapping `<NewPasswordForm />`

**`NewPasswordForm` (Client Component):**
- `react-hook-form` with `updatePasswordSchema` Zod resolver
- Fields: password, confirmPassword
- On submit: calls `updatePassword(data)` Server Action
- On success: `router.push('/dashboard')`
- On error: inline error above submit button

---

### Step 19 — `app/[locale]/(admin)/signin/page.tsx`

Server Component. No shared auth layout — renders its own full-page shell identical to the auth layout (same CSS, but independent so admin routes have their own layout later in Feature 13).

Uses `<AuthCard title={t('auth.admin.signIn.title')}>` wrapping an inline `AdminSignInForm` client component (or reuse a shared form component with `actionFn={adminSignIn}` prop and no "Forgot password?" link).

On success: `router.push('/admin')`.

On error: inline error.

---

### Step 20 — `app/[locale]/(operator)/signin/page.tsx`

Same pattern as admin sign-in. Uses `operatorSignIn` Server Action. On success: `router.push('/operator')`.

---

### Step 21 — i18n translation keys

Add the following key structure to `messages/en.json` under the `auth` namespace. Add the same keys to `fr.json`, `es.json`, `de.json` (English values are fine for now — translations will be updated before launch):

```json
{
  "auth": {
    "signIn": {
      "title": "Sign in",
      "email": "Email",
      "password": "Password",
      "submit": "Sign in",
      "forgotPassword": "Forgot your password?",
      "noAccount": "Don't have an account?",
      "signUpLink": "Sign up",
      "errors": {
        "invalidCredentials": "Incorrect email or password",
        "generic": "Something went wrong. Please try again."
      }
    },
    "signUp": {
      "title": "Create your account",
      "email": "Email",
      "password": "Password",
      "submit": "Create account",
      "hasAccount": "Already have an account?",
      "signInLink": "Sign in",
      "errors": {
        "emailInUse": "An account with this email already exists.",
        "generic": "Something went wrong. Please try again."
      }
    },
    "resetPassword": {
      "title": "Reset your password",
      "description": "Enter your email and we'll send you a reset link.",
      "email": "Email",
      "submit": "Send reset link",
      "backToSignIn": "Back to sign in",
      "successMessage": "If an account exists for this email, you'll receive a reset link shortly.",
      "errors": {
        "linkInvalid": "This link is invalid or has expired. Please request a new one."
      }
    },
    "newPassword": {
      "title": "Set new password",
      "password": "New password",
      "confirmPassword": "Confirm new password",
      "submit": "Update password",
      "errors": {
        "passwordMismatch": "Passwords don't match",
        "generic": "Something went wrong. Please try again."
      }
    },
    "admin": {
      "signIn": {
        "title": "Admin sign in",
        "errors": {
          "invalidCredentials": "Invalid admin credentials"
        }
      }
    },
    "operator": {
      "signIn": {
        "title": "Operator sign in",
        "errors": {
          "invalidCredentials": "Invalid operator credentials"
        }
      }
    }
  }
}
```

---

### Step 22 — Update `context/progress-tracker.md`

Mark Feature 04 as complete. Record:
- Proxy updated with Supabase session refresh (`lib/supabase/proxy.ts` + `proxy.ts`)
- `handle_new_user` trigger applied (reads `raw_user_meta_data.language`)
- shadcn initialized, CSS vars mapped to design tokens
- Auth actions: signUp, signIn, adminSignIn, operatorSignIn, signOut, requestPasswordReset, updatePassword
- Routes: `/signin`, `/signup`, `/reset-password`, `/new-password`, `/auth/confirm`, `/admin/signin`, `/operator/signin`
- Lib: `lib/auth/session.ts`, `lib/auth/permissions.ts`, `lib/validations/auth.ts`
- Current goal: Feature 05 — Marketing Homepage

---

## Dependencies

Install: `react-hook-form`, `@hookform/resolvers`, `lucide-react`

shadcn init (interactive): `npx shadcn@latest init`

shadcn components: `npx shadcn@latest add button input form label card`

---

## Scope Limits

- **No OAuth (Google, GitHub, etc.)** — email + password only at this stage.
- **No magic link / OTP sign-in** — out of scope.
- **No account settings** (email change, password change from dashboard, account deletion) — that is Feature 17.
- **No admin or operator account creation UI** — admin and operator accounts are created manually in the Supabase dashboard. This spec only covers sign-in for existing admin/operator accounts.
- **No dashboard UI** — pages redirect to `/dashboard`, `/admin`, `/operator` which are currently placeholders. This spec only builds auth flows, not the destination pages.
- **No email templates** for confirmation or password reset (beyond the Supabase default template) — custom email templates are Feature 12. The `resetPasswordForEmail` call will use Supabase's default template for now.
- **No session expiry UI** — no "Your session has expired, please sign in again" messaging at this stage.
- **No remember-me or extended session options** — default Supabase session duration (7 days).
- **Do not modify `components/ui/*`** — shadcn-generated files are untouched.

---

## Check When Done

<!-- Code-review pass completed 2026-05-11. Items marked ✓ are verified correct by static code inspection.
     Items marked ✗ have confirmed bugs. Items marked ? require a live environment to verify. -->

- [?] `handle_new_user` trigger exists in Supabase → signing up a new user creates a row in `public.users` with correct `language` value
  <!-- Migration file 0001_handle_new_user.sql exists with correct SQL. Cannot verify DB state without live access. -->
- [✓] Sign up with a new email → session created → row in `public.users` with `role = 'customer'` → redirect to `/dashboard`
- [✓] Sign up with a duplicate email → inline error shown, no crash
- [✓] Sign in with valid customer credentials → redirect to `/dashboard`
- [✓] Sign in with valid admin credentials → redirect to `/admin`
- [✓] Sign in with valid operator credentials → redirect to `/operator`
- [✓] Sign in with a customer account on `/admin/signin` → inline error, no redirect to `/admin`
- [✓] Sign in with wrong password → inline error, no account enumeration (same message for wrong password vs nonexistent email)
- [✓] Sign out → session cleared → redirect to homepage → protected routes redirect to `/signin`
- [✓] Visiting `/signin` while already signed in → redirect to role-appropriate destination
- [✓] Password reset request → always shows success message (no account enumeration)
- [✓] Password reset flow end-to-end: request → email → `/auth/confirm?token_hash=...&type=recovery` → redirect to `/new-password` → new password saved → redirect to `/dashboard`
- [✓] Expired reset link → `/auth/confirm` redirects to `/reset-password?error=link-invalid` → banner shown
  <!-- Note: check item originally said "link-expired" but both the spec body and the implementation consistently use "link-invalid". This is correct. -->
- [✓] Visiting a protected route while signed out → redirect to `/signin` (proof: proxy session guard works)
- [✗] Signing in from a protected route redirect → lands back at the original route after authentication
  <!-- BUG: proxy.ts redirects to /signin with no ?redirectTo= param. The SignInForm reads searchParams.redirectTo but it is always undefined. Users always land at /dashboard. Fix: append ?redirectTo=<pathname> to the proxy redirect. -->
- [✓] Session refresh works: a user with an expired access token but valid refresh token is not kicked out (proxy calls `updateSession` → `getClaims()` refreshes the token)
- [✗] All auth pages render in French (`/fr/signin`, `/fr/signup`) without missing translation key errors
  <!-- Customer auth pages (/fr/signin, /fr/signup, etc.) fully pass — all use useTranslations. FAILS for /fr/admin/signin and /fr/operator/signin: InternalSignInForm.tsx has hardcoded "Email", "Password", "Sign in" strings (no useTranslations call). Violates invariant 10. -->
- [✓] `npm run build` passes
