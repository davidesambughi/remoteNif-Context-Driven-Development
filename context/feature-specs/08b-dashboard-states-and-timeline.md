# 08b — Dashboard Order States & Timeline

Read `context/AGENTS.md`, `context/progress-tracker.md` before starting.

Implement the visual progress timeline and all post-upload order states (`under_review`, `approved`, `submitted`, `delivered`) for the customer dashboard.

---

## Constraints

### Tokens (UI features only)

| Purpose | Token | Tailwind utility |
|---------|-------|-----------------|
| Timeline active step | `var(--brand-primary)` | `bg-[var(--brand-primary)]` |
| Timeline completed step | `var(--status-success)` | `bg-[var(--status-success)]` |
| Timeline line | `var(--border-subtle)` | `bg-[var(--border-subtle)]` |
| Text muted | `var(--text-muted)` | `text-[var(--text-muted)]` |
| Success text | `var(--status-success)` | `text-[var(--status-success)]` |

Rules that always apply to UI work in this project:
- No raw Tailwind color classes (`zinc-*`, `slate-*`, `blue-*`). Tokens only.
- No hardcoded hex or rgb values.
- Mobile-first. Add breakpoint variants only where layout actually changes.

### Architecture

- `OrderTimeline` component should be a React Server Component (RSC) unless interactivity (like tooltips) requires `"use client"`.
- Dashboard state views should be conditionally rendered in the main `page.tsx`.
- Support link should be a standard `mailto:` or help center link.

### TypeScript

- Strict mode. No `any`.
- Handle the full `OrderStatus` enum safely.

### i18n

- All status-specific messages go in `messages/en.json` under `dashboard.states` and `dashboard.timeline`.
- Add support contact labels under `common.support`.
- Add translations to `fr.json`, `es.json`, `de.json` (placeholders in English if needed).

---

## Design

### Visual Timeline
A horizontal progress tracker at the top of the dashboard content area. 
Steps: 
1. **Upload** (`documents_pending`)
2. **Review** (`documents_under_review`)
3. **Approved** (`documents_approved`)
4. **Submitted** (`submitted`)
5. **Delivered** (`delivered`)

### State Views
- **Reviewing:** A card informing the user that documents are being checked (AI review usually takes seconds, but fallback to manual is possible).
- **Approved:** A card confirming readiness. For **Express** tier, mention the 48-hour submission SLA.
- **Submitted:** A card confirming the application is at the Portuguese Tax Authority (Finanças). Show an estimated delivery date (Standard: 5-10 business days).
- **Delivered:** A high-contrast success card displaying the NIF number clearly.

---

## Implementation

1. **Create `OrderTimeline` Component**
   - Create `components/dashboard/OrderTimeline.tsx` (RSC).
   - It should accept the current `OrderStatus` as a prop.
   - Use shadcn-like styling for a horizontal progress bar with dots/icons and labels.
   - Highlight completed steps in `status-success` and the current step in `brand-primary`.

2. **Update Dashboard Page**
   - Import `OrderTimeline`.
   - In `app/[locale]/(dashboard)/dashboard/page.tsx`, render the `OrderTimeline` above the state cards.
   - Implement conditional rendering for the remaining statuses:
     - `documents_under_review`
     - `documents_approved`
     - `submitted`
     - `delivered` (Show `order.nifNumber`)

3. **Add Support Contact**
   - Add a footer or sidebar link to `support@remotenif.com` in the dashboard layout.

4. **Translations**
   - Add `dashboard.timeline` keys for all 5 step labels.
   - Add `dashboard.states` keys for:
     - `underReview.title/description`
     - `approved.title/description` (and `expressNotice`)
     - `submitted.title/description`
     - `delivered.title/description/nifLabel`
   - Add `common.support` keys.

---

## Scope Limits

- Do not implement the document upload form logic yet (Feature 09/10).
- Do not implement the automated email notifications (Feature 12).
- Keep the timeline visual-only for now; no interactive tooltips.

---

## Check When Done

- `OrderTimeline` correctly highlights the current status.
- All 5 statuses have unique, professional views.
- NIF number is visible for the `delivered` state.
- Support link is visible and correct.
- `npm run build` passes.
