# Build Plan

Ordered by dependency. Finish each feature before starting the next.  
Each feature file lives next to this one as `NN-feature-name.md`.  
If a detail depends on current framework/library behavior, verify it against the latest docs during implementation.

**Component rule:** prefer shadcn/ui for all interactive elements (buttons, links styled as buttons, accordions, forms). Use custom markup only for purely display elements with no user interaction.

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

## 06b — Marketing Button Audit

Replace custom-styled link/anchor CTAs in existing marketing components with shadcn `Button asChild`.

Done when:

- `HeroSection` "Get Started" and "Learn More" use `Button asChild` with `Link` / `<a>`.
- `MarketingHeader` "Sign In" uses `Button asChild` with `Link`.
- All interactive elements in marketing components have a visible focus ring via shadcn's built-in `focus-visible:ring`.
- No new functionality added — visual appearance stays the same.

Notes:

- `StepCard` divs in `HowItWorksSection` are display-only — do not change them.
- Do not change shadcn component source files in `components/ui/`.

Depends on: 06a.

---

## 07a — Checkout Session

Implement Stripe checkout session creation triggered from tier selection.

Done when:

- Stripe package is installed and client is initialized.
- Checkout session can be created from the app (`app/actions/checkout.ts`).
- `ActionResult<T>` is moved from `app/actions/auth.ts` to `lib/types.ts`.
- Tier selection triggers the session creation and redirects to Stripe-hosted checkout.

Notes:

- Verify current Stripe checkout best practices.
- Do not add webhook handling or DB record creation yet.
- All new user-facing copy uses next-intl translation keys; add to all four locale files.

Depends on: 04, 06a.

---

## 07b — Checkout Webhook

Implement Stripe webhook processing to finalize order and payment records.

Done when:

- Webhook endpoint receives Stripe events (`app/api/webhooks/stripe/route.ts`).
- Webhook handling verifies signature and is idempotent.
- Successful payment (`checkout.session.completed`) creates the expected `Order` (status: `documents_pending`) and `Payment` records in the database.
- Order confirmation page is shown after successful checkout (part of the dashboard shell).

Notes:

- Verify current Stripe webhook best practices.
- Do not send order confirmation emails yet (that belongs to Feature 12).
- Do not implement document upload UI yet (that belongs to Feature 10).
- All new user-facing copy (confirmation page, error states) uses next-intl translation keys; add to all four locale files.

Depends on: 07a.

---

## 08a — Dashboard Shell & Pending State

Build the authenticated customer dashboard shell, data fetching, and the initial pending state.

Done when:

- Route `app/[locale]/(dashboard)/dashboard/page.tsx` fetches the current user's active order.
- `loading.tsx` is added to the dashboard route.
- Dashboard shell (layout wrapper) is implemented with responsive container.
- If order status is `documents_pending`, it shows the initial prompt to complete details and upload documents.
- Basic order info (tier) is displayed.

Notes:

- This is the first page with real async data fetching, so it is the right place to introduce loading states. Continue adding `loading.tsx` to each new route from Feature 09 onward.
- All new user-facing copy uses next-intl translation keys; add to all four locale files.
- The actual personal details form and document upload UI will be built in Features 09 and 10. For now, just build the shell and placeholder prompt.

Depends on: 07.

---

## 08b — Dashboard Order States & Timeline

Implement the visual timeline and all post-upload order states.

Done when:

- Visual timeline component correctly maps the order status to progress steps.
- All supported order states (`documents_under_review`, `documents_approved`, `submitted`, `delivered`) have a distinct view.
- Support contact link is included.
- Delivery estimate copy is shown clearly for the `submitted` state.
- NIF number is shown prominently for the `delivered` state.

Notes:

- All new user-facing copy uses next-intl translation keys; add to all four locale files.

Depends on: 08a.

---

## 09a — Personal Details Form

Add the personal details form and persist the data to the order record.

Done when:

- Customers can fill in and save all required personal details (name, nationality, date of birth, Portuguese address, NIF-adjacent fields, etc.).
- The form uses shadcn form primitives with react-hook-form + zod validation.
- Saved data is written back to the order record in the database.
- Document uploads stay locked until details are saved (gate enforced in the UI).
- Success and error states are clearly communicated to the user.

Notes:

- Use shadcn when possible — `Form`, `Input`, `Select`, `Button`, etc.
- Add comments to all non-trivial code.
- All new user-facing copy (form labels, validation messages, status copy) uses next-intl translation keys; add to all four locale files.
- The POA generation step (09b) must not block this feature — save first, generate PDF separately.
- Verify current email-confirmation status: per Feature 04 notes, if email confirmation is still disabled, add a check here that blocks POA generation (not form save) until the email is verified, as the legal note requires.

Depends on: 08.

---

## 09b — POA PDF Generation

Generate a pre-filled Power of Attorney PDF from the saved personal details.

Done when:

- After personal details are saved, a POA PDF is generated server-side pre-filled with the customer's data.
- The PDF download link appears in the dashboard once generation is complete.
- Regeneration is possible if details are edited (old link replaced).
- The generated file is stored securely (Supabase Storage or equivalent) and not publicly guessable.

Notes:

- Resolves open question Q5 on PDF library choice — research and select a suitable Node.js-compatible PDF library (e.g. `pdf-lib`, `@react-pdf/renderer`, or a puppeteer-based approach) before starting implementation.
- Generation should happen server-side (Server Action or API route) — never expose raw template logic to the client.
- Add comments to all non-trivial code.
- All new user-facing copy (generation status, download label, error states) uses next-intl translation keys; add to all four locale files.

Depends on: 09a.

---

## 10a — Storage Infrastructure & Security

Set up Supabase Storage and secure document upload tracking logic.

Done when:

- The `documents` bucket is created in Supabase Storage.
- Row Level Security (RLS) policies restrict users to only upload/read their own files associated with their order.
- Server Actions securely record document metadata (file path, type, size) into the Postgres `documents` table upon successful upload.

Notes:

- Backend/Infrastructure task only. No UI components.
- Resolves open question Q6.

Depends on: 09b.

---

## 10b — Document Upload UI

Add frontend document upload handling components.

Done when:

- Customers can upload the required document set (Passport, Proof of Address, Signed POA) using drag-and-drop components.
- Client-side file validation is enforced (PDF/JPG/PNG, max 10MB).
- Upload status is visible (idle, uploading, success, error).
- Signed POA is accepted without review.
- POA upload stays locked until personal details are saved.

Notes:

- UI only. Assumes the secure Server Actions from 10a are already in place.
- All new user-facing copy (upload slot labels, status messages, file validation errors) uses next-intl translation keys; add to all four locale files.

Depends on: 10a.

---

## 11a — Automated AI Document Review

Integrate AI to automatically review uploaded documents.

Done when:

- Uploaded documents (Passport, Proof of Address) are automatically sent for AI review upon successful upload.
- The AI correctly identifies if the document is valid or flagged.
- Approved and flagged states are updated in the database and shown clearly in the customer dashboard.

Notes:

- Verify current AI/document review integration approach (Google Gemini API) before implementation.
- AI flag reasons shown to customers must use `next-intl` translation keys — do NOT surface raw AI output as user-facing copy. Map AI responses to predefined error keys.
- The UI must include a 30-second timeout fallback (graceful degradation) transitioning the badge to "Still reviewing…" if the AI is slow.
- Cross-slot locking (locking other approved document slots when one is flagged) and hydrating the UI from the database should be implemented here, as deferred from 10b.

Depends on: 10b.

---

## 11b — Manual Review Escalation & Notifications

Implement the fallback manual review workflow and admin notifications.

Done when:

- Failed AI review attempts (e.g., 2 consecutive flags or AI errors) automatically escalate the document to manual review.
- The customer dashboard clearly shows the "Manual review required" state instead of asking for more uploads.
- Admins are notified when a document escalates to manual review, OR when all documents for an order are successfully approved.

Notes:

- Keeps the system robust against AI failures or persistent user upload errors.
- Ensures admins are kept in the loop only when human intervention is required or when the order is ready to proceed.

Depends on: 11a.

---

## 12a — Customer Emails (Order Phase)

Add customer email templates and delivery triggers for the order phase.

Done when:

- Order confirmation emails exist.
- Password reset email support is in place.
- Emails are localized and translations are coherent with other pages.
- Emails include deep links back to the dashboard.

Depends on: 07.

---

## 12b — Customer Emails (Document Phase)

Add customer email templates and delivery triggers for the document phase.

Done when:

- Document review status and approval notification emails exist.
- Emails are localized and translations are coherent with other pages.
- Emails include deep links back to the dashboard.

Depends on: 11, 12a.

---

## 13a — Admin Panel (Order List)

Build the admin area order list and filter views.

Done when:

- Admins can view and filter orders in a main table view.
- **Proxy redirect for admin/operator routes is updated.** Currently `proxy.ts` redirects all unauthenticated users (including admins hitting `/admin/*` and operators hitting `/operator/*`) to the customer `/signin` page. Per `user-flows.md` Flow 6d and 6e, they should be redirected to `/admin/signin` and `/operator/signin` respectively. Fix the proxy's redirect logic when building this feature — it requires detecting the route prefix and choosing the correct sign-in destination.

Depends on: 11, 12b.

---

## 13b — Admin Panel (Order Detail & Actions)

Build the admin order detail view and status update actions.

Done when:

- Order detail views show customer and document data.
- Admin actions update order/document state.
- Key actions are logged.

Depends on: 13a.

---

## 14a — Operator Queue (Packaging & Submission)

Build the operator priority queue and submission workflow.

Done when:

- Operators see the queue in the correct priority order.
- Orders can be packaged and submitted.

Depends on: 13b.

---

## 14b — Operator Queue (Archive & Preferences)

Build the operator archive view and preferences area.

Done when:

- Submitted orders move into an archive view.
- Operator notification preferences can be updated.

Depends on: 14a.

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

## 17a — Account Settings (Security & Deletion)

Add user account security settings and deletion.

Done when:

- Email can be changed securely.
- Password can be changed securely.
- Account deletion is supported safely.

Notes:

- All new user-facing copy uses next-intl translation keys; add to all four locale files.
- This feature adds more auth-adjacent forms — evaluate whether a shared form hook is worth introducing to reduce the structural repetition across auth form components.

Depends on: 04.

---

## 17b — Account Settings (Language Preference)

Add user language preference settings.

Done when:

- Language preference is saved.
- The UI immediately applies the saved language preference.

Notes:

- All new user-facing copy uses next-intl translation keys; add to all four locale files.

Depends on: 17a.

---

## 18a — Renewal Flow (Checkout & Extension)

Add fiscal representation renewal checkout and expiry extension.

Done when:

- Renewal checkout works.
- Renewal payments extend the relevant expiry.

Notes:

- All new user-facing copy uses next-intl translation keys; add to all four locale files.

Depends on: 15, 16.

---

## 18b — Renewal Flow (Reminders & Expired State)

Add fiscal representation renewal reminders and expired-state handling.

Done when:

- Renewal reminders are sent on schedule.
- Expired-state messaging and dismissal are handled properly.

Notes:

- All new user-facing copy (renewal banner, expiry messaging) uses next-intl translation keys; renewal emails sent in the customer's stored language preference.

Depends on: 18a.

---

## 19 — UX Improvements & Corrections

Fix accumulated UX gaps and misleading states discovered during testing.

Done when:

- All identified misleading or broken user-facing states are corrected.
- Error messages map to what actually happened — no raw i18n keys, no generic copy where a specific message exists.
- Edge cases discovered during development are handled gracefully.

Known items to address:

- **Signup — "email already in Supabase Auth but not in public.users"**: Supabase silently accepts the signup call, attempts to send a confirmation email, but returns no session. The user sees "Email confirmation is required. Please check your inbox." — misleading because the email is either never sent (SMTP domain restriction blocks sends to non-owner addresses during dev) or Supabase silently swallows the duplicate. The fix is to detect this state more precisely and show a message that does not promise an email the system may not have sent (e.g. "If this email is not registered, you'll receive a confirmation link shortly.") — or, once email confirmation is re-enabled pre-launch, test the full confirmation flow end-to-end.
- **Personal details form — no success state after save**: after a successful save the form stays fully visible and editable, giving no signal that the save worked. Users may think it failed and retry or abandon. Fix: collapse the form into a read-only summary card on success, with an "Edit" link to re-open it. Also add a short pre-submit note ("Please double-check your details — they will be used in your official application") to surface the typo-check prompt before saving.
- **Document upload — no delete/re-upload for approved slots (discovered: Feature 11a testing)**: once a slot reaches `approved`, there is no self-serve way for the user to replace it (e.g. wrong file that AI still cleared). The `flagged` path already has Re-upload. An `approved` slot would need: (a) a "Replace" button visible only when `order.status === 'documents_pending'`; (b) a server action that soft-deletes the existing record (`supersededAt = now`) and resets the slot to `idle` for a fresh upload + re-review; (c) locked once order moves past `documents_pending`. Restriction: `manual_review` slots must NOT get a Replace button — admin handles those. Defer until real usage confirms demand.
- **`DocumentUploadSlot` — extract `useDocumentUpload` hook (structural refactor)**: the component's `handleFile` function is a 105-line async pipeline (validate → sign URL → PUT to storage → register in DB → AI review → timeout management). Extract all state and async logic into `hooks/useDocumentUpload.ts`, leaving the component as a thin renderer. Also consolidate the two boolean sub-state flags (`isReviewing`, `isSlowReview`) into the main `SlotStatus` state machine to remove the manual sync requirement. Do not change any behavior — structural refactor only. Verify the full upload flow (upload, AI review, timeout, cross-slot locking) still works end-to-end after the change.
- **Email confirmation template is unstyled (discovered: Feature 11a testing)**: the Supabase default confirmation email is plain and unbranded. Fix: customize the email template in Supabase Auth → Email Templates to match RemoteNIF branding (logo, colors, clear CTA button). All four locale email templates should be updated.
- **Timeline missing "Payment received" step and not reactive during partial upload (discovered: Feature 11a testing)**: the timeline starts at "Upload" with no indication that payment was already confirmed. "Payment received" should be step 1, always shown as complete once the user reaches the dashboard. Additionally, the timeline does not visually progress while the user uploads documents one by one — it only advances when the order status changes, which only happens after all 3 documents are approved. Consider showing partial progress within the `documents_pending` state.
- **`manual_review` copy promises a 4-hour SLA (discovered: Feature 11a testing)**: the message "Our team will review your document within 4 hours" makes a specific time commitment that is not guaranteed and misleads users. Fix: replace with something like "Our team has been notified and will review this document manually." — no time promise.
- **Pricing page — fiscal representation issue**: Ask the user before writing any copy or making changes regarding who needs fiscal representation (EU/EEA vs non-EU, active tax ties, etc.).
- Add further items here as they are discovered during feature testing.

Notes:

- This feature is a rolling list — add to it whenever a UX gap is found during testing of any earlier feature.
- Do not add new functionality here. Corrections and copy/state fixes only.
- All copy changes go through next-intl as usual.

Depends on: 18b (all functional features complete so the full flow can be reviewed).

---

## 20 — SEO & Metadata

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

Depends on: 18b (all pages must exist to write meaningful metadata).

---

## 21 — UI Polish & High Fidelity

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

**Known issues to address during this feature:**

- `--bg-elevated` is identical to `--bg-surface` (both white) — no elevation contrast between cards and modals. Give `--bg-elevated` a distinct value before the polish pass.
- The status-subtle background pattern was introduced in Feature 10b cleanup: any surface that carries a status (`pending`, `approved`, `flagged`, etc.) should use `bg-warning-subtle` / `bg-success-subtle` / `bg-error-subtle` as the card background, plus a matching colored border and icon. This pattern is already applied on `DocumentUploadSlot` and the `PersonalDetailsForm` summary card — apply it consistently to any new state-bearing surfaces added in later features.
- Brand color moments: each major section should have one deliberate brand-color anchor (e.g. brand-tinted background block, brand top border on a card). Currently applied on `AuthCard` (top border) and `HeroSection` stats grid (tinted block). Extend this pattern to new pages during the polish pass.

Depends on: 20 (all features complete).

---

## Notes

- Features 17a and 17b can be built in parallel with 08–16 after auth is ready.
- Features 05 and 06 can be built in parallel with 07 after auth is ready.
- Do not start a feature until its dependencies are complete.
- Mark progress in `progress-tracker.md` as each feature finishes.
