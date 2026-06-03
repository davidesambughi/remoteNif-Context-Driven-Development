# S6-Fix10 — SLA Breach Alert Cron

<!-- Context files to read before implementing: AGENTS.md, progress-tracker.md,
     architecture-context.md, code-standards.md, tech-spec.md -->

When an Express order stays in `documents_approved` status for more than 48 hours
(the operator SLA), the admin receives an automatic alert email once per breach;
the alert is deduplicated via a new `slaBreachAlertSentAt` column on `orders`.

---

## Constraints

### Architecture

- No UI, no client components, no i18n.
- New DB column `sla_breach_alert_sent_at` (nullable timestamp) on `orders`. Add it to:
  - `lib/db/schema.ts` (Drizzle column definition on the `orders` table)
  - `lib/db/migrations/0004_sla_breach_alert.sql` (hand-written ALTER TABLE — drizzle-kit hangs on Windows, same reason as all prior migrations)
  - `context/tech-spec.md` (Order interface)
- Two new DB queries in `lib/db/queries.ts`:
  - `getOverdueExpressOrders` — reads overdue orders for the cron
  - `markSlaBreachAlertSent` — sets the dedup column after each alert is sent
- New email template at `lib/email/templates/admin-sla-breach.tsx` — English only (admin emails have no locale parameter; see `admin-order-ready.tsx` for the established pattern).
- New cron route at `app/api/cron/sla-breach/route.ts` — Bearer auth (same `CRON_SECRET` pattern as `app/api/cron/renewals/route.ts`).
- `lib/email/send.ts` extended with `admin_sla_breach` union member and switch case.
- The cron schedule is NOT configured here — `vercel.json` is a post-launch Feature 22. Only the route handler is needed.
- Sends to `env.ADMIN_EMAIL` (already in `lib/env.ts`) — no new env vars.
- No Server Action wrapper. The cron route calls queries and `sendEmail` directly — same as the renewals cron.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- Infer types from Zod schemas with `z.infer<typeof Schema>` — no duplicate type definitions.
- The query return type for `getOverdueExpressOrders` must be typed explicitly as an inline interface or type alias — do not use `any`.

### Validation

No user input. The only validation is the `Authorization` header, using the same Zod schema pattern as `app/api/cron/renewals/route.ts`:

```typescript
const CronHeaderSchema = z
  .string()
  .refine((val) => val === `Bearer ${env.CRON_SECRET}`, {
    message: 'Invalid cron secret',
  })
```

---

## Implementation

1. **Write the migration file** at `lib/db/migrations/0004_sla_breach_alert.sql`:

   ```sql
   ALTER TABLE "orders" ADD COLUMN "sla_breach_alert_sent_at" timestamp;
   ```

   No `NOT NULL` — existing rows have no breach alert sent, so null is the correct default.

2. **Update `lib/db/schema.ts`** — add `slaBreachAlertSentAt` to the `orders` table definition, immediately after `fiscalRepDismissedAt`:

   ```typescript
   slaBreachAlertSentAt: timestamp('sla_breach_alert_sent_at'),
   ```

3. **Update `context/tech-spec.md`** — add to the Order interface (in the Timestamps block, after `fiscalRepDismissedAt`):

   ```typescript
   slaBreachAlertSentAt: Date | null  // set when the admin SLA breach alert has been sent — prevents duplicate alerts
   ```

4. **Add two DB queries to `lib/db/queries.ts`**, in a new section `// SLA breach queries (Feature S6-Fix10)`:

   **`getOverdueExpressOrders`** — returns all Express orders where:
   - `status = 'documents_approved'`
   - `tier = 'express'`
   - `documentsApprovedAt` is older than 48 hours from now (use `lt(orders.documentsApprovedAt, new Date(Date.now() - 48 * 60 * 60 * 1000))`)
   - `slaBreachAlertSentAt` IS NULL

   Return shape (select only what the email needs):
   ```typescript
   { id: string; fullName: string | null; documentsApprovedAt: Date }[]
   ```

   **`markSlaBreachAlertSent(orderId: string)`** — sets `slaBreachAlertSentAt = new Date()` and `updatedAt = new Date()` on the matching order row.

5. **Create `lib/email/templates/admin-sla-breach.tsx`** — English-only admin alert.

   Props interface:
   ```typescript
   interface AdminSlaBreachEmailProps {
     orderId: string
     customerName: string
     hoursOverdue: number
     adminOrderUrl: string
   }
   ```

   Subject function: `getAdminSlaBreachSubject(orderId: string): string`
   Returns: `Express SLA breach — Order #${orderId.slice(0, 8)}`

   Email body (follow the same inline-styles pattern as `admin-order-ready.tsx`):
   - Brand header: `RemoteNIF`
   - Heading: `Express SLA has been breached.`
   - Fields: Customer (`fullName ?? 'Unknown'`), Order (`#${orderId}`), Tier (`Express`), Overdue (`${hoursOverdue} hours`)
   - CTA link: `Review order →` linking to `adminOrderUrl`
   - Footer: `RemoteNIF · remotenif.com`

   The `hoursOverdue` value is computed by the cron route before calling `sendEmail` (see step 7).

6. **Extend `lib/email/send.ts`**:

   - Import `AdminSlaBreachEmail` and `getAdminSlaBreachSubject` from `./templates/admin-sla-breach`
   - Add `'admin_sla_breach'` to `EmailTemplateName`
   - Add to `EmailPayload` union:
     ```typescript
     | { template: 'admin_sla_breach'; orderId: string; customerName: string; hoursOverdue: number }
     ```
   - Add switch case:
     ```typescript
     case 'admin_sla_breach': {
       const adminOrderUrl = `${env.NEXT_PUBLIC_APP_URL}/en/admin/orders/${payload.orderId}`
       subject = getAdminSlaBreachSubject(payload.orderId)
       reactElement = AdminSlaBreachEmail({
         orderId: payload.orderId,
         customerName: payload.customerName,
         hoursOverdue: payload.hoursOverdue,
         adminOrderUrl,
       })
       break
     }
     ```
   - Note: this template sends to `env.ADMIN_EMAIL`, not to a customer locale — the `locale` parameter passed to `sendEmail` should be `'en'` (the function signature requires it; it is only used to build `dashboardUrl`, which is unused by this template).

7. **Create `app/api/cron/sla-breach/route.ts`**:

   - Same Bearer auth validation as the renewals route (copy the `CronHeaderSchema` pattern exactly).
   - Auth failure → `Response.json({ error: 'Unauthorized' }, { status: 401 })`.
   - On auth success:
     - Call `getOverdueExpressOrders()`.
     - If the DB query throws, log the error and return `Response.json({ success: false, error: 'db_query_failed' }, { status: 500 })`.
     - For each overdue order:
       - Compute `hoursOverdue = Math.floor((Date.now() - order.documentsApprovedAt.getTime()) / (1000 * 60 * 60))`.
       - Fire-and-forget: `void sendEmail(env.ADMIN_EMAIL, 'en', { template: 'admin_sla_breach', orderId: order.id, customerName: order.fullName ?? 'Unknown', hoursOverdue })`.
       - Call `await markSlaBreachAlertSent(order.id)` — must `await` this (if it fails, log and continue; don't abort the loop).
       - Increment a counter.
     - Return `Response.json({ success: true, processed: counter })`.

---

## Scope Limits

- Do not add the cron schedule to `vercel.json` — that is Feature 22 (post-launch).
- Do not send to the customer — only the admin receives this alert.
- Do not add retry logic or re-alerting — one alert per breach per order, full stop.
- Do not add UI to the admin panel for acknowledged breaches — out of scope.
- Do not add a second alert if the breach continues growing. The `slaBreachAlertSentAt` column is set once and never cleared.
- Do not run `drizzle-kit generate` or `drizzle-kit migrate` — write the SQL migration file by hand and apply it manually (see how all prior migrations were written).
- Do not modify `app/api/cron/renewals/route.ts`.

---

## Check When Done

- `lib/db/migrations/0004_sla_breach_alert.sql` exists and contains `ALTER TABLE "orders" ADD COLUMN "sla_breach_alert_sent_at" timestamp;`.
- `lib/db/schema.ts` has `slaBreachAlertSentAt: timestamp('sla_breach_alert_sent_at')` in the `orders` table.
- `context/tech-spec.md` Order interface includes `slaBreachAlertSentAt: Date | null`.
- `getOverdueExpressOrders` and `markSlaBreachAlertSent` exist in `lib/db/queries.ts` with explicit return types.
- `lib/email/templates/admin-sla-breach.tsx` exports `AdminSlaBreachEmail` and `getAdminSlaBreachSubject`.
- `lib/email/send.ts` includes `admin_sla_breach` in `EmailTemplateName`, `EmailPayload`, and the switch (exhaustive check still compiles).
- `app/api/cron/sla-breach/route.ts` exists and exports `GET`.
- A request to `GET /api/cron/sla-breach` with a missing or wrong `Authorization` header returns 401.
- `npm run build` passes.
