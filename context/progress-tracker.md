# Progress Tracker

<!-- The AI updates this file after every meaningful implementation change.
     This is how work resumes across sessions without losing context.
     Never delete completed work — it's the audit trail of decisions made. -->

---

## Current Phase

Active development. Features 01–04 complete. Auth flows fully implemented.

---

## Current Goal

Feature 05 — Marketing Homepage.

---

## Completed

- Context documentation (project-overview, user-flows, ui-context, architecture-context, tech-spec, code-standards, ai-workflow-rules)
- Architecture decisions Q1–Q3 resolved (see project-overview.md appendix)
- Low-fidelity mockup (saved locally, not in repo)
- **Feature 01 — Dev Environment** ✓
  - `tsconfig.json`: added `noUncheckedIndexedAccess` and `noImplicitReturns`
  - `eslint.config.mjs`: added `no-explicit-any` (error), `no-unused-vars`, `no-console` rules
  - `zod` installed
  - `lib/env.ts`: Zod env schema, dev-only fallback, exports `env` and `Env`
  - `lib/pricing.ts`: `TIERS`, `TIER_ORDER`, `RENEWAL_PRICE_EUR_CENTS` constants
  - `.env.local`: created with `NEXT_PUBLIC_APP_URL` and `NODE_ENV`; all other vars commented as placeholders
  - `globals.css` `@theme inline` block verified complete
  - `npm run build` ✓ — `npm run lint` ✓
- **Feature 02 — Database Schema** ✓
  - Installed: `drizzle-orm`, `drizzle-kit`, `postgres`, `@supabase/supabase-js`, `@supabase/ssr`, `dotenv`
  - `drizzle.config.ts`: loads `.env.local` via dotenv, points to `lib/db/schema.ts`
  - `lib/db/schema.ts`: all 7 tables, 9 enums, all indexes, `SelectX`/`InsertX` exports
  - `lib/db/index.ts`: exports `db` (Drizzle instance)
  - `lib/db/queries.ts`: empty placeholder
  - `lib/supabase/client.ts`, `server.ts`, `admin.ts`: three Supabase client factories
  - `package.json`: added `db:generate`, `db:migrate`, `db:studio` scripts
  - Env vars renamed: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_SECRET_KEY`
  - `DATABASE_URL` added to `.env.local` (direct Supabase connection)
  - Migration `0000_whole_triathlon.sql` generated and applied — all 7 tables live in Supabase
  - `npm run build` ✓
- **Feature 03 — i18n Routing + Proxy** ✓
- **Feature 04 — Auth Flows** ✓
  - `npm run db:migrate` applied `0001_handle_new_user` trigger (reads `raw_user_meta_data.language`, inserts into `public.users` with `role='customer'`)
  - shadcn/ui initialized via manual `components.json` + `lib/utils.ts`; `npx shadcn add button input form label card` installed components
  - `globals.css`: shadcn CSS var mapping block added; `@theme inline` updated to resolve `bg-primary` to brand color (Tailwind v4 convention)
  - `lib/supabase/proxy.ts`: `updateSession()` — `getClaims()` returns `{ claims, header, signature }` not `{ user }` (spec inaccuracy corrected); uses `claims.sub` for user ID
  - `proxy.ts`: updated to call `updateSession()` and use `hasValidSession` from `getClaims()` result
  - `lib/validations/auth.ts`: four Zod schemas + inferred types
  - `lib/db/queries.ts`: `getUserById`, `getUserByEmail`
  - `lib/auth/session.ts`: `getCurrentUser`, `requireAuth`, `requireRole`
  - `lib/auth/permissions.ts`: `isAdmin`, `isOperator`, `isCustomer`
  - `app/actions/auth.ts`: `signUp`, `signIn`, `adminSignIn`, `operatorSignIn`, `signOut`, `requestPasswordReset`, `updatePassword`; shared `_signInWithRole` helper
  - `app/auth/confirm/route.ts`: OTP token exchange for password recovery
  - Auth routes: `/signin`, `/signup`, `/reset-password`, `/new-password` (under `(auth)` layout), `/admin/signin`, `/operator/signin` (own shells)
  - Form components: `SignUpForm`, `SignInForm`, `RequestPasswordResetForm`, `NewPasswordForm`, `InternalSignInForm`
  - `components/auth/AuthCard.tsx`: shared card shell
  - i18n keys added under `auth` namespace in all four locale files
  - `.env.local`: placeholder values added for Stripe, Resend, Gemini, CRON vars so `next build` passes
  - `npm run build` ✓ — 7 auth routes generated
  - Installed: `next-intl`
  - `i18n/routing.ts`: `defineRouting` — locales `[en, fr, es, de]`, defaultLocale `en`, localePrefix `as-needed`
  - `i18n/request.ts`: `getRequestConfig` (v4: awaits `requestLocale` Promise, uses `hasLocale`, returns `messages`)
  - `i18n/navigation.ts`: `createNavigation` exports — locale-aware `Link`, `redirect`, `usePathname`, `useRouter`, `getPathname`
  - `messages/en.json`, `fr.json`, `es.json`, `de.json`: created with `common.appName` placeholder
  - `next.config.ts`: wrapped with `createNextIntlPlugin('./i18n/request.ts')`
  - `globals.css`: font tokens updated to reference `var(--font-inter)` and `var(--font-jetbrains-mono)`
  - `app/layout.tsx`: pass-through only (`return children`)
  - `app/[locale]/layout.tsx`: renders `<html lang={locale}>`, loads Inter + JetBrains Mono via `next/font/google`, `NextIntlClientProvider`, `generateStaticParams`, locale validation, `setRequestLocale`
  - `app/page.tsx`: deleted
  - `app/[locale]/(marketing)/page.tsx`: minimal placeholder rendering `t('common.appName')`
  - `proxy.ts`: next-intl `createMiddleware` + Supabase session cookie guard for `/dashboard`, `/admin`, `/operator`
  - Smoke tested: `/` → `lang="en"` RemoteNIF ✓ — `/fr` → `lang="fr"` RemoteNIF ✓
  - `npm run build` ✓ — 4 locale routes generated, proxy registered

---

## In Progress

- Nothing.

---

## Open Questions

- Q4 — SEO content strategy (keyword clusters, cadence, AI vs human copy) — blocking: no — can decide before launch
- Q5 — PDF library for POA generation (Feature 09): options are `pdf-lib` (low-level, no React), `@react-pdf/renderer` (React-based). Decision affects the implementation pattern — must be resolved before writing the Feature 09 spec. Blocking: yes, for Feature 09.
- Q6 — Supabase Storage bucket setup (Feature 10): at least one private `documents` bucket with access rules is required before document upload can work. Must be covered explicitly in the Feature 10 spec. Blocking: yes, for Feature 10.

---

## Architecture Decisions

- Q1: Deadline selector and tier cards are one screen, not two steps — reduces friction
- Q2: Document review is async with badge state progression (Uploading → Reviewing → Approved); 30s timeout → manual review fallback
- Q3: Fiscal rep renewal uses a new Stripe Checkout session per renewal email — no card storage needed at this stage

---

## Session Notes

- Starting from scratch — only the Next.js scaffold exists
- First task: confirm Supabase project exists and pull env vars before touching schema
- Feature 01 built 2026-05-09: all foundational config in place, build and lint clean
