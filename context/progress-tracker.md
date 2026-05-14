# Progress Tracker

<!-- The AI updates this file after every meaningful implementation change.
     This is how work resumes across sessions without losing context.
     Never delete completed work — it's the audit trail of decisions made. -->

---

## Current Phase

Active development. Features 01–07b complete.

---

## Current Goal

Feature 09b — POA Generation.

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

- **Feature 05c — Auth i18n Fixes** ✓

- **Feature 06a — Pricing Page (Structure)** ✓
  `/pricing` page renders hero + 3 tier cards + "All tiers include" bar. `TierCard` uses shadcn `Card` shell and `Button asChild` for the CTA (focus ring, keyboard nav). Unauthenticated CTA → `/signup?tier=X`; authenticated → `/dashboard?tier=X`. `pricing` namespace added to all 4 locale files. CTA copy: `Get Essential / Get Standard / Get Express` (en), `Obtenir` (fr), `Obtener` (es), `holen` (de). `npm run build` passes (36 static pages).
  `useRouter` and `Link` imports corrected in all five auth form components (`SignUpForm`, `SignInForm`, `RequestPasswordResetForm`, `NewPasswordForm`, `InternalSignInForm`) — now use `@/i18n/navigation` instead of `next/navigation`/`next/link`. Hardcoded English error string in `signUp` action replaced with `'auth.signUp.errors.emailConfirmationRequired'`; raw `error.message` in `updatePassword` replaced with `'auth.newPassword.errors.generic'`. `auth` namespace fully translated in `fr.json`, `es.json`, `de.json`. New key `auth.signUp.errors.emailConfirmationRequired` added to all four locale files. Design token violations fixed in `MarketingHeader`, `MarketingFooter`, `LanguageSwitcher`, `HeroSection`, `HowItWorksSection`, `FAQSection`. Hardcoded `RemoteNIF` literals replaced with `{t('appName')}` in `AuthCard`, `MarketingHeader`, `MarketingFooter`.

- **Feature 06b — Marketing Button Audit** ✓
  `HeroSection` "Get Started" (`Link /pricing`) and "Learn More" (`<a #how-it-works`) wrapped in `Button asChild` (variants `default` and `outline`). `MarketingHeader` "Sign In" (`Link /signin`) wrapped in `Button variant="outline" size="sm" asChild`. All three CTAs now carry shadcn's `focus-visible:ring`. No new routes, actions, translations, or data changes. `npm run build` passes (36 static pages).

- **Feature 07a — Checkout Session** ✓
  Stripe installed (`stripe@22.x`). `ActionResult<T>` moved from `app/actions/auth.ts` to `lib/types.ts`. Stripe client initialized in `lib/stripe/client.ts`. Server action `createCheckoutSession` built in `app/actions/checkout.ts` to create the Stripe checkout session, receiving `CheckoutSessionSchema` (`tier`). `components/marketing/CheckoutButton.tsx` (Client Component) handles the loading state and redirecting to the Stripe-hosted checkout. Pricing page updated to pass `isAuthenticated` into `TierCard`, rendering `CheckoutButton` only for authenticated users (unauthenticated users still get routed to signup via `Link`). Checkout error translations added to all 4 locale files (`en.json`, `fr.json`, `es.json`, `de.json`). `npm run build` passes.

- **Feature 07b — Checkout Webhook** ✓
  `lib/stripe/webhooks.ts` built with `handleCheckoutSessionCompleted` logic. Uses `db.transaction()` to insert a new `Order` (status: `documents_pending`) and `Payment` simultaneously. Includes idempotency check via `payments.stripeCheckoutSessionId`. `app/api/webhooks/stripe/route.ts` built to capture the raw body with `request.text()` and verify the `Stripe-Signature` header according to 2026 App Router best practices. Added a basic dashboard shell at `app/[locale]/(dashboard)/dashboard/page.tsx` to handle the `success_url` redirect (`?session_id=...`), displaying a success message. Updated `messages/*.json` with `dashboard.checkoutSuccess` keys. `npm run build` passes.

- **Feature 08a — Dashboard Shell & Pending State** ✓
  shadcn `skeleton` installed. `lib/db/queries.ts` updated with `getUserActiveOrder(userId)` (fetch latest order by user ID). `app/[locale]/(dashboard)/dashboard/loading.tsx` implemented with skeleton layout for streaming. Dashboard page (`app/[locale]/(dashboard)/dashboard/page.tsx`) rebuilt as RSC fetching active order. Support for `!order` (empty state) and `order.status === 'documents_pending'` (pending view using shadcn `Card`). Previous `checkoutSuccess` placeholder removed. `dashboard` i18n namespace expanded in all 4 locale files with keys for titles, descriptions, and empty states. `npm run build` passes.

---

- **Feature 08b — Dashboard Order States & Timeline** ✓

- **Feature 09a — Personal Details Form** ✓
  `PersonalDetailsSchema` + `PersonalDetailsData` type in `lib/validations/orders.ts`. `updateOrderPersonalDetails` query in `lib/db/queries.ts` (ownership check via `and(eq(orders.id), eq(orders.userId))`). `savePersonalDetails` Server Action in `app/actions/orders.ts` (validate → auth → update → return `ActionResult<void>`). `COUNTRIES` list in `lib/utils/countries.ts` (15 ISO alpha-2 countries). `PersonalDetailsForm` Client Component with `react-hook-form` + `zodResolver`, two-column layout, shadcn `Select` for nationality, success/error banners, `router.refresh()` on save, upload-gate placeholder slots with `opacity-50 cursor-not-allowed`. Dashboard page updated to pass `orderId`, `initialValues`, and `detailsSaved` props. `personalDetails` i18n namespace added to all 4 locale files. `npm run build` passes.
  `OrderTimeline` RSC built to visualize the 5-step application process using shadcn-aligned design tokens. Dashboard page updated with specific views for `under_review`, `approved` (with tier-specific Express notice), `submitted` (with delivery estimates), and `delivered` (prominent NIF display). Support contact link added to the dashboard. Translations for all states and timeline steps added to all 4 locale files. `npm run build` passes.

- **Hotfix — Foreign Key Cascade** ✓
  Updated `lib/db/schema.ts` to include `.onDelete('cascade')` on all foreign key references to `users.id` and `orders.id`. This ensures that deleting a user or an order automatically removes all child records (orders, documents, payments, etc.), fulfilling the "Delete Account" requirement. Migration `0002_flowery_amphibian.sql` generated and applied. Verified via `scratch/verify-delete-cascade.ts`.

---

- **Hotfix — Personal Details Form UX** ✓
  `PersonalDetailsForm` now has two modes: editing (default, first visit) and saved (post-save / returning user). On successful save the form immediately collapses to a read-only summary card (name, DOB, nationality, passport, address) with a checkmark icon and an "Edit details" button. Clicking "Edit" re-opens the form with values pre-filled. A pre-submit note was added above the save button ("Please double-check your details…"). The `router.refresh()` call was removed — not needed since the state transition is handled locally. Two new i18n keys added (`save.preSubmitNote`, `summary.description`, `summary.editButton`) to all four locale files. `npm run build` passes.

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

