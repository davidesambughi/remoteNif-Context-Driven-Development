# S6-Fix6 — Delivered State: Order Details Record

<!-- Context files to read before implementing:
     context/AGENTS.md, context/progress-tracker.md,
     context/architecture-context.md, context/tech-spec.md -->

Add a permanent order summary below the NIF copy block in the `delivered` state, showing the four fields defined in the user flows doc: reference ID, plan tier, order date, and delivered date.

---

## Constraints

### Tokens

| Purpose | Token | Tailwind utility |
|---------|-------|-----------------|
| Card background | `var(--bg-subtle)` | `bg-subtle` |
| Section border | `var(--border-subtle)` | `border-border-subtle` |
| Label text | `var(--text-muted)` | `text-text-muted` |
| Value text | `var(--text-primary)` | `text-text-primary` |
| Secondary value text | `var(--text-secondary)` | `text-text-secondary` |
| Section heading | `var(--text-secondary)` | `text-text-secondary` |
| Font bold | `var(--font-bold)` | `font-[number:var(--font-bold)]` |
| Font medium | `var(--font-medium)` | `font-[number:var(--font-medium)]` |
| Text sm | `var(--text-sm)` | `text-[length:var(--text-sm)]` |
| Text xs | `var(--text-xs)` | `text-[length:var(--text-xs)]` |
| Space 6 | `var(--space-6)` | `p-[length:var(--space-6)]` |
| Space 4 | `var(--space-4)` | `gap-[length:var(--space-4)]` |
| Space 2 | `var(--space-2)` | `gap-[length:var(--space-2)]` |
| Space 1 | `var(--space-1)` | `gap-[length:var(--space-1)]` |
| Radius lg | `var(--radius-lg)` | `rounded-[length:var(--radius-lg)]` |

Rules that always apply to UI work in this project:
- No raw Tailwind color classes (`zinc-*`, `slate-*`, `blue-*`). Tokens only.
- No hardcoded hex or rgb values.
- Mobile-first. Add breakpoint variants only where layout actually changes.
- Border radius from scale: `--radius-sm` / `md` / `lg` / `xl` / `2xl` / `full`.
- Shadows from scale: `--shadow-sm` / `md` / `lg` / `xl`.
- Shadcn components when possible.

### Architecture

- `OrderDetailsRecord` is a **pure Server Component** (no `'use client'`) — it receives pre-processed props from `DashboardContent.tsx`, formats dates server-side, and returns JSX.
- Create the file at `components/dashboard/OrderDetailsRecord.tsx`.
- Import and render it in `DashboardContent.tsx` inside the `delivered` state block, directly below `<NifCopyBlock />` in the existing `<CardContent>`.
- Date formatting: use `getFormatter` from `next-intl/server` in `DashboardContent.tsx`, add it to the existing `Promise.all` call, and pass formatted date strings as props to `OrderDetailsRecord`. Do **not** call `getFormatter` inside `OrderDetailsRecord` — keep data fetching in the parent.
- No new DB queries. All fields (`id`, `tier`, `createdAt`, `deliveredAt`) are already present on the `order` object returned by `getUserActiveOrder`.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- Infer types from Zod schemas with `z.infer<typeof Schema>` — no duplicate type definitions.
- Props interface for `OrderDetailsRecord` uses typed primitives: `referenceId: string`, `tier: 'essential' | 'standard' | 'express'`, `orderDate: string`, `deliveredDate: string`.

### Validation

No form inputs or Zod schemas needed. All data comes from the existing `SelectOrder` type returned by `getUserActiveOrder`.

### i18n

- All user-facing strings go in `messages/en.json` under `dashboard.states.delivered.orderRecord`.
- Use `useTranslations('dashboard.states.delivered')` already in scope — access as `t('orderRecord.title')` etc.
- No hardcoded English strings in JSX.
- Add the same keys to `fr.json`, `es.json`, `de.json`.
- Tier display names (capitalised) go under `dashboard.states.delivered.orderRecord.tiers.essential`, `.standard`, `.express`.

**Keys to add (all 4 locales):**

```json
"orderRecord": {
  "title": "Order Details",
  "reference": "Reference",
  "plan": "Plan",
  "orderDate": "Order Date",
  "deliveredDate": "Delivered Date",
  "tiers": {
    "essential": "Essential",
    "standard": "Standard",
    "express": "Express"
  }
}
```

---

## Design

The order details record sits below `NifCopyBlock` inside the existing `<CardContent>`. It is a secondary info block — visually quieter than the NIF number, using smaller text and muted labels.

**Layout:**
- A `<dl>` (description list) with 4 rows arranged in a 2-column grid on `sm` and above, stacked (1-column) on mobile.
- Each item: label (`<dt>`) in `text-xs`, `text-text-muted`, uppercase, and tracked; value (`<dd>`) in `text-sm`, `text-text-primary`, `font-medium`.
- Reference ID value displayed in `font-mono`.
- A small section heading ("Order Details") above the grid in `text-xs`, `text-text-secondary`, uppercase, tracked — same visual treatment as the NIF label in `NifCopyBlock`.
- No border, no card wrapper — the block sits inside the already-bordered `CardContent` with consistent padding. Keep it light.

---

## Implementation

1. Add `getFormatter` to the `Promise.all` call in `DashboardContent.tsx` (it is already imported from `next-intl/server`):

   ```tsx
   const [t, tc, locale, order, fmt] = await Promise.all([
     getTranslations('dashboard'),
     getTranslations('common'),
     getLocale(),
     getUserActiveOrder(userId),
     getFormatter(),
   ])
   ```

   Then, in the `delivered` state block, prepare the two date strings before the JSX:

   ```tsx
   const orderDate = fmt.dateTime(order.createdAt, { dateStyle: 'medium' })
   const deliveredDate = order.deliveredAt
     ? fmt.dateTime(order.deliveredAt, { dateStyle: 'medium' })
     : '—'
   ```

2. Create `components/dashboard/OrderDetailsRecord.tsx` — a pure Server Component (no `'use client'`) that accepts:

   ```tsx
   interface OrderDetailsRecordProps {
     referenceId: string        // order.id.slice(0, 8).toUpperCase()
     tier: 'essential' | 'standard' | 'express'
     orderDate: string          // pre-formatted by parent
     deliveredDate: string      // pre-formatted by parent, or '—' if null
   }
   ```

   The component renders a description list (2-column grid on sm+) with the 4 fields. Uses `useTranslations('dashboard.states.delivered')` to access `orderRecord.*` keys.

3. In `DashboardContent.tsx`, import `OrderDetailsRecord` and render it inside the `delivered` state's `<CardContent>`, after `<NifCopyBlock />`:

   ```tsx
   <CardContent className="flex flex-col items-center sm:items-start gap-[length:var(--space-4)]">
     <NifCopyBlock nifNumber={order.nifNumber} />
     <OrderDetailsRecord
       referenceId={order.id.slice(0, 8).toUpperCase()}
       tier={order.tier}
       orderDate={orderDate}
       deliveredDate={deliveredDate}
     />
   </CardContent>
   ```

4. Add i18n keys to `messages/en.json` under `dashboard.states.delivered.orderRecord` (see schema in i18n section above). Add the same keys to `fr.json`, `es.json`, `de.json` — untranslated (English copy) for now.

5. Update `context/progress-tracker.md` to mark Finding 6 complete.

---

## Dependencies

None. No new packages required.

---

## Scope Limits

- Do not change `NifCopyBlock.tsx` — that component is complete.
- Do not add any interactive elements to `OrderDetailsRecord` — it is purely presentational.
- Do not add the "What comes next?" section — Finding 7 is marked post-launch.
- Do not format dates with a custom utility — use `next-intl`'s `getFormatter` (already in the stack).
- Keep `OrderDetailsRecord` as a Server Component — do not add `'use client'`.
- Do not add tests for this feature — it is pure UI with no actions or queries.

---

## Check When Done

- `OrderDetailsRecord.tsx` exists at `components/dashboard/OrderDetailsRecord.tsx` with no `'use client'` directive.
- All 4 fields (reference, plan, order date, delivered date) are visible in the delivered state card.
- Reference ID is displayed in uppercase monospace.
- `orderRecord.*` and `orderRecord.tiers.*` keys exist in all 4 locale files (`en`, `fr`, `es`, `de`).
- `getFormatter` is added to the `Promise.all` in `DashboardContent.tsx`.
- Dates are formatted using `fmt.dateTime(...)` — no raw `toLocaleDateString` calls.
- No raw Tailwind color classes used in the new component.
- `npm run build` passes.
