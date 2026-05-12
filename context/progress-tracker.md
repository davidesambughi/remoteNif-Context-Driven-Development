# Progress Tracker

<!-- The AI updates this file after every meaningful implementation change.
     This is how work resumes across sessions without losing context.
     Never delete completed work — it's the audit trail of decisions made. -->

---

## Current Phase

Active development. Features 01–05a complete.

---

## Current Goal

Feature 06 — Pricing Page.

---

## Completed

- Context documentation complete (all 8 context files). Architecture decisions Q1–Q3 resolved (see `project-overview.md` appendix).

- **Feature 01 — Dev Environment** ✓
  TypeScript strict mode (`noUncheckedIndexedAccess`, `noImplicitReturns`), ESLint (`no-explicit-any`, `no-unused-vars`, `no-console`), `lib/env.ts` (Zod env schema), `lib/pricing.ts` (`TIERS`, `TIER_ORDER`, `RENEWAL_PRICE_EUR_CENTS`), `globals.css` design tokens complete.

- **Feature 02 — Database Schema** ✓
  Installed: `drizzle-orm`, `drizzle-kit`, `postgres`, `@supabase/supabase-js`, `@supabase/ssr`. All 7 tables + 9 enums in `lib/db/schema.ts`, 3 Supabase client factories, `db:generate/migrate/studio` scripts. Migration `0000_whole_triathlon.sql` applied. Env vars: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_SECRET_KEY`.

- **Feature 03 — i18n Routing + Proxy** ✓
  `next-intl` installed. `i18n/routing.ts` (locales `[en,fr,es,de]`, defaultLocale `en`, `as-needed` prefix), `i18n/request.ts`, `i18n/navigation.ts` (locale-aware Link/router). `proxy.ts`: next-intl middleware + Supabase session guard for `/dashboard`, `/admin`, `/operator`. `app/layout.tsx` owns `<html>`/`<body>` via `getLocale()`; `app/[locale]/layout.tsx` handles locale validation + `NextIntlClientProvider`.

- **Feature 04 — Auth Flows** ✓
  shadcn/ui initialized (`button`, `input`, `form`, `label`, `card`). Migration `0001` applies new-user trigger (inserts into `public.users` with `role='customer'`). All auth actions in `app/actions/auth.ts` (`signUp`, `signIn`, `adminSignIn`, `operatorSignIn`, `signOut`, `requestPasswordReset`, `updatePassword`). Routes: `/signin`, `/signup`, `/reset-password`, `/new-password`, `/admin/signin`, `/operator/signin`. Session helpers: `lib/auth/session.ts` (`getCurrentUser`, `requireAuth`, `requireRole`), `lib/auth/permissions.ts`. `lib/supabase/proxy.ts`: `updateSession()` uses `getClaims()` → `{ claims, header, signature }` (not `{ user }`) — `claims.sub` for user ID. `auth` i18n namespace in all 4 locale files.

- **Auth Bug Fixes** ✓
  `strongPassword` schema (min 8, uppercase, lowercase, digit) applied to signUp + updatePassword. Link-expired guard in `app/auth/confirm/route.ts` (detects `?error=` before OTP exchange). Resend configured as Supabase Custom SMTP (`smtp.resend.com:465`). White-text bug fixed: removed `--color-base` from `@theme inline` (was colliding with Tailwind's `text-base` font-size utility); added `input, textarea, select { color: var(--text-primary) }` to `globals.css`. 23 Vitest tests pass.

- **Feature 05a — Marketing Home (Structure)** ✓
  Marketing layout (`app/[locale]/(marketing)/layout.tsx`) with sticky header clearance (`pt-14`). `MarketingHeader` (brand + globe/locale switcher + Sign In), `MarketingFooter` (copyright + nav links + switcher), `LanguageSwitcher` (`"use client"`, globe icon + uppercase locale label, transparent native select overlay). Homepage sections: `HeroSection` (headline, "Get Started" → `/pricing`, "Learn More" → `#how-it-works`, 2×2 stats grid), `HowItWorksSection` (3 numbered step cards, `id="how-it-works"`), `FAQSection` (5-item shadcn Accordion). shadcn `accordion` installed. `home`, `common.nav`, `common.footer` i18n namespaces added to all 4 locale files (English content in all — translations in 05b).

- **Feature 05b — Marketing Home (Localization)** ✓
  `messages/fr.json`, `es.json`, `de.json` translated for `home` and `common` namespaces. Copyright year fixed to 2026 in all four locale files. `i18n/types.ts` added with next-intl v4 `AppConfig` declaration (`Locale` + `Messages` types) — enables compile-time key validation for all future translation work. `app/[locale]/(marketing)/page.tsx` and `LanguageSwitcher.tsx` updated to use the `Locale` type union (required by the stricter types AppConfig introduced).

---

## In Progress

- Nothing.

---

## Open Questions

- Q4 — SEO content strategy (keyword clusters, cadence, AI vs human copy) — blocking: no — can decide before launch.
- Q5 — PDF library for POA generation (Feature 09): options are `pdf-lib` (low-level) or `@react-pdf/renderer` (React-based). Must resolve before writing the Feature 09 spec. Blocking: yes, for Feature 09.
- Q6 — Supabase Storage bucket setup (Feature 10): private `documents` bucket with access rules required before document upload. Must be covered in the Feature 10 spec. Blocking: yes, for Feature 10.

---

## Architecture Decisions

- Q1: Deadline selector and tier cards are one screen, not two steps — reduces friction.
- Q2: Document review is async with badge state progression (Uploading → Reviewing → Approved); 30s timeout → manual review fallback.
- Q3: Fiscal rep renewal uses a new Stripe Checkout session per renewal email — no card storage at this stage.

---

## Session Notes

