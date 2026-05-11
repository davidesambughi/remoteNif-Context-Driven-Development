# Code Standards

<!-- Implementation rules for this project's stack.
     Pre-filled with the default stack conventions. Update per project as needed.
     The AI follows these rules — if something isn't here, it defaults to its own habits. -->

---

## General

- Keep modules small and single-purpose.
- Fix root causes — do not layer workarounds on top of broken behavior.
- Do not mix unrelated concerns in one component or route.
- Respect the system boundaries defined in `architecture-context.md`.
- Name files after the responsibility they contain, not the technology.

---

## TypeScript

- Strict mode is required throughout the project.
- Never use `any`. Use explicit interfaces or narrowly scoped generic types.
- Use `interface` for object contracts (props, API shapes, DB models).
- Use `type` for unions, intersections, and derived types.
- Validate all unknown external input (user input, API responses, env vars) with Zod at the boundary before trusting it inside the app.

---

## Next.js

- Default to React Server Components (RSC). Do not add `"use client"` unless the component specifically needs browser interactivity, React hooks, or real-time state.
- Keep route handlers focused on a single responsibility: validate → check auth → act → respond.
- Long-running work belongs in background tasks, not in request handlers.
- Do not fetch data inside client components when a server component can do it.
- Use `next/image` for all images. Use `next/font` for all fonts.

---

## Styling

- Use CSS custom property tokens defined in `globals.css` — never raw Tailwind color classes (`zinc-*`, `slate-*`) or hardcoded hex values.
- Reference tokens through their Tailwind utility names as defined in `ui-context.md`.
- Follow the border radius scale from `ui-context.md` exactly.
- Do not write custom CSS unless Tailwind utilities cannot achieve the result.
- Responsive design: mobile-first. Add breakpoint variants only where the layout actually changes.

---

## Validation (Zod)

- Define Zod schemas for all API request bodies, API responses consumed by the app, and form data before it reaches business logic.
- Co-locate schemas with the code that uses them (e.g. schema in the same file as the route handler or form).
- Infer TypeScript types from Zod schemas with `z.infer<typeof Schema>` — do not write duplicate type definitions.

---

## Forms

- Use `react-hook-form` with Zod resolver via `@hookform/resolvers/zod`.
- Use shadcn/ui `Form`, `FormField`, `FormItem`, `FormLabel`, `FormMessage` wrappers.
- Show field-level error messages inline. Show server-level errors as a toast or inline summary.

---

## Animation (Framer Motion)

- Use Framer Motion only for meaningful UI transitions — page entrances, modal open/close, list item add/remove.
- Do not animate data-heavy or table-heavy screens.
- Keep durations short: 150–250ms for most transitions. Nothing above 400ms unless intentional.
- Prefer `layout` animations over manual position calculations.

---

## Email (Resend)

- All email sending happens in server-side code only (API routes or background tasks) — never in client components.
- Use React Email templates. Keep templates in `emails/` directory.
- Always handle Resend API errors explicitly — do not let email failures crash the main request silently.

---

## API Routes

- Validate and parse request input before any logic runs.
- Enforce auth and ownership before any mutation.
- Return consistent response shapes: `{ data }` on success, `{ error: string }` on failure.
- Use appropriate HTTP status codes.
- Keep route handlers thin — push complexity into `lib/` or background tasks.

---

## File Organization

```
lib/             shared infrastructure: DB client, auth helpers, utilities
hooks/           custom React hooks (client-side stateful logic only)
types/           shared TypeScript interfaces and types
components/ui/   shadcn/ui foundation — do not modify
components/      app-level components grouped by feature
app/api/         route handlers (thin — validate, auth check, act, respond)
emails/          React Email templates
```