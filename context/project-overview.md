# Product Requirements Document — RemoteNIF v2

**Version:** 1.0  
**Date:** April 2026  
**Status:** Draft

---

## 1. Who Is This For?

**Primary user: Marcus.**

Marcus is a 44-year-old American who just had an offer accepted on a two-bedroom apartment in Lisbon. His real estate agent told him he needs a NIF number before he can sign the CPCV (promissory contract) in three weeks. He lives in New York, he doesn't speak Portuguese, and he cannot travel to Portugal right now.

He Googled "get NIF Portugal online," found four services with nearly identical names and wildly different pricing pages, and has no idea which one is legitimate or whether the €89 upfront fee is the real total cost or just the beginning. He's worried about being scammed. He has a closing deadline and it cannot move.

**Secondary user: Amira.**

Amira is a 31-year-old French digital nomad applying for Portugal's D8 remote work visa. The Portuguese consulate requires a NIF as part of the application. She found this out during her application and has a consulate appointment in Paris in 12 days. She's technically comfortable but has never dealt with Portuguese bureaucracy.

**We are not building for:**
- Portuguese citizens or residents who already have a NIF
- Businesses seeking a collective NIF (empresa)
- Tax attorneys or accountants reselling the service to clients

---

## 2. What Problem Does It Solve?

### For Marcus: Deadline Risk

Marcus cannot proceed with a legal property transaction without a NIF. He cannot get one directly from abroad — as a non‑resident he must use a licensed fiscal representative in Portugal to submit the application on his behalf. The alternative is either a trip to Portugal or hiring a service that handles the fiscal‑representative process remotely.

The concrete problem: **he faces a hard legal deadline, has no viable DIY path, and the market of services solving this is opaque, untrustworthy-looking, and inconsistently priced.**

The secondary problem: the market's pricing model is deliberately confusing. Most services advertise a low upfront number and bury monthly or annual fiscal representation fees in the fine print. Marcus discovers this only after paying. His trust in the category is damaged before he even begins.

### For Amira: Bureaucratic Opacity

Amira's problem is different. She has time (12 days), but she doesn't understand which document type qualifies as proof of address, whether a French lease agreement is acceptable, or what happens if her document gets rejected. She needs confidence, not just speed.

### Language Barrier

Both Marcus and Amira face the same tertiary problem: **the entire Portuguese bureaucratic process is in Portuguese.** Competitors offer English-language checkout flows, but most provide minimal or no localization beyond that. Email notifications, status updates, and support are often English-only or poorly translated.
For a French speaker like Amira or a Spanish-speaking customer, this adds unnecessary friction. The product must communicate clearly in the customer's language throughout the entire journey — not just at checkout.


### The Market Gap

Competitors (nifportugal.com, Bordr, e-residence.com, Novomove) solve the mechanical part — they do submit NIF applications. What none of them do well:

1. **Show the real total cost upfront.** Most hide ongoing fiscal rep fees.
2. **Acknowledge the customer's deadline.** None ask when the NIF is needed and whether the selected tier will get there in time.
3. **Provide meaningful status transparency.** After you pay, most send an email and go silent for days.
4. **Explain what comes next.** Getting a NIF is step one. Marcus also needs to know about opening a Portuguese bank account, paying IMT tax, and registering the deed. Nobody is guiding him through the full journey.

### Regulatory Context (Critical)

As of July 1, 2026 — three months from this writing — Portugal's law changes: non-EU residents with **no Portuguese tax obligations** will no longer be legally required to appoint a fiscal representative. This directly undercuts the main recurring revenue model of every competitor.

This product must be designed with that shift in mind. Fiscal representation cannot be the primary recurring value. The recurring value must be **compliance confidence**: helping customers stay correctly registered, filing the right declarations, and not getting fined.

---

## 3. Core User Flow

1. The user lands on the homepage and reviews pricing, trust signals, and additional free value and information ( building trust).
2. User enter the flow sees the deadline question and pricing tiers together — selects the appropriate tier based on their timeline.
3. User creates an account with their email and password.
4. User completes checkout via Stripe.
5. User downloads the pre-filled POA, signs it, and uploads it alongside their passport and proof of address from their authenticated dashboard.
6. AI pre-checks documents — returns clear, flagged with reason, or error.
7. If flagged, user re-uploads the corrected document.
8. Admin reviews and approves the document package. (48h submission clock starts here for Express orders)
9. Operator receives alert, downloads the pre-prepared package, and submits to ebalcão.
10. Operator marks the order as submitted — system auto-transitions status.
11. NIF is issued by Finanças — operator enters the NIF number into the admin panel and marks order as delivered. System stores the number and displays it permanently on the customer's dashboard.
12. Customer receives delivery email and lands on the status page showing completion.
13. Post-NIF journey guide email is sent automatically.

---

## 4. What Are We Building?

### Core Product: NIF Acquisition (Three Tiers)

| Tier | Price | What's Included | Delivery |
|------|-------|-----------------|----------|
| **Essential** | €79 | NIF only, no fiscal rep | 5 business days |
| **Standard** | €129 | NIF + 12 months fiscal representation | 5 business days |
| **Express** | €179 | NIF + 12 months fiscal representation | Application submitted within 48h of document approval

**Why this structure :**
- Express guarantees document review and submission to Finanças within 48 hours of upload — something no competitor explicitly promises. Most advertise fast delivery without explaining what they control. Being honest about the Finanças queue, while committing to a fast submission, builds trust and sets expectations that are realistic to beat."
- The 48h submission clock starts from document approval, not from payment or upload. This must be stated clearly at checkout: "Your 48-hour window begins once your documents pass review.
- Standard includes 12 months (not 1 year with ambiguous renewal), clearly stated
- Essential is for EU citizens who don't legally need fiscal rep — explicitly say so on the UI

### Feature: Deadline-Aware Checkout

The pricing page opens with the question "When do you need your NIF?" followed by the three tier cards — each showing price, submission time, and included benefits. The cards are the answer to the question. There is no separate selector step.

Each card maps to a deadline scenario:
- **Express** — for customers with an urgent deadline (property closing, visa appointment)
- **Standard** — for customers who need their NIF within 5 business days
- **Essential** — for customers with no urgent deadline (EU citizens who don't legally need fiscal rep)

The user picks one card and proceeds to account creation. No extra step.

### Feature: Order Timeline & Status Page

After checkout, the customer lands on a dashboard showing:
- Their NIF application status with a visual timeline (not just a status badge)
- Estimated delivery date, based on typical Finanças processing times — shown as an estimate, not a guarantee. Copy must make clear that this is outside our control once the application is submitted.
- What each status means in plain language
- A way to contact support directly from this page

Status transitions trigger email notifications. Every email includes a deep link back to the status page.

### Feature: Document AI Pre-Check

After document upload, the system runs an AI review (Gemini) and returns one of three results:
- **Clear** — document accepted, no action needed
- **Flagged with specific reason** — "Your proof of address is older than 3 months, which Finanças may reject. Upload a more recent document."
- **Error** — AI unavailable, admin will review manually

The key improvement over the current implementation: **Flagged results must include a specific, actionable reason in plain language.** Vague flags ("document may not meet requirements") are not acceptable.

**Escalation policy:** After 2 failed AI review attempts on the same document, the order escalates automatically to manual admin review. The customer sees: "Our team will review your documents within 4 hours." No further uploads are required until the admin responds.

**Accepted proof of address documents** (provisional — confirm with fiscal rep before launch):
- Utility bill (electricity, water, gas) — less than 3 months old. Phone/TV bills not accepted.
- Bank statement — less than 3 months old
- Rental/lease agreement
- Official government letter with address

⚠️ Non-Portuguese documents may require certified translation.

### Feature: Fiscal Representation Renewal Flow

For Standard and Express customers approaching the 12-month mark (at 11 months), the system sends a renewal email with a direct payment link. Renewal is:
- €89/year for ongoing fiscal representation only
- Clearly explained what happens if they don't renew (they become unregistered with no representative — fines possible if they have PT tax obligations)

After July 1, 2026, the renewal email must also explain whether the customer likely still needs a fiscal rep, based on whether they have declared Portuguese income. Customers who probably don't need it should be told honestly.

### Feature: Post-NIF Journey Guide (Passive, Not Upsell-First)

After NIF delivery, the customer receives a single email: **"What comes next?"** This email is content, not a sales pitch. It explains:
- How to open a Portuguese bank account (with a referral link to Wise/N26 if they don't have one)
- How to register a property in their name after purchase
- What NHR/IFICI is and whether they might qualify

The goal is trust, not immediate conversion. If they need NISS or NHR help in six months, they remember this was the service that told them the truth.

## Account Management 
— Standard authenticated user flows (password reset, email change, account deletion) handled via Supabase Auth

### Admin Panel (Customer-Facing Management)

The existing admin panel handles the customer side. Required capabilities:
- View all orders and their status
- Manually update order status (with note to customer)
- View uploaded documents and AI review results
- Override AI review result (approve or flag manually)
- Trigger email resend for any status

### Operator Workflow (Internal Submission Tool)

The ebalcão submission — the licensed fiscal representative logging into the Portuguese tax authority portal and submitting the NIF application — is an irreducible human step. There is no public API and scripting the portal is not an option.

The goal is to compress everything *around* that step so the rep's total time per application is under 5 minutes.

**What the system prepares automatically, before the rep touches anything:**

1. **Document package** — passport, proof of address, and signed POA are bundled into a single download. The POA is pre-filled from the customer's form data; the customer downloads, signs, and uploads it as part of the document step. The customer's signature is required — the fiscal rep does not sign on their behalf. ⚠️ Must be confirmed with fiscal rep before launch.
2. **Priority queue** — the internal queue separates Express orders (marked urgent, with a countdown showing time remaining against the 48h SLA) from Standard orders. The rep always sees Express first.
3. **Alert on approval** — when an Express order's documents pass AI + admin review, the rep receives an immediate push notification or SMS. They do not need to poll the queue.

**What the rep does:**

1. Opens the operator queue
2. Downloads the pre-prepared package for the next order
3. Logs into ebalcão, submits the application (form is pre-filled where the portal allows it)
4. Marks the order as "submitted" in the operator tool
5. System auto-transitions order status, triggers customer email — rep does nothing else

At launch volume (single-digit orders per day), one part-time rep can handle this comfortably. At scale, the same workflow supports multiple reps without changes — the queue just distributes orders across whoever is online.

---

## 5. What Are We NOT Building?

**Tax advice or filing.** Filing Portuguese tax returns (Modelo 3, IRS) requires a licensed accountant (TOC/ROC). We cannot and should not offer this. We can refer customers to a partner.

**Business NIFs (Número de Identificação de Pessoa Coletiva).** Different process, different legal entity, different documents. Out of scope entirely.

**Visa application services.** D7, D8, Golden Visa applications are complex legal processes. We are not immigration lawyers. We can write SEO content about visas to attract organic traffic, but we do not offer or imply visa application help.

**Portuguese bank account opening.** Compelling upsell but out of scope for v2. The referral model (Wise affiliate) captures value without operational complexity.

**NISS (social security number) registration.** Sprint 3+. Do not design for it now.

**A mobile app.** The customer completes one action (apply for NIF) and then waits. A responsive web app is sufficient. There is no recurring mobile use case at this stage.

**Automated Finanças submission.** There is no public API for Finanças. This step is and must remain manual. Any design that implies automation is dishonest and sets wrong expectations.

**Multi-currency pricing.** Prices are in EUR only. If the customer is American and pays in USD, Stripe handles the conversion at checkout. We do not display USD prices.

---

## 6. How Do We Know It Worked?

### Primary Metrics (Product-Market Fit Signals)

| Metric | Target | Why |
|--------|--------|-----|
| **Checkout completion rate** | ≥ 60% (order created → payment) | Current industry benchmark is ~40-50%; higher means clearer pricing is working |
| **NIF delivered on time** | Application submitted within 48h | ≥ 98% of Express orders submitted to ebalcão within 48h of document approva |
| **Support tickets per order** | < 0.3 (fewer than 1 ticket per 3 orders) | Measures clarity of status communication |
| **Fiscal rep renewal rate** | ≥ 55% at 12 months | Signals customers trust the ongoing relationship |

### Secondary Metrics (Growth Signals)

| Metric | Target |
|--------|--------|
| Organic search traffic (NIF-related keywords) | Month-over-month growth |
| Referral rate (customers referring friends) | ≥ 15% of new orders have a referral attribution |
| NPS after NIF delivery | ≥ 60 |

### Failure Signals (When to Stop or Pivot)

- If < 40% of orders reach payment (checkout completion rate), pricing or trust is broken.
- If > 5% of Express orders miss the 48h deadline, the operational process is not ready for that tier and it must be paused.
- If fiscal rep renewal rate drops below 30% after the July 2026 regulatory change, the recurring model needs to be rebuilt around a different value (tax compliance packages).

---

## 7. Constraints

### Time

This is a one-person (or small team) project. Each sprint should scope to roughly 2-3 weeks. MVP means: working checkout, working document upload with AI review, working status dashboard, working admin panel, working email notifications. Everything in this PRD beyond those six things is Sprint 2.

### Technology

The existing stack is non-negotiable for now:
- **Next.js 16 App Router** — Server Actions for all mutations
- **Supabase** — Auth, PostgreSQL, Realtime, Storage
- **Stripe** — Payments and webhooks
- **Drizzle ORM** — Database access layer
- **Resend** — Transactional email
- **Next/intl** — Internationalization (i18n) and localization (l10n)

### Localization

The product must support multiple languages from launch. Priority languages based on target market:

**Launch languages (MVP):**
- English (primary) — US, UK, Ireland buyers
- French — French digital nomads, Belgian buyers
- Spanish — Spanish and Latin American buyers
- German — German buyers (significant PT property market)

**Post-launch (Sprint 2+):**
- Italian, Dutch, Swedish — based on demand

**What must be translated:**
- All marketing pages (homepage, pricing, about)
- Entire checkout flow
- Dashboard and status page
- All transactional emails
- Error messages and validation feedback
- Admin panel (English only is acceptable — internal tool)

**What does NOT need translation:**
- Legal documents (POA, terms of service) — these may need to remain in Portuguese or English for legal validity. Confirm with legal counsel.
- Uploaded customer documents (obviously)
- Internal operator tools

**Language detection:**
- Default to browser language if supported, otherwise English
- Allow manual language switcher in header (persistent across sessions)
- Language preference stored in user account after signup

**Translation workflow:**
- Initial translations: professional translation service (not machine translation for customer-facing copy)
- Maintenance: translation keys managed in codebase, updates via translation service API or manual file updates
- Quality bar: native speaker review before launch for each language



No new infrastructure decisions without a concrete technical reason. Adding a message queue, a separate backend service, or a different database is out of scope.

### Legal / Operational

The product cannot function without a licensed Portuguese fiscal representative (advogado or solicitador) on staff or under contract. This is not a technical constraint — it is a legal one. The person or firm acting as fiscal representative must be identified, contracted, and available to process applications within the guaranteed delivery windows.

The Express tier is only launchable once the operational workflow can reliably submit applications within 48h of document approval. Do not launch Express until at least 10 test applications have completed that cycle.

### Budget

- Stripe fees: 1.4% + €0.25 (EU cards) to 2.9% + €0.25 (non-EU cards). At €129 Standard, net is ~€126. Factor into tier pricing.
- Gemini API (document review): ~$0.003 per document at current rates. Negligible per order.
- Resend: Free tier covers ~3,000 emails/month. At ≤ 6 emails per order, that's ~500 orders before a paid plan is needed.
- Supabase: Free tier sufficient until ~500 MAU.

### Regulatory (July 2026 Change)

As noted in section 2: the legal requirement for non-EU fiscal representation ends July 1, 2026 for customers with no Portuguese tax obligations. By that date:

1. The checkout flow must clearly indicate who still needs fiscal rep (those with PT rental income, employment income, or declared assets).
2. The Standard and Express tier descriptions must be updated — "legally required fiscal representation" becomes "optional but recommended for property owners."
3. The renewal email must be updated to reflect the new law honestly.

This is not optional. Continuing to market fiscal rep as legally required after July 1 would be misleading to customers.

---

## Phase 2: Submission Acceleration (Post-Launch)

**Trigger:** launch when Express order volume makes the manual submission step a daily bottleneck — roughly 5+ Express orders per day.

### Chrome Extension: ebalcão Form Filler

A lightweight internal Chrome extension used exclusively by the fiscal representative.

**How it works:**

1. The rep opens the ebalcão NIF application page in Chrome
2. The extension detects the page and shows a sidebar with the next queued order from the system
3. One click pre-fills every form field — name, nationality, passport number, address, POA reference — directly into the ebalcão inputs from the order database
4. The rep reviews the pre-filled form (takes ~30 seconds)
5. Rep clicks submit on ebalcão
6. The extension automatically marks the order as submitted in the system and advances its status — no second action required

**Why this is the right tool for this step:**

- The rep still authenticates with their own credentials, still reviews before submitting, still clicks submit. No portal terms are violated and no security is bypassed. It is functionally identical to a password manager auto-filling a form.
- Eliminates all manual data entry and copy-pasting, which removes the main source of human error (typos in passport numbers, wrong nationality codes).
- Reduces per-application time from ~15 minutes to ~3 minutes. One rep handles 4x the volume without additional headcount.
- If AT redesigns the ebalcão page and selectors break, the fix is a CSS selector update — a 30-minute maintenance task, not an architectural problem.

**Build cost:** a weekend project. Chrome extension that reads from the existing order API and writes to known DOM inputs. No new backend infrastructure required.

**What this is not:** this is not automation of the submission. The human step — authentication, review, and the final click — is preserved intentionally. This tool removes friction around that step, not the step itself.

---

## Appendix: Decisions This PRD Does Not Make 


# Open Technical Decisions

These were flagged in the PRD as deferred to technical design.
Resolve all four before starting architecture — the answers affect both the data model and the UI specs.

---

## Q1 — Deadline-aware checkout: where does it live? -- RESOLVED 

**The question:** The checkout flow asks "When do you need your NIF?" before showing tiers. Where does this question appear?

**Solution**
 - Q1: Steps 2 and 3 merged into one screen — deadline selector + tier cards together, graying out in real time.

---

## Q2 — AI document review: synchronous or asynchronous? - RESOLVED

**The question:** After a customer uploads a document, does the AI review block the UI until it completes, or does it run in the background and notify the customer?

**SOLUTION**
- Q2: Upload step now shows the badge state progression (Uploading → Reviewing… → Approved ✓), the 30-second
  timeout behavior, and explicitly notes no email is sent while the customer is still on screen .

Graceful degradation: if review exceeds 30 seconds, badge updates to "Still reviewing… this is taking longer than usual." If it times out entirely, transitions to manual review state and admin is notified. Customer sees "Under manual review — we'll confirm within 4 hours."

---

## Q3 — Fiscal rep renewal: new Stripe Checkout session or saved payment method? — RESOLVED

**Decision:** Option A — renewal handled through a new Stripe Checkout session. The renewal email contains a link that opens a fresh Stripe Checkout session. No card storage required on our side. Option B (saved payment method) deferred to Sprint 2.


## Q4 — SEO content strategy: which pages, which keywords, what cadence?

**The question:** The product relies heavily on organic search (people Googling "get NIF Portugal online"). The current codebase has a `(marketing)` route group with content pages. What is the content plan?

**What needs deciding:**
- Which 5-10 keyword clusters to target first (e.g. "NIF Portugal non-resident", "fiscal representative Portugal", "NIF for property purchase Portugal")
- Whether content pages are written by a human, AI-assisted, or fully AI-generated with human review
- Publication cadence (1 page/week? 2 pages/month?)
- Whether to build a blog/news section or only static evergreen guides

**Note:** This is the only decision here that does not block the technical architecture. It can be decided after development starts, but it should be decided before launch so SEO content is live and indexed before the product goes public.



