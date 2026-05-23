# 18b — Renewal Flow (Reminders & Expired State)

Read `context/AGENTS.md`, `context/user-flows.md`, and `context/tech-spec.md` before starting this unit.

Implement automated email reminders for fiscal representation renewals and build the dismissible dashboard banner for expired and near-expiry states.

---

## Constraints

### Tokens

| Purpose | Token | Tailwind utility |
|---------|-------|-----------------|
| Warning banner background | `var(--status-warning-subtle)` | `bg-warning-subtle` |
| Warning banner text/border | `var(--status-warning)` | `text-warning` / `border-warning` |
| Error/Expired banner background | `var(--status-error-subtle)` | `bg-error-subtle` |
| Error banner text/border | `var(--status-error)` | `text-error` / `border-error` |

> **Why not `bg-amber-50` / `bg-rose-50`?** Those are raw Tailwind color classes — banned by Invariant #8.
> `bg-warning-subtle` and `bg-error-subtle` are registered in `globals.css` `@theme inline` as
> `--color-warning-subtle` and `--color-error-subtle`. `text-status-warning` does not exist as a
> Tailwind utility — the `@theme inline` entry is `--color-warning`, which generates `text-warning`.

Rules that always apply to UI work in this project:
- No raw Tailwind color classes (`zinc-*`, `slate-*`, `blue-*`). Tokens only.
- No hardcoded hex or rgb values.
- Mobile-first. Add breakpoint variants only where layout actually changes.
- Border radius from scale: `--radius-sm` / `md` / `lg` / `xl` / `2xl` / `full`.
- Shadows from scale: `--shadow-sm` / `md` / `lg` / `xl`.
- Shadcn components when possible.

### Architecture

- Cron jobs run via API routes in `app/api/cron/renewals/route.ts` triggered via HTTP GET.
- Cron authentication MUST validate `Bearer ${env.CRON_SECRET}` in the Authorization header.
- DB queries for fetching eligible reminder targets go in `lib/db/queries.ts`.
- Server Action for dismissing the fiscal rep goes in `app/actions/orders.ts` (not settings.ts — it mutates an order field, same boundary as `savePersonalDetails`).
- The dashboard banner is rendered within the `app/[locale]/(dashboard)/dashboard/page.tsx` flow.
- All internal links (banner CTA, settings link) must use `<Link>` from `@/i18n/navigation` — never bare `<a>` or `next/link`.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- Infer types from Zod schemas with `z.infer<typeof Schema>` — no duplicate type definitions.

### Validation

```typescript
// Validation for the cron route auth
import { z } from 'zod';
const CronHeaderSchema = z.string().refine(val => val === `Bearer ${env.CRON_SECRET}`, {
  message: 'Invalid cron secret'
});
```

### i18n

- All user-facing strings go in `messages/en.json` under the `renewal` or `dashboard.renewalBanner` key.
- Use `useTranslations()` in the component.
- No hardcoded English strings in JSX.
- Add the same keys (untranslated for now) to `fr.json`, `es.json`, `de.json`.
- Emails MUST be sent in the customer's preferred language (`customerLanguage` from the DB).

---

## Design

- **Renewal Banner**: Displayed at the top of the dashboard page (below header, above timeline/details).
- **Near Expiry State**: Warning styling (amber/orange semantics mapped to tokens). "Your fiscal representation expires in X days. Renew to stay covered." Link to `/[locale]/renewal?orderId=...`.
- **Expired State**: Error styling (red/rose semantics mapped to tokens). "Your fiscal representation expired on [date]. Renew to stay covered." Link to `/[locale]/renewal?orderId=...`.
- **Dismissal**: A small "I no longer need fiscal representation" button/link on the banner. Clicking it opens a shadcn `AlertDialog` for confirmation ("Are you sure? You may face fines if you have Portuguese tax obligations.").
- **Settings Link**: If the banner is dismissed, a subtle "Renew fiscal representation" text link remains in the Account Settings view.

---

## Implementation

1. **Database Queries (`lib/db/queries.ts`)**
   - Add a query `getOrdersForRenewalReminders(targetDaysFromNow: number)`:
     - Joins `orders` and `users`.
     - Filters: `status = 'delivered'`, `tier IN ('standard', 'express')`, `fiscalRepDismissedAt IS NULL`.
     - Filters `fiscalRepExpiresAt` using a **day-window range** — `>= startOfTargetDay AND < startOfNextDay` — because the column stores a full timestamp (set from `deliveredAt`), not a date-only value. A simple `eq` comparison will match nothing in practice. Use Drizzle's `gte`/`lt` with `sql` date arithmetic: `>= CURRENT_DATE + INTERVAL 'N days'` and `< CURRENT_DATE + INTERVAL 'N+1 days'`.
     - **Known limitation — no deduplication guard.** If the cron fires twice on the same day (Vercel retry, redeployment), a customer may receive a duplicate reminder. This is acceptable at current scale. Add a `// NOTE: no dedup guard — known limitation, acceptable at current scale` comment in the cron route handler.

2. **Email Templates (`lib/email/templates/` and `lib/email/send.ts`)**
   - Create React Email templates for the 3 reminder intervals (30 days, 15 days, expired today). This can be 3 separate templates or 1 parameterized template (`renewal-reminder.tsx`).
   - Copy must match Flow 11a in `user-flows.md` and be translated across all 4 locales.
   - Link the CTA to `[NEXT_PUBLIC_APP_URL]/[locale]/renewal?orderId=[orderId]`.
   - Update `EmailPayload` union in `send.ts` and wire the dispatch switch.

3. **Cron API Route (`app/api/cron/renewals/route.ts`)**
   - Implement `GET` handler.
   - Validate `Authorization` header against `env.CRON_SECRET`.
   - Call DB query for 30 days (11 months), 15 days (11.5 months), and 0 days (12 months).
   - Loop over results and call `sendEmail` for each in the user's `language`.
   - Return `{ success: true, processed: count }`.

4. **Dismissal Action (`app/actions/orders.ts`)**
   - Create `dismissFiscalRep(orderId: string)` Server Action.
   - Validate `orderId` with Zod — reuse `GeneratePoaSchema` from `lib/validations/orders.ts` (already validates a UUID string).
   - Validates ownership (must belong to `getCurrentUser()`).
   - Updates `fiscalRepDismissedAt = NOW()`.
   - Calls `revalidatePath('/dashboard')`.

5. **Dashboard Banner UI (`components/dashboard/RenewalBanner.tsx`)**
   - Server Component or hydrated Client Component that takes the `order` data.
   - If `fiscalRepDismissedAt` is NOT null, return `null` (hide banner).
   - Check if `fiscalRepExpiresAt` is within 30 days of `NOW()` or in the past.
   - Render the appropriate warning or error banner based on dates.
   - Include the dismiss button.

6. **Dismissal Dialog (`components/dashboard/DismissRenewalDialog.tsx`)**
   - Client Component wrapping the dismiss action inside a shadcn `AlertDialog`.
   - Invokes the `dismissFiscalRep` Server Action and handles loading states (`useTransition` or `useFormStatus`).

7. **Account Settings Link**
   - In `/settings/page.tsx`, if the user has an order where `order.tier !== 'essential'` AND `order.fiscalRepDismissedAt !== null`, display a "Renew fiscal representation" text link routing to `/[locale]/renewal?orderId=...`.
   - Use `<Link>` from `@/i18n/navigation`. The `order` object is already fetched by the settings page via `getUserActiveOrder` — no extra query needed.

---

## Scope Limits

- **Do not modify the checkout process** — Feature 18a already handles the Stripe checkout session creation.
- **Do not implement retry logic for failed cron emails** — rely on Vercel's built-in cron retries or log it. Keep the route simple.
- **Do not send emails to Essential tier customers** — they do not have fiscal representation.
- Keep this focused purely on reminders (emails) and the expired/near-expiry visibility (banner).

---

## Check When Done

- `GET /api/cron/renewals` returns 401 when the secret is missing or incorrect.
- `GET /api/cron/renewals` returns 200 when authenticated and processes the target cohorts.
- DB queries correctly isolate 30-day, 15-day, and 0-day cohorts, excluding dismissed orders.
- Renewal email templates render without errors in all 4 locales, containing the NIF renewal link.
- `RenewalBanner` renders correctly on the dashboard for users within 30 days of expiry.
- Dismissing the banner writes `fiscalRepDismissedAt` to the DB and permanently hides the banner.
- A "Renew fiscal representation" link appears in Account Settings if the banner was dismissed.
- Create unit/integration tests for the cron route, the DB query, the new Server Action, and the new email templates.
- `npm run build` passes.
