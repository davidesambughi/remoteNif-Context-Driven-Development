# Build Plan

Ordered by dependency. Finish each feature before starting the next.  
Each feature file lives next to this one as `NN-feature-name.md`.  
If a detail depends on current framework/library behavior, verify it against the latest docs during implementation.

---

## 01 — Foundation
Set up the base app environment and shared config.

Done when:
- TypeScript strict mode is enabled.
- ESLint is configured.
- Env validation exists in `lib/env.ts`.
- Pricing and renewal config live in `lib/pricing.ts`.
- Global design tokens are mapped to Tailwind.

Depends on: nothing.

---

## 02 — Data Layer
Set up the database schema and Supabase clients.

Done when:
- All core tables exist: users, orders, documents, payments, operator_notifications, operator_preferences, audit_log.
- Supabase client helpers exist for browser, server, and admin use.
- Required indexes are in place.
- First migration applies cleanly.

Depends on: 01.

---

## 03 — Locale and Routing
Add locale-based routing and protected route handling.

Done when:
- App Router uses locale segments.
- Internationalization config is in place.
- Message files exist for en, fr, es, de.
- Protected route groups redirect unauthenticated users.

Notes:
- Verify current Next.js internationalization and routing guidance.search online - breaking changes since your last training
- Keep route matching aligned with locale handling.

Depends on: 01.

---

## 04 — Authentication
Implement sign up, sign in, sign out, and password reset.

Done when:
- Customers can create accounts and sign in.
- User profiles are created in the database.
- Role-based access comes from stored user data.
- Admin and operator sign-in use the same auth system.

Notes:
- Verify current Supabase auth patterns before implementation.
- **Email confirmation is currently disabled in Supabase (required for MVP checkout flow).** This is intentional but a security tradeoff — without it, users can register with an email they don't own. Before launch, add a non-blocking email verification step: allow sign-up and payment immediately, but require a verified email before the order is submitted to the Portuguese tax authority (Feature 09 or 10). This avoids legal/GDPR risk without breaking the checkout funnel.

Depends on: 02, 03.

---

## 05a — Marketing Home (Structure)
Build the public homepage sections in English.

Done when:
- Hero, trust signals, how-it-works, and FAQ are present.
- No auth is required.
- Page renders correctly across all locales (content stays in English).

Depends on: 03.

---

## 05b — Marketing Home (Localization)
Translate the homepage into all four supported locales.

Done when:
- All homepage copy exists in en, fr, es, de message files.
- Each locale renders its own translated content.
- Locale detection and manual switching work end-to-end.

Depends on: 05a.

---

## 05c — Auth i18n Fixes
Fix five i18n defects in the auth layer deferred from Feature 04: locale-unaware router and link imports in client form components, hardcoded English error strings in two Server Actions, and untranslated `auth` namespace in fr/es/de message files.

Done when:
- All auth form components use `useRouter` and `Link` from `@/i18n/navigation`.
- `signUp` and `updatePassword` Server Actions return translation keys, not raw strings.
- `auth` namespace is fully translated in `fr.json`, `es.json`, `de.json`.
- Post-auth redirects land on the correct locale URL on all four locales.

Depends on: 05b.

---

## 06a — Pricing Page (Structure)
Build the static pricing page and tier selection routing.

Done when:
- Three pricing tiers are shown clearly with prices, features, and delivery times.
- Tier selection routes to signup (unauthenticated) or dashboard (authenticated) as appropriate.
- Tier info is preserved in the URL (e.g. `?tier=standard`).
- All copy uses next-intl translation keys; added to all four locale files.

Depends on: 03, 04.

---

## 06b — Pricing Page (Deadline Proximity Logic)
Add deadline-awareness to the pricing tier cards.

Done when:
- User can input or select their required NIF deadline.
- Card state reflects tier feasibility based on the selected deadline.
- Tiers that cannot meet the deadline are visually de-emphasised or flagged.
- Logic reads delivery time constants from `lib/pricing.ts`.

Notes:
- Design decision required before implementation: how should infeasible tiers render? (greyed out, warning badge, disabled CTA?) Provide a reference or decision before writing the spec.
- `TierConfig.deliveryDescription` in `lib/pricing.ts` is a hardcoded English string — replace with a translation key before rendering it in UI.

Depends on: 06a.

---

## 07 — Checkout
Add Stripe checkout and webhook processing.

Done when:
- Checkout can be created from the app.
- Successful payment creates the expected order/payment records.
- Webhook handling is idempotent.
- Order confirmation updates correctly after checkout.

Notes:
- Verify current Stripe and webhook best practices.
- Consider splitting: checkout session creation and webhook processing + DB record writes are independent concerns.
- All new user-facing copy (confirmation page, error states) uses next-intl translation keys; add to all four locale files.
- When creating `app/actions/checkout.ts`, move `ActionResult<T>` from `app/actions/auth.ts` to `lib/types.ts` so all action files share it.

Depends on: 04, 06.

---

## 08 — Customer Dashboard
Build the authenticated customer dashboard shell.

Done when:
- Dashboard shows the correct state for each order status.
- All supported order states have a distinct view.
- Timeline and support contact are included.
- Delivery estimate copy is shown clearly.

Notes:
- Consider splitting: dashboard shell + empty/pending state first, then remaining order states separately.
- All new user-facing copy uses next-intl translation keys; add to all four locale files.
- Add `loading.tsx` to the dashboard route — this is the first page with real async data fetching, so it is the right place to introduce loading states. Continue adding `loading.tsx` to each new route from Feature 09 onward.

Depends on: 07.

---

## 09 — Personal Details
Add the personal details form and POA generation flow.

Done when:
- Customers can save personal details.
- Order data updates correctly.
- A pre-filled POA document is generated.
- The POA download link appears after save.
- Document uploads stay locked until details are complete.

Notes:
- Consider splitting: the form + data save is one session; PDF generation is a separate concern (see open question Q5 on PDF library).
- All new user-facing copy (form labels, validation messages, status copy) uses next-intl translation keys; add to all four locale files.

Depends on: 08.

---

## 10 — Document Uploads
Add document upload handling.

Done when:
- Customers can upload the required document set.
- File validation is enforced.
- Upload status is visible.
- Signed POA is accepted without review.
- POA upload stays locked until personal details are saved.

Notes:
- Consider splitting: Supabase Storage bucket setup and upload UI are distinct concerns (see open question Q6).
- All new user-facing copy (upload slot labels, status messages, file validation errors) uses next-intl translation keys; add to all four locale files.

Depends on: 09.

---

## 11 — Document Review
Add automated document review and escalation.

Done when:
- Uploaded documents are reviewed automatically where needed.
- Approved, flagged, and error states are shown clearly.
- Failed review attempts can escalate to manual review.
- Admins are notified when escalation or completion happens.

Notes:
- Verify current AI/document review integration approach before implementation.
- Consider splitting: AI review integration and the escalation + admin notification flow are independent concerns.
- AI flag reasons shown to customers must use next-intl translation keys — do not surface raw AI output as user-facing copy.

Depends on: 10.

---

## 12 — Customer Emails
Add customer email templates and delivery triggers.

Done when:
- Order and document phase emails exist.
- Emails are localized.
- Emails include deep links back to the dashboard.
- Password reset email support is in place.

Notes:
- Consider splitting: order-phase templates and document-phase templates can be built independently.

Depends on: 07, 11.

---

## 13 — Admin Panel
Build the admin area for review and approvals.

Done when:
- Admins can view and filter orders.
- Order detail views show customer and document data.
- Admin actions update order/document state.
- Key actions are logged.

Notes:
- Consider splitting: order list + filter view and order detail + actions are distinct screens.
- **Proxy redirect for admin/operator routes needs updating.** Currently `proxy.ts` redirects all unauthenticated users (including admins hitting `/admin/*` and operators hitting `/operator/*`) to the customer `/signin` page. Per `user-flows.md` Flow 6d and 6e, they should be redirected to `/admin/signin` and `/operator/signin` respectively. This was deferred from Feature 04 to avoid scope creep. Fix the proxy's redirect logic when building this feature — it requires detecting the route prefix and choosing the correct sign-in destination.

Depends on: 11, 12.

---

## 14 — Operator Queue
Build the operator queue and preferences area.

Done when:
- Operators see the queue in the correct priority order.
- Orders can be packaged and submitted.
- Submitted orders move into an archive view.
- Operator notification preferences can be updated.

Notes:
- Consider splitting: queue + packaging logic and the archive view + preferences area are independent concerns.

Depends on: 13.

---

## 15 — NIF Delivery
Add final NIF delivery handling.

Done when:
- NIF can be saved and delivered.
- The NIF cannot be changed once set.
- Delivery updates the dashboard state.
- Delivery timestamps and expiry dates are recorded correctly.

Notes:
- All new user-facing copy uses next-intl translation keys; add to all four locale files.

Depends on: 14.

---

## 16 — Delivery Emails
Add the delivery-phase email flow.

Done when:
- NIF delivery emails are sent.
- A follow-up guide email is scheduled after delivery.
- Emails are sent in the customer's stored language preference.

Depends on: 15.

---

## 17 — Account Settings
Add user account settings.

Done when:
- Email can be changed securely.
- Password can be changed securely.
- Language preference is saved.
- Account deletion is supported safely.

Notes:
- Consider splitting: email + password changes and account deletion are higher-risk than language preference and can be scoped separately.
- All new user-facing copy uses next-intl translation keys; add to all four locale files.
- This feature adds more auth-adjacent forms — evaluate whether a shared form hook is worth introducing to reduce the structural repetition across auth form components.

Depends on: 04.

---

## 18 — Renewal Flow
Add fiscal representation renewal support.

Done when:
- Renewal reminders are sent on schedule.
- Renewal checkout works.
- Renewal payments extend the relevant expiry.
- Expired-state messaging and dismissal are handled properly.

Notes:
- Consider splitting: Stripe renewal checkout + expiry extension and the reminder scheduling + expired-state UI are independent concerns.
- All new user-facing copy (renewal banner, expiry messaging) uses next-intl translation keys; renewal emails sent in the customer's stored language preference.

Depends on: 15, 16.

---

## 19 — SEO & Metadata
Add per-page metadata, structured data, sitemap, and robots.txt.

Done when:
- Every public page has a `title` and `description` in the root language (English).
- Open Graph tags are present on all public-facing pages.
- JSON-LD structured data is added where relevant (homepage, pricing page).
- `sitemap.ts` and `robots.ts` are generated dynamically.
- Canonical URLs are correct across all locales.
- `metadataBase` resolves correctly in production.

Notes:
- Resolves open question Q4 (SEO content strategy).
- Locale variants of metadata (translated titles/descriptions) are a stretch goal — English is sufficient for launch.
- Do not add per-page metadata before this feature — the base template in root layout is enough until here.

Depends on: 18 (all pages must exist to write meaningful metadata).

---

## 20 — UI Polish & High Fidelity
Do a full visual pass across all screens once every feature is structurally complete.

Done when:
- Typography, spacing, and visual hierarchy are consistent across all pages.
- All screens have been reviewed at mobile, tablet, and desktop breakpoints.
- Interaction states (hover, focus, disabled, loading) are polished on every interactive element.
- The homepage, pricing page, and dashboard — the three highest-traffic screens — have been reviewed against the approved high-fidelity designs.
- No raw Tailwind color classes or hardcoded values remain anywhere in the codebase.
- No hardcoded string literals in any component — all user-facing text goes through next-intl.

Notes:
- This is the only feature where touching multiple screens in one session is acceptable — coherence across screens is the goal.
- Do not redesign structure or add new sections here — polish only. Structural changes belong in the feature they affect.
- A high-fidelity mockup or design reference should be provided before starting this feature.

Depends on: 19 (all features complete).

---

## Notes

- Feature 17 can be built in parallel with 08–16 after auth is ready.
- Features 05 and 06 can be built in parallel with 07 after auth is ready.
- Do not start a feature until its dependencies are complete.
- Mark progress in `progress-tracker.md` as each feature finishes.