# Audit Sprint 6 Findings: User Flows vs Implementation

Here are the verified discrepancies between `context/user-flows.md` and the actual codebase (Server Actions, route handlers, components):

### 1. Flow 3: Webhook-delay polling missing
- **Doc states:** Success page polls for order creation for up to 30 seconds.
- **Codebase:** No polling exists in the dashboard. `DashboardContent` checks `getUserActiveOrder(userId)` immediately on load. If the webhook is delayed and the order isn't in the DB yet, it falls back to the "Empty State" ("You have no orders yet"). The `session_id` query param from Stripe is ignored.

### 2. Flow 4: POA AI Review
- **Doc states:** Signed POA is accepted immediately without AI review.
- **Codebase:** `uploadDocument` in `app/actions/documents.ts` sets `aiReviewStatus: 'pending'` for **all** documents, including POA. A comment explicitly states: *"All document types go through AI review — none are auto-approved on upload."* The POA goes through the AI review flow just like passports and proof of address.

### 3. Flow 5 (`submitted`): Missing delivery estimate copy
- **Doc states:** Shows "Typically 5–10 business days...".
- **Codebase:** This text is entirely missing from the `submitted` state UI in `DashboardContent.tsx`.

### 4. Flow 5 (`submitted`): Missing "useful reading" content
- **Doc states:** Shows a content section below the timeline with useful reading while they wait.
- **Codebase:** This section is missing from the `submitted` state UI in `DashboardContent.tsx`.

### 5. Flow 5 (`delivered`): NIF not copyable
- **Doc states:** NIF number is "copyable with one click".
- **Codebase:** NIF displays in large mono-spaced font, but there is no copy-to-clipboard functionality or button.

### 6. Flow 5 (`delivered`): Missing order details record
- **Doc states:** Shows a "Permanent record of their order details below".
- **Codebase:** No order details are rendered in the `delivered` state UI.

### 7. Flow 5 (`delivered`): Missing "What comes next?" section
- **Doc states:** Shows a condensed version of the post-NIF journey guide.
- **Codebase:** This section is missing from the `delivered` state UI.

### 8. Flow 7e: Manual Status Note not emailed
- **Doc states:** Manual status update sends customer an email with the admin's note.
- **Codebase:** `adminUpdateOrderStatus` in `app/actions/admin.ts` explicitly comments that the note is **not** emailed to the customer because the `status_update_with_note` email template is not yet implemented. The note is only saved to the internal audit log.

### 9. Flow 8: Essential Tier in Operator Queue
- **Doc states:** Queue has two sections — Express (SLA countdown) and Standard (date ordered).
- **Codebase:** Queue has **three** sections — Express, Standard, and Essential. (Note: Essential orders still need a NIF submitted to Finanças by the operator, they just don't get the 12-month ongoing fiscal rep, so the code logic is correct).

### 10. Flow 8: SLA Breach Alert missing
- **Doc states:** Express SLA countdown reaches zero before submission → admin receives an automatic alert email.
- **Codebase:** There is no cron job or backend logic to detect an SLA breach and trigger an automatic alert email to the admin.
