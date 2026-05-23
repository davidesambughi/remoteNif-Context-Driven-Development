# 19a — Auth UI Polish

Read `context/AGENTS.md`, `context/ui-context.md`, `context/code-standards.md`, `context/progress-tracker.md` before starting.

Fix four UX defects in the auth forms: dead submit buttons with no feedback, missing password visibility toggles, a skeleton flash on fast connections, and a misleading confirmation copy that promises an email that may never have been sent.

---

## Constraints

### Tokens (UI features only)

| Purpose | Token | Tailwind utility |
|---------|-------|-----------------|
| Submit button background | `var(--brand-primary)` | `bg-brand-primary` |
| Submit button text | `var(--text-on-accent)` | `text-on-accent` |
| Input border (default) | `var(--border-default)` | `border-border-default` |
| Input border (focus) | `var(--brand-primary)` | `focus:border-brand-primary` |
| Password toggle icon (default) | `var(--text-muted)` | `text-text-muted` |
| Password toggle icon (hover) | `var(--text-secondary)` | `hover:text-text-secondary` |
| Error text | `var(--status-error)` | `text-error` |
| Label text | `var(--text-secondary)` | `text-text-secondary` |

Rules that always apply to UI work in this project:
- No raw Tailwind color classes (`zinc-*`, `slate-*`, `blue-*`). Tokens only.
- No hardcoded hex or rgb values.
- Mobile-first. Add breakpoint variants only where layout actually changes.
- Border radius from scale: `--radius-sm` / `md` / `lg` / `xl` / `2xl` / `full`.
- Shadcn components when possible.

### Architecture

- These are all `'use client'` form components — `useState` and `form.formState.isSubmitting` are already available. No new hooks or providers needed.
- `PasswordInput` is a thin wrapper component — place it in `components/auth/PasswordInput.tsx`, NOT in `components/ui/` (that folder is shadcn-only).
- No Server Actions are modified. No database queries. No API routes. UI and copy only.
- `loading.tsx` files are plain Next.js route files — deleting them stops the skeleton from rendering. No other changes needed to enable or disable skeleton behaviour.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- `PasswordInput` accepts the same props as shadcn `Input` (spread via `React.ComponentProps<typeof Input>`) — no separate interface needed beyond omitting `type`.
- No duplicate type definitions.

### Validation

No new Zod schemas. This feature touches copy and UI only.

### i18n

- All new loading label strings go in `messages/en.json` under the existing `auth.*` namespaces — no new top-level namespace.
- The same keys (same English string, untranslated for now) must be added to `fr.json`, `es.json`, `de.json`.
- The `emailConfirmationRequired` key already exists — update its value only, do not rename the key.
- No hardcoded English strings in JSX.

---

## Design

### Password visibility toggle

Each password `<Input>` is replaced by a `<PasswordInput>` component that renders:
- A `div` with `className="relative"` as the outer wrapper.
- A shadcn `<Input>` with `type={visible ? 'text' : 'password'}` and `pr-10` to leave room for the icon.
- A `<button type="button">` (never `type="submit"`) absolutely positioned on the right. Renders `Eye` when hidden, `EyeOff` when visible. Both are 16px (`h-4 w-4`). The button itself has no background, no border — icon-only with an `aria-label`.
- One `useState<boolean>(false)` per field — each field's visibility is independent.

The toggle does not affect the surrounding `FormItem`, `FormLabel`, or `FormMessage` — those are unchanged.

### Submit button loading state

When `form.formState.isSubmitting` is true, the button renders a `Loader2` icon (`animate-spin h-4 w-4`) to the left of a loading label string. The button stays full-width and remains `disabled`. No layout shift — the icon + text replace the static label in place.

```tsx
// Pattern — apply to all five forms
<Button
  type="submit"
  disabled={form.formState.isSubmitting}
  className="w-full mt-[length:var(--space-6)] bg-brand-primary text-on-accent font-[number:var(--font-semibold)]"
>
  {form.formState.isSubmitting ? (
    <>
      <Loader2 className="animate-spin h-4 w-4" />
      {t('submitting')}
    </>
  ) : (
    t('submit')
  )}
</Button>
```

---

## Implementation

1. **Create `components/auth/PasswordInput.tsx`** — a reusable password input with a visibility toggle.

   - Accept `React.ComponentProps<typeof Input>` minus `type` (the component owns `type` internally).
   - Manage `showPassword` state with `useState(false)`.
   - Render: `<div className="relative">`, then `<Input type={showPassword ? 'text' : 'password'} className={cn('pr-10', className)} {...rest} />`, then a `<button type="button">` with `Eye`/`EyeOff` icon and `aria-label` of "Show password" / "Hide password".
   - Import `Eye`, `EyeOff` from `lucide-react`. Import `cn` from `@/lib/utils`.

2. **Update `components/auth/SignInForm.tsx`**:

   - Import `Loader2` from `lucide-react` and `PasswordInput` from `./PasswordInput`.
   - Replace the `<Input type="password" ...>` in the password field's `<FormControl>` with `<PasswordInput autoComplete="current-password" className="..." {...field} />`.
   - Update the submit `<Button>` to conditionally render spinner + `{t('submitting')}` when `form.formState.isSubmitting`, otherwise `{t('submit')}`.

3. **Update `components/auth/SignUpForm.tsx`**:

   - Same imports as step 2.
   - Replace the password `<Input type="password" ...>` with `<PasswordInput autoComplete="new-password" className="..." {...field} />`.
   - Update the submit `<Button>` to render spinner + `{t('submitting')}` when submitting.

4. **Update `components/auth/InternalSignInForm.tsx`**:

   - Same imports as step 2.
   - Replace the password `<Input type="password" ...>` with `<PasswordInput autoComplete="current-password" className="..." {...field} />`.
   - Update the submit `<Button>` to render spinner + `{t('submitting')}` when submitting. This form uses `useTranslations('auth.signIn')`, so the key is `auth.signIn.submitting`.

5. **Update `components/auth/RequestPasswordResetForm.tsx`**:

   - Import `Loader2` from `lucide-react` (no password field on this form — no `PasswordInput` needed).
   - Update the submit `<Button>` to render spinner + `{t('submitting')}` when submitting.

6. **Update `components/auth/NewPasswordForm.tsx`**:

   - Import `Loader2` and `PasswordInput`.
   - Replace BOTH password `<Input type="password" ...>` fields (password and confirmPassword) with `<PasswordInput>`. Each gets its own independent visibility toggle (this is handled automatically by `PasswordInput` since each instance has its own `useState`).
   - Update the submit `<Button>` to render spinner + `{t('submitting')}` when submitting.

7. **Add i18n keys — `messages/en.json`**:

   Add `"submitting"` under each relevant auth namespace:

   ```json
   "auth": {
     "signIn": {
       "submitting": "Signing in…",
       ...
     },
     "signUp": {
       "submitting": "Creating account…",
       "errors": {
         "emailConfirmationRequired": "Check your email — if you signed up with this address, we've sent a confirmation link."
       },
       ...
     },
     "resetPassword": {
       "request": {
         "submitting": "Sending…"
       },
       ...
     },
     "newPassword": {
       "submitting": "Updating password…",
       ...
     }
   }
   ```

   **Note on `emailConfirmationRequired`**: Change the value only — do NOT rename the key. The old value "Email confirmation is required. Please check your inbox." promises an email was sent; the new value must not promise delivery. Use: `"Check your email — if you signed up with this address, we've sent a confirmation link."`

   **Note on `InternalSignInForm`**: It reads from `auth.signIn` namespace — `auth.signIn.submitting` covers admin and operator signin too. No separate key needed.

8. **Propagate i18n keys to `fr.json`, `es.json`, `de.json`**:

   Add the same keys with the **same English strings** as placeholders — do not translate them. Mark them with a comment if the format supports it, otherwise just copy the English value.

9. **Delete `app/[locale]/(auth)/signin/loading.tsx`**.

10. **Delete `app/[locale]/(auth)/signup/loading.tsx`**.

---

## Dependencies

No new packages. `lucide-react` is already installed (used throughout the project). `cn` from `@/lib/utils` is already available.

---

## Scope Limits

- Do NOT add password visibility toggles to the settings page (`ChangePasswordForm`) — that form is not listed in the feature spec for this unit. Defer to a future pass if needed.
- Do NOT add `loading.tsx` to other auth routes (`reset-password`, `new-password`) — they never had one and are fast enough that none is needed.
- Do NOT change any Server Actions — no logic changes, no error key renames.
- Do NOT change the `emailConfirmationRequired` key name — only its string value.
- Do NOT modify anything in `components/ui/` — shadcn source files are off-limits.
- Do NOT add Google OAuth or any new auth provider — that is Feature 23.
- Keep this focused on the four UX defects: loading states, password toggle, skeleton flash removal, and misleading confirmation copy.

---

## Check When Done

- `PasswordInput` component exists at `components/auth/PasswordInput.tsx` and renders correctly in all five auth forms.
- Clicking the eye icon on any password field reveals the typed characters; clicking again hides them.
- Submitting any auth form shows the spinner icon and loading label ("Signing in…", "Creating account…", etc.) on the button for the duration of the server action.
- The submit button is disabled and non-interactive while the loading state is active.
- Navigating to `/en/signin` and `/en/signup` on a fast connection shows NO skeleton flash — the page renders directly.
- The `emailConfirmationRequired` error in the signup form no longer says "Please check your inbox" — it uses the new non-promissory copy.
- `messages/en.json`, `fr.json`, `es.json`, `de.json` all contain the new `submitting` keys and the updated `emailConfirmationRequired` value.
- No hardcoded English strings remain in any modified component.
- `npm run build` passes.
- `npx vitest run` passes (423 tests — this feature adds no new tests since it is UI-only with no business logic).
