# Agent Instructions

Read the following files in order before implementing anything or making any architectural decision.
Do not skip steps. Do not infer missing information — log it as an open question in `progress-tracker.md`.

## Reading Order

1. `context/project-overview.md` — who this is for, what problem it solves, scope, success criteria, constraints
2. `context/user-flows.md` — how users move through the product, including edge cases and error paths
3. `context/ui-context.md` — design language, tokens, component inventory, interaction states, copy rules
4. `context/architecture-context.md` — stack, project tree, system boundaries, storage model, invariants
5. `context/tech-spec.md` — data models (all 7 tables, fields, business rules), database indexes, environment variables
6. `context/code-standards.md` — implementation rules specific to this project's stack
7. `context/ai-workflow-rules.md` — how to scope, split, and deliver work
8. `context/progress-tracker.md` — current phase, active goal, completed work, open questions

## Feature Specs

Feature specs live in `feature-specs/`. They are not read upfront — they are given to you one at a time when a feature unit is ready to be built.

When you receive a feature spec:

- Read the context files it references before starting.
- Implement only what the spec defines — nothing adjacent, nothing assumed.
- Respect the `Scope Limits` section exactly.
- Verify every item in `Check When Done` before considering the unit complete.
- Update `context/progress-tracker.md` when done.

## Current Issues

Current-issues files live in `current-issues/`. Like feature specs, they are not read upfront — they are given to you one at a time when a bug fix session begins.

When you receive a current-issues file:

- Review the components or directories listed in the opening line before touching anything.
- Fix only what is listed — nothing adjacent, nothing assumed.
- Add `Do not change anything else` as a hard constraint on every issue.
- Respect the `## Scope` section exactly — it defines what must not be broken.
- Verify `npm run build` passes before considering the session complete.
- Update `context/progress-tracker.md` when done.

## Rules

- Update `context/progress-tracker.md` after every meaningful implementation change.
- If implementation changes the architecture, scope, or UI system, update the relevant context file before continuing.
- Do not modify `components/ui/*` (shadcn/ui) unless a task explicitly requires it.
- If a requirement is ambiguous or missing, add it as an open question in `progress-tracker.md` — do not invent behavior.
