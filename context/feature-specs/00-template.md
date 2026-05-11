# [NN] — [Feature Unit Name]

<!-- Naming convention: NN is a zero-padded number that defines the build order.
     The number IS the dependency chain — lower numbers must be complete before higher ones start.
     Name the file after the responsibility, not the technology.
     Examples: 03-auth.md, 11-base-canvas.md, 22-design-agent-api.md -->

<!-- Opening line (required): tell the AI which context files to read before starting.
     Only list the files actually relevant to this unit.
     Always include AGENTS.md and progress-tracker.md. Add others only as needed. -->

Read `context/AGENTS.md`, `context/progress-tracker.md` before starting.

<!-- One-sentence summary (required): what this unit does, in plain language.
     Write it as a statement of outcome, not a list of tasks.
     Example: "Replace the canvas placeholder with a Liveblocks-backed React Flow canvas." -->

[One sentence describing what this unit does and why it exists at this point in the build.]

---

## Constraints

<!-- Required. This is the safety net — the distilled rules from the context docs that apply to THIS unit.
     The agent must not go back to code-standards.md or ui-context.md during implementation.
     Everything it needs to follow the project rules for this feature lives here.

     Fill in each sub-section. Delete a sub-section only if it is genuinely not applicable
     (e.g. a non-UI feature has no tokens section). Do not leave sections empty "just in case". -->

### Tokens (UI features only)
<!-- List every design token this feature uses. Copy exact values from ui-context.md / globals.css.
     If the agent doesn't see the token here, it will invent one. -->

| Purpose | Token | Tailwind utility |
|---------|-------|-----------------|
| [e.g. Primary button background] | `var(--brand-primary)` | `bg-brand-primary` |
| [e.g. Body text] | `var(--text-primary)` | `text-primary` |

Rules that always apply to UI work in this project:
- No raw Tailwind color classes (`zinc-*`, `slate-*`, `blue-*`). Tokens only.
- No hardcoded hex or rgb values.
- Mobile-first. Add breakpoint variants only where layout actually changes.
- Border radius from scale: `--radius-sm` / `md` / `lg` / `xl` / `2xl` / `full`.
- Shadows from scale: `--shadow-sm` / `md` / `lg` / `xl`.

### Architecture
<!-- Copy the exact patterns and boundaries that apply to this feature.
     Name the files where things go. The agent should not have to guess. -->

- [e.g. Server Action goes in `app/actions/orders.ts` — thin, validate → auth → act → return]
- [e.g. DB queries go in `lib/db/queries.ts`, not inline in the action]
- [e.g. This is a Server Component — no `"use client"` unless X is needed]
- [e.g. API route only if this is a webhook — internal mutations use Server Actions]

### TypeScript
<!-- List the type rules that apply. Always include the first two. Add others if relevant. -->

- Strict mode. No `any`. No type assertions without a comment explaining why.
- Infer types from Zod schemas with `z.infer<typeof Schema>` — no duplicate type definitions.
- [e.g. Use `interface` for props and DB model shapes. Use `type` for unions.]

### Validation
<!-- Define the Zod schema shape for this feature, or reference the file where it lives.
     If there's a form or API input, write the schema here so the agent doesn't invent fields. -->

```typescript
// [Where this schema lives, e.g. lib/validations/orders.ts]
const [FeatureName]Schema = z.object({
  // [list the fields]
})
```

### i18n
<!-- Only include if this feature has user-facing text. -->

- All user-facing strings go in `messages/en.json` under the `[featureName]` key.
- Use `useTranslations('[featureName]')` in the component.
- No hardcoded English strings in JSX.
- Add the same keys (untranslated for now) to `fr.json`, `es.json`, `de.json`.

---

## Design

<!-- Include this section only if this unit involves UI work where visual decisions need to be made.
     If the design is fully defined in ui-context.md, reference it and skip this section.
     If there are layout or visual decisions specific to this feature, define them here.
     
     Be precise: layouts, breakpoints, what not to include (no gradients, no scroll-heavy layouts, etc.).
     The AI will interpret silence as permission — if you don't want something, say so explicitly. -->

[Describe the visual and layout decisions for this unit. Remove section if no UI work.]

---

## Implementation

<!-- Numbered steps. Each step is one discrete action: create a file, add a route, wire a provider, etc.
     Order matters — steps are executed sequentially.
     Be specific: name the file, name the route, name the function, name the field.
     Do not describe HOW to implement (the AI knows); describe WHAT to create and WHAT it should do. -->

1. [First discrete action — be specific about file path, route, or function name]

2. [Second action]

   <!-- Nest sub-steps when a single action has multiple parts that belong together -->
   - [sub-step]
   - [sub-step]

3. [Third action]

4. [Continue as needed]

---

## Dependencies

<!-- Include this section only if this unit requires installing new packages.
     List the exact package names. No version pinning unless a specific version is required.
     Do not list packages already in the project. -->

Install: `package-name`, `other-package`

---

## Scope Limits

<!-- Required. This is the most important section for preventing scope creep.
     List everything that is NOT part of this unit — even things that seem obviously related.
     Each item: what is excluded + optionally when it will be added.
     
     The AI will build adjacent things unless told not to. Be explicit.
     Examples:
     - "don't add AI logic yet — that's covered in [NN]-[name].md"
     - "don't add persistence — keep this focused on the UI shell only"
     - "don't customize Clerk internals — use default flows" -->

- [What is explicitly excluded from this unit]
- [What is explicitly excluded from this unit]
- Keep this focused on [the narrow responsibility of this unit].

---

## Check When Done

<!-- Required. Verifiable conditions that define "done" for this unit.
     Each item must be checkable — not "it feels right" but "this file exists", "this route returns X", "build passes".
     Always end with: `npm run build` passes.
     The agent uses this list to self-verify before marking the unit complete. -->

- [Specific, verifiable condition]
- [Specific, verifiable condition]
- [Specific, verifiable condition]
- `npm run build` passes.
