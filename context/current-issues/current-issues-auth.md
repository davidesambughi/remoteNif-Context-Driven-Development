# Current Issues — Auth

Review `app/actions/auth.ts`, `components/auth/`, `app/[locale]/(auth)/`, and `app/globals.css` before starting. Do not break existing features.

---

## Issues

### 1. Sign-up cannot be fully end-to-end tested — Supabase free tier rate limit

Read `app/actions/auth.ts` before implementing.

**Status: partially verified. Blocked by infrastructure limit — not a code bug.**

What was confirmed during debugging:
- Email confirmation was disabled in Supabase (P1 prerequisite done) ✓
- The `handle_new_user` trigger fires correctly — a row appeared in `public.users` after at least one successful sign-up call ✓
- The trigger correctly sets `role = 'customer'` and reads `language` from `raw_user_meta_data` ✓

What is NOT yet verified:
- The full happy path: sign-up → session returned → redirect to `/dashboard`
- The `router.push('/dashboard')` call in `SignUpForm.tsx` actually executing

**Why it's blocked:**
The Supabase free tier limits sign-up requests to ~2 per hour project-wide. In 2026, raising this limit requires configuring a Custom SMTP provider (Supabase → Authentication → SMTP Settings). Use Resend — it is already a project dependency via `RESEND_API_KEY`. The built-in provider is for testing only.

**What to do when resuming:**
1. Configure Custom SMTP in Supabase using the existing Resend API key OR wait ~1 hour for the rate limit to reset
2. Clean stale test data: Supabase → Authentication → Users → delete all test accounts; Table Editor → `users` → delete all test rows
3. Sign up once with a fresh email and password `Test1234`
4. Verify: no error shown, redirect to `/dashboard`, row in `public.users`
5. After verifying, remove the temporary `console.error('[signUp] Supabase error:', ...)` line from `app/actions/auth.ts` (lines 38–39)

Do not change anything else.

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

### 3. Form text appears white on the sign-up page — root cause not yet identified

Read `app/globals.css`, `app/[locale]/layout.tsx`, `components/auth/AuthCard.tsx`, `components/auth/SignUpForm.tsx` before implementing.

Text in the "Create Account" form appears white (invisible or near-invisible against the card background). Token definitions and component class names are all correct in code — this is a runtime CSS resolution issue.

**Fixes already attempted (none resolved it):**
- Fix A: Added `className="bg-background text-foreground"` to `<body>` in `app/[locale]/layout.tsx` — already present, no change
- Fix B: Added `color-scheme: light` to `:root` in `app/globals.css` — applied, no effect
- Fix C: Renamed self-referential `--font-sans: var(--font-sans)` to `--font-family-sans: var(--font-sans)` in `@theme inline` block in `app/globals.css` — applied, no effect

**Next step — DevTools inspection (required before any further code changes):**

The root cause cannot be identified without seeing what CSS is actually computed in the browser. Open the sign-up page, right-click the "Create Account" heading → Inspect → Computed tab → find the `color` property. Report the exact value (e.g. `oklch(100% 0 0)` or `rgb(255, 255, 255)`). Also check `background-color` on the card `<div>`. This will confirm whether the text is literally white or the background is dark — two different problems with different fixes.

Also confirm: is the OS or browser in dark mode? This directly affects which cause to investigate next.

Do not change anything else until DevTools output is known.

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
