# 22a — Checkout Resume: Suspense Fix

<!-- Read before starting: context/AGENTS.md, context/progress-tracker.md, context/code-standards.md -->

Fix a regression introduced by an unspecced implementation of the checkout tier resume flow: `SignInForm` and `SignUpForm` both call `useSearchParams()` without a `<Suspense>` boundary, causing Next.js to fail hydration on those pages — click handlers are never attached, making the submit buttons completely unresponsive.

---

## Background

A previous session added tier-based redirect logic to `SignInForm` and `SignUpForm` (so users who selected a pricing tier before signing in/up are sent to Stripe checkout after auth). Both components now call `useSearchParams()` to read `?tier=` from the URL. In Next.js App Router, any component calling `useSearchParams()` must be wrapped in a `<Suspense>` boundary — without it, the page fails to hydrate and all event handlers are lost.

This spec fixes that regression. It does not change the tier redirect logic itself.

---

## Constraints

### Tokens

Not applicable — no visual changes in this unit.

### Architecture

- `SignInPage` and `SignUpPage` are Server Components — they must stay that way. Do not add `'use client'` to either page file.
- The `<Suspense>` boundary wraps the Client Component that calls `useSearchParams()`, not the entire page.
- Fallback is `null` — these forms render after server hydration; there is no meaningful loading state to show at component level. Page-level loading is already handled by `loading.tsx` if present.
- Do **not** modify `SignInForm.tsx`, `SignUpForm.tsx`, or `InternalSignInForm.tsx` — the fix lives in the page files only.
- Do **not** add or remove `loading.tsx` files — that is tracked as a separate item in Feature 14d/19.
- `Suspense` is imported from `'react'` — no additional package needed.

### TypeScript

- Strict mode. No `any`. No type assertions.
- No new types introduced in this unit.

### Validation

No schema changes.

### i18n

No new copy. No i18n changes.

---

## Implementation

1. **`app/[locale]/(auth)/signin/page.tsx`**

   - Add `import { Suspense } from 'react'` to the imports.
   - Wrap the `<SignInForm>` render with `<Suspense fallback={null}>`:

   ```tsx
   <AuthCard title={t('title')}>
     <Suspense fallback={null}>
       <SignInForm redirectTo={redirectTo} initialError={error} />
     </Suspense>
   </AuthCard>
   ```

2. **`app/[locale]/(auth)/signup/page.tsx`**

   - Add `import { Suspense } from 'react'` to the imports.
   - Wrap the `<SignUpForm>` render with `<Suspense fallback={null}>`:

   ```tsx
   <AuthCard title={t('title')}>
     <Suspense fallback={null}>
       <SignUpForm locale={locale} />
     </Suspense>
   </AuthCard>
   ```

3. **Verify manually** (no code change needed — diagnostic only):
   - Restart the dev server.
   - Go to `/signin` — click the submit button with valid credentials. A network request should fire.
   - Go to `/signup` — click the submit button. A network request should fire.
   - Go to `/admin/signin` — click the submit button. If still unresponsive after the above fix, report as a separate issue; do not extend the scope of this spec to diagnose it.
   - Check browser console for any remaining `useSearchParams` warnings.

4. **`context/progress-tracker.md`** — mark 22a complete. Add a note that the checkout tier resume flow was implemented without a spec; the existing code in `SignInForm`, `SignUpForm`, `auth.ts`, and `validations/auth.ts` constitutes the de-facto implementation.

---

## Scope Limits

- Do not modify `SignInForm.tsx`, `SignUpForm.tsx`, or `InternalSignInForm.tsx`.
- Do not modify `app/actions/auth.ts` or any server action.
- Do not modify `lib/validations/auth.ts`.
- Do not add, remove, or change any `loading.tsx` files.
- Do not change the tier redirect logic — it is not part of this fix.
- Do not add Google login or any other OAuth provider — tracked separately in Feature 19.
- Do not touch `components/dashboard/CheckoutResumer.tsx` — that component is untracked and belongs to a future spec.
- This unit fixes exactly two files: `signin/page.tsx` and `signup/page.tsx`.

---

## Check When Done

- `app/[locale]/(auth)/signin/page.tsx` imports `Suspense` from `'react'` and wraps `<SignInForm>` in `<Suspense fallback={null}>`.
- `app/[locale]/(auth)/signup/page.tsx` imports `Suspense` from `'react'` and wraps `<SignUpForm>` in `<Suspense fallback={null}>`.
- `/signin` — clicking the submit button fires a network request to the server action.
- `/signup` — clicking the submit button fires a network request to the server action.
- No `useSearchParams` or missing Suspense boundary warnings in the browser console.
- `npm run build` passes.
