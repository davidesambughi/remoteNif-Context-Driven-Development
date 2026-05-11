# Current Issues — Auth

Review `app/actions/auth.ts`, `components/auth/`, `app/[locale]/(auth)/`, and `app/globals.css` before starting. Do not break existing features.

---

## Issues

### 1. Sign-up cannot be fully end-to-end tested — Supabase free tier rate limit — RESOLVED

**Fix applied:**
- Configured Custom SMTP in Supabase (Authentication → SMTP Settings) using Resend: `smtp.resend.com:465`, username `resend`, password = `RESEND_API_KEY`, sender `onboarding@resend.dev` (test domain, replace with verified domain before launch)
- Cleaned stale test users from Supabase Auth and `public.users` table
- Smoke test passed: sign-up with fresh email + `Test1234` → no error → redirect to `/dashboard` → row confirmed in `public.users`
- Also resolved: `app/layout.tsx` was a bare pass-through (`return children`) which Next.js 16.2.4 now rejects at runtime. Moved `<html>` and `<body>` to `app/layout.tsx` using `getLocale()` from next-intl/server to preserve `lang={locale}`. Removed `<html>`/`<body>` from `app/[locale]/layout.tsx`. `npm run build` ✓

**Remaining cleanup (deferred — not blocking):**
- Remove the temporary `console.error('[signUp] Supabase error:', ...)` from `app/actions/auth.ts` (lines 38–39) once SMTP is confirmed stable in production
- Replace `onboarding@resend.dev` sender with a verified domain email before launch

---

### 2. Password requirements mismatch between Zod schema and Supabase

Read `lib/validations/auth.ts` and `tests/unit/validations/auth.test.ts` before implementing.

During debugging, custom password requirements were added in the Supabase dashboard (Authentication → Password Settings). Supabase now enforces: lowercase, uppercase, number, and special character. Our `signUpSchema` only enforces `min(8)`. This means:

- A password like `password1` passes our Zod validation and reaches Supabase
- Supabase rejects it with a 422 error
- The error is swallowed and shown as "Something went wrong. Please try again."
- The user gets no field-level feedback about what the password is missing

**Decision needed before fixing:** choose one of two options:

- **Option A (recommended):** Remove the custom Supabase password requirements (Supabase → Authentication → Password Settings → reset to default). Let our Zod schema own all password validation so we control the error messages and UX. Update `signUpSchema` and `updatePasswordSchema` to enforce: min 8 chars, at least one uppercase letter, at least one lowercase letter, at least one number. Skip the special character requirement — it is poor UX and not standard practice.
- **Option B:** Keep the Supabase constraints as-is. Update `signUpSchema` to match exactly (including special chars). Map the Supabase 422 error to a translated message in `signUp` action so users see a helpful error instead of the generic one.

Whichever option is chosen, update `tests/unit/validations/auth.test.ts` to cover the new password rules.

Do not change anything else.

---

### 3. Form text appears white on the sign-up page — RESOLVED

**Root cause:** `--color-base: var(--bg-base)` in the `@theme inline` block of `app/globals.css` caused Tailwind v4 to generate a `text-base { color: var(--bg-base) }` color utility. The shadcn `Input` uses `text-base` for font-size — that class now also carried a near-white color, making typed text invisible against the white card background.

**Fix applied (`app/globals.css`):**
1. Removed `--color-base` from `@theme inline` — eliminates the naming collision. `bg-base` shorthand was unused in the codebase; all components use `bg-[var(--bg-base)]` directly.
2. Added explicit `input, textarea, select { color: var(--text-primary) }` to base styles — makes form element text color cascade-independent going forward.

---

### 4. Expired Supabase auth link lands on root page with no error message

Read `app/auth/confirm/route.ts` and `app/[locale]/(marketing)/page.tsx` before implementing.

When a Supabase auth link is clicked after it has expired, Supabase redirects to:
```
http://localhost:3000/?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired
```

The root marketing page receives these query parameters and silently ignores them — the user sees the homepage with no explanation. This occurred during debugging when old confirmation links were clicked.

The fix belongs in `app/auth/confirm/route.ts`, which already handles the OTP token exchange. Extend it to detect the `error` and `error_code` query parameters in the incoming request. If `error_code=otp_expired` (or any other Supabase auth error), redirect to `/signin` with a localized error message passed as a query param (e.g. `?error=link_expired`). The sign-in page should then display the message.

This is low priority — it only affects the edge case of clicking an expired email link.

Do not change anything else.

---

## Scope

- Fix only what is listed above.
- Do not add new features or refactor unrelated code.
- Do not modify any shadcn component in `components/ui/` unless a cause above explicitly requires it.
- Do not modify the Supabase trigger SQL or migration files.
- `npm run build` passes.
