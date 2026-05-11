# AI-Driven Development Context System

A set of structured documents that give an AI coding agent everything it needs to build a project — and keep it disciplined while doing so.

The core idea: instead of re-explaining your project every session, you write it once into these files. The AI reads them before touching any code and updates them as it builds. Every decision is written down. Nothing lives only in someone's head.

---

## The Problem This Solves

AI coding agents are stateless. Every new conversation, they start from zero. Without a structured context system they will:

- Invent behavior that wasn't asked for
- Make architecture decisions inconsistently across sessions
- Use the wrong colors, fonts, or component patterns
- Forget what was already built and duplicate work
- Mix concerns that should be separate (business logic in components, long-running work in request handlers, etc.)

These files fix that. They are written once, kept up to date, and read in full before any implementation begins.

---

## The Files

### `AGENTS.md` — Entry Point
The first file an AI reads. It enforces the reading order for all other context files and states the non-negotiable rules (update the tracker, don't invent missing behavior, don't modify foundation components). Think of it as the standing instructions for every session.

### `project-overview.md` — The Product Brain
Answers the questions every developer should know before writing a line of code:
- **Who** is this for? (A specific person, not a category)
- **What problem** does it solve? (Concrete, not vague)
- **What are we building?** (Features and scope)
- **What are we NOT building?** (Explicitly out of scope)
- **How do we know it worked?** (Measurable success criteria)
- **What are the constraints?** (Time, tech, budget)

The out-of-scope section is as important as the features. Without it, the AI will build things you didn't ask for.

### `user-flows.md` — How Users Move Through the Product
Defines every screen, every primary flow, every error flow, and every edge case. Written from the user's perspective — actions and outcomes, not implementation. If a flow isn't here, the AI won't build it.

### `ui-context.md` — The Design System Contract
The single source of truth for every visual and behavioral decision:
- Color tokens (CSS custom properties — never raw hex or Tailwind color classes)
- Typography and font loading
- Border radius scale
- Motion principles
- Copy rules (tone, button labels, error messages, empty states)
- Component inventory
- Interaction states (hover, active, disabled, loading, focus)
- Error states and empty states
- Responsiveness breakpoints

The AI uses this file to write consistent UI across every screen and every session. Without it, it guesses — and guesses differently each time.

**Mockups:** visual mockups (screenshots, JPGs, PNGs) live in `public/images/`. They are not embedded here — reference them directly in your prompt when you need the AI to see the visual. The decisions from mockups (colors, layout, spacing) should be transferred into this file as text tokens and rules.

### `architecture-context.md` — The System Rules
Defines the technical structure of the system and the rules that must never be broken:
- Full stack table with roles
- Project file and folder tree
- System boundaries (what each part of the codebase is responsible for)
- Storage model (what data lives where)
- Auth and access rules
- Invariants — hard constraints the AI cannot violate, even if a shortcut is tempting

Invariants are the most important part of this file. Examples: "request handlers never run long-lived work," "auth is checked at every mutation boundary," "large artifacts are never stored directly in the database."

### `tech-spec.md` — The Implementation Blueprint
The implementation-level detail for every feature. Updated as features are spec'd and as decisions are made:
- **Data models** — every entity, its fields, types, constraints, and relationships
- **Feature specs** — what each feature does technically, what data it touches, what the business rules and edge cases are
- **API routes and server actions** — every endpoint: method, path, auth requirement, request shape, response shape, status codes
- **Environment and config** — every environment variable, its purpose, where to get it, and a `.env.local` template

This file is the contract between design and code. Write data models and API shapes here before implementing them — schema mistakes are the hardest to undo.

### `code-standards.md` — How to Write the Code
Project-specific implementation rules. Pre-seeded with conventions for the default stack (Next.js, TypeScript, Tailwind, shadcn/ui, Zod, Framer Motion, Resend). Covers:
- TypeScript strict mode and type discipline
- When to use React Server Components vs client components
- Styling rules (tokens only, no raw classes or hex)
- Validation with Zod
- Form handling
- Animation principles
- Email sending rules
- API route conventions
- File organization

The AI defaults to its own habits from training data. This file overrides those defaults with your standards.

### `ai-workflow-rules.md` — How the AI Works
Controls the development process itself:
- One feature unit at a time
- Small, verifiable increments
- Never invent behavior that isn't in the spec
- Log missing requirements as open questions rather than guessing
- Keep docs in sync with implementation
- Don't move to the next feature until the current one works end to end

This file is almost entirely reusable across projects. It encodes a disciplined methodology that prevents the AI from going wide when it should go deep.

### `progress-tracker.md` — Session Memory
The AI's working memory across conversations. Tracks:
- Current phase and active goal
- Completed work
- What's in progress
- What's next
- Open questions (with a blocking flag)
- Architecture decisions and the reasons behind them
- Session notes for resuming work

The AI updates this file after every meaningful change. Without it, every session starts from zero.

---

## The Feature Specs System

The context files define **what to build and how to build it**. The feature specs define **what to build next, in what order, and exactly how much**.

Each file in `feature-specs/` is a work order for one feature unit — small enough to build and verify in a single session. Together they form the complete build sequence for the project.

### How It Works

Files are numbered (`01-`, `02-`, `03-`...) and that number is the build order. It is also the dependency chain — a feature with a higher number can depend on everything below it being complete. The sequence is decided upfront and respected throughout the build.

Each file is given to the AI one at a time. The AI completes the unit, verifies it, updates `progress-tracker.md`, and only then moves to the next file.

### Anatomy of a Feature Spec

Every file follows the same structure:

**Opening line** — which context files to read before starting. Always includes `AGENTS.md`. Only lists files relevant to this unit.

**One-sentence summary** — what this unit does, stated as an outcome. Written before the sections.

**`## Design`** (optional) — visual and layout decisions specific to this unit. Only included when the unit involves UI work that isn't fully covered by `ui-context.md`. Be explicit about what not to include — the AI interprets silence as permission.

**`## Implementation`** — numbered steps. Each step is one discrete action: create a file, add a route, wire a provider. Steps are sequential. Names are specific — file paths, route names, function names, field names. The AI is told what to create and what it should do, not how to implement it internally.

**`## Dependencies`** (optional) — packages to install. Only included when this unit requires new packages not already in the project.

**`## Scope Limits`** — the most important section. An explicit list of what is NOT part of this unit, even if it seems related. Each item prevents a specific form of scope creep. The more specific, the better. Examples: "don't add AI logic yet", "don't add persistence — keep this focused on the UI shell", "don't customize provider internals."

**`## Check When Done`** — verifiable conditions that define done. Each item is checkable, not subjective. Always ends with `npm run build passes` as a non-negotiable baseline.

### Why This Works

Without feature specs, the AI decides scope on its own — and almost always goes too wide. It will build the adjacent feature, add the persistence layer before the UI is wired, or wire the AI logic before the backend plumbing exists. Feature specs remove that discretion. The AI builds exactly what the file says, verifies it, and stops.

The `Scope Limits` section is where the most thinking happens when writing these files. Every item you add there is a scope creep failure mode you're preventing in advance.

### The Files in `feature-specs/`

| File | Purpose |
| ---- | ------- |
| `00-template.md` | Blank template with instructions in every section comment |
| `00-example.md` | Filled example showing a complete auth spec — delete before real use |
| `NN-[name].md` | One file per feature unit, in build order |

---

## Reading Order

The order matters. Each file builds on the previous one.

```
1. project-overview.md     understand what and why before anything else
2. user-flows.md           understand how users move through the product
3. ui-context.md           understand the visual and behavioral system
4. architecture-context.md understand the system structure and hard rules
5. tech-spec.md            understand the implementation detail
6. code-standards.md       understand how to write the code
7. ai-workflow-rules.md    understand how to scope and deliver work
8. progress-tracker.md     understand the current state
```

`AGENTS.md` enforces this order. The AI reads it first, then reads the rest in sequence.

---

## How to Use This Template

### Phase 0 — Foundation (2-Day Timebox)

Before filling context files or writing any feature code, invest up to 2 days setting up the scaffolding that makes everything cheap to change. This is not extra work — it's what makes refactoring safe for the rest of the project.

**What Phase 0 delivers:**

| Item | Where it lives | Why it matters |
| ---- | -------------- | -------------- |
| Design tokens (colors, typography, spacing) | `globals.css` + `ui-context.md` | Change one value, everything updates |
| Core TypeScript types | `types/index.ts` | Compiler catches breaking changes before they reach production |
| Folder structure | Matches `architecture-context.md` tree | Each area is isolated — changing one won't break another |
| External services connected | Auth, DB, payments wired and smoke-tested | No integration surprises mid-build |
| shadcn/ui installed | `components/ui/` | Foundation components ready; don't rebuild them |
| `npm run build` passes | CI baseline | If build passes, the foundation is clean |

**The 2-day rule:** If you're still in Phase 0 on day 3, you're over-engineering. Phase 0 is a foundation, not a finished design system. Establish the minimum and move on.

**In feature specs:** Phase 0 maps to your first 1–2 specs (e.g. `01-foundation.md`, `02-design-system.md`). These should always be the first specs in the sequence.

**Mental model:** The foundation is an investment that pays back starting with your second screen. By screen 3, you're ahead. After that, every change costs a fraction of what it would cost in an unstructured codebase.

---

### Phase 1 — Fill the Context Files (Before Writing Any Code)

1. Copy this entire folder into your new project as `context/`.
2. Fill in `project-overview.md` first. Don't skip the out-of-scope section.
3. Fill in `user-flows.md`. List every screen in the screen inventory before writing any flows.
4. Fill in `ui-context.md` once you have design decisions. Transfer tokens from your design file exactly — no approximation.
5. Fill in `architecture-context.md` with your stack choices. Write your invariants before building anything.
6. Fill in `tech-spec.md` — data models and API contracts first, feature specs as you plan each one.
7. Review `code-standards.md` — remove sections that don't apply to your stack, add project-specific rules.
8. Leave `ai-workflow-rules.md` as-is unless your project has specific workflow constraints.
9. Leave `progress-tracker.md` blank — the AI fills it.

**Not all files require the same depth of conversation.** Some need the AI to ask probing questions and push back — expect real back-and-forth before anything gets written. Others are more mechanical once the harder files are done.

| File | Iteration level | Why |
| ---- | --------------- | --- |
| `project-overview.md` | Deep — expect multiple rounds | Persona, problem, and scope decisions have downstream consequences on everything. The AI should challenge vague answers. |
| `ui-context.md` | Deep for structure, fast for values | Component patterns, token naming, and typography scale are hard to change — get these right. Specific color values are cheap (one token update). Lock in a color direction in < 30 minutes; don't explore multiple palettes for hours. |
| `architecture-context.md` | Deep — expect multiple rounds | Stack choices, storage model, and invariants are the foundation. Wrong decisions here are expensive to fix later. |
| `tech-spec.md` | Deep — expect multiple rounds | Data models and API contracts are harder to change than UI. The AI should ask about edge cases and relationships before writing anything. |
| `user-flows.md` | Medium — structured conversation | More mechanical once the product is defined, but edge cases and error flows need active thinking together. |
| `code-standards.md` | Light — review and trim | Pre-seeded for your stack. Mostly removing what doesn't apply and adding project-specific rules. |
| `ai-workflow-rules.md` | None — leave as-is | Reusable across all projects. Only touch if your project has unusual constraints. |
| `progress-tracker.md` | None — starts blank | The AI writes this. You read it. |

### Phase 2 — Write the Feature Specs (Before Building Each Feature)

1. Create a `feature-specs/` folder in your project (copy from template).
2. Plan your full build sequence — every feature unit, in the order they must be built. Write file names before filling them in.
3. Fill in feature specs one at a time, starting from the foundation (design system, auth, DB setup) and working up to complex features.
4. Write data models and API routes in `tech-spec.md` before writing the feature spec that implements them.
5. Keep each spec small enough to build and verify in one session. If a spec feels large, split it.

### Phase 3 — Build (One Feature Spec at a Time)

- Give the AI one feature spec file at a time — not the whole folder.
- The AI reads `AGENTS.md` and the relevant context files first, then implements the spec.
- After completing a unit, the AI updates `progress-tracker.md` before moving on.
- If a requirement is missing or ambiguous, it gets logged as an open question in `progress-tracker.md` — not invented.
- If implementation changes architecture, storage, or UI decisions, the relevant context file is updated before continuing.

### What to Update and When

| Something changes | Update this file |
| ----------------- | ---------------- |
| Feature added or removed | `project-overview.md` + `tech-spec.md` |
| New screen or flow | `user-flows.md` |
| Design token, component, or state | `ui-context.md` |
| Architecture or storage decision | `architecture-context.md` |
| Data model or API route | `tech-spec.md` |
| New env variable | `tech-spec.md` (Environment section) |
| Coding convention | `code-standards.md` |
| Phase complete or question resolved | `progress-tracker.md` |
| Feature unit complete | `progress-tracker.md` + mark unit done in `feature-specs/` |
| Feature scope changes mid-build | Update the feature spec file before continuing |

### Quick Reference — What to Say to the AI

| What you're doing | What to say |
| ----------------- | ----------- |
| Starting a planning session | "Read `context/AGENTS.md`, then let's fill in `context/[file].md`." |
| Starting a build session | "Read `context/AGENTS.md`, then implement `context/feature-specs/[NN-name].md`." |
| Filing a bug | "Let's write a current-issues file for `[area]`." |
| Fixing bugs | "Read `context/AGENTS.md`, then fix `context/current-issues/current-issues-[area].md`." |
| Resuming after a break | "Read `context/AGENTS.md` and `context/progress-tracker.md`, then tell me where we left off." |

---

## The Current Issues System

Current-issues files are **bug fix work orders** — reactive documents filed when something breaks. They are a separate category from feature specs.

| | Feature Specs | Current Issues |
|---|---|---|
| **When written** | Before building | When a bug is found |
| **Purpose** | Build new behavior forward | Fix broken behavior without new breakage |
| **Scope direction** | "Don't build this yet" | "Don't break this while fixing" |
| **Trigger** | Planned build sequence | Observed failure |

### How It Works

One file per area of the codebase (`current-issues-canvas.md`, `current-issues-auth.md`, etc.). Each file covers all currently known bugs in that area. When bugs are fixed, they are removed from the file or the file is deleted. When new bugs appear in that area, they are added.

Like feature specs, current-issues files are handed to the AI one at a time — not read upfront with the context files.

### Anatomy of a Current Issues File

**Opening line** — which components or directories to review before starting, and the standing rule: do not break existing features. For visual bugs, a reference to a screenshot.

**`## Issues`** — one numbered `###` section per bug. Each issue contains:

- **"Read X before implementing"** — specific files to read before touching anything related to this fix. Prevents blind edits.
- **Problem description** — what is broken and what correct behavior looks like. Written from the user's perspective, not a technical hypothesis.
- **Fix instructions** — specific steps: which file to open, what to change, what to add. Same precision as feature spec implementation steps.
- **"Do not change anything else."** — the collateral damage line. Required on every issue. Makes the AI's scope explicit and non-negotiable.

**`## Scope`** — global constraints for the whole file. What is covered, what must be protected, and `npm run build passes` as the non-negotiable baseline.

### The Files in `current-issues/`

| File | Purpose |
| ---- | ------- |
| `00-template.md` | Blank template with instructions in every section comment |
| `00-example.md` | Filled example showing a navbar bug fix file — delete before real use |
| `current-issues-[area].md` | One file per area, filed when bugs are found |

---

## What This System Is Not

- **It is not a substitute for design.** `ui-context.md` is where design decisions are recorded, not where they are made. Do the design work first, then transfer the decisions here.
- **It is not a project management tool.** `progress-tracker.md` tracks implementation state, not tasks, deadlines, or team assignments.
- **It is not auto-generated.** These files require human judgment to fill in, especially `project-overview.md`, `user-flows.md`, and `tech-spec.md`. The quality of the AI's output is directly proportional to the quality of these files.
- **It is not a one-time artifact.** These files are living documents. An outdated context file is worse than no context file — the AI will build against stale specs.

---

## File Reference

```
context/
├── DEVELOPER.md                     this file — workflow guide for the human developer
├── AGENTS.md                        entry point — reading order and standing rules
├── project-overview.md              PRD: persona, problem, features, scope, success, constraints
├── user-flows.md                    screen inventory, primary flows, error flows, edge cases
├── ui-context.md                    design tokens, copy rules, components, states, responsiveness
├── architecture-context.md          stack, project tree, boundaries, storage model, invariants
├── tech-spec.md                     data models, feature specs, API routes, env config
├── code-standards.md                implementation rules for the project stack
├── ai-workflow-rules.md             how the AI scopes and delivers work
├── progress-tracker.md              live state: phase, completed, in progress, open questions
├── feature-specs/
│   ├── 00-template.md               blank feature spec template
│   ├── 00-example.md                filled example — delete before real use
│   ├── 01-[first-unit].md           foundation: design system, config, DB setup
│   ├── 02-[second-unit].md          build upward from foundation
│   └── NN-[name].md                 one file per feature unit, in build order
└── current-issues/
    ├── 00-template.md               blank current-issues template
    ├── 00-example.md                filled example — delete before real use
    └── current-issues-[area].md     one file per area, filed when bugs are found
```
