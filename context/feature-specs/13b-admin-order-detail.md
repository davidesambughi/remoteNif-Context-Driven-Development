# 13b — Admin Panel: Order Detail & Actions

Read `context/AGENTS.md`, `context/progress-tracker.md`, `context/user-flows.md` (Flows 7b–7f) before starting.

Build the admin order detail screen at `/admin/orders/[id]` — a full view of one order including customer info, all three documents with their AI review results, per-document override actions, order approval, manual status update, and email resend. Also add two new email templates triggered by admin approval.

---

## Constraints

### Tokens

| Purpose | Token | Tailwind utility |
|---------|-------|-----------------|
| Page canvas | `var(--bg-base)` | `bg-[var(--bg-base)]` |
| Card surface | `var(--bg-surface)` | `bg-surface` |
| Muted area | `var(--bg-subtle)` | `bg-subtle` |
| Brand dim | `var(--brand-primary-dim)` | `bg-brand-primary-dim` |
| Primary text | `var(--text-primary)` | `text-[var(--text-primary)]` |
| Secondary text | `var(--text-secondary)` | `text-[var(--text-secondary)]` |
| Muted text | `var(--text-muted)` | `text-[var(--text-muted)]` |
| On-accent text | `var(--text-on-accent)` | `text-on-accent` |
| Brand color | `var(--brand-primary)` | `text-brand-primary` |
| Standard border | `var(--border-default)` | `border-[var(--border-default)]` |
| Subtle border | `var(--border-subtle)` | `border-[var(--border-subtle)]` |
| Success | `var(--status-success)` | `text-success` / `bg-success` |
| Success tint | `var(--status-success-subtle)` | `bg-success-subtle` |
| Warning | `var(--status-warning)` | `text-warning` / `bg-warning` |
| Warning tint | `var(--status-warning-subtle)` | `bg-warning-subtle` |
| Error | `var(--status-error)` | `text-error` / `bg-error` |
| Error tint | `var(--status-error-subtle)` | `bg-error-subtle` |
| Info | `var(--status-info)` | `text-info` |
| Card radius | `var(--radius-lg)` | `rounded-lg` |
| Card shadow | `var(--shadow-md)` | `shadow-[var(--shadow-md)]` |
| Modal radius | `var(--radius-2xl)` | `rounded-2xl` |

Rules that always apply to UI work in this project:
- No raw Tailwind color classes (`zinc-*`, `slate-*`, `blue-*`). Tokens only.
- No hardcoded hex or rgb values.
- Mobile-first. Add breakpoint variants only where layout actually changes.
- Border radius from scale: `--radius-sm` / `md` / `lg` / `xl` / `2xl` / `full`.
- Shadows from scale: `--shadow-sm` / `md` / `lg` / `xl`.
- shadcn/ui components by default — reach for `Button`, `Badge`, `Card`, `Dialog`, `Select`, `Textarea`, `Separator` before writing custom markup.

### Architecture

- Page: `app/[locale]/(admin)/orders/[id]/page.tsx` — Server Component. Fetches all data server-side. Passes data to child components as props.
- Loading: `app/[locale]/(admin)/orders/[id]/loading.tsx` — skeleton placeholder.
- Layout is already in place from Feature 13a — no layout changes needed.
- DB queries go in `lib/db/queries.ts` under an `// Admin queries (Feature 13b)` section.
- Server Actions go in a new file: `app/actions/admin.ts`. Thin: validate → auth check (requireRole admin) → call lib/ → return `{ success, data/error }`.
- Interactive components (buttons that call Server Actions, modals, forms) use `"use client"`. Everything else is a Server Component.
- Email sending is fire-and-forget via the existing `sendEmail` helper in `lib/email/send.ts`.
- Audit log writes go in the Server Actions, not in lib/ queries.
- All mutations check `requireRole('admin')` before anything else.
- Use `Link` from `@/i18n/navigation` for locale-aware navigation (back link).

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- Infer types from Zod schemas with `z.infer<typeof Schema>` — no duplicate type definitions.
- Use `interface` for props and DB query return shapes. Use `type` for unions.
- Export `AdminOrderDetail` interface from `lib/db/queries.ts` for the full detail query return type.

### Validation

```typescript
// In app/actions/admin.ts — co-located with each action

const FlagDocumentSchema = z.object({
  documentId: z.string().uuid(),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
})

const ApproveOrderSchema = z.object({
  orderId: z.string().uuid(),
})

const UpdateOrderStatusSchema = z.object({
  orderId: z.string().uuid(),
  newStatus: z.enum([
    'documents_pending',
    'documents_under_review',
    'documents_approved',
    'submitted',
    'delivered',
  ]),
  note: z.string().max(1000).optional(),
})

const ResendEmailSchema = z.object({
  orderId: z.string().uuid(),
  emailType: z.enum(['order_confirmation', 'documents_approved_customer']),
})
```

### i18n

- All new user-facing strings go in `messages/en.json` under the existing `admin` namespace (add a `detail` sub-key).
- Use `getTranslations('admin')` in Server Components, `useTranslations('admin')` in Client Components.
- No hardcoded English strings in JSX.
- Add the same keys (untranslated — copy English values) to `fr.json`, `es.json`, `de.json`.

---

## Design

Internal tool — functional and scannable, not decorative. Single-column on mobile; two-column (`lg:grid-cols-[1fr_320px]`) on large screens where the main content (customer info + documents) is on the left and the actions panel is a sticky sidebar on the right.

**Page container:** `max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8`

**Back link:** `← All orders` in `text-[var(--text-muted)] text-sm hover:text-[var(--text-primary)]` at the top, above the grid.

**Order header card** (`bg-surface border border-[var(--border-default)] rounded-lg p-6 mb-6`):
- Row 1: customer full name in `text-xl font-bold text-[var(--text-primary)]` + tier badge + status badge (reuse badge styles from 13a).
- Row 2: customer email in `text-sm text-[var(--text-secondary)]` + order ID in `text-xs text-[var(--text-muted)] font-mono` + ordered date.
- Row 3 (Express + `documents_approved` only): `<SlaCountdown>` reused from 13a, preceded by label "SLA remaining:".

**Documents section** (three `DocumentReviewCard` components stacked with `gap-4`):

Each card (`bg-surface border border-[var(--border-default)] rounded-lg p-5`):
- Header row: document type label (bold, translated) + approved/flagged/pending status badge.
- File row: filename in `font-mono text-xs text-[var(--text-secondary)]` + file size + upload date — all `text-[var(--text-muted)]`.
- Download link: `<a>` with signed URL — "Download" in `text-brand-primary text-sm underline`.
- AI review block (passport and proof_of_address only):
  - Status label: e.g., "AI review: Clear" in appropriate status color.
  - Reason (if flagged/error): indented `text-sm text-[var(--text-secondary)]` beneath the label.
  - Attempts count if > 0: `text-xs text-[var(--text-muted)]` — "X attempt(s)".
- Admin override block (if `adminOverride === true`): subtle tinted `bg-subtle rounded p-3 text-sm` showing who overrode, when, and the reason if flagging.
- Override action buttons (`DocumentOverrideButtons` — Client Component):
  - `signed_poa`: no buttons — POA is accepted without AI review.
  - If `approved === true`: ghost "Flag" button (`variant="ghost"` with error color text) — opens a `Dialog` asking for a reason before calling `adminFlagDocument`.
  - If `approved === false`: solid "Approve" button (`variant="outline"` with success border/text) — calls `adminApproveDocument` directly (no modal needed, no reason required).
  - While action is pending: button shows spinner, disabled.

**Actions panel** (right column on `lg:`, below documents on mobile):

Three shadcn `Card` components stacked with `gap-4`:

1. **Approve Order card:**
   - Title: "Approve Order" (`font-semibold`).
   - Description: `text-sm text-[var(--text-secondary)]` — explain what approval does and that it starts the 48h SLA for Express.
   - Disabled state (not all docs approved or status ≠ `documents_under_review`): full-width shadcn `Button` disabled with `text-[var(--text-muted)]`. Show reason below: "All 3 documents must be approved" or "Order is not in review state".
   - Active state: full-width green-bordered shadcn `Button variant="outline"` labeled "Approve Order". On click: confirm dialog ("This will notify the operator and start the 48h SLA for Express orders") → on confirm, call `adminApproveOrder`.

2. **Update Status card:**
   - Title: "Update Status".
   - shadcn `Select` showing all 5 statuses (current status pre-selected).
   - shadcn `Textarea` for optional note to customer (placeholder: "Optional note to customer..."). Required and highlighted with error border if the new status moves backward from current.
   - shadcn `Button` "Update status" — disabled until status changes from current value. On submit: call `adminUpdateOrderStatus`. On success: toast confirmation.

3. **Resend Email card:**
   - Title: "Resend Email".
   - shadcn `Select` with email types: Order Confirmation, Documents Approved.
   - shadcn `Button` "Resend" — calls `adminResendEmail`. On success: toast "Email sent".

---

## Implementation

1. **Add DB queries to `lib/db/queries.ts`** under a `// Admin queries (Feature 13b)` comment block:

   a. `getAdminOrderDetail(orderId: string): Promise<AdminOrderDetail | null>` — single query joining `orders`, `users`, active `documents` (where `supersededAt IS NULL`), and latest `payments` row. Returns the composite shape or null.

   ```typescript
   export interface AdminOrderDetail {
     // Order fields
     id: string
     tier: 'essential' | 'standard' | 'express'
     status: SelectOrder['status']
     fullName: string | null
     dateOfBirth: string | null
     nationality: string | null
     passportNumber: string | null
     passportExpiry: string | null
     address: string | null
     createdAt: Date
     documentsApprovedAt: Date | null
     // Customer
     customerEmail: string
     customerId: string
     customerLanguage: 'en' | 'fr' | 'es' | 'de'
     // Payment (latest)
     paymentAmountCents: number | null
     paymentStatus: string | null
     // Documents (all 3 active records — may be fewer if not yet uploaded)
     documents: AdminDocumentDetail[]
   }

   export interface AdminDocumentDetail {
     id: string
     type: 'passport' | 'proof_of_address' | 'signed_poa'
     filePath: string
     fileName: string
     fileSize: number
     mimeType: string
     aiReviewStatus: SelectDocument['aiReviewStatus']
     aiReviewReason: string | null
     aiReviewAttempts: number
     adminOverride: boolean
     adminOverrideBy: string | null
     adminOverrideReason: string | null
     adminOverrideAt: Date | null
     approved: boolean
     approvedAt: Date | null
     createdAt: Date
   }
   ```

   Fetch documents in a separate query and attach as `documents: []`. Do not use a lateral join — two round-trips is fine.

   b. `getOperatorUsers(): Promise<Array<{ id: string; email: string }>>` — select `id` and `email` from `users` where `role = 'operator'`.

   c. `adminSetDocumentApproved(documentId: string, adminId: string): Promise<void>` — set `adminOverride=true`, `adminOverrideBy=adminId`, `adminOverrideAt=now`, `adminOverrideReason=null`, `approved=true`, `approvedAt=now`, `updatedAt=now`.

   d. `adminSetDocumentFlagged(documentId: string, adminId: string, reason: string): Promise<void>` — set `adminOverride=true`, `adminOverrideBy=adminId`, `adminOverrideAt=now`, `adminOverrideReason=reason`, `aiReviewStatus='flagged'`, `approved=false`, `approvedAt=null`, `updatedAt=now`.

   e. `adminTransitionOrderToApproved(orderId: string): Promise<void>` — update `status='documents_approved'`, `documentsApprovedAt=now`, `updatedAt=now`.

   f. `adminUpdateOrderStatusQuery(orderId: string, newStatus: SelectOrder['status'], timestamps: Partial<Pick<SelectOrder, 'documentsApprovedAt' | 'submittedToFinancasAt' | 'deliveredAt'>>): Promise<void>` — update status + any provided timestamps + `updatedAt=now`.

   g. `insertAuditLog(entry: { userId: string; orderId: string; action: string; details: Record<string, unknown>; ipAddress?: string }): Promise<void>` — insert one row. Never throws — wrap in try/catch and log on error so audit failures never break the main action.

   h. `insertOperatorNotification(data: { orderId: string; operatorId: string; type: 'email' | 'sms'; status: 'pending' | 'sent' | 'failed'; sentAt?: Date }): Promise<void>` — insert one row.

2. **Create two new email templates:**

   a. `lib/email/templates/documents-approved-customer.tsx`
   - Props: `{ locale: EmailLocale; customerName: string; tier: string; dashboardUrl: string }`
   - Content: "Your documents have been approved. Your application is being prepared for submission to Finanças." — include Express note ("submitted within 48 hours") only if `tier === 'express'`.
   - Export `DocumentsApprovedCustomerEmail` component and `getDocumentsApprovedCustomerSubject(locale)` function.

   b. `lib/email/templates/operator-submission-ready.tsx`
   - Props: `{ customerName: string; tier: string; orderId: string; operatorQueueUrl: string; slaNote?: string }`
   - Content: order summary for the operator — customer name, tier, order ID, link to operator queue. For Express: include `slaNote` ("48h SLA has started — submit as soon as possible").
   - Export `OperatorSubmissionReadyEmail` component and `getOperatorSubmissionReadySubject(customerName: string)` function.

3. **Register both templates in `lib/email/send.ts`:**
   - Import both new components + subject helpers.
   - Add two new members to the `EmailPayload` discriminated union:
     ```typescript
     | { template: 'documents_approved_customer'; customerName: string; tier: string }
     | { template: 'operator_submission_ready'; customerName: string; tier: string; orderId: string; slaNote?: string }
     ```
   - Add matching `case` blocks in the `switch` statement in `sendEmail`.
   - For `documents_approved_customer`: `dashboardUrl` is derived from `locale` and `env.NEXT_PUBLIC_APP_URL` (same pattern as `order_confirmation`).
   - For `operator_submission_ready`: `operatorQueueUrl = env.NEXT_PUBLIC_APP_URL + '/en/operator'`.

4. **Create `app/actions/admin.ts`** with `'use server'` directive:

   a. `adminApproveDocument(documentId: string): Promise<ActionResult<void>>`
   - `requireRole('admin')` → get admin user id.
   - Validate `documentId` is a UUID.
   - Call `adminSetDocumentApproved(documentId, adminId)`.
   - Call `insertAuditLog({ action: 'document.admin_approved', details: { documentId }, ... })`.
   - Call `revalidatePath` on the order detail page.
   - Return `{ success: true }`.

   b. `adminFlagDocument(documentId: string, reason: string): Promise<ActionResult<void>>`
   - `requireRole('admin')` → get admin user id.
   - Validate with `FlagDocumentSchema`.
   - Call `adminSetDocumentFlagged(documentId, adminId, reason)`.
   - Call `insertAuditLog({ action: 'document.admin_flagged', details: { documentId, reason }, ... })`.
   - `revalidatePath`.
   - Return `{ success: true }`.

   c. `adminApproveOrder(orderId: string): Promise<ActionResult<void>>`
   - `requireRole('admin')` → get admin user id.
   - Validate `orderId` is a UUID.
   - Fetch active documents for the order — verify all 3 exist and all have `approved === true`. If not: return `{ success: false, error: 'not_all_approved' }`.
   - Fetch the order — verify status is `documents_under_review`. If not: return `{ success: false, error: 'invalid_status' }`.
   - Call `adminTransitionOrderToApproved(orderId)`.
   - Fetch operators via `getOperatorUsers()`. For each operator:
     - Insert OperatorNotification record (type: 'email', status: 'pending').
     - Fire-and-forget: `sendEmail(operator.email, 'en', { template: 'operator_submission_ready', customerName, tier, orderId, slaNote })`. Update notification status to 'sent' after send (best-effort — on error, mark 'failed').
   - Fire-and-forget: `sendEmail(customerEmail, customerLanguage, { template: 'documents_approved_customer', customerName, tier })`.
   - Call `insertAuditLog({ action: 'order.approved', details: { orderId, operatorsNotified: operatorIds }, ... })`.
   - `revalidatePath`.
   - Return `{ success: true }`.

   d. `adminUpdateOrderStatus(orderId: string, newStatus: string, note?: string): Promise<ActionResult<void>>`
   - `requireRole('admin')`.
   - Validate with `UpdateOrderStatusSchema`.
   - Fetch the order to get `currentStatus`, `customerId`, `customerEmail`, `customerLanguage`, `fullName`, `tier`.
   - Build `timestamps` partial based on `newStatus`: if `documents_approved` → set `documentsApprovedAt=now`; if `submitted` → `submittedToFinancasAt=now`; if `delivered` → `deliveredAt=now`. Only set the timestamp if it is currently null (don't overwrite an existing timestamp on a backward move).
   - Call `adminUpdateOrderStatusQuery(orderId, newStatus, timestamps)`.
   - If `note` is provided: fire-and-forget `sendEmail` with a generic `status_update_with_note` template (placeholder — add a `TODO: implement status_update_with_note template in Feature 12b` comment; skip the send for now).
   - Call `insertAuditLog({ action: 'order.status_updated', details: { orderId, previousStatus: currentStatus, newStatus, note }, ... })`.
   - `revalidatePath`.
   - Return `{ success: true }`.

   e. `adminResendEmail(orderId: string, emailType: string): Promise<ActionResult<void>>`
   - `requireRole('admin')`.
   - Validate with `ResendEmailSchema`.
   - Fetch the order to get `customerEmail`, `customerLanguage`, `tier`, `id`, and `stripePaymentIntentId` (for amount).
   - Switch on `emailType`:
     - `order_confirmation`: fetch payment amount from payments table; call `sendEmail(customerEmail, lang, { template: 'order_confirmation', orderId, tier, amountEur })`.
     - `documents_approved_customer`: call `sendEmail(customerEmail, lang, { template: 'documents_approved_customer', customerName, tier })`.
   - Call `insertAuditLog({ action: 'email.resent', details: { orderId, emailType }, ... })`.
   - Return `{ success: true }`.

5. **Create client components:**

   a. `components/admin/DocumentOverrideButtons.tsx` — `"use client"`:
   - Props: `{ document: AdminDocumentDetail; orderId: string }`.
   - `signed_poa` type: render nothing.
   - If `approved === true`: render shadcn `Button variant="ghost"` with error text color labeled `admin.detail.flagDocument`. On click: open shadcn `Dialog` with a `Textarea` for the reason. Dialog "Confirm" button calls `adminFlagDocument(documentId, reason)` via `useTransition`. While pending: spinner + disabled.
   - If `approved === false`: render shadcn `Button variant="outline"` with success border labeled `admin.detail.approveDocument`. On click: call `adminApproveDocument(documentId)` via `useTransition`. While pending: spinner + disabled.
   - On action error: show inline `text-error text-sm` message below the buttons.

   b. `components/admin/ApproveOrderSection.tsx` — `"use client"`:
   - Props: `{ orderId: string; orderStatus: string; allDocsApproved: boolean; tier: string }`.
   - Compute `canApprove = allDocsApproved && orderStatus === 'documents_under_review'`.
   - Render a shadcn `Card` with title, description, and a full-width `Button`.
   - If `canApprove === false`: button is disabled; show reason beneath (`text-xs text-[var(--text-muted)]`).
   - If `canApprove === true`: on click, open shadcn `Dialog` for confirmation (warn about SLA for Express), then call `adminApproveOrder(orderId)` via `useTransition`.
   - On success: show a brief success message inside the card before the page revalidates.

   c. `components/admin/StatusUpdateSection.tsx` — `"use client"`:
   - Props: `{ orderId: string; currentStatus: string }`.
   - Render a shadcn `Card` with title "Update Status".
   - shadcn `Select` pre-set to `currentStatus`.
   - shadcn `Textarea` for optional note. Required (and `border-error`) if new status is earlier in the sequence than `currentStatus`.
   - shadcn `Button` "Update" — disabled until status differs from `currentStatus`. Calls `adminUpdateOrderStatus(orderId, newStatus, note)`.
   - On success: brief inline confirmation.

   d. `components/admin/EmailResendSection.tsx` — `"use client"`:
   - Props: `{ orderId: string }`.
   - Render a shadcn `Card` with title "Resend Email".
   - shadcn `Select` with options: `order_confirmation` and `documents_approved_customer`.
   - shadcn `Button` "Resend". Calls `adminResendEmail`. On success: "Email sent" text replaces button briefly.

6. **Create `components/admin/DocumentReviewCard.tsx`** — Server Component:
   - Props: `{ doc: AdminDocumentDetail; orderId: string; adminBaseUrl: string }`.
   - Renders the full document card as described in the Design section.
   - Generates a Supabase Storage signed URL server-side for the download link (call `createServerClient().storage.from('documents').createSignedUrl(doc.filePath, 3600)`).
   - Renders `<DocumentOverrideButtons document={doc} orderId={orderId} />` at the bottom.
   - If no file uploaded yet (doc is undefined for this type): render a muted placeholder card "Not yet uploaded".

7. **Create `components/admin/OrderDetailHeader.tsx`** — Server Component:
   - Props: `{ order: AdminOrderDetail }`.
   - Renders the header card as described in the Design section.
   - Reuses `<SlaCountdown>` from Feature 13a if applicable.

8. **Create `app/[locale]/(admin)/orders/[id]/loading.tsx`**:
   - Skeleton with one `bg-subtle animate-pulse rounded-lg h-32 mb-4` for the header + three `h-40` skeleton cards for documents + one `h-64` skeleton for the actions panel.

9. **Create `app/[locale]/(admin)/orders/[id]/page.tsx`** — Server Component:
   - `params` is a `Promise<{ id: string; locale: string }>` in Next.js 16 — `await` before using.
   - Call `requireRole('admin')` — redirect to `/${locale}/admin/signin` on failure.
   - Call `getAdminOrderDetail(id)` — if null, render a `not-found` message or redirect to `/admin`.
   - Compute `allDocsApproved`: all 3 document types are present and their `approved` field is `true`.
   - Pass data to: `<OrderDetailHeader>`, three `<DocumentReviewCard>` components, `<ApproveOrderSection>`, `<StatusUpdateSection>`, `<EmailResendSection>`.
   - Layout: single column on mobile; `lg:grid lg:grid-cols-[1fr_320px] lg:gap-8` on large screens — main content (header + documents) left, actions panel right with `lg:sticky lg:top-6`.

10. **Add i18n keys** to all 4 locale files under `admin.detail`:

    ```json
    "admin": {
      "detail": {
        "back": "All orders",
        "orderId": "Order ID",
        "ordered": "Ordered",
        "payment": "Payment",
        "documents": "Documents",
        "notUploaded": "Not yet uploaded",
        "download": "Download",
        "aiReview": "AI review",
        "aiAttempts": "attempt(s)",
        "adminOverrideBadge": "Admin override",
        "approveDocument": "Approve",
        "flagDocument": "Flag",
        "flagReason": "Reason for flagging",
        "flagReasonPlaceholder": "Describe the issue clearly — this will be shown to the customer",
        "flagConfirm": "Flag document",
        "flagCancel": "Cancel",
        "approveOrder": "Approve Order",
        "approveOrderDescription": "Approves the order and notifies the operator to begin submission. For Express orders, the 48h SLA starts now.",
        "approveOrderConfirmTitle": "Approve this order?",
        "approveOrderConfirmDescription": "The operator will be notified immediately. For Express orders, the 48h submission SLA starts from this moment.",
        "approveOrderConfirm": "Yes, approve",
        "approveOrderCancel": "Cancel",
        "approveOrderDisabledDocs": "All 3 documents must be approved first",
        "approveOrderDisabledStatus": "Order is not in review state",
        "updateStatus": "Update Status",
        "updateStatusNote": "Note to customer (optional)",
        "updateStatusNoteRequired": "A note is required when moving the order backward",
        "updateStatusSubmit": "Update",
        "updateStatusSuccess": "Status updated",
        "resendEmail": "Resend Email",
        "resendSubmit": "Resend",
        "resendSuccess": "Email sent",
        "emailTypes": {
          "order_confirmation": "Order Confirmation",
          "documents_approved_customer": "Documents Approved"
        }
      }
    }
    ```

    Add the same keys (English values) to `fr.json`, `es.json`, `de.json`.

---

## Scope Limits

- Don't build the NIF delivery action — that's Feature 15.
- Don't build the operator queue or submission workflow — that's Feature 14a.
- Don't add the `status_update_with_note` customer email template — deferred to Feature 12b. Add a `TODO` comment in the action where it would be called.
- Don't add SMS notifications — no Twilio setup yet; operator email only for now.
- Don't add pagination or search to any list in this feature.
- Don't add real-time updates — admin refreshes the page manually.
- Don't modify `components/ui/*` shadcn source files.
- Keep this focused on the order detail view, document overrides, order approval, status update, and email resend only.

---

## Check When Done

- Visiting `/admin/orders/[id]` with a valid admin session renders the full order detail page.
- Visiting without an admin session redirects to `/[locale]/admin/signin`.
- Order header shows customer name, email, tier badge, status badge, order date, and order ID.
- Express orders in `documents_approved` status show the live SLA countdown in the header.
- All 3 document cards render; each shows filename, size, upload date, AI review status, AI reason (if flagged), and admin override info (if applied).
- Download link on each document card generates a working signed URL.
- "Approve" button on a flagged document calls `adminApproveDocument`; the document card updates after revalidation.
- "Flag" button on an approved document opens a dialog; submitting the reason calls `adminFlagDocument`; the document card updates.
- "Approve Order" button is disabled when not all docs are approved or order is not `documents_under_review`.
- "Approve Order" button is active when all 3 docs are approved and status is `documents_under_review`. Clicking it opens a confirmation dialog; confirming calls `adminApproveOrder`.
- After `adminApproveOrder`: order status transitions to `documents_approved`, `documentsApprovedAt` is set, OperatorNotification records are created, operator email(s) are sent, customer "documents approved" email is sent, audit log entry is written.
- Status update section pre-selects the current status; selecting a different status and clicking "Update" calls `adminUpdateOrderStatus`; the page revalidates with the new status.
- Moving to a status earlier in the sequence without a note shows an inline error.
- Email resend section sends the selected email and shows "Email sent" confirmation.
- All admin actions write an entry to `audit_log`.
- New `admin.detail.*` keys exist in all 4 locale files.
- `npm run build` passes.
