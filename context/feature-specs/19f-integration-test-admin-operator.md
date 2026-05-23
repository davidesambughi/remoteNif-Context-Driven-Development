# 19f — Integration Tests: Admin Queries & Operator Queue

<!-- Read before starting: context/AGENTS.md, context/progress-tracker.md, context/architecture-context.md -->

Fill the integration test gap for the admin and operator DB query layer. These six admin functions and one operator query have zero real-DB coverage — they are only tested via unit mocks today.

---

## Why This Exists

The admin query layer is the most complex in the codebase. `getAdminOrderDetail` joins orders, users, payments, and all three documents with AI results, admin overrides, and approval state. Unit tests mock this entirely — if the query returns wrong data, nothing catches it until an admin uses the panel.

`getOperatorQueue` has a non-trivial two-section sort: Express orders first, sorted by SLA ascending (least time remaining first); Standard orders second, sorted by creation date ascending. The filter is also non-trivial: only `documents_approved` status, latest approved docs only. A wrong join or wrong sort is invisible in unit tests.

All tests run against Docker Postgres (same pattern as existing integration suites — see `tests/integration/db/queries.test.ts` for setup).

---

## Scope

Seven query functions to cover with real-DB tests:

### Admin queries (`tests/integration/db/admin-queries.test.ts`)

**`getAdminOrderList`**
- Returns orders in reverse creation order by default
- Filter by status — returns only matching orders
- Filter by tier — returns only matching orders
- Express orders with `documentsApprovedAt` set appear with SLA data
- Orders for other users are included (admin sees all)
- Empty result when no orders match the filter

**`getAdminOrderDetail`**
- Returns full joined shape: order + user email + payment amount/status + all three documents
- Returns null for a non-existent order ID
- Document slots show `null` when a document type has not been uploaded yet
- `approved` flag on a document reflects the correct computed state
- `adminOverride` fields are populated correctly after `adminSetDocumentApproved` is called

**`adminSetDocumentApproved`**
- Sets `approved = true`, `adminOverride = true`, `adminOverrideBy`, `adminOverrideAt` on the target document
- Does not touch other documents on the same order (row isolation)

**`adminSetDocumentFlagged`**
- Sets `aiReviewStatus = 'flagged'`, `approved = false`, `adminOverride = true`, `adminOverrideReason` on the target document
- Does not touch other documents on the same order

**`adminTransitionOrderToApproved`**
- Sets `status = 'documents_approved'` and `documentsApprovedAt` on the target order
- Does not touch unrelated orders

**`adminUpdateOrderStatusQuery`**
- Forward move (`documents_pending` → `documents_under_review`): sets status, does not touch unset timestamps
- Move to `documents_approved`: sets `documentsApprovedAt` if not already set; does not overwrite an existing value
- Move to `submitted`: sets `submittedToFinancasAt`
- Move to `delivered`: sets `deliveredAt`

### Operator queries (`tests/integration/db/operator-queue.test.ts`)

**`getOperatorQueue`**
- Returns only orders with status `documents_approved`
- Express orders appear before Standard orders regardless of creation date
- Among Express orders: sorted by `documentsApprovedAt` ascending (least SLA remaining first)
- Among Standard orders: sorted by `createdAt` ascending (oldest first)
- Orders in other statuses (`submitted`, `delivered`, `documents_pending`, etc.) do not appear
- Returns correct shape: `id`, `tier`, `fullName`, `documentsApprovedAt`

---

## Constraints

### Architecture

- All tests use the existing Docker Postgres setup — same `vitest.integration.config.ts`, same `truncateAll` + fixture helpers.
- Import query functions directly from `@/lib/db/queries` — no mocking.
- Use `insertTestUser`, `insertTestOrder`, `insertTestDocument` fixtures from `tests/integration/fixtures.ts`. Extend fixtures if new document fields are needed — do not duplicate inline.
- Each `describe` block calls `beforeEach(truncateAll)` — never share DB state between tests.
- Run with `npx vitest run --config vitest.integration.config.ts` (requires Docker on port 5433).

### TypeScript

- Strict mode. No `any`. 
- Return types are already exported from `@/lib/db/queries` — use them for `expect` assertions.
- Use `expect.objectContaining` for partial shape assertions rather than full object equality where the shape is large.

### Scope Limits

- Do not add integration tests for Supabase Storage calls (`getSignedDocumentUrl`, signed upload URLs) — Storage is not available in Docker Postgres; unit tests are sufficient.
- Do not test `insertAuditLog` in isolation — it is already exercised as a side-effect in existing operator and renewal integration tests.
- Do not test simple single-table SELECTs (`getUserById`, `getOrderStatusById`, `getOrderFullName`) — the query complexity does not justify the test overhead.
- Do not add tests for `insertOperatorNotification` — it is a simple INSERT already covered indirectly.
- E2E tests (Playwright, full browser) are a separate future feature — this spec is DB-layer only.

---

## Check When Done

- `tests/integration/db/admin-queries.test.ts` exists and covers all six admin functions with the cases listed above.
- `tests/integration/db/operator-queue.test.ts` exists and covers `getOperatorQueue` with the sort/filter cases listed above.
- `npx vitest run --config vitest.integration.config.ts` passes with no failures (requires Docker running on port 5433).
- `npm run build` passes.
- Unit test suite (`npx vitest run`) still passes — no regressions.

---

## Not In This Feature

- E2E browser tests (Playwright) — planned after UI is complete (Feature 21b)
- Auth flow testing against real Supabase Auth — requires live Supabase connection, not Docker
- Email delivery testing against real Resend — not appropriate for automated tests
- AI document review against real Groq — not appropriate for automated tests; unit mocks are correct here
