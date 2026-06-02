# Audit Sprint 4 Findings — `code-standards.md`

## Summary
The codebase is highly compliant with the defined standards, particularly in its use of Zod for boundary validation, consistent `ActionResult` shapes for most actions, and disciplined use of CSS tokens. The primary pattern violation found is the omission of the `return` keyword in `redirect()` calls.

## Findings List

| ID | Finding | Recommendation | Type |
|----|---------|----------------|------|
| **D1** | **Missing `return` in `redirect()` calls.** Multiple files call `redirect()` without the `return` keyword. The standard requires `return redirect(...)` for proper TypeScript narrowing. | Add `return` prefix to all 6 instances. | **Fix Code** |
| **D2** | **`signOut` doesn't return `ActionResult`.** `app/actions/auth.ts` `signOut` redirects directly without an `ActionResult` wrapper. | Add `return redirect(...)` and update return type if needed, or leave as is since it's an exit point. | **Intentional** |
| **D3** | **`t(errorKey as any)` in `CheckoutResumer.tsx`.** Known issue where error keys are forced to `any` because of dynamic translation key building. | Keep as is (Intentional) or research `next-intl` key union types. | **Intentional** |
| **D4** | **Documented `any` in `queries.ts`.** Drizzle transaction and SQL template literal use `any` but are properly guarded with `eslint-disable` and rationale comments. | No action needed. | **Intentional** |

## File-Specific Details for D1 (Missing `return`)

1. `app/[locale]/(auth)/signin/page.tsx` (L22, L23, L24)
2. `app/[locale]/(auth)/signup/page.tsx` (L17)
3. `app/[locale]/(dashboard)/dashboard/page.tsx` (L32)
4. `app/[locale]/(dashboard)/layout.tsx` (L28)
5. `app/[locale]/admin/(panel)/orders/[id]/page.tsx` (L24)
6. `app/actions/auth.ts` (L163, inside `signOut`)

## Verification Checklist (Compliant)

- ✅ **TypeScript:** No un-annotated `any` or `as any` (outside of documented exceptions).
- ✅ **i18n:** 100% of locale-aware hooks/links imported from `@/i18n/navigation`.
- ✅ **Next.js:** No `revalidateTag` or `use cache` found. `revalidatePath` used correctly.
- ✅ **Styling:** No raw Tailwind color classes or hex codes in components.
- ✅ **Organization:** File structure matches `architecture-context.md`.
