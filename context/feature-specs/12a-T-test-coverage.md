# 12a-T — Test Coverage (Email & Document Review)

Read `context/AGENTS.md`, `context/progress-tracker.md` before starting.

Add unit tests for the document review pipeline and email dispatch logic, preceded by a pre-flight consistency audit of the admin components built in 13b.

---

## Constraints

### Architecture

- Test files live in `tests/unit/` — match the source tree under `actions/`, `email/`, and `lib/stripe/`.
- New test files:
  - `tests/unit/actions/documents.test.ts` — `reviewDocument`, `uploadDocument`, `createUploadSignedUrl`
  - `tests/unit/lib/stripe/webhooks.test.ts` — `handleCheckoutSessionCompleted`
  - `tests/unit/email/send.test.ts` — `sendEmail` dispatch routing
  - `tests/unit/email/templates.test.tsx` — add missing template tests (extend existing file)
- `tests/unit/actions/admin.test.ts` already covers all five admin actions — do not modify it.
- All mocks use `vi.mock` / `vi.fn()` — no real DB, no real Resend, no real Supabase, no real Stripe.
- Mock boundaries: `@/lib/db/queries`, `@/lib/auth/session`, `@/lib/email/send`, `@/lib/ai/document-review`, `@/lib/supabase/admin`, `@/lib/db` (Drizzle instance for webhook handler), `@/lib/stripe/client`, `resend` client.
- `env` is imported in `send.ts` and `webhooks.ts` — mock it as a module or set `process.env` values in a vitest setup file so imports don't throw at startup.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- Infer types from Zod schemas with `z.infer<typeof Schema>` — no duplicate type definitions.
- Use `interface` for fixture shapes. Use `type` for unions.

### Validation

No new Zod schemas in this feature. Existing schemas in `lib/validations/documents.ts` are exercised indirectly by the action tests.

### i18n

No user-facing text in this feature. No translation keys needed.

---

## Implementation

### Step 1 — Pre-flight audit of 13b admin components

Before writing any tests, audit `app/actions/admin.ts` and `components/admin/*.tsx` for the following. Fix any issues found before continuing to Step 2.

**`any` types:**
- Search for `any` in `app/actions/admin.ts` — none expected; fix if found.
- `lib/email/send.ts` has `let reactElement: any` with an eslint-disable and a comment explaining why (Resend's `react:` prop type is not exported). This is acceptable as-is — do not remove it.

**Server Component i18n — `getTranslations` vs `useTranslations`:**
- `OrderDetailHeader` is an `async` Server Component. It must use `getTranslations` from `next-intl/server`. Verify it does — it already does, no change needed.
- `ApproveOrderSection`, `StatusUpdateSection`, `EmailResendSection`, `OrderFilters` are Client Components (`'use client'`). They must use `useTranslations` from `next-intl`. Verify — they already do, no change needed.

**`"use client"` necessity check:**
- `ApproveOrderSection` — has `useState`, `useTransition`, event handlers. `'use client'` is required.
- `StatusUpdateSection` — has `useState`, `useTransition`, event handlers. `'use client'` is required.
- `EmailResendSection` — has `useState`, `useTransition`, event handlers. `'use client'` is required.
- `OrderFilters` — has `useRouter`, `usePathname`, event handlers. `'use client'` is required.
- All four are justified. No change needed.

**`window.confirm`:**
- `ApproveOrderSection` already uses an inline confirmation (`isConfirming` state with `handleConfirm` / cancel buttons). No `window.confirm` present. No change needed.

If the audit passes with no changes needed, proceed to Step 2.

---

### Step 2 — Mock infrastructure

Create `tests/unit/actions/documents.test.ts`. Set up all mocks at the top of the file before any `describe` blocks. Use `vi.mock` for:

```typescript
vi.mock('@/lib/auth/session', () => ({ requireAuth: vi.fn() }))
vi.mock('@/lib/db/queries', () => ({
  getOrderForUser: vi.fn(),
  createDocumentRecord: vi.fn(),
  supersedePreviousDocuments: vi.fn(),
  getDocumentByIdForUser: vi.fn(),
  getActiveDocumentsForOrder: vi.fn(),
  updateDocumentAiReview: vi.fn(),
  markOrderDocumentsUnderReview: vi.fn(),
  getOrderBasicInfo: vi.fn(),
}))
vi.mock('@/lib/ai/document-review', () => ({ reviewDocumentWithAI: vi.fn() }))
vi.mock('@/lib/email/send', () => ({ sendEmail: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    storage: { from: vi.fn(() => ({ createSignedUploadUrl: vi.fn() })) },
  })),
}))
vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    ADMIN_EMAIL: 'admin@example.com',
  },
}))
```

Use a `beforeEach` to `vi.clearAllMocks()` and set default resolved values for `requireAuth` (returns a user fixture) and `sendEmail` (resolves void).

---

### Step 3 — `createUploadSignedUrl` tests

In `tests/unit/actions/documents.test.ts`, add a `describe('createUploadSignedUrl')` block covering:

1. **Ownership check** — mock `getOrderForUser` to return `null`; expect `{ success: false, error: 'Order not found' }` and that `createAdminClient` is never called.
2. **Happy path** — mock `getOrderForUser` to return a valid order; mock the Supabase storage chain to return `{ data: { signedUrl: 'https://...', token: 'tok' }, error: null }`; expect `success: true` and `data.signedUrl` and `data.token` to be present.
3. **Storage error** — mock storage to return `{ data: null, error: { message: 'storage error' } }`; expect `{ success: false, error: 'Failed to create upload URL' }`.

---

### Step 4 — `uploadDocument` tests

In the same file, add a `describe('uploadDocument')` block covering:

1. **Ownership check** — mock `getOrderForUser` to return `null`; expect `{ success: false, error: 'Order not found' }` and that `supersedePreviousDocuments` and `createDocumentRecord` are never called.
2. **Supersede + record creation** — mock `getOrderForUser` to return an order; mock `supersedePreviousDocuments` and `createDocumentRecord` to resolve; expect `supersedePreviousDocuments` called with `(orderId, type)` and `createDocumentRecord` called with `aiReviewStatus: 'pending'` and `approved: false`; expect `{ success: true, data: { documentId: ... } }`.
3. **`signed_poa` is also created with `aiReviewStatus: 'pending'`** — per code, all types go through AI review on upload. Confirm `createDocumentRecord` receives `aiReviewStatus: 'pending'` for `signed_poa` input.

---

### Step 5 — `reviewDocument` tests (all four branches)

In the same file, add a `describe('reviewDocument')` block. Each test must mock `getDocumentByIdForUser` to return a fixture document. Use a helper `makeDoc(overrides)` that builds a doc fixture with `aiReviewAttempts: 0` by default.

**Branch A — AI error → `manual_review`, attempts not incremented:**
- Mock `reviewDocumentWithAI` to return `{ status: 'error' }`.
- Mock `getOrderBasicInfo` to return `{ fullName: 'João Silva', tier: 'standard' }`.
- Expect `updateDocumentAiReview` called with `aiReviewStatus: 'manual_review'` and `aiReviewAttempts: 0` (not incremented).
- Expect `sendEmail` called with `template: 'admin_document_escalated'` and `escalationReason: 'AI review failed'`.
- Expect return `{ success: true, data: { aiReviewStatus: 'manual_review', aiReviewReason: null } }`.

**Branch B — AI clear, not all 3 docs approved yet:**
- Mock `reviewDocumentWithAI` to return `{ status: 'clear' }`.
- Mock `getActiveDocumentsForOrder` to return 2 approved docs (less than 3).
- Expect `updateDocumentAiReview` called with `approved: true`.
- Expect `markOrderDocumentsUnderReview` NOT called.
- Expect `sendEmail` NOT called.
- Expect return `{ success: true, data: { aiReviewStatus: 'clear', aiReviewReason: null } }`.

**Branch C — AI clear, all 3 docs now approved:**
- Mock `reviewDocumentWithAI` to return `{ status: 'clear' }`.
- Mock `getActiveDocumentsForOrder` to return 3 docs all with `approved: true`.
- Mock `getOrderBasicInfo` to return `{ fullName: 'Maria Santos', tier: 'express' }`.
- Expect `markOrderDocumentsUnderReview` called with the order ID.
- Expect `sendEmail` called with `template: 'admin_order_ready'`.
- Expect return `{ success: true, data: { aiReviewStatus: 'clear', aiReviewReason: null } }`.

**Branch D — AI flagged, first attempt (attempts = 0):**
- Mock `reviewDocumentWithAI` to return `{ status: 'flagged', reasonKey: 'photo_blurry' }`.
- Fixture doc has `aiReviewAttempts: 0`.
- Expect `updateDocumentAiReview` called with `aiReviewStatus: 'flagged'`, `aiReviewAttempts: 1`, `approved: false`.
- Expect `sendEmail` NOT called.
- Expect return `{ success: true, data: { aiReviewStatus: 'flagged', aiReviewReason: 'photo_blurry' } }`.

**Branch E — AI flagged, second attempt (attempts = 1) → escalate:**
- Mock `reviewDocumentWithAI` to return `{ status: 'flagged', reasonKey: 'document_expired' }`.
- Fixture doc has `aiReviewAttempts: 1`.
- Mock `getOrderBasicInfo` to return `{ fullName: 'Ana Costa', tier: 'standard' }`.
- Expect `updateDocumentAiReview` called with `aiReviewStatus: 'manual_review'`, `aiReviewAttempts: 2`.
- Expect `sendEmail` called with `template: 'admin_document_escalated'` and `escalationReason: 'document_expired'`.
- Expect return `{ success: true, data: { aiReviewStatus: 'manual_review', aiReviewReason: null } }`.

---

### Step 6 — `handleCheckoutSessionCompleted` tests

Create `tests/unit/lib/stripe/webhooks.test.ts`. Mock at the top:

```typescript
vi.mock('@/lib/db', () => ({
  db: {
    query: { payments: { findFirst: vi.fn() } },
    transaction: vi.fn(),
  },
}))
vi.mock('@/lib/db/queries', () => ({ getUserLanguage: vi.fn() }))
vi.mock('@/lib/email/send', () => ({ sendEmail: vi.fn() }))
vi.mock('@/lib/env', () => ({
  env: { NEXT_PUBLIC_APP_URL: 'http://localhost:3000' },
}))
```

Build a minimal `Stripe.Checkout.Session` fixture with `metadata: { userId: 'user-1', tier: 'standard' }`, `id: 'cs_test_1'`, `payment_intent: 'pi_test_1'`, `amount_total: 12900`, `currency: 'eur'`, `payment_status: 'paid'`, `customer_details: { email: 'ana@example.com' }`.

Cover:

1. **Missing metadata → early return** — set `session.metadata = {}` (no userId/tier); expect `db.transaction` not called.
2. **Idempotency — existing payment → early return** — mock `db.query.payments.findFirst` to return an existing record; expect `db.transaction` not called.
3. **Happy path — creates order and payment** — mock `findFirst` to return `undefined`; mock `db.transaction` to call the callback with a `tx` stub that resolves `[{ id: 'order-1' }]` from `.returning()`; expect `db.transaction` called once.
4. **Happy path — sends order_confirmation email** — same setup as above; mock `getUserLanguage` to return `'en'`; expect `sendEmail` called with `template: 'order_confirmation'`, `tier: 'standard'`, and an `amountEur` string containing `'129'`.
5. **No customer email → email not sent** — set `session.customer_details = null` and `session.customer_email = null`; expect `sendEmail` not called even when order is created.

For the `db.transaction` mock, the callback receives a `tx` argument. The simplest approach:

```typescript
vi.mocked(db.transaction).mockImplementation(async (cb) => {
  const tx = {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 'order-1' }]),
  }
  return cb(tx as any)
})
```

Use `as any` here only because the Drizzle transaction type is structurally complex and the real shape is not needed for these tests — add a comment documenting this.

---

### Step 7 — `sendEmail` dispatch routing tests

Create `tests/unit/email/send.test.ts`. Mock:

```typescript
vi.mock('./resend', () => ({ resendClient: { emails: { send: vi.fn() } } }))
vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    RESEND_FROM_EMAIL: 'noreply@remotenif.com',
    ADMIN_EMAIL: 'admin@example.com',
  },
}))
```

For each `EmailPayload` variant, call `sendEmail('to@example.com', 'en', payload)` and assert:

1. `order_confirmation` → `resendClient.emails.send` called with a `subject` that contains the order ID and a `react` property that is not null.
2. `admin_document_escalated` → subject contains customer name; `react` is not null.
3. `admin_order_ready` → subject contains customer name; `react` is not null.
4. `documents_approved_customer` → `react` is not null; no error thrown.
5. `operator_submission_ready` → `react` is not null; `slaNote` is passed through when present.
6. **Resend API error is swallowed** — mock `resendClient.emails.send` to resolve `{ error: { message: 'API error' } }`; call `sendEmail` and expect it to resolve (not throw) and not propagate the error.

These tests verify the routing switch, not the template content (that's covered by `templates.test.tsx`).

---

### Step 8 — Missing email template tests

Open `tests/unit/email/templates.test.tsx` and add smoke tests for the two templates not yet covered:

**`DocumentsApprovedCustomerEmail`:**
- Renders without throwing in all four locales (en, fr, es, de).
- Contains `customerName` in the rendered HTML.
- Contains `dashboardUrl` as a link.

**`OperatorSubmissionReadyEmail`:**
- Renders without throwing.
- Contains `customerName` in the rendered HTML.
- Contains the operator queue URL.
- When `slaNote` is provided, it appears in the output.
- When `slaNote` is `undefined`, render does not throw.

---

### Step 9 — Run and confirm

Run `npx vitest run` and fix any failures. All tests must pass before marking this unit done.

---

## Scope Limits

- Do not add integration tests against a real DB — unit tests with mocks only.
- Do not modify `tests/unit/actions/admin.test.ts` — admin action coverage is already complete.
- Do not add tests for any feature not yet built (operator actions, NIF delivery, renewal).
- Do not add Playwright or E2E tests — those are Feature 21b.
- Do not change any production code as part of this feature, except for the pre-flight audit fixes in Step 1 (which must be zero changes if the code is already clean).
- Do not add new translation keys or modify message files.

---

## Check When Done

- Pre-flight audit of `app/actions/admin.ts` and `components/admin/*.tsx` is complete; any issues found are fixed.
- `tests/unit/actions/documents.test.ts` exists and covers `createUploadSignedUrl` (3 cases), `uploadDocument` (3 cases), and `reviewDocument` (5 branches: error, clear-partial, clear-all, flagged-first, flagged-second).
- `tests/unit/lib/stripe/webhooks.test.ts` exists and covers `handleCheckoutSessionCompleted` (5 cases: no metadata, idempotency, happy-path order creation, happy-path email, no customer email).
- `tests/unit/email/send.test.ts` exists and covers all 5 `EmailPayload` variants plus the Resend error-swallowing case.
- `tests/unit/email/templates.test.tsx` covers `DocumentsApprovedCustomerEmail` (4 locales) and `OperatorSubmissionReadyEmail` (with and without `slaNote`).
- `npx vitest run` passes with zero failures and zero skipped tests.
- `npm run build` passes.
