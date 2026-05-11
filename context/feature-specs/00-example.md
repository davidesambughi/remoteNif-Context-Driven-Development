# [NN] — Example: User Authentication

<!-- This file is a filled example of 00-template.md.
     It shows how a real feature spec looks when complete.
     Delete this file before using the template in a real project. -->

Read `AGENTS.md`, `context/architecture-context.md`, `context/ui-context.md` before starting.

Wire authentication into the app: provider setup, sign-in and sign-up pages, route protection, and user menu.

---

## Design

Sign-in and sign-up pages:

- Large screens: two-panel layout — left panel has logo, tagline, and short feature list; right panel has the centered auth form.
- Small screens: form only, no left panel.
- No gradients, no hero sections, no feature cards, no scroll-heavy layouts.
- Use CSS variable tokens from `ui-context.md` throughout — no hardcoded colors.

---

## Implementation

1. Wrap the root layout with the auth provider using the app's dark theme.

2. Create sign-in and sign-up pages at `/sign-in` and `/sign-up`.

   - Use the provider's prebuilt form components.
   - Apply the two-panel layout on large screens, form-only on small screens.
   - Override provider appearance variables using the app's existing CSS variables.

3. Add route protection.

   - Public routes: `/sign-in`, `/sign-up`.
   - All other routes are protected by default.
   - Authenticated users visiting `/` redirect to `/dashboard`.
   - Unauthenticated users visiting any protected route redirect to `/sign-in`.

4. Add a user menu to the app navbar.

   - Place it in the right section of the navbar.
   - Use the provider's built-in user button component.
   - Do not rebuild or customize the profile flow — use the default.

5. Use existing auth environment variables. Do not rename or add new ones.

---

## Dependencies

Install: `@auth-provider/nextjs`

---

## Scope Limits

- Don't build any role-based access control — auth is owner-only at this stage.
- Don't customize the provider's internal profile or account settings pages.
- Don't add organization or team features.
- Don't build a custom user profile page — use the provider's default.
- Keep this focused on authentication wiring only.

---

## Check When Done

- Auth provider wraps the root layout.
- Sign-in and sign-up pages exist and render without errors.
- All routes except `/sign-in` and `/sign-up` are protected.
- Unauthenticated users are redirected to `/sign-in`.
- Authenticated users visiting `/` are redirected to `/dashboard`.
- Auth pages use CSS variable tokens — no hardcoded colors.
- User menu appears in the navbar.
- `npm run build` passes.
