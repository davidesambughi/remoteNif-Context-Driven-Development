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

Depends on: 02, 03.

---

## 05 — Marketing Home
Build the public homepage.

Done when:
- Hero, trust signals, how-it-works, and FAQ are present.
- The page is fully localized.
- No auth is required.
- Locale detection and manual switching work.

Depends on: 03.

---

## 06 — Pricing Page
Build the pricing page and tier selection flow.

Done when:
- Three pricing tiers are shown clearly.
- Card state reacts to deadline proximity.
- Tier selection routes to sign up or dashboard as appropriate.
- Tier info is preserved in the URL.

Depends on: 03, 04.

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

Depends on: 04, 06.

---

## 08 — Customer Dashboard
Build the authenticated customer dashboard shell.

Done when:
- Dashboard shows the correct state for each order status.
- All supported order states have a distinct view.
- Timeline and support contact are included.
- Delivery estimate copy is shown clearly.

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

Depends on: 10.

---

## 12 — Customer Emails
Add customer email templates and delivery triggers.

Done when:
- Order and document phase emails exist.
- Emails are localized.
- Emails include deep links back to the dashboard.
- Password reset email support is in place.

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

Depends on: 13.

---

## 15 — NIF Delivery
Add final NIF delivery handling.

Done when:
- NIF can be saved and delivered.
- The NIF cannot be changed once set.
- Delivery updates the dashboard state.
- Delivery timestamps and expiry dates are recorded correctly.

Depends on: 14.

---

## 16 — Delivery Emails
Add the delivery-phase email flow.

Done when:
- NIF delivery emails are sent.
- A follow-up guide email is scheduled after delivery.

Depends on: 15.

---

## 17 — Account Settings
Add user account settings.

Done when:
- Email can be changed securely.
- Password can be changed securely.
- Language preference is saved.
- Account deletion is supported safely.

Depends on: 04.

---

## 18 — Renewal Flow
Add fiscal representation renewal support.

Done when:
- Renewal reminders are sent on schedule.
- Renewal checkout works.
- Renewal payments extend the relevant expiry.
- Expired-state messaging and dismissal are handled properly.

Depends on: 15, 16.

---

## Notes

- Feature 17 can be built in parallel with 08–16 after auth is ready.
- Features 05 and 06 can be built in parallel with 07 after auth is ready.
- Do not start a feature until its dependencies are complete.
- Mark progress in `progress-tracker.md` as each feature finishes.