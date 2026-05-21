# Progress Tracker

---

## Current Phase

Active development. Features 01–13b complete.

---

## Current Goal

Feature 14 (next unbuilt feature — check feature list).

> **Quality audit complete** (2026-05-21). All 3 red violations fixed. 14 yellow smells remain — tracked in `context/quality-audit.md`.

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

---

## Open Questions

- Q4 — SEO content strategy — not blocking launch.
- Q5 — RESOLVED: `@react-pdf/renderer`, POA copy needs fiscal rep review before launch.
- Q6 — RESOLVED: `documents` Supabase bucket pre-existed, RLS applied.

---

## Architecture Decisions

- Q1: Tier selection and deadline question are one screen — no separate step.
- Q2: AI document review is async with progressive badge states; 30s timeout → manual review.
- Q3: Fiscal rep renewal uses a new Stripe Checkout session per email — no stored payment method.
