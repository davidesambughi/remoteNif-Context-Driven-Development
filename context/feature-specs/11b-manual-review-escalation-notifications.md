Read `context/AGENTS.md`, `context/progress-tracker.md`, `context/user-flows.md` before starting.

Add admin email notifications to the document review workflow — alert the admin when a document escalates to manual review and when all documents on an order are approved and ready for sign-off.

---

## Constraints

### Architecture

- No new routes, no new pages, no UI changes.
- Two triggers live in `app/actions/documents.ts` → `reviewDocument` — after each DB update, before returning to the client.
- Two new email templates: `lib/email/templates/admin-document-escalated.tsx` and `lib/email/templates/admin-order-ready.tsx`. Both import primitives from `'react-email'`.
- Extend `EmailPayload` in `lib/email/send.ts` with two new members and add the corresponding branches. Now that the union has 3 members, restructure `sendEmail` to use a `switch` statement — the `default` exhaustive check (`const _exhaustive: never = payload`) compiles correctly with 2+ members.
- Admin emails are always English — pass `'en'` as locale to `sendEmail`.
- Admin email address comes from `env.ADMIN_EMAIL` (new env var). One address, can be a distribution list.
- All `sendEmail` calls are fire-and-forget — `sendEmail` already swallows errors internally.
- New query `getOrderBasicInfo` in `lib/db/queries.ts` — fetches `fullName` and `tier` by `orderId`.
- Only touch: `lib/env.ts`, `.env.local`, `lib/db/queries.ts`, `lib/email/send.ts`, `lib/email/templates/` (two new files), `app/actions/documents.ts`.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment.
- The `switch` exhaustive check in `default` must compile — verify it does not produce a type error.
- `customerName` from `order.fullName` may be `null` — fall back to `'Customer'` before passing to the email payload.

### Validation

No new Zod schemas. All inputs come from verified DB records already in scope inside `reviewDocument`.

### i18n

No translation keys. Admin templates are English only — copy is hardcoded inside the template file. No changes to `messages/*.json`.

---

## Design

Admin emails are functional, not customer-facing. Same shared visual rules as customer templates (container, font, colors from the spec) but no decorative sections — just the essential context and one action link.

**Template: `admin_document_escalated`**

Triggered after a document transitions to `manual_review` (either AI error or 2nd failed AI attempt).

- Subject: `"Manual review required — [customerName], Order #[orderId]"`
- Heading: "A document needs manual review."
- Body: customer name, document type (human-readable label), escalation reason
- CTA link (plain `<Link>`, not a `<Button>`): "View order →" → `adminOrderUrl`
- Footer

**Template: `admin_order_ready`**

Triggered after all 3 documents pass review and the order transitions to `documents_under_review`.

- Subject: `"Documents approved — [customerName] ready for review, Order #[orderId]"`
- Heading: "All documents have been approved."
- Body: customer name, tier (human-readable: Essential / Standard / Express), all 3 documents cleared
- CTA link (plain `<Link>`): "Review order →" → `adminOrderUrl`
- Footer

---

## Implementation

1. **Add `ADMIN_EMAIL` to `lib/env.ts`:**
   - Add `ADMIN_EMAIL: z.string().email()` to `envSchema`
   - Add `ADMIN_EMAIL=` placeholder line to `.env.local`

2. **Add `getOrderBasicInfo` to `lib/db/queries.ts`:**
   ```typescript
   getOrderBasicInfo(orderId: string): Promise<{
     fullName: string | null
     tier: 'essential' | 'standard' | 'express'
   } | null>
   ```
   Selects only `fullName` and `tier` from `orders` where `id = orderId`.

3. **Extend `EmailPayload` in `lib/email/send.ts`** with two new members:
   ```typescript
   | { template: 'admin_document_escalated'; orderId: string; customerName: string; documentType: string; escalationReason: string }
   | { template: 'admin_order_ready'; orderId: string; customerName: string; tier: string }
   ```
   Also extend `EmailTemplateName` with `'admin_document_escalated' | 'admin_order_ready'`.

4. **Restructure `sendEmail` in `lib/email/send.ts`** to use a `switch` statement:
   ```typescript
   switch (payload.template) {
     case 'order_confirmation': { ... break }
     case 'admin_document_escalated': { ... break }
     case 'admin_order_ready': { ... break }
     default: {
       const _exhaustive: never = payload
       return
     }
   }
   ```
   Build `adminOrderUrl` as `${env.NEXT_PUBLIC_APP_URL}/en/admin/orders/${payload.orderId}` in the two admin cases. Pass it as a prop to the template alongside the payload data.

5. **Create `lib/email/templates/admin-document-escalated.tsx`:**
   - Props interface: `{ orderId: string; customerName: string; documentType: string; escalationReason: string; adminOrderUrl: string }`
   - Export `getAdminDocumentEscalatedSubject(customerName: string, orderId: string): string`
   - Design: shared visual rules, minimal layout, `<Link>` CTA (not `<Button>`)

6. **Create `lib/email/templates/admin-order-ready.tsx`:**
   - Props interface: `{ orderId: string; customerName: string; tier: string; adminOrderUrl: string }`
   - Export `getAdminOrderReadySubject(customerName: string, orderId: string): string`
   - Design: shared visual rules, minimal layout, `<Link>` CTA (not `<Button>`)

7. **Update `app/actions/documents.ts` → `reviewDocument`** — add three notification calls:

   **After the AI error path** (currently lines ~128–135 — after `updateDocumentAiReview` with `manual_review` due to error):
   ```typescript
   const orderInfo = await getOrderBasicInfo(doc.orderId)
   if (orderInfo) {
     const customerName = orderInfo.fullName ?? 'Customer'
     await sendEmail(env.ADMIN_EMAIL, 'en', {
       template: 'admin_document_escalated',
       orderId: doc.orderId,
       customerName,
       documentType: DOCUMENT_TYPE_LABELS[doc.type],
       escalationReason: 'AI review failed',
     })
   }
   ```

   **After the 2nd flag escalation** (currently lines ~165–174 — after `updateDocumentAiReview` with `manual_review` due to 2 failures):
   ```typescript
   const orderInfo = await getOrderBasicInfo(doc.orderId)
   if (orderInfo) {
     const customerName = orderInfo.fullName ?? 'Customer'
     await sendEmail(env.ADMIN_EMAIL, 'en', {
       template: 'admin_document_escalated',
       orderId: doc.orderId,
       customerName,
       documentType: DOCUMENT_TYPE_LABELS[doc.type],
       // aiResult.reasonKey is in scope here — use it as the reason, fall back if null
       escalationReason: aiResult.reasonKey ?? 'Document flagged twice',
     })
   }
   ```

   **After `markOrderDocumentsUnderReview`** (currently lines ~154–156 — inside the `allThreeApproved` block):
   ```typescript
   const orderInfo = await getOrderBasicInfo(doc.orderId)
   if (orderInfo) {
     const customerName = orderInfo.fullName ?? 'Customer'
     await sendEmail(env.ADMIN_EMAIL, 'en', {
       template: 'admin_order_ready',
       orderId: doc.orderId,
       customerName,
       tier: orderInfo.tier,
     })
   }
   ```

   Add a `DOCUMENT_TYPE_LABELS` constant at the top of the file:
   ```typescript
   const DOCUMENT_TYPE_LABELS: Record<'passport' | 'proof_of_address' | 'signed_poa', string> = {
     passport: 'Passport',
     proof_of_address: 'Proof of address',
     signed_poa: 'Signed POA',
   }
   ```

   Add imports: `getOrderBasicInfo` from `lib/db/queries`, `sendEmail` from `lib/email/send`, `env` from `lib/env`.

---

## Scope Limits

- Do not build the admin panel UI — that is Feature 13.
- Do not notify the operator — operator notifications are Feature 14.
- Do not send customer emails for document state changes — that is Feature 12b.
- Do not add SMS notifications.
- Do not modify `DocumentUploadSlot` or any customer-facing UI — those are complete and correct.
- Do not add a retry mechanism for failed email sends — `sendEmail` logs and swallows errors by design.

---

## Check When Done

- `ADMIN_EMAIL` is in `lib/env.ts` schema and added to `.env.local`.
- `getOrderBasicInfo` query exists in `lib/db/queries.ts` and returns `null` if the order is not found.
- `EmailPayload` has 3 members; `sendEmail` uses a `switch` with a compiling exhaustive check in `default`.
- `lib/email/templates/admin-document-escalated.tsx` and `admin-order-ready.tsx` exist and render without error.
- `reviewDocument` calls `sendEmail` at all three trigger points (AI error escalation, 2nd-flag escalation, all-docs-approved).
- `npm run build` passes.
