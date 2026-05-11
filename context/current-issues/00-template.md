# Current Issues — [Area Name]

<!-- Naming convention: current-issues-[area].md
     Area = the part of the codebase this file covers. One file per area.
     Examples: current-issues-canvas.md, current-issues-auth.md, current-issues-api.md
     
     Purpose: fix broken behavior without introducing new breakage.
     This is not a feature spec — do not add new features here.
     Every issue must be verifiable. Every fix must be scoped. -->

<!-- Opening line (required): which files or components to review before starting.
     Reference screenshots if the issue is visual. -->

Review `[component or directory]` before starting. Do not break existing features.

<!-- Optional: reference a screenshot if the issue is visual -->
<!-- Check `context/screenshots/[filename]` for the current broken state. -->

---

## Issues

### [N]. [Issue Title — short, describes the broken behavior]

<!-- "Read X before implementing" — tell the AI exactly which files to read first.
     Only list files directly relevant to this fix. -->

Read `[file or component path]` before implementing.

<!-- Problem description: what is broken, what the correct behavior should be.
     Be concrete — describe what the user sees, not what you think the cause is.
     One paragraph is usually enough. -->

[Describe the broken behavior. What is happening. What should happen instead.]

<!-- Fix instructions: specific steps to implement the fix.
     Same rules as feature specs: name the file, route, function, field.
     Tell the AI what to create or change, not how to think about it internally. -->

[Specific instruction on what to change or add.]

[Another instruction if needed.]

<!-- Explicit constraint (required per issue): what must not be changed.
     This is the collateral damage prevention line. Be specific. -->

Do not change anything else.

---

### [N]. [Issue Title]

Read `[file or component path]` before implementing.

[Describe the broken behavior and the correct expected behavior.]

[Fix instructions — be specific about file paths, function names, and what changes.]

Do not change anything else.

---

### [N]. [Issue Title]

<!-- For purely visual bugs, describe what it looks like vs. what it should look like.
     List the likely causes to check — the AI investigates and fixes. -->

[Description of visual bug — what it looks like, what it should look like.]

Investigate and fix the following potential causes:

- [Possible cause to check and fix]
- [Possible cause to check and fix]
- [Possible cause to check and fix]

Do not change anything else.

---

## Scope

<!-- Global constraints that apply to the entire file.
     List exactly what this file covers, what must be protected, and the build requirement.
     This section is non-negotiable. -->

- Fix only what is listed above.
- Do not add new features or refactor unrelated code.
- Do not modify [protected area — e.g. "the editor home layout", "existing autosave logic"].
- Do not modify [another protected area].
- `npm run build` passes.
