# 12b-T — Integration Tests (Database Layer)

Read `context/AGENTS.md`, `context/progress-tracker.md` before starting.

Add integration tests that run against a real local Postgres database to verify DB queries and the server-side actions that depend on them, without mocking the data layer.

---

## Constraints

### Architecture

- Integration tests run against a **local Postgres instance via Docker** — this is the chosen strategy (see Decision below). Do not use the dev Supabase project or a separate Supabase test project.
- All integration tests live in `tests/integration/` — a separate directory from `tests/unit/`.
- A separate Vitest workspace config (`vitest.integration.config.ts`) targets `tests/integration/**/*.test.ts` so these tests are excluded from the standard `npx vitest run`. Run them with `npm run test:integration`.
- Each test file seeds its own data and tears it down after — no shared state between tests.
- No mocking of the DB layer — that is the entire point. Mock only external services that would require network calls: `@/lib/email/send`, `@/lib/ai/document-review`, `@/lib/supabase/admin` (storage only), `@/lib/stripe/client`.
- The Drizzle client in `lib/db/index.ts` must point to the test DB when `NODE_ENV=test`. Do this via a `DATABASE_URL` env var injected in the Vitest config (see Step 1).
- Test files:
  - `tests/integration/db/queries.test.ts` — query function correctness
  - `tests/integration/actions/documents.test.ts` — `uploadDocument` and `reviewDocument` end-to-end
  - `tests/integration/webhooks/stripe.test.ts` — `handleCheckoutSessionCompleted` idempotency

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- Reuse the same fixture builder pattern from unit tests (`makeOrder`, `makeDoc`) — extract shared fixtures to `tests/integration/fixtures.ts`.

### Validation

No new Zod schemas. Existing schemas are exercised by the actions under test.

### i18n

No user-facing text. No translation keys needed.

---

## Decision — Test DB Strategy

**Chosen: local Postgres via Docker.**

Rationale:
- **Isolation** — a dedicated container has no shared data with the dev Supabase project. Truncating tables between tests is safe.
- **Reproducibility** — any developer or CI runner spins up the same container with `docker compose up -d db`. No Supabase project credentials to share.
- **Migration parity** — Drizzle migrations in `lib/db/migrations/` are applied directly to the container, so the schema is always in sync with production.
- **Speed** — a local container is faster than a remote Supabase project. No network round-trip for each query.

Trade-off: requires Docker on the developer's machine and in CI. This is acceptable — Docker is already standard in this stack.

The alternative (separate schema in dev Supabase) was rejected because it risks accidental cross-contamination with dev data and requires sharing the Supabase service key with all contributors.

---

## Implementation

### Step 1 — Docker Compose and test DB config

Add a `docker-compose.test.yml` (or add a `db-test` service to an existing `docker-compose.yml`) that runs Postgres on a non-colliding port (e.g. `5433`):

```yaml
services:
  db-test:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: nif3_test
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5433:5432"
    tmpfs:
      - /var/lib/postgresql/data  # in-memory storage — fast, auto-cleared on stop
```

Create `vitest.integration.config.ts` in the project root:

```typescript
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ['tests/integration/**/*.test.ts'],
    environment: 'node',
    globals: true,
    setupFiles: ['tests/integration/setup.ts'],
    env: {
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5433/nif3_test',
      NODE_ENV: 'test',
    },
    // Run tests serially within each file — parallel runs would interleave seed/teardown
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
})
```

Add to `package.json` scripts:

```json
"test:integration": "docker compose -f docker-compose.test.yml up -d && drizzle-kit migrate --config drizzle.test.config.ts && vitest run --config vitest.integration.config.ts"
```

Create `drizzle.test.config.ts` pointing at the test DB:

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://postgres:postgres@localhost:5433/nif3_test',
  },
})
```

---

### Step 2 — Setup and teardown helpers

Create `tests/integration/setup.ts`:

- Import `db` from `@/lib/db`.
- Export a `truncateAll()` helper that deletes all rows from every table in dependency order (audit_log, operator_notifications, documents, payments, orders, users). Call this in a `beforeEach` in each test file so every test starts clean.
- Do NOT drop and recreate tables — migrations already ran once at startup. Truncate only.

Create `tests/integration/fixtures.ts`:

- `insertTestUser(overrides?)` — inserts a user row with role `'customer'` and returns the full record. Accept partial overrides for role, language, email.
- `insertTestOrder(userId, overrides?)` — inserts an order with status `'documents_pending'` and returns the full record.
- `insertTestDocument(orderId, userId, overrides?)` — inserts a document record and returns the full record. Defaults: `type: 'passport'`, `aiReviewStatus: 'pending'`, `approved: false`, `aiReviewAttempts: 0`, `supersededAt: null`.

These helpers call Drizzle insert directly — no actions, no Server Actions.

---

### Step 3 — Query function tests (`tests/integration/db/queries.test.ts`)

**`getOrderForUser`:**
1. Returns the order when ownership matches.
2. Returns `null` when the userId does not match (another user's order).
3. Returns `null` for a non-existent order ID.

**`createDocumentRecord`:**
1. Inserts a row and returns a record with a generated `id` and `createdAt`.
2. The inserted row is retrievable via `getActiveDocumentsForOrder`.

**`supersedePreviousDocuments`:**
1. Sets `supersededAt` on all active documents of the given type for an order.
2. Does not affect documents of a different type on the same order.
3. Does not affect documents of the same type on a different order.
4. After superseding, `getActiveDocumentsForOrder` no longer returns the superseded document.

**`getActiveDocumentsForOrder`:**
1. Returns only documents where `supersededAt IS NULL`.
2. Returns all 3 types when 3 active documents exist.
3. Returns an empty array when all documents have been superseded.

**`markOrderDocumentsUnderReview`:**
1. Updates the order status to `'documents_under_review'`.
2. Sets `documentsSubmittedAt` to a non-null timestamp.
3. Does not affect other orders.

**`getOrderBasicInfo`:**
1. Returns `{ fullName, tier }` for an existing order.
2. Returns `null` for a non-existent order ID.

---

### Step 4 — `uploadDocument` action end-to-end (`tests/integration/actions/documents.test.ts`)

Mock only `requireAuth` (returns a seeded user), `createAdminClient` (storage path — no real file upload needed), and `sendEmail`.

Test:
1. **Happy path** — call `uploadDocument` with valid input; verify the document row appears in the DB with `aiReviewStatus: 'pending'` and `approved: false`; verify `supersedePreviousDocuments` was a real DB write by inserting an existing doc first and confirming it is now superseded.
2. **Supersede correctness** — insert a previous document of the same type, call `uploadDocument`, then query the DB directly and verify: old record has `supersededAt !== null`, new record has `supersededAt === null`.

---

### Step 5 — `reviewDocument` all-approved path (`tests/integration/actions/documents.test.ts`)

This is the most important integration test in this feature — it verifies the full multi-step DB write chain that the unit tests could only check with mocks.

Setup: seed a user, an order (status `'documents_pending'`), and 3 document records with `approved: true` for passport and proof_of_address. The third document (signed_poa) starts as `approved: false` and is the one being reviewed.

Mock only `requireAuth` (returns the seeded user), `reviewDocumentWithAI` (returns `{ status: 'clear' }`), `sendEmail` (fire-and-forget, swallowed), `getOrderBasicInfo` (return seeded order info — keep this mock to avoid the extra join query).

Call `reviewDocument(signedPoaDocumentId)`.

Assert against the DB directly (not against the return value):
1. The signed_poa document row now has `approved: true` and `approvedAt` is a non-null Date.
2. The order row now has `status: 'documents_under_review'`.
3. The order row has `documentsSubmittedAt` set to a non-null timestamp.

---

### Step 6 — Stripe webhook idempotency (`tests/integration/webhooks/stripe.test.ts`)

Mock only `stripe.webhooks.constructEvent` (bypass signature verification — inject the event object directly), `getUserLanguage` (return `'en'`), and `sendEmail`.

Test:
1. **First call creates records** — call `handleCheckoutSessionCompleted` with a valid session fixture; query the DB and verify one `orders` row and one `payments` row exist with the correct `stripeCheckoutSessionId`.
2. **Second call is a no-op** — call `handleCheckoutSessionCompleted` again with the identical session; query the DB and verify there is still exactly one `orders` row and one `payments` row (no duplicates).
3. **Missing metadata — no records created** — call with `session.metadata = {}`; verify no `orders` rows were inserted.

---

## Dependencies

Install: `docker`, `vitest` (already installed), `vite-tsconfig-paths` (check if already present — used in the unit test config)

No new npm packages required beyond what's already in the project, assuming `vite-tsconfig-paths` is present. Verify before installing.

---

## Scope Limits

- Do not test Supabase Storage operations — those require a real Supabase instance. Storage calls are mocked.
- Do not test auth flows (sign-up, sign-in) — they depend on Supabase Auth, not just the DB. Out of scope for this feature.
- Do not test admin actions against a real DB — unit tests in `admin.test.ts` already provide sufficient coverage for those actions given their logic is in the Server Action layer, not in complex SQL.
- Do not add E2E tests — that is Feature 21b.
- Do not run these tests in the standard `npx vitest run` — they must be gated behind `npm run test:integration` only.
- Do not seed more than what each test strictly needs — minimal fixtures, clean teardown.

---

## Check When Done

- `docker-compose.test.yml` exists and starts a Postgres 16 container on port 5433.
- `vitest.integration.config.ts` exists, targets `tests/integration/**`, and injects the test DB connection string.
- `drizzle.test.config.ts` exists pointing at the test DB.
- `npm run test:integration` script exists in `package.json`.
- `tests/integration/setup.ts` exports `truncateAll()` and it is called in `beforeEach` in every test file.
- `tests/integration/fixtures.ts` exports `insertTestUser`, `insertTestOrder`, `insertTestDocument`.
- `tests/integration/db/queries.test.ts` covers all 6 query functions with the cases listed above.
- `tests/integration/actions/documents.test.ts` covers `uploadDocument` supersede correctness and the `reviewDocument` all-approved DB write chain.
- `tests/integration/webhooks/stripe.test.ts` covers idempotency (two identical calls → one record), missing metadata (no record), and happy path (one record created).
- `npm run test:integration` passes with zero failures (requires Docker running).
- `npx vitest run` (unit tests) is unaffected — integration tests do not appear in its output.
- `npm run build` passes.
