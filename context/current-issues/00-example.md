# Current Issues — Navbar

<!-- This is a filled example of 00-template.md.
     Delete this file before using the template in a real project. -->

Review `components/navbar` before starting. Do not break existing features.

---

## Issues

### 1. Save Button Missing in Workspace Navbar

Read the navbar component and the autosave hook before implementing.

The workspace navbar is missing a Save button. The autosave hook already exists and tracks saving, saved, and error states — wire a button to it.

Add the Save button to the workspace navbar only. The navbar is shared with the home screen, so conditionally render the button based on workspace context — it must not appear on the home navbar.

Button behavior:
- Default state: shows "Save"
- While saving: shows "Saving..."
- After successful save: shows "Saved" briefly then returns to "Save"
- On error: shows "Error" briefly then returns to "Save"
- Clicking it triggers a manual save through the same function the autosave hook uses

Do not change anything else.

---

### 2. UserButton Appears in Wrong Context

Read the navbar component before implementing.

The UserButton is rendering in the workspace navbar. It should only appear on the home navbar. The navbar is shared, so conditionally render the UserButton based on whether the component is in the workspace context or the home context.

Do not change anything else.

---

### 3. Active Nav Link Styling Not Applied

Read `components/navbar` and the current routing setup before implementing.

The active navigation link has no visual distinction from inactive links. The active state should apply the brand accent color to the link text and an underline or background indicator. Check whether the active class is being applied correctly based on the current route, and whether the CSS for the active state is defined in the token system.

Investigate and fix the following potential causes:

- Active class not being applied to the correct element
- Token-based active styles missing or overridden by base styles
- Router-based active detection not matching the current path

Do not change anything else.

---

## Scope

- Fix only what is listed above.
- Do not add new features or refactor unrelated code.
- Do not modify the editor canvas or any canvas-related components.
- Do not modify the autosave hook logic — only wire it to the button.
- `npm run build` passes.
