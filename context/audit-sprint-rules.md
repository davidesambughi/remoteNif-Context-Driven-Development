# Audit Sprint Rules

> Read this at the start of every audit session before touching any file.

## What This Audit Is

We are checking whether the context docs match the actual codebase — not adding features.
For every gap found, we decide: **fix the code** OR **update the doc** OR **log as intentional deviation**.
We never silently skip a gap.

## Sprint List (do in order)

| Sprint | Task | Scope | Risk |
|--------|------|-------|------|
| ✅ 0 | R1–R3 | Write reference docs (Next.js 16.2, next-intl v4, Supabase 2026) | None — done |
| ✅ 1 | A2 | Audit `tech-spec.md` — Drizzle schema + env vars | Low |
| ✅ 2 | A4 | Audit `ui-context.md` — design tokens in `globals.css` | Low |
| ✅ 3 | A1 | Audit `architecture-context.md` — invariants, tree, boundaries | Medium |
| ✅ 4 | A3 | Audit `code-standards.md` — Next.js patterns, i18n, TypeScript | Medium |
| ✅ 5 | A5 | Audit `progress-tracker.md` — accuracy check | Low |
| ✅ 6 | A6 | Audit `user-flows.md` — flows vs Server Actions | High |
| ✅ 7 | A7 | Audit `project-overview.md` — scope and constraints | Low |

## Pattern for Every Sprint

1. **Plan mode** — explore the relevant files, write a findings list to a temp doc
2. **Review** — user reads findings, decides "fix code / update doc / intentional" for each
3. **Implement** — apply only the agreed fixes, nothing adjacent
4. **Verify** — `npm run build` must pass before the sprint is closed
5. **Update tracker** — log the completed sprint in `context/progress-tracker.md`

## Hard Rules

- One sprint per session. Do not combine sprints.
- Do not fix anything not on the agreed findings list for that sprint.
- Do not refactor, rename, or clean up while fixing — separate concerns.
- If a finding is ambiguous, log it as an open question and move on.
- Reference docs live in `context/references/` — read them before evaluating any finding.
  - `context/references/nextjs-16-2.md`
  - `context/references/next-intl-v4.md`
  - `context/references/supabase-2026.md`

## Status

Update the checkbox in the Sprint List above as each sprint completes.
