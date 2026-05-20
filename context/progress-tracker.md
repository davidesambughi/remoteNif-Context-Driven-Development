# Progress Tracker

<!-- The AI updates this file after every meaningful implementation change.
     This is how work resumes across sessions without losing context.
     Never delete completed work — it's the audit trail of decisions made. -->

---

## Current Phase

Active development. Features 01–10b complete.

---

## Current Goal

Feature 12a-T — Unit test coverage for email infrastructure and document review actions (vi.mock layer for DB queries, Resend, and AI). Then unblock Feature 11a (Groq replacement).

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

- **Feature 09b — POA PDF Generation** ✓
  `poaGeneratedPath` column added to `orders` table (migration `0003`). `@react-pdf/renderer` installed; added to `serverExternalPackages` in `next.config.ts`. `lib/pdf/poa-template.tsx` renders a single-page A4 POA with draft banner, bilingual PT/EN field labels (Portuguese first as legally binding), alternating EN/PT authorization paragraphs, representative placeholder, and signature block. Footer is bilingual PT/EN. This is the permanent document design — not locale-driven. `lib/pdf/generator.ts` contains all PDF/storage business logic (`generateAndStorePoaPdf`, `deleteStoredPoaPdf`, `getPoaSignedUrl`) — all using the admin client. `GeneratePoaSchema` added to `lib/validations/orders.ts`. `generatePoa` Server Action added to `app/actions/orders.ts`; `savePersonalDetails` updated to delete and clear the stored POA when details are re-saved. Dashboard RSC fetches a signed URL server-side when `poaGeneratedPath` is set. `PersonalDetailsForm` summary view extended with a POA section (three states: idle → generating → ready/download). `ActionResult<T>` type fixed to use a conditional so `data` is required (not optional) when `T` is non-void. New i18n keys (`poa.*`) added to all four locale files with full translations (FR/ES/DE). `npm run build` passes.

- **Hotfix — Personal Details Form UX** ✓
  `PersonalDetailsForm` now has two modes: editing (default, first visit) and saved (post-save / returning user). On successful save the form immediately collapses to a read-only summary card (name, DOB, nationality, passport, address) with a checkmark icon and an "Edit details" button. Clicking "Edit" re-opens the form with values pre-filled. A pre-submit note was added above the save button ("Please double-check your details…"). The `router.refresh()` call was removed — not needed since the state transition is handled locally. Two new i18n keys added (`save.preSubmitNote`, `summary.description`, `summary.editButton`) to all four locale files. `npm run build` passes.

- **Feature 10a — Storage Infrastructure & Security** ✓
  `lib/validations/documents.ts` created (`CreateUploadUrlSchema`, `UploadDocumentSchema`). `lib/db/queries.ts` extended with `getOrderForUser` (ownership gate), `createDocumentRecord`, `supersedePreviousDocuments` (soft-delete via `supersededAt`). `app/actions/documents.ts` created with `createUploadSignedUrl` (admin client, signed upload URL, timestamp-prefixed path `{userId}/{orderId}/{ts}-{file}`) and `uploadDocument` (soft-deletes prior upload of same type, inserts record, instant-approves `signed_poa`, sets `aiReviewStatus: 'pending'` for passport/proof_of_address). `npm run build` passes (41 static pages).
  Supabase `documents` bucket pre-existed. RLS SQL policies (user-own-folder INSERT/SELECT + admin SELECT/DELETE) to be verified in Supabase dashboard — see feature spec for SQL.

- **Feature 10b — Document Upload UI** ✓
  `documents` i18n namespace added to all 4 locale files (upload button, state labels, disabled reasons, error messages). `components/dashboard/DocumentUploadSlot.tsx` built as a Client Component: manages `SlotStatus` state machine (`idle → uploading → pending_review | approved`), runs client-side pre-flight (size ≤ 10 MB, allowed MIME types), calls `createUploadSignedUrl` → PUT to signed URL → `uploadDocument`, calls `router.refresh()` on success. `signed_poa` transitions directly to `approved`; passport/proof_of_address go to `pending_review`. `PersonalDetailsForm` updated: placeholder div grids replaced with `DocumentUploadSlot` in both the saved and editing branches; `slots` array computed from live `isSaved`/`poaUrl` state so slots unlock instantly without a page refresh. `npm run build` passes (41 static pages).

- **Design Token Cleanup** ✓
  Full audit of color token usage across all components. Identified and fixed two categories of violations: (1) color tokens using raw `[var(--...)]` arbitrary syntax instead of the shorthand utilities already defined in `@theme inline` — replaced across all 25+ component and page files; (2) hardcoded Tailwind color classes (`text-gray-500`, `bg-black`, etc.) in `app/error.tsx` — replaced with token equivalents. Spacing/typography/radius/shadow tokens (`[length:var(...)]` syntax) confirmed correct — no shorthand utilities exist for these, so arbitrary syntax is intentional. `bg-[var(--bg-base)]` also intentionally kept as raw var (excluded from `@theme inline` to avoid collision with Tailwind's `text-base` font-size utility). `npm run build` passes.

- **Color & UX Enhancement Pass** ✓
  `globals.css`: `--border-default` bumped to slate-300 (was slate-200 — near invisible), `--border-subtle` to slate-200 (was slate-100). Added `--status-success-subtle`, `--status-warning-subtle`, `--status-error-subtle` (8% opacity tints) wired into `@theme inline` as `bg-success-subtle` / `bg-warning-subtle` / `bg-error-subtle`. Applied the **status-surface pattern** (state-bearing card gets a tinted background + colored border): `DocumentUploadSlot` (pending=amber tint, approved=green tint, flagged=red tint), `PersonalDetailsForm` summary card (green tint + green border when saved). Applied **brand anchor pattern** (one brand-color moment per major section): `AuthCard` (4px brand-primary top border), `HeroSection` stats grid (`bg-brand-primary-dim` block), `TierCard` featured card (`bg-brand-primary-dim` background), `HowItWorksSection` (section background=`bg-brand-primary-dim`, step cards with `border-t-4 border-t-brand-primary`). `FAQSection`: brand-tinted separators (`border-brand-primary/30`), brand chevrons, question text promoted to `text-base font-semibold`, open-state question turns brand-primary, answer text gets a brand left-border accent. Both `HowItWorksSection` and `FAQSection` headings get a `border-l-4 border-brand-primary` accent. Inline `style={{ opacity: 0.2 }}` on step numbers replaced with `opacity-30` Tailwind class. Both patterns documented in Feature 21 notes in `0-feature-list.md`. `npm run build` passes.

- **Feature 11a — Automated AI Document Review** ✓
  `@google/genai` installed. `DOCUMENT_FLAG_REASON_KEYS` (12 predefined keys, including 3 new POA keys) and `AiReviewResponseSchema` added to `lib/validations/documents.ts`. `lib/ai/gemini.ts` built: downloads file from Supabase Storage (admin client), sends to `gemini-2.0-flash` as inline base64 data, strips markdown fences, validates JSON response with `z.safeParse()` — any unexpected key or parse failure returns `{ status: 'error' }`. Four new queries in `lib/db/queries.ts`: `getActiveDocumentsForOrder`, `getDocumentByIdForUser`, `updateDocumentAiReview`, `markOrderDocumentsUnderReview`. `uploadDocument` action now returns `ActionResult<{ documentId: string }>`. New `reviewDocument` action: ownership check → AI → escalation logic (error → manual_review immediately, no attempts incremented; flagged × 2 → manual_review; clear → checks all 3 docs approved → transitions order to `documents_under_review`). `DocumentUploadSlot` updated: calls `reviewDocument` after upload, 30s `isSlowReview` timeout, `onStatusChange` callback for cross-slot locking, translates reasonKey from DB before display. `PersonalDetailsForm` updated: accepts `documentRecords` prop, derives initial slot statuses from DB, tracks live statuses via `slotStatuses` state, locks approved slots when any slot is flagged. Dashboard page fetches `getActiveDocumentsForOrder` in parallel with POA URL. All 4 locale files updated with `documents.states.stillReviewing` and `documents.flagReasons.*` (12 keys). `signed_poa` now goes through AI review (was previously auto-approved) with 3 dedicated flag reason keys (`poa_unsigned`, `poa_wrong_document`, `poa_incomplete`). `npm run build` passes (41 static pages).

- **Feature 11a — Switch AI provider from Gemini to Groq** ✓
  Replaced `lib/ai/gemini.ts` with `lib/ai/document-review.ts` using `groq-sdk` + `meta-llama/llama-4-scout-17b-16e-instruct`. PDFs use `pdfjs-dist` text extraction (worker disabled for Node.js); scanned/image-only PDFs that yield no text fall to `{ status: 'error' }` → `manual_review` upstream. `GEMINI_API_KEY` removed from `lib/env.ts`; `GROQ_API_KEY` added. `@google/genai` uninstalled; `groq-sdk` and `pdfjs-dist` installed. Import in `app/actions/documents.ts` updated. `npm run build` passes.

- **Hotfix — Date of Birth Year Digit Limit** ✓
  Added `max="9999-12-31"` to both `dateOfBirth` and `passportExpiry` inputs in `PersonalDetailsForm.tsx` to restrict year typing to 4 digits (`YYYY`) in modern browsers. `npm run build` and all tests pass.

- **Feature 12a — Customer Emails (Order Phase)** ✓
  `resend` and `react-email` (v6 unified package) installed — `@react-email/components` and `@react-email/render` removed (deprecated). `lib/email/resend.ts` exports the Resend client. `lib/email/send.ts` exports `sendEmail`, `EmailLocale`, `EmailTemplateName`, `EmailPayload` — fire-and-forget, errors logged never thrown. `lib/email/templates/order-confirmation.tsx` renders full 4-locale copy (EN/FR/ES/DE) using React Email primitives from `react-email`; subject helper `getOrderConfirmationSubject` co-located. `getUserLanguage` query added to `lib/db/queries.ts`. Stripe webhook handler updated: after transaction commits, fetches user language, formats `amountEur` from Stripe cents, calls `sendEmail` for `order_confirmation`. React element passed via Resend's `react:` prop (no manual `render()` call needed). `npm run build` passes (41 static pages).

---

- **Feature 11b — Manual Review Escalation & Notifications** ✓
  `ADMIN_EMAIL` env var added to `lib/env.ts` and `.env.local`. `getOrderBasicInfo` query added to `lib/db/queries.ts`. `EmailPayload` extended with `admin_document_escalated` and `admin_order_ready` members; `sendEmail` restructured from if/else to `switch` — exhaustive check in `default` now compiles correctly with 3 union members. Two admin email templates created (`lib/email/templates/admin-document-escalated.tsx`, `admin-order-ready.tsx`) — English only, minimal layout, `<Link>` CTA. `reviewDocument` action wired with three notification triggers: AI error → escalated email, 2nd flag → escalated email, all docs approved → order-ready email. Admin panel link (`/en/admin/orders/{orderId}`) is live in emails but the route doesn't exist until Feature 13a. `npm run build` passes (41 static pages).

---

## In Progress

---

## Open Questions

- Q4 — SEO content strategy (keyword clusters, cadence, AI vs human copy) — blocking: no — can decide before launch.
- Q5 — RESOLVED: `@react-pdf/renderer` selected. No existing template; layout designed from scratch in `lib/pdf/poa-template.tsx`. Draft placeholder copy — fiscal rep must review and confirm before launch.
- Q6 — RESOLVED: `documents` bucket pre-existed in Supabase. RLS policies applied. Feature 10a complete.

---

## Architecture Decisions

- Q1: Deadline selector and tier cards are one screen, not two steps — reduces friction.
- Q2: Document review is async with badge state progression (Uploading → Reviewing → Approved); 30s timeout → manual review fallback.
- Q3: Fiscal rep renewal uses a new Stripe Checkout session per renewal email — no card storage at this stage.

---

- **Testing features added to feature list** ✓
  Three testing features added to `0-feature-list.md`:
  - `12a-T` — unit tests with `vi.mock` for `reviewDocument` (4 branches), Stripe webhook, `sendEmail` dispatch, `uploadDocument`. Next to implement.
  - `12b-T` — integration tests against a real DB (deferred until after 13b).
  - `21b` — Playwright E2E for the 5 critical flows (deferred until after Feature 21 UI polish).
  Existing tests already cover: email subjects, template renders, Zod schemas (auth/documents/orders), pricing constants, permission helpers.

---

## Session Notes

