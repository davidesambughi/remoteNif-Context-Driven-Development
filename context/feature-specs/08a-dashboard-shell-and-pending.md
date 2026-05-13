# 08a — Dashboard Shell & Pending State

Build the authenticated customer dashboard shell with server-first data fetching and an initial pending state, following Next.js 16.2 best practices for streaming and Suspense boundaries.

---

## Constraints

### Tokens (UI features only)

| Purpose                | Token                   | Tailwind utility                    |
| ---------------------- | ----------------------- | ----------------------------------- |
| Page canvas background | `var(--bg-base)`        | `bg-[var(--bg-base)]`               |
| Surface background     | `var(--bg-surface)`     | `bg-[var(--bg-surface)]`            |
| Text primary           | `var(--text-primary)`   | `text-[var(--text-primary)]`        |
| Text secondary         | `var(--text-secondary)` | `text-[var(--text-secondary)]`      |
| Subtle border          | `var(--border-subtle)`  | `border-[var(--border-subtle)]`     |
| Card radius            | `var(--radius-xl)`      | `rounded-[length:var(--radius-xl)]` |

Rules that always apply to UI work in this project:

- No raw Tailwind color classes (`zinc-*`, `slate-*`, `blue-*`). Tokens only.
- No hardcoded hex or rgb values.
- Mobile-first. Add breakpoint variants only where layout actually changes.
- Border radius from scale: `--radius-sm` / `md` / `lg` / `xl` / `2xl` / `full`.
- Shadows from scale: `--shadow-sm` / `md` / `lg` / `xl`.

### Architecture

- `app/[locale]/(dashboard)/dashboard/page.tsx` must be a React Server Component (RSC). Do not use `"use client"` here.
- Leverage Next.js 16.2 streaming by adding `app/[locale]/(dashboard)/dashboard/loading.tsx` for instant loading states.
- Perform efficient data fetching directly in the Server Component.
- DB queries go in `lib/db/queries.ts`, not inline in the component.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- Infer types from DB models (e.g., `SelectOrder`).

### i18n

- All user-facing strings go in `messages/en.json` under the `dashboard` key.
- Use `getTranslations('dashboard')` in the Server Component.
- No hardcoded English strings in JSX.
- Add the same keys (untranslated for now) to `fr.json`, `es.json`, `de.json`.

---

## Design

The dashboard shell should have a maximum width container centered on the page. Use shadcn/ui components (`Card`, `CardHeader`, `CardTitle`, `CardContent`, `Button`) for the pending state prompt. It should display the order tier and ID. The typography and spacing should follow the `ui-context.md` guidelines using an 8px base grid (`--space-*`).

---

## Implementation

1. Update `lib/db/queries.ts`
   - Create an exported async function `getUserActiveOrder(userId: string)` that fetches the most recent order for a given user from the `orders` table.

2. Create `app/[locale]/(dashboard)/dashboard/loading.tsx`
   - Build a loading skeleton using shadcn `Skeleton` components.
   - It should match the approximate shape of the dashboard layout to provide a seamless streaming experience.

3. Update `app/[locale]/(dashboard)/dashboard/page.tsx`
   - Keep it as an async Server Component.
   - Fetch the authenticated user session (redirect to sign-in if invalid).
   - Await the `getUserActiveOrder(user.id)` query.
   - Remove the old `checkoutSuccess` hardcoded placeholder logic if present, replacing it with the actual order data flow.
   - If the user has no orders, render a simple empty state encouraging them to start an application.

4. Build the `documents_pending` view
   - If the order exists and its `status` is `documents_pending`, show the pending view.
   - Display the order Tier and the order ID using standard typography.
   - Render a shadcn `Card` with a message prompting the user to complete their details and upload documents (this will be wired up in features 09 and 10). Include a `Button` as a placeholder for the next action.

5. Update i18n Message Files
   - Add the necessary keys to `messages/en.json` (e.g., `dashboard.pending.title`, `dashboard.pending.description`, `dashboard.emptyState.title`).
   - Add the same keys to the other locale files.

---

## Scope Limits

- Do not build the personal details form. (Belongs in Feature 09).
- Do not build the document upload slots. (Belongs in Feature 10).
- Do not build the visual timeline or other order states like `documents_under_review`. (Belongs in Feature 08b).
- Keep this focused on the data fetching, the Suspense boundary (`loading.tsx`), and the initial pending shell.

---

## Check When Done

- `getUserActiveOrder` query is implemented in `lib/db/queries.ts`.
- `loading.tsx` correctly renders a skeleton state.
- Dashboard fetches the user's active order.
- Dashboard accurately displays the `documents_pending` prompt if the order status matches.
- All new copy uses next-intl translation keys.
- `npm run build` passes.
