# 02 — Database Schema

Read `context/AGENTS.md`, `context/progress-tracker.md`, `context/tech-spec.md`, `context/architecture-context.md` before starting.

Define the full Drizzle ORM schema for all 7 tables, configure the Drizzle client and Supabase clients, and run the first migration against Supabase — so that every subsequent feature has a typed, validated data layer to build on.

---

## Constraints

### Architecture

- Schema lives in `lib/db/schema.ts` — one file, all 7 tables, all enums.
- Drizzle client (pool connection) lives in `lib/db/index.ts` — imports `env.DATABASE_URL`.
- Supabase clients live in three files:
  - `lib/supabase/client.ts` — browser client (uses `createBrowserClient`)
  - `lib/supabase/server.ts` — server client (uses `createServerClient` with cookie access)
  - `lib/supabase/admin.ts` — service role client (uses `createClient` with `SUPABASE_SERVICE_ROLE_KEY`)
- Drizzle config lives at `drizzle.config.ts` in the project root.
- `lib/db/queries.ts` is created as an empty file (populated by later feature specs).
- No Server Actions, no API routes, no UI in this feature.
- `lib/env.ts` already validates `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` — import `env` wherever credentials are needed.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- Infer types from Drizzle's `$inferSelect` and `$inferInsert` helpers — do not write duplicate interface definitions.
- Export one `SelectX` and `InsertX` type per table from `lib/db/schema.ts` (e.g. `SelectOrder`, `InsertOrder`).
- Use `interface` for composite shapes that don't map 1:1 to a single table row.

### Validation

No Zod schemas in this feature. All field-level validation belongs in the feature specs that introduce forms or mutations.

---

## Implementation

### Step 1 — Install packages

Install: `drizzle-orm`, `drizzle-kit`, `postgres`, `@supabase/supabase-js`, `@supabase/ssr`

### Step 2 — Drizzle config (`drizzle.config.ts`)

Create `drizzle.config.ts` at the project root:

- `dialect: 'postgresql'`
- `schema: './lib/db/schema.ts'`
- `out: './lib/db/migrations'`
- `dbCredentials.url` reads from `process.env.DATABASE_URL` (not from `lib/env.ts` — Drizzle Kit runs outside Next.js)

### Step 3 — Add db scripts to `package.json`

Add to the `scripts` block:

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio"
```

### Step 4 — Drizzle client (`lib/db/index.ts`)

- Import `postgres` and `drizzle` from `drizzle-orm/postgres-js`.
- Import `env` from `lib/env.ts`.
- Create a single `postgres` pool using `env.DATABASE_URL`.
- Export `db` as the Drizzle instance.
- Export the `db` type as `Database`.

### Step 5 — Schema (`lib/db/schema.ts`)

Define all 7 tables using `pgTable` from `drizzle-orm/pg-core`. Implement every field, constraint, and default from `tech-spec.md` exactly — do not add, remove, or rename fields.

#### Enums (define before tables, using `pgEnum`)

- `roleEnum` — `'customer' | 'admin' | 'operator'`
- `languageEnum` — `'en' | 'fr' | 'es' | 'de'`
- `orderStatusEnum` — `'documents_pending' | 'documents_under_review' | 'documents_approved' | 'submitted' | 'delivered'`
- `tierEnum` — `'essential' | 'standard' | 'express'`
- `documentTypeEnum` — `'passport' | 'proof_of_address' | 'signed_poa'`
- `aiReviewStatusEnum` — `'pending' | 'clear' | 'flagged' | 'error' | 'manual_review'`
- `paymentStatusEnum` — `'pending' | 'succeeded' | 'failed' | 'refunded'`
- `notificationTypeEnum` — `'email' | 'sms'`
- `notificationStatusEnum` — `'pending' | 'sent' | 'failed'`

#### Table: `users`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | primary key, default `gen_random_uuid()` |
| `email` | `text` | not null, unique |
| `role` | `roleEnum` | not null, default `'customer'` |
| `language` | `languageEnum` | not null, default `'en'` |
| `createdAt` | `timestamp` | not null, default `now()` |
| `updatedAt` | `timestamp` | not null, default `now()` |

#### Table: `orders`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | primary key, default `gen_random_uuid()` |
| `userId` | `uuid` | not null, FK → `users.id` |
| `tier` | `tierEnum` | not null |
| `status` | `orderStatusEnum` | not null, default `'documents_pending'` |
| `fullName` | `text` | nullable |
| `dateOfBirth` | `date` | nullable |
| `nationality` | `text` | nullable (ISO country code) |
| `passportNumber` | `text` | nullable |
| `passportExpiry` | `date` | nullable |
| `address` | `text` | nullable |
| `nifNumber` | `text` | nullable |
| `createdAt` | `timestamp` | not null, default `now()` |
| `documentsSubmittedAt` | `timestamp` | nullable |
| `documentsApprovedAt` | `timestamp` | nullable |
| `submittedToFinancasAt` | `timestamp` | nullable |
| `deliveredAt` | `timestamp` | nullable |
| `updatedAt` | `timestamp` | not null, default `now()` |
| `fiscalRepExpiresAt` | `timestamp` | nullable |
| `fiscalRepDismissedAt` | `timestamp` | nullable |
| `stripeCheckoutSessionId` | `text` | nullable |
| `stripePaymentIntentId` | `text` | nullable |

#### Table: `documents`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | primary key, default `gen_random_uuid()` |
| `orderId` | `uuid` | not null, FK → `orders.id` |
| `userId` | `uuid` | not null, FK → `users.id` |
| `type` | `documentTypeEnum` | not null |
| `filePath` | `text` | not null |
| `fileName` | `text` | not null |
| `fileSize` | `integer` | not null |
| `mimeType` | `text` | not null |
| `aiReviewStatus` | `aiReviewStatusEnum` | nullable |
| `aiReviewReason` | `text` | nullable |
| `aiReviewedAt` | `timestamp` | nullable |
| `aiReviewAttempts` | `integer` | not null, default `0` |
| `adminOverride` | `boolean` | not null, default `false` |
| `adminOverrideBy` | `uuid` | nullable, FK → `users.id` |
| `adminOverrideReason` | `text` | nullable |
| `adminOverrideAt` | `timestamp` | nullable |
| `approved` | `boolean` | not null, default `false` |
| `approvedAt` | `timestamp` | nullable |
| `supersededAt` | `timestamp` | nullable |
| `createdAt` | `timestamp` | not null, default `now()` |
| `updatedAt` | `timestamp` | not null, default `now()` |

#### Table: `payments`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | primary key, default `gen_random_uuid()` |
| `orderId` | `uuid` | not null, FK → `orders.id` |
| `userId` | `uuid` | not null, FK → `users.id` |
| `stripePaymentIntentId` | `text` | not null, unique |
| `stripeCheckoutSessionId` | `text` | nullable, unique |
| `amount` | `integer` | not null (cents) |
| `currency` | `text` | not null, default `'eur'` |
| `status` | `paymentStatusEnum` | not null, default `'pending'` |
| `tier` | `tierEnum` | not null |
| `isRenewal` | `boolean` | not null, default `false` |
| `createdAt` | `timestamp` | not null, default `now()` |
| `updatedAt` | `timestamp` | not null, default `now()` |

#### Table: `operatorNotifications`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | primary key, default `gen_random_uuid()` |
| `orderId` | `uuid` | not null, FK → `orders.id` |
| `operatorId` | `uuid` | not null, FK → `users.id` |
| `type` | `notificationTypeEnum` | not null |
| `status` | `notificationStatusEnum` | not null, default `'pending'` |
| `attempts` | `integer` | not null, default `0` |
| `lastAttemptAt` | `timestamp` | nullable |
| `createdAt` | `timestamp` | not null, default `now()` |
| `sentAt` | `timestamp` | nullable |

#### Table: `operatorPreferences`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | primary key, default `gen_random_uuid()` |
| `userId` | `uuid` | not null, FK → `users.id`, unique |
| `emailNotifications` | `boolean` | not null, default `true` |
| `smsNotifications` | `boolean` | not null, default `true` |
| `phoneNumber` | `text` | nullable |
| `createdAt` | `timestamp` | not null, default `now()` |
| `updatedAt` | `timestamp` | not null, default `now()` |

#### Table: `auditLog`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | primary key, default `gen_random_uuid()` |
| `userId` | `uuid` | nullable, FK → `users.id` |
| `orderId` | `uuid` | nullable, FK → `orders.id` |
| `action` | `text` | not null |
| `details` | `jsonb` | not null |
| `ipAddress` | `text` | nullable |
| `userAgent` | `text` | nullable |
| `createdAt` | `timestamp` | not null, default `now()` |

Note: `auditLog` has no `updatedAt` — records are append-only and immutable.

#### Indexes (using Drizzle `index()` / `uniqueIndex()`)

Define all indexes from `tech-spec.md` as Drizzle index definitions inside each table's second argument callback:

- `users`: index on `email`, index on `role`
- `orders`: index on `userId`, index on `status`, index on `tier`, index on `createdAt` (desc), index on `documentsApprovedAt` (partial: where `status = 'documents_approved'`)
- `documents`: index on `orderId`, index on `userId`, index on `type`, index on `aiReviewStatus`
- `payments`: index on `orderId`, index on `userId`, unique index on `stripePaymentIntentId`, unique index on `stripeCheckoutSessionId`
- `operatorNotifications`: index on `orderId`, index on `status`
- `auditLog`: index on `userId`, index on `orderId`, index on `action`, index on `createdAt` (desc)

#### Exports per table

For each table export a `SelectX` and `InsertX` type:

```typescript
export type SelectUser = typeof users.$inferSelect
export type InsertUser = typeof users.$inferInsert
// … repeat for all 7 tables
```

### Step 6 — Supabase clients

**`lib/supabase/client.ts`** (browser):
- `createBrowserClient` from `@supabase/ssr`
- Uses `env.NEXT_PUBLIC_SUPABASE_URL` and `env.NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Exports a factory function `createClient()` — do not export a singleton (SSR safety)

**`lib/supabase/server.ts`** (server / RSC / Server Actions):
- `createServerClient` from `@supabase/ssr`
- Accepts cookies via Next.js `cookies()` from `next/headers`
- Uses `env.NEXT_PUBLIC_SUPABASE_URL` and `env.NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Exports an async factory function `createClient()` — always `await cookies()` before constructing the client

**`lib/supabase/admin.ts`** (service role — bypasses RLS):
- `createClient` from `@supabase/supabase-js`
- Uses `env.NEXT_PUBLIC_SUPABASE_URL` and `env.SUPABASE_SERVICE_ROLE_KEY`
- Exports a factory function `createAdminClient()` — never a singleton
- Add a comment: `// Service role — bypasses RLS. Only use in server-side code that has already verified authorization.`

### Step 7 — Empty queries file

Create `lib/db/queries.ts` with a single comment:

```typescript
// Reusable DB queries — populated by feature specs as each feature is built.
```

### Step 8 — Run migration

```bash
npm run db:generate
npm run db:migrate
```

Verify: the migration runs without errors and all 7 tables appear in the Supabase dashboard Table Editor.

### Step 9 — Update `progress-tracker.md`

Mark Feature 02 complete. Update "Current Goal" to Feature 03.

---

## Dependencies

Install: `drizzle-orm`, `drizzle-kit`, `postgres`, `@supabase/supabase-js`, `@supabase/ssr`

---

## Scope Limits

- Do not define any Zod validation schemas — those belong in the feature specs that introduce forms or mutations.
- Do not write any Server Actions or API routes — this feature is the data layer only.
- Do not create any UI components.
- Do not set up Supabase Row Level Security (RLS) policies — that is a security hardening step for a later sprint.
- Do not populate `lib/db/queries.ts` with actual queries — future feature specs define these one at a time.
- Do not configure Supabase Storage buckets — that belongs in the document upload feature spec.
- Do not touch `lib/env.ts` — it already covers all the env vars needed here.
- Keep this focused on: schema definition, Drizzle client, Supabase clients, migration.

---

## Check When Done

- `lib/db/schema.ts` exists and exports all 7 tables and their `SelectX` / `InsertX` types.
- All 9 enums are defined with `pgEnum`.
- All indexes from `tech-spec.md` are defined as Drizzle index definitions.
- `lib/db/index.ts` exports `db`.
- `lib/db/queries.ts` exists (empty with comment).
- `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts` all exist and export their factory functions.
- `drizzle.config.ts` exists at project root.
- `package.json` has `db:generate`, `db:migrate`, `db:studio` scripts.
- `npm run db:generate` produces a migration file in `lib/db/migrations/`.
- `npm run db:migrate` runs without errors.
- All 7 tables are visible in the Supabase Table Editor.
- `npm run build` passes.
