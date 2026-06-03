# Sprint 6 Fix 5 — NIF Copy to Clipboard

<!-- Context files to read: AGENTS.md, progress-tracker.md, audit-sprint-6-findings.md -->

The delivered state NIF number block currently displays the number statically. This fix adds a one-click copy-to-clipboard button with brief visual feedback, satisfying the user-flows.md requirement: "copyable with one click".

---

## Constraints

### Tokens (UI features only)

| Purpose | Token | Tailwind utility |
|---------|-------|-----------------|
| NIF block background | `var(--bg-subtle)` | `bg-subtle` |
| NIF block border | `var(--border-subtle)` | `border-border-subtle` |
| NIF number text | `var(--text-primary)` | `text-text-primary` |
| Label text | `var(--text-muted)` | `text-text-muted` |
| Copy icon (default) | `var(--text-muted)` | `text-text-muted` |
| Copy icon (confirmed) | `var(--status-success)` | `text-success` |
| Button hover background | `var(--brand-primary-dim)` | `hover:bg-brand-primary-dim` |
| Border radius (block) | `var(--radius-lg)` | `rounded-lg` |

Rules that always apply to UI work in this project:
- No raw Tailwind color classes (`zinc-*`, `slate-*`, `blue-*`). Tokens only.
- No hardcoded hex or rgb values.
- Mobile-first. Add breakpoint variants only where layout actually changes.
- Border radius from scale: `--radius-sm` / `md` / `lg` / `xl` / `2xl` / `full`.
- Shadows from scale: `--shadow-sm` / `md` / `lg` / `xl`.
- Shadcn components when possible.

### Architecture

- `DashboardContent.tsx` is a Server Component — clipboard access (`navigator.clipboard`) requires a Client Component.
- Extract the NIF display block into a new Client Component: `components/dashboard/NifCopyBlock.tsx`.
  - This component receives `nifNumber: string | null` as a prop.
  - It manages its own `copied` state with `useState`.
  - On copy, it calls `navigator.clipboard.writeText(nifNumber)` and sets `copied = true` for 2 seconds, then resets.
- `DashboardContent.tsx` imports `NifCopyBlock` and replaces the existing static NIF div with it — no other changes to `DashboardContent.tsx`.
- Do not add `'use client'` to `DashboardContent.tsx` — only `NifCopyBlock.tsx` is a Client Component.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- Infer types from Zod schemas with `z.infer<typeof Schema>` — no duplicate type definitions.
- Props interface: `interface NifCopyBlockProps { nifNumber: string | null }`.

### Validation

No form or API input. No Zod schema needed for this feature.

### i18n

- New keys go under `dashboard.states.delivered` in all 4 locale files (`en.json`, `fr.json`, `es.json`, `de.json`).
- New keys required:
  - `copyButton` — label/aria for the copy button (e.g. "Copy NIF")
  - `copiedButton` — confirmation state label/aria (e.g. "Copied!")
- Use `useTranslations('dashboard')` in `NifCopyBlock.tsx` (already a Client Component).
- No hardcoded English strings in JSX.

---

## Design

The NIF block is already styled in `DashboardContent.tsx` (lines 183–190). Preserve the existing layout exactly:

```
[ YOUR NIF NUMBER label ]
[ 123 456 789             ]   [ Copy icon ]
```

- The existing `bg-subtle` block, padding, radius, border remain unchanged.
- The copy button sits **inline to the right of the NIF number**, not below it. Use `flex items-center justify-between` on the NIF number row.
- The button is icon-only (Lucide `Copy` icon, 20×20px) with an `aria-label` from the translation key.
- When `copied === true`, swap the `Copy` icon for `Check` (also 20×20px) and apply `text-success`.
- No text label next to the icon — icon only, with `aria-label` for accessibility.
- If `nifNumber` is `null`, render the existing `'--- --- ---'` fallback with the copy button disabled (`cursor-not-allowed opacity-50`).

---

## Implementation

1. Add translation keys to all 4 locale files under `dashboard.states.delivered`:
   - `en.json`: `"copyButton": "Copy NIF"`, `"copiedButton": "Copied!"`
   - `fr.json`: `"copyButton": "Copier le NIF"`, `"copiedButton": "Copié !"`
   - `es.json`: `"copyButton": "Copiar NIF"`, `"copiedButton": "¡Copiado!"`
   - `de.json`: `"copyButton": "NIF kopieren"`, `"copiedButton": "Kopiert!"`

2. Create `components/dashboard/NifCopyBlock.tsx`:
   - `'use client'` directive at the top.
   - Props: `{ nifNumber: string | null }`.
   - `useState<boolean>` for `copied`, initialized to `false`.
   - `useTranslations('dashboard')` for `copyButton` / `copiedButton` keys.
   - Copy handler: calls `navigator.clipboard.writeText(nifNumber!)`, sets `copied = true`, and schedules `setTimeout(() => setCopied(false), 2000)`.
   - Render: the full NIF block (preserving all existing token classes from `DashboardContent.tsx` lines 183–190), with the NIF number row changed to `flex items-center justify-between`.
   - Copy button: shadcn `Button` with `variant="ghost"` and `size="icon"`, `aria-label` from translation key, disabled when `nifNumber === null`.
   - Icon: `Copy` (default) or `Check` (when `copied === true`) from `lucide-react`, `className="h-5 w-5"`.
   - Apply `text-success` class to the `Check` icon.

3. In `DashboardContent.tsx`, replace the `<CardContent>` block for the `delivered` state (lines 182–191):
   - Remove the static NIF div.
   - Import and render `<NifCopyBlock nifNumber={order.nifNumber} />` inside the existing `<CardContent>`.
   - Preserve the `className` on `<CardContent>` unchanged.

---

## Scope Limits

- Do not add Finding 6 (order details record) in this spec — that is a separate fix.
- Do not change any other order status cards.
- Do not change `DashboardContent.tsx` beyond the `delivered` `<CardContent>` swap.
- Do not add tests for this feature — it is pure UI with no actions or queries.

---

## Check When Done

- `components/dashboard/NifCopyBlock.tsx` exists with `'use client'` directive.
- `dashboard.states.delivered.copyButton` and `copiedButton` keys exist in all 4 locale files.
- `DashboardContent.tsx` renders `<NifCopyBlock>` in the delivered state instead of the static NIF div.
- Copy button is visible in the delivered state UI.
- Clicking the button triggers the `Check` icon for approximately 2 seconds then resets.
- Button is disabled (not clickable, visually dimmed) when `nifNumber` is `null`.
- `npm run build` passes.
