# Progress Tracker

---

## Current Phase

Active development. Features 01–18b complete. Feature 19 in progress (19a, 19b done).

---

## Current Goal

Feature 19 — UX Gap Fixes (see `context/feature-specs/` and `current-issues/`).

> **Quality audit complete** (2026-05-21). All 3 red violations fixed. 14 yellow smells remain — tracked in `context/quality-audit.md`.

---

## Handoff Note — Feature 18b complete

**Feature 18b — Renewal Reminder Emails & Dashboard Banner** — done. See Completed section for full detail.

**Key context for next session:**
- `CRON_SECRET` env var must be set in Vercel before the cron route is useful. Add to `.env.local` for local testing.
- The Vercel cron schedule (`vercel.json`) is tracked as Feature 22 (post-launch) — do not implement now.
- Deduplication is a known limitation in the cron route (documented in-code comment) — acceptable at current scale.
- `RenewalBanner` is a Server Component — do not add `'use client'` to it.
- Test ORDER_IDs must be valid UUID v4 (Zod v4 enforces version bits) — use `00000000-0000-4000-8000-000000000001` as the pattern.

**Next feature:** 19 — UX Gap Fixes (see `project_ux_gaps.md` memory and any current-issues files).

---

## Handoff Note (read before starting next session)

**Next feature is 17b** — Account Settings: language preference selector.

**Key context for 17b:**
- Add a fourth card to the existing `/settings` page (below Delete Account).
- Language selector saves to `public.users.language` via a Server Action in `app/actions/settings.ts`.
- On save, page reloads in the selected locale — use `router.push` with the new locale via `@/i18n/navigation`.
- i18n keys go under `settings.languagePreference.*` namespace in all 4 locale files.
- All forms use react-hook-form + Zod + shadcn `Form` primitives — same pattern as Personal Details form.
- Supabase Auth handles email change and password update — use `supabase.auth.updateUser()`.
- Delete account: delete from `auth.users` (Supabase admin client) + `public.users` cascade handles FK cleanup.
- All copy via next-intl keys under `settings.*` namespace in all 4 locale files.

**Test order reset (if needed for Feature 16 testing):**
```sql
UPDATE public.orders SET status = 'submitted', nif_number = NULL, delivered_at = NULL, fiscal_rep_expires_at = NULL WHERE id = '0f449877-f56c-4411-9f5c-eef0190d606e';
```

**Operator test account:** promote your own user account via `UPDATE public.users SET role = 'operator' WHERE email = 'YOUR_EMAIL'`, sign out, sign back in.

---

## Completed

- **Context docs** — all 8 context files complete.
- **Feature 01 — Dev Environment** — TypeScript strict, ESLint, `lib/env.ts`, `lib/pricing.ts`, design tokens in `globals.css`.
- **Feature 02 — Database Schema** — all 7 tables + 9 enums, 3 Supabase client factories, migrations applied.
- **Feature 03 — i18n Routing + Proxy** — next-intl, `[en,fr,es,de]` locales, `as-needed` prefix, Supabase session guard in `proxy.ts`.
- **Feature 04 — Auth Flows** — all auth actions, 6 routes, `getCurrentUser` / `requireRole`, shadcn/ui initialized.
- **Auth Bug Fixes** — strong password schema, link-expired guard, Resend as custom SMTP, white-text token collision fixed.
- **Feature 05a/b/c — Marketing Home** — hero, how-it-works, FAQ, `LanguageSwitcher`, full EN/FR/ES/DE translations, `AppConfig` types.
- **Feature 06a/b — Pricing Page** — tier cards, deadline-aware CTAs, `CheckoutButton`, shadcn button audit across marketing.
- **Feature 07a — Checkout Session** — `createCheckoutSession` action, `CheckoutButton` client component, Stripe client.
- **Feature 07b — Checkout Webhook** — Stripe webhook handler, `db.transaction()` order + payment insert, idempotency check.
- **Feature 08a/b — Dashboard** — order status shell, `OrderTimeline`, all 5 status views (pending → delivered), skeleton loading.
- **Feature 09a — Personal Details Form** — `savePersonalDetails` action, `PersonalDetailsForm` with edit/saved modes, countries list.
- **Feature 09b — POA PDF Generation** — `@react-pdf/renderer`, bilingual PT/EN template, `generatePoa` action, signed URL delivery.
- **Feature 10a/b — Document Upload** — Supabase Storage, signed upload URLs, `DocumentUploadSlot` state machine, RLS policies.
- **Feature 11a — AI Document Review** — Groq + Llama 4 Scout, PDF text extraction via `pdfjs-dist`, 12 flag reason keys, escalation logic. Windows fixes: `serverExternalPackages`, legacy ESM import, `file://` worker path.
- **Feature 11b — Manual Review Notifications** — admin email templates (`admin_document_escalated`, `admin_order_ready`), `ADMIN_EMAIL` env var.
- **Feature 12a — Customer Emails** — `react-email` v6, `sendEmail` fire-and-forget, order confirmation email in 4 locales.
- **Feature 13a — Admin Panel: Order List** — `proxy.ts` `AUTH_PAGES` exclusion for `/admin/signin`, `getAdminOrderList` query (users join, filters, SLA sort), admin shell layout with role check, `OrderFilters`, `SlaCountdown`, `OrderRow`.
- **Design Token Cleanup** — full audit; `bg-[var(--bg-base)]` kept as raw var (avoids `text-base` collision).
- **Color & UX Enhancement Pass** — status-surface pattern, brand anchor pattern, subtle border tints added to `globals.css`.
- **Hotfix — FK Cascade** — `.onDelete('cascade')` on all FK refs, migration `0002` applied.
- **Hotfix — DOB Year Digit Limit** — `max="9999-12-31"` on date inputs.
- **Testing features scoped** — `12a-T` (vi.mock unit tests), `12b-T` (DB integration), `21b` (Playwright E2E) added to feature list.
- **Feature 12b-T — Integration Tests** — 3 test files, 23 tests, 0 failures. Docker Postgres on port 5433, psql-based migration script (drizzle-kit hangs on Windows). Covers: all 6 query functions (getOrderForUser, createDocumentRecord, supersedePreviousDocuments, getActiveDocumentsForOrder, markOrderDocumentsUnderReview, getOrderBasicInfo), uploadDocument (happy path + supersede correctness), reviewDocument all-approved path (real DB write chain), handleCheckoutSessionCompleted (idempotency + missing metadata). Run with `npm run test:integration` (requires Docker running).
- **Feature 12a-T — Unit Test Coverage** — 198 tests, 0 failures. Covers: all 5 admin actions, `createUploadSignedUrl`, `uploadDocument`, `reviewDocument` (5 branches A–E), `handleCheckoutSessionCompleted` (idempotency + email routing), `sendEmail` dispatch (all 5 templates), all 5 email template smoke tests in EN/FR/ES/DE.
- **Feature 13b — Admin Panel: Order Detail** — `getAdminOrderDetail` query (orders + users + payments + documents join), all 5 admin actions (`adminApproveDocument`, `adminFlagDocument`, `adminApproveOrder`, `adminUpdateOrderStatus`, `adminResendEmail`), `OrderDetailHeader`, `DocumentReviewCard`, `ApproveOrderSection` (inline confirmation, no `window.confirm`), `StatusUpdateSection`, `EmailResendSection`, `DocumentOverrideButtons`. Full EN/FR/ES/DE translations under `admin.detail` namespace.
- **Quality Audit + Red Fixes** — full audit documented in `context/quality-audit.md`; 3 red violations fixed: (1) duplicate `ActionResult` in `admin.ts` deleted, now imported from `lib/types.ts`; (2) wrong token names (`text-primary`/`text-muted`) corrected to `text-text-primary`/`text-text-muted` in `PersonalDetailsForm.tsx`; (3) Stripe redirect URLs made locale-aware via `locale` field added to `CheckoutSessionSchema` and passed from `CheckoutButton`. 198 unit tests still passing.
- **Quality Audit — Yellow Fixes (batch 1)** — 4 yellow smells resolved: (1) `ORDER_STATUS_SEQUENCE` constant exported from `lib/db/schema.ts`, replacing hardcoded `statusOrder` arrays in `admin.ts` and `StatusUpdateSection.tsx`; (2) admin filter Zod schema now derives from `orderStatusEnum.enumValues` / `tierEnum.enumValues` instead of duplicating string literals; (3) `DocumentReviewCard.tsx` token syntax unified to shorthand throughout; (4) AI status label casing fixed — consistent Title Case via `aiStatusLabel` map, eliminating the `replace(/_/g,' ')` vs `toUpperCase()` inconsistency. 198 unit tests still passing.
- **Feature 14a-1 — Operator Queue UI & Submission** — operator shell layout with role guard, `getOperatorQueue()` / `getOrderStatusById()` / `markOrderSubmitted()` queries in `lib/db/queries.ts`, `markOrderAsSubmitted` Server Action in `app/actions/operator.ts` (validate → requireRole → status check → update → audit log → revalidate), `SlaCountdown` client component (48h, color-coded, ticks every 60s), `QueueRow` client component with shadcn `AlertDialog` (success toast via Sonner, inline error on failure), `OperatorQueue` server component (Express / Standard sections with `Badge` + `Separator`), `/operator` page. Installed shadcn `alert-dialog`, `badge`, `separator`, `sonner`. Full EN/FR/ES/DE `operator.queue` translations. **Manually verified**: SLA color thresholds (green >24h, amber 8–24h, red <8h, red bold overdue), submit flow (AlertDialog → Server Action → toast → row disappears), empty state for both sections.
- **Feature 14a-2 — Operator Package Download** — `GET /api/operator/package/[orderId]` returns `application/zip`. Implemented: `resolveCountry` moved from `poa-template.tsx` into `lib/utils/countries.ts` (shared by both PDF templates); `getOperatorPackageData` query added to `lib/db/queries.ts` (gates on `documents_approved` status + 3 approved docs + all personal-detail fields non-null); `lib/operator/CoverSheet.tsx` PDF template with `renderCoverSheetPdf`; `lib/operator/packageBuilder.ts` with `buildOperatorPackage` (downloads docs via service-role client, zips with jszip 3.10.1); API route with Zod param validation, 401/403/404/500 error paths. TypeScript compiles cleanly; 264 unit tests passing.
- **Feature 19 UX items added** — no Google login, no password visibility toggle, operator user seeding gotcha (raw SQL insert does not produce valid Supabase Auth session; promote existing account instead).
- **Feature 14a-2-T — Tests** — 33 new tests across 3 files: `tests/unit/lib/operator/packageBuilder.test.ts` (ZIP structure, MIME→ext mapping, cover sheet content, storage error paths), `tests/unit/api/operator/package.test.ts` (400/401/403/404/500/200 route handler paths), `tests/integration/db/operator-package.test.ts` (18 cases for `getOperatorPackageData` — null on wrong status, incomplete details, missing/superseded/unapproved docs; success with correct shape). Both suites run automatically in CI on every push. Integration tests require Docker — confirmed working pattern (same as existing integration suite).
- **Feature 14b — Operator Archive, Preferences & Submission Email** — `lib/utils/dates.ts` created with `formatSubmissionDate`; 4 new DB queries (`getOrderDataForSubmissionEmail`, `getSubmittedOrders`, `getOperatorPreferencesOrDefaults`, `upsertOperatorPreferences`); `lib/email/templates/order-submitted-customer.tsx` in 4 locales; `send.ts` extended with `order_submitted_customer` template; `markOrderAsSubmitted` wired with fire-and-forget email + second `revalidatePath` for archive; `updateOperatorPreferences` Server Action (validate → role check → phone guard → upsert → audit log); shadcn `Switch` installed; `OperatorNav` client component with locale-aware active detection; operator layout updated with nav; `/operator/submitted` page (read-only archive table); `/operator/preferences` page + `PreferencesForm` client component; translation keys added to all 4 locale files; operator test file updated (sendEmail mock, new queries mock) + 16 new tests for both actions. 274 unit tests passing, `npm run build` passes.
- **Feature 14b — Tests** — 18 new unit tests: `formatSubmissionDate` (6 cases in `tests/unit/lib/utils/dates.test.ts`), `OrderSubmittedCustomerEmail` template smoke tests in 4 locales + key content assertions + `getOrderSubmittedCustomerSubject` locale uniqueness (10 cases appended to `templates.test.tsx`), `sendEmail` dispatch for `order_submitted_customer` in 2 locales (appended to `send.test.ts`). 23 new integration tests in `tests/integration/db/operator-14b.test.ts`: `getSubmittedOrders` (empty, filter, exclusion, ordering, shape), `getOperatorPreferencesOrDefaults` (defaults when missing, stored values, read-only guarantee), `upsertOperatorPreferences` (insert, ON CONFLICT update, phone number), `getOrderDataForSubmissionEmail` (null for missing, join shape, null fullName, all 4 locales). 292 unit tests passing.
- **Feature 14c — App-Wide Navigation** — `DashboardSignOutButton` (client), `DashboardHeader` (server, sticky, brand link + LanguageSwitcher + sign-out), `DashboardLayout` (new `app/[locale]/(dashboard)/layout.tsx` — auth guard + header shell); `OperatorNavLinks` (client, tab nav with active indicator replacing `OperatorNav`); `AdminNavLinks` (client, same pattern); operator layout rewritten to single sticky bar (brand + tabs inline); admin layout rewritten to single sticky bar (brand + tabs inline); `OperatorNav.tsx` deleted; i18n keys `nav.signOut` / `nav.accountSettings` added to all 4 locale files. Build: clean. 292 unit tests passing.
- **Feature 14d — Performance: Loading States & Auth Caching** — `getCurrentUser()` wrapped in React `cache()` in `lib/auth/session.ts` (deduplicates layout + page DB calls per request); `loading.tsx` skeletons added for `/operator`, `/operator/submitted`, `/operator/preferences`, `/signin`, `/signup`. Note: `unstable_instant` (Next.js 16.2) was researched and specced but requires `cacheComponents: true` in `next.config.ts` — enabling it is an architectural decision deferred to a future feature. Skeletons deliver their core UX benefit without it. 292 unit tests passing, build clean.
- **Feature 15 — NIF Delivery** — `AdminOrderDetail` interface extended with `nifNumber`; `getAdminOrderDetail` SELECT updated; `getOrderNifAndTier` (lightweight read for immutability check) and `deliverNifNumber` (atomic UPDATE: `nifNumber`, `status = 'delivered'`, `deliveredAt`, `fiscalRepExpiresAt = deliveredAt + 12 months` for Standard/Express, null for Essential) added to `lib/db/queries.ts`; `adminDeliverNif` Server Action added to `app/actions/admin.ts` (validate → requireRole → immutability guard → deliverNifNumber → audit log → revalidate); `DeliverNifSection` client component created (`components/admin/DeliverNifSection.tsx`) with inline confirmation pattern, digit-only input, delivered read-only state; wired into admin order detail aside; i18n keys added under `admin.detail.deliverNif` in all 4 locales. Customer dashboard was already wired (08b placeholder, `getUserActiveOrder` returns all fields). 7 new unit tests, 300 total passing, build clean.
- **Feature 17b — Account Settings (Language Preference)** — `updateLanguagePreference` action + `updateUserLanguage` DB query + `LanguagePreferenceForm` (shadcn Select, `useState`, locale-aware `router.push`). Enum derived from `routing.locales` — no hardcoded strings. i18n keys in all 4 locales. Bugfix: `text-secondary` shorthand collision in `OrderDetailHeader`. 363 unit tests passing, build clean.
- **Feature 17a — Account Settings (Security & Deletion)** — `app/[locale]/(dashboard)/settings/page.tsx` (calls `setRequestLocale(locale)` — required so `NextIntlClientProvider` serialises locale to client; fixes "No intl context" in `LanguageSwitcher`) + `loading.tsx` (3-card skeleton); `app/actions/settings.ts` (`changeEmail`, `changePassword`, `deleteAccount`); `lib/validations/settings.ts` (`changeEmailSchema`, `changePasswordSchema`, `deleteAccountSchema`); `strongPassword` exported from `lib/validations/auth.ts`; `components/dashboard/settings/` (`ChangeEmailForm`, `ChangePasswordForm`, `DeleteAccountSection`); `settings` namespace added to all 4 locale files (← arrow removed from `backToDashboard` to fix double-arrow visual bug); `DashboardHeader` updated: text link replaced with gear icon (`Settings` from lucide-react, `aria-label` for accessibility). Tests: `tests/unit/validations/settings.test.ts` (23 tests — strongPassword, changeEmailSchema, changePasswordSchema, deleteAccountSchema) + `tests/unit/actions/settings.test.ts` (24 tests — all 3 actions, error branches, signOut/updateUser call guards). 363 unit tests passing, build clean.
- **Feature 16 — Delivery Emails** — `getOrderNifAndTier` in `lib/db/queries.ts` extended with `leftJoin` on `users` to return `customerEmail`, `customerLanguage`, and `fullName` alongside existing fields; `lib/email/templates/nif-delivered.tsx` created (4 locales: EN/FR/ES/DE) — intentionally minimal: NIF number in a prominent brand-tinted monospace block + dashboard CTA only, no guide content (bank/property/NHR removed — biased recommendations and regulatory risk; content hub deferred to v2, logged in `project-overview.md`); `nif_delivered` registered in `lib/email/send.ts` (union member + switch case + exhaustive check); `adminDeliverNif` wired with `void sendEmail(...)` fire-and-forget after `deliverNifNumber` succeeds; 16 new unit tests (template smoke tests × 4 locales + NIF-in-output + no-guide-content assertion + dashboard URL + subject uniqueness; send dispatch × 2 locales; action: sendEmail called on success, fullName-null fallback, NOT called on immutability guard). 316 total passing, build clean.
- **Feature 18a — Renewal Flow (Checkout & Extension)** — `getRenewalOrderInfo`, `extendFiscalRepExpiry`, `getOrderFullName` DB queries in `lib/db/queries.ts`; `RenewalCheckoutSchema`, `RenewalWebhookMetadataSchema` + inferred types in `lib/validations/checkout.ts`; `createRenewalCheckoutSession` Server Action in `app/actions/checkout.ts`; `handleRenewalCheckoutCompleted` in `lib/stripe/webhooks.ts` (idempotency guard + `db.transaction` + fire-and-forget email); webhook route updated to dispatch on `metadata.type === 'fiscal_rep_renewal'`; `fiscal-rep-renewal-confirmation.tsx` email template (4 locales); `send.ts` extended with `fiscal_rep_renewal_confirmation` union member + switch case; `RenewalCheckoutButton` client component (single `ButtonState` state machine, auto-trigger via `useEffect`); `/[locale]/renewal` Server Component page + co-located `NotEligibleCard` / `RenewalCard` sub-components; `loading.tsx` skeleton; `renewal.*` i18n keys in all 4 locale files. 4 new test files (checkout action, webhook handler, email template, email send) covering 71 cases. 387 total unit tests passing, build clean.
- **Feature 19a — Auth UI Polish** — `PasswordInput` component created (`components/auth/PasswordInput.tsx`); password visibility toggle added to all 5 auth forms (SignInForm, SignUpForm, InternalSignInForm, NewPasswordForm, RequestPasswordResetForm); submit button loading states added (spinner + label: "Signing in…" / "Creating account…" / "Sending…" / "Updating password…") using `form.formState.isSubmitting`; skeleton `loading.tsx` files deleted from `/signin` and `/signup`; `emailConfirmationRequired` copy updated to non-promissory phrasing in all 4 locale files; `submitting` keys added to `auth.signIn`, `auth.signUp`, `auth.resetPassword`, `auth.newPassword` in all 4 locale files. 423 unit tests passing, build clean.
- **Feature 19d — Tests** — `tests/unit/lib/supabase/documents.test.ts` (4 cases: success URL, Supabase error → null, no URL → null, correct bucket name); `tests/unit/actions/checkout.test.ts` extended with 9 `createCheckoutSession` cases (invalid tier, invalid locale, null input, unauthenticated, happy path, Stripe throws, session.url null, locale-aware URLs, metadata shape without renewal type marker). 436 total unit tests passing.
- **Feature 19d — Admin Storage Utility, Text-2xs Token & Audit Annotations** — `lib/supabase/documents.ts` created with `getSignedDocumentUrl(filePath): Promise<string | null>` (60-min expiry constant, null-on-error); `DocumentReviewCard.tsx` swapped `createClient` + inline `createSignedUrl` for the new utility; `--text-2xs: 0.625rem` added to `globals.css` `:root` block + `--font-size-2xs: var(--text-2xs)` added to `@theme inline` (generates `text-2xs` Tailwind utility); `ui-context.md` Type Scale table updated with `--text-2xs` row; all 12 `text-[10px]` occurrences in 5 admin components (`DocumentReviewCard`, `OrderDetailHeader`, `ApproveOrderSection`, `DocumentOverrideButtons`, `StatusUpdateSection`) replaced with `text-2xs`; `text-[8px]` in `OrderTimeline.tsx` untouched; `OrderDetailHeader.tsx` — added `tAdmin = getTranslations('admin')`, status badge now uses `tAdmin('statuses.*')`, tier badge uses `tAdmin('tiers.*').toUpperCase()` (no more `.replace(/_/g, ' ')`); `StatusUpdateSection.tsx` — added `tAdmin = useTranslations('admin')`, Select options now use `tAdmin('statuses.*')`; `KNOWN LIMITATION` comment added above UUID-fragment render in `DocumentReviewCard.tsx`; empty TODO in `adminUpdateOrderStatus` replaced with `NOTE:` comment explaining the note is audit-logged but not emailed. Quality audit findings 4c, 3c, 3d, 3f, 6b resolved. 423 unit tests passing, build clean.
- **Feature 19b — Dashboard Timeline & Copy Fixes** — `payment_received` synthetic step prepended to `steps` array in `OrderTimeline.tsx` (always renders completed; `currentStepIndex` for `documents_pending` is now 1, so `index < currentStepIndex` is naturally true for the payment step — no logic change needed); progress-line width formula self-consistent with 6 steps (20% per real status transition); `dashboard.timeline.payment: "Payment"` key added to all 4 locale files; `documents.states.manualReview` value updated to remove the "4 hours" promise in all 4 locale files. 423 unit tests passing, build clean.
- **Feature 18b — Renewal Reminder Emails & Dashboard Banner** — `RenewalReminderTarget` type + `getOrdersForRenewalReminders` (3-cohort day-window query: 30/15/0 days, gte/lt range on `fiscalRepExpiresAt`, status=delivered, tier IN standard/express, dismissedAt IS NULL) + `dismissFiscalRepForOrder` DB queries; `renewal-reminder.tsx` email template (4 locales × 3 intervals: `30_days`/`15_days`/`expired` — inline styles, regulatory warning block); `send.ts` extended with `renewal_reminder` union member + switch case; `app/api/cron/renewals/route.ts` (Bearer auth via `CRON_SECRET`, processes 3 cohorts serially, per-cohort DB error = log + continue, fire-and-forget `sendEmail`, returns `{ success, processed }`); `dismissFiscalRep` Server Action in `app/actions/orders.ts` (Zod UUID validation, ownership check via `getUserActiveOrder`, sets `fiscalRepDismissedAt`); `DismissRenewalDialog.tsx` client component (shadcn AlertDialog, destructive confirm, `useTransition`); `RenewalBanner.tsx` server component (skips Essential + no-expiry + dismissed + >30 days; warning/error states via semantic tokens `bg-warning-subtle`/`bg-error-subtle`; `<Link>` from `@/i18n/navigation`); dashboard page wired with `RenewalBanner`; settings page wired with recovery link (shown when dismissed + non-Essential); `renewalBanner.*` + `settings.renewFiscalRep` i18n keys in all 4 locale files; Feature 22 (vercel.json cron schedule) added to feature list as post-launch. Tests: `orders.test.ts` (7), `cron-renewals.test.ts` (9), `templates.test.tsx` appended (12 smoke × intervals/locales), `send.test.ts` appended (2 dispatch). Note: test `ORDER_ID` must be valid UUID v4 (`00000000-0000-4000-8000-000000000001`) — Zod v4 enforces version bits. 423 total unit tests passing, build clean.

---

## Upcoming Features

- **Feature 20 — Integration Tests: Admin Queries & Operator Queue** — spec at `context/feature-specs/20-integration-test-admin-operator.md`. Six admin query functions (`getAdminOrderList`, `getAdminOrderDetail`, `adminSetDocumentApproved`, `adminSetDocumentFlagged`, `adminTransitionOrderToApproved`, `adminUpdateOrderStatusQuery`) and `getOperatorQueue` have zero real-DB coverage. Two new test files against Docker Postgres. Not blocking launch but should be done before the first real order is processed.
- **Feature 21b — E2E Tests (Playwright)** — deferred until UI is complete per user decision.
- **Feature 22 — Vercel Cron Schedule (`vercel.json`)** — wire up the renewal cron job; post-launch.
- **Feature 23 — Google OAuth** — not in current scope.

---

## Open Questions

- Q4 — SEO content strategy — not blocking launch.
- Q5 — RESOLVED: `@react-pdf/renderer`, POA copy needs fiscal rep review before launch.
- Q6 — RESOLVED: `documents` Supabase bucket pre-existed, RLS applied.
- Q7 — RESOLVED: "Submitted to Finanças" customer email implemented in Feature 14b (`order_submitted_customer` template, fired from `markOrderAsSubmitted`).

---

## Architecture Decisions

- Q1: Tier selection and deadline question are one screen — no separate step.
- Q2: AI document review is async with progressive badge states; 30s timeout → manual review.
- Q3: Fiscal rep renewal uses a new Stripe Checkout session per email — no stored payment method.
