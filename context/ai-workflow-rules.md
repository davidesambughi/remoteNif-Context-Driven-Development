# AI Workflow Rules

<!-- These rules define how development work is scoped and delivered.
     They are not suggestions — the AI must follow them to stay in control of the project.
     This file is almost entirely reusable across projects. Only modify the "Protected Components" section. -->

---

## Approach

Build incrementally using a spec-driven workflow. Context files define what to build, how to build it, and the current state of progress. Always implement against these specs — do not infer or invent behavior from scratch.

When something is missing from the specs, it gets logged as an open question in `progress-tracker.md` and resolved before implementation continues.

---

## Scoping Rules

- Work on one feature unit or subsystem at a time.
- Prefer small, verifiable increments over large speculative changes.
- Do not combine unrelated system boundaries in a single implementation step.
- A feature unit is small enough if it can be verified end-to-end in one session.

---

## When To Split Work

Split an implementation step if it combines:

- UI changes and data persistence changes
- Multiple unrelated API routes
- Client-side state and server-side logic
- Behavior that is not clearly defined in the context files
- More than one screen or user flow

If you cannot quickly verify that a change works end-to-end, the scope is too broad — split it.

---

## Handling Missing Requirements

- Do not invent product behavior that is not defined in the context files.
- If a requirement is ambiguous, write the resolved interpretation in the relevant context file before implementing.
- If a requirement is missing, add it as an open question in `progress-tracker.md` before continuing.
- Never silently make a product decision — if a decision was made, it must be written down.

---

## Decision Speed

Not all decisions carry the same cost to reverse. Match iteration depth to reversibility.

**Irreversible — get these right before building:**
- Data models and database schema
- API contracts (routes, request/response shapes)
- Auth model and access rules
- Architectural invariants and system boundaries

These are expensive to fix after code exists. Iterate until confident before writing any code that depends on them.

**Reversible — decide fast, lock in, move:**
- Color values and typography (one token update fixes everything)
- Copy: button labels, headings, error messages
- Component variants and layout details
- Whether a UI element appears, is hidden, or is styled differently

These are near-zero cost to change when design tokens, components, and types are in place. Pick the best option on the table. Lock it in. Build. If it's wrong, change one token.

**Rule:** Never spend more than 30 minutes deciding a reversible thing. If exploration is still open after 30 minutes, pick the leading option and move forward — you will learn more from building one screen than from comparing five options.

---

## Protected Foundation Components

Do not modify the following unless a task explicitly requires it:

- `components/ui/*` — shadcn/ui components. These are generated, versioned, and must stay default and reusable.
- Third-party library internals.

Project-specific styling, layout changes, and feature logic must be implemented in app-level components, not by modifying foundation components.

---

## Keeping Docs In Sync

Update the relevant context file whenever implementation changes:

- System architecture, boundaries, or storage decisions → `architecture-context.md`
- UI system decisions (new token, new component, new pattern) → `ui-context.md`
- Code conventions or standards → `code-standards.md`
- Feature scope (in or out of scope) → `project-overview.md`
- Progress, open questions, or architecture decisions → `progress-tracker.md`

Progress state must reflect the actual state of the implementation, not the intended state.

---

## Before Moving To The Next Feature Unit

All three conditions must be true before starting the next unit:

1. The current unit works end-to-end within its defined scope.
2. No invariant defined in `architecture-context.md` was violated.
3. `progress-tracker.md` reflects the completed work and any decisions made.
