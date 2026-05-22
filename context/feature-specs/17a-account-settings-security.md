# 17a — Account Settings (Security & Deletion)

<!-- Read before starting: context/AGENTS.md, context/progress-tracker.md,
     context/architecture-context.md, context/tech-spec.md,
     context/code-standards.md, context/user-flows.md (Flow 9a, 9b, 9d) -->

Add a `/settings` page inside the customer dashboard with three self-contained sections: Change Email (with current-password verification and new-email confirmation), Change Password (current + new + confirm), and Delete Account (type-"DELETE" AlertDialog confirmation). All mutations go through new Server Actions in `app/actions/settings.ts`.

---

## Constraints

### Tokens (UI features only)

| Purpose | Token | Tailwind utility |
|---------|-------|-----------------|
| Page canvas | `var(--bg-base)` | `bg-[var(--bg-base)]` |
| Card surface | `var(--bg-surface)` | `bg-[var(--bg-surface)]` |
| Card border | `var(--border-default)` | `border-[var(--border-default)]` |
| Body text | `var(--text-primary)` | `text-[var(--text-primary)]` |
| Secondary text | `var(--text-secondary)` | `text-[var(--text-secondary)]` |
| Muted / placeholder | `var(--text-muted)` | `text-[var(--text-muted)]` |
| Input border focus | `var(--brand-primary)` | `focus:border-[var(--brand-primary)]` |
| Primary button background | `var(--brand-primary)` | `bg-[var(--brand-primary)]` |
| Button text on accent | `var(--text-on-accent)` | `text-[var(--text-on-accent)]` |
| Error text / border | `var(--status-error)` | `text-[var(--status-error)]` / `border-[var(--status-error)]` |
| Success text | `var(--status-success)` | `text-[var(--status-success)]` |
| Destructive action (delete) | `var(--status-error)` | `bg-[var(--status-error)]` |
| Divider | `var(--border-subtle)` | `border-[var(--border-subtle)]` |
| Card radius | `var(--radius-lg)` | `rounded-[length:var(--radius-lg)]` |
| Card shadow | `var(--shadow-md)` | `shadow-[var(--shadow-md)]` |
| Section spacing | `var(--space-8)` | `gap-[length:var(--space-8)]` |

Rules that always apply to UI work in this project:
- No raw Tailwind color classes (`zinc-*`, `slate-*`, `blue-*`). Tokens only.
- No hardcoded hex or rgb values.
- Mobile-first. Add breakpoint variants only where layout actually changes.
- Border radius from scale: `--radius-sm` / `md` / `lg` / `xl` / `2xl` / `full`.
- Shadows from scale: `--shadow-sm` / `md` / `lg` / `xl`.
- shadcn components when possible.

### Architecture

- **New file `app/actions/settings.ts`** — three Server Actions live here: `changeEmail`, `changePassword`, `deleteAccount`. Do NOT add these to `app/actions/auth.ts` — auth.ts handles unauthenticated flows; settings.ts handles authenticated account mutations.
- **DB queries** stay in `lib/db/queries.ts`. Any new query (e.g. looking up user email for password verification) goes there, not inline in the action.
- All three actions follow the invariant pattern: validate (Zod) → auth check (`getCurrentUser`) → act (Supabase) → return `ActionResult`.
- **Supabase auth mutations:**
  - Change email: `supabase.auth.updateUser({ email: newEmail })` — Supabase sends a verification email to the new address; old email stays active until confirmed.
  - Change password: verify current password via `supabase.auth.signInWithPassword` first, then `supabase.auth.updateUser({ password: newPassword })`.
  - Delete account: use the **admin Supabase client** (`createAdminClient` from `lib/supabase/admin.ts`) to call `supabase.auth.admin.deleteUser(userId)` — the `onDelete('cascade')` FK chain handles `public.users` automatically.
- **Route**: `app/[locale]/(dashboard)/settings/page.tsx` — Server Component (reads current user for display). All three form sections are Client Components that call Server Actions.
- **Components**: live in `components/dashboard/settings/` — one file per section: `ChangeEmailForm.tsx`, `ChangePasswordForm.tsx`, `DeleteAccountSection.tsx`.
- No API routes for this feature — all mutations are internal Server Actions.
- After successful `deleteAccount`, sign the user out and redirect to `/` (homepage). Use the admin client to delete; then call `supabase.auth.signOut()` on the regular client before redirecting.
- `revalidatePath` is NOT needed for delete (user no longer exists) or for email/password changes (no displayed data changes in the UI).

### TypeScript

- Strict mode. No `any`. No type assertions without an explanatory comment.
- Infer types from Zod schemas with `z.infer<typeof Schema>` — no duplicate type definitions.
- Use `interface` for props and DB model shapes; `type` for unions.
- Server Actions return `ActionResult` (from `lib/types.ts`) — `{ success: true }` or `{ success: false, error: string }` where `error` is an i18n key.

### Validation

```typescript
// lib/validations/settings.ts  (new file)

import { z } from 'zod'

// Re-use the same strong password rule as sign-up.
// Do not duplicate the regex — import strongPassword from lib/validations/auth.ts
// or extract it to a shared lib/validations/shared.ts constant.
// strongPassword: min 8 chars, one uppercase, one lowercase, one digit.

export const changeEmailSchema = z.object({
  newEmail: z.string().email(),
  currentPassword: z.string().min(1),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: strongPassword,           // same rule as signUpSchema
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'settings.changePassword.errors.passwordMismatch',
    path: ['confirmPassword'],
  })

// Delete requires the user to type the exact string "DELETE"
export const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE'),
})

export type ChangeEmailInput = z.infer<typeof changeEmailSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>
```

> **Note on `strongPassword`:** it is currently defined inline in `lib/validations/auth.ts`. Before writing `lib/validations/settings.ts`, extract it into a shared constant. Two options: (a) export it from `auth.ts` and import it in `settings.ts`, or (b) move it to a new `lib/validations/shared.ts`. Option (a) is the lower-effort path — prefer it unless (b) is clearly better at the time of writing.

### i18n

- All user-facing strings go in `messages/en.json` under the `settings` key.
- Use `getTranslations('settings')` in the Server Component page; `useTranslations('settings')` in Client Component forms.
- No hardcoded English strings in JSX.
- Add the same keys (untranslated) to `fr.json`, `es.json`, `de.json`.

**Required i18n key structure (`settings` namespace):**

```json
"settings": {
  "pageTitle": "Account Settings",

  "changeEmail": {
    "heading": "Change Email",
    "description": "A verification link will be sent to your new email address. Your current email stays active until you confirm the change.",
    "newEmailLabel": "New email address",
    "newEmailPlaceholder": "you@example.com",
    "currentPasswordLabel": "Current password",
    "currentPasswordPlaceholder": "Enter your current password",
    "submitButton": "Send verification link",
    "successMessage": "Verification link sent. Check your new inbox to confirm the change.",
    "errors": {
      "emailInUse": "This email is already registered to another account.",
      "incorrectPassword": "Incorrect password.",
      "generic": "Something went wrong. Please try again."
    }
  },

  "changePassword": {
    "heading": "Change Password",
    "description": "Choose a strong password with at least 8 characters, one uppercase letter, one lowercase letter, and one number.",
    "currentPasswordLabel": "Current password",
    "newPasswordLabel": "New password",
    "confirmPasswordLabel": "Confirm new password",
    "submitButton": "Update password",
    "successMessage": "Password updated successfully.",
    "errors": {
      "incorrectPassword": "Current password is incorrect.",
      "passwordMismatch": "Passwords don't match.",
      "weakPassword": "Password must be at least 8 characters with one uppercase letter, one lowercase letter, and one number.",
      "generic": "Something went wrong. Please try again."
    }
  },

  "deleteAccount": {
    "heading": "Delete Account",
    "description": "Permanently delete your account and all order history. Your NIF number remains valid with Finanças, but you will lose access to this dashboard.",
    "triggerButton": "Delete my account",
    "dialog": {
      "title": "Are you sure?",
      "body": "This action is permanent and cannot be undone. Type DELETE below to confirm.",
      "activeOrderWarning": "You have an active order. You will lose access to order status updates.",
      "fiscalRepWarning": "Your fiscal representation is active until {date}. Deleting your account will not cancel it. Contact support if you need to cancel.",
      "confirmationLabel": "Type DELETE to confirm",
      "confirmationPlaceholder": "DELETE",
      "cancelButton": "Cancel",
      "confirmButton": "Delete my account",
      "errors": {
        "generic": "Something went wrong. Please try again."
      }
    }
  }
}
```

---

## Design

The settings page is a single-column layout inside the existing dashboard shell (`DashboardHeader` is already rendered by the layout — do not add another header).

```
┌─────────────────────────────────────┐
│  Account Settings          (h1)      │
│  Manage your email, password, and   │
│  account preferences.    (p muted)   │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Change Email             (card) │ │
│ │ [description]                   │ │
│ │ New email ________________      │ │
│ │ Current password __________     │ │
│ │ [Send verification link] btn    │ │
│ │ ✓ Verification link sent.       │ │  ← success state (inline, under button)
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Change Password          (card) │ │
│ │ [description]                   │ │
│ │ Current password ___________    │ │
│ │ New password _______________    │ │
│ │ Confirm new password _______    │ │
│ │ [Update password] btn           │ │
│ │ ✓ Password updated successfully.│ │  ← success state
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Delete Account           (card) │ │
│ │ [description]                   │ │
│ │ [Delete my account] btn ← destructive (error token bg)
│ └─────────────────────────────────┘ │
│                                     │
│  ← AlertDialog opens on click ──→   │
│ ┌─────────────────────────────────┐ │
│ │ Are you sure?            (title)│ │
│ │ This action is permanent...     │ │
│ │ [active order warning if any]   │ │
│ │ [fiscal rep warning if any]     │ │
│ │                                 │ │
│ │ Type DELETE to confirm:         │ │
│ │ ________________________        │ │
│ │                                 │ │
│ │ [Cancel]    [Delete my account] │ │
│ │              ← disabled until   │ │
│ │                input === DELETE  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Rules:**
- All three sections are separate cards: `bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[length:var(--radius-lg)] p-[length:var(--space-6)] shadow-[var(--shadow-md)]`.
- Max content width: `max-w-xl` — settings forms should not sprawl wide on desktop.
- Success messages appear inline directly below the submit button. Use `text-[var(--status-success)]` with a `CheckCircle` icon (Lucide, `h-4 w-4`). No toast — these are quiet confirmations.
- Error messages use shadcn `FormMessage` (field-level) and an inline `<p>` for action-level errors (wrong current password, email in use).
- The "Delete my account" trigger button uses destructive styling: `bg-[var(--status-error)] text-[var(--text-on-accent)]`.
- Inside the AlertDialog, the "Delete my account" confirm button stays visually disabled (`opacity-50 cursor-not-allowed`) and non-interactive until the typed input matches `"DELETE"` exactly. Use controlled `useState` on the input — do NOT use form submission for this; it's a single string comparison.
- The Delete Account card has a top border in `var(--status-error)` at 2px to signal the destructive nature of this section visually.
- No animations needed — this is a functional settings page, not a marketing surface.

---

## Implementation

### 1. Extract `strongPassword` from `lib/validations/auth.ts`

Export the `strongPassword` constant from `auth.ts` so `settings.ts` can import it without duplicating the regex.

```typescript
// lib/validations/auth.ts
export const strongPassword = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
```

Update `signUpSchema` and `updatePasswordSchema` in `auth.ts` to import `strongPassword` locally (it's already defined in the same file — just add `export` to the existing const).

---

### 2. Create `lib/validations/settings.ts`

New file. Contains `changeEmailSchema`, `changePasswordSchema`, `deleteAccountSchema`, and their inferred types. Import `strongPassword` from `./auth`.

---

### 3. Create `app/actions/settings.ts`

New `'use server'` file. Three exported actions:

#### `changeEmail(input: unknown): Promise<ActionResult>`

Flow:
1. `changeEmailSchema.safeParse(input)` → return generic error on failure.
2. `getCurrentUser()` → return `{ success: false, error: 'settings.changeEmail.errors.generic' }` if null.
3. Verify current password: call `supabase.auth.signInWithPassword({ email: user.email, password: currentPassword })`. If error → return `{ success: false, error: 'settings.changeEmail.errors.incorrectPassword' }`.
4. Call `supabase.auth.updateUser({ email: newEmail })`. If error message includes `already registered` or `unique` → return `{ success: false, error: 'settings.changeEmail.errors.emailInUse' }`. Any other error → generic.
5. Return `{ success: true }`.

> Note: `supabase.auth.updateUser` sends a verification email to the new address automatically. No manual email send needed. The old email stays active until confirmed — this is Supabase's built-in behavior. No DB write to `public.users` is needed here; Supabase Auth handles the email field.

#### `changePassword(input: unknown): Promise<ActionResult>`

Flow:
1. `changePasswordSchema.safeParse(input)` → return `passwordMismatch` key if refine fails, `generic` for other parse errors.
2. `getCurrentUser()` → generic error if null.
3. Verify current password: `supabase.auth.signInWithPassword({ email: user.email, password: currentPassword })`. If error → return `{ success: false, error: 'settings.changePassword.errors.incorrectPassword' }`.
4. `supabase.auth.updateUser({ password: newPassword })`. Any error → generic.
5. Return `{ success: true }`.

#### `deleteAccount(): Promise<ActionResult>`

Flow:
1. `getCurrentUser()` → generic error if null.
2. Use `createAdminClient()` from `lib/supabase/admin.ts` to call `adminSupabase.auth.admin.deleteUser(user.id)`. The cascade on `public.users` handles FK cleanup automatically.
3. If error → return `{ success: false, error: 'settings.deleteAccount.dialog.errors.generic' }`.
4. Sign out the regular client: `supabase.auth.signOut()`.
5. Return `{ success: true }`.

> **Note:** The component handles the redirect to `/` after receiving `{ success: true }` from `deleteAccount`. The action itself does not call `redirect()` — returning success lets the client component control navigation.

> **Note:** `deleteAccount` does not take `input` — the "DELETE" confirmation string is validated client-side only (controlling the button's disabled state). No Zod schema is needed for this action.

---

### 4. Add i18n keys

Add the full `settings` namespace defined in the **i18n** section above to:
- `messages/en.json`
- `messages/fr.json`
- `messages/es.json`
- `messages/de.json`

For `fr`, `es`, `de` — add the keys with the same English values for now. Translation will follow during the localization pass.

---

### 5. Create `components/dashboard/settings/ChangeEmailForm.tsx`

`'use client'` component. Uses `react-hook-form` with `zodResolver(changeEmailSchema)` and shadcn `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`.

State:
- `pending` (from `useTransition`) — disables the submit button and shows a spinner during the action call.
- `actionError: string | null` — stores the i18n key for action-level errors (display as a translated `<p>` above the submit button).
- `success: boolean` — shows the success message inline after submit.

On submit:
1. Call `changeEmail(values)` inside `startTransition`.
2. If `result.success` → set `success = true`, reset the form.
3. If `!result.success` → map `result.error` to the appropriate field error or set `actionError`.

Map action error keys to UI:
- `settings.changeEmail.errors.incorrectPassword` → `setError('currentPassword', ...)` (field-level)
- `settings.changeEmail.errors.emailInUse` → `setError('newEmail', ...)` (field-level)
- `settings.changeEmail.errors.generic` → `actionError` (action-level)

---

### 6. Create `components/dashboard/settings/ChangePasswordForm.tsx`

Same pattern as `ChangeEmailForm`. Uses `changePasswordSchema`.

Map action error keys to UI:
- `settings.changePassword.errors.incorrectPassword` → `setError('currentPassword', ...)`
- `settings.changePassword.errors.passwordMismatch` → `setError('confirmPassword', ...)` (should never reach server — Zod refine catches it client-side first)
- `settings.changePassword.errors.generic` → `actionError`

On success: reset the form, show inline success message.

---

### 7. Create `components/dashboard/settings/DeleteAccountSection.tsx`

`'use client'` component. Uses shadcn `AlertDialog` (`AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogCancel`, `AlertDialogAction`).

State:
- `confirmationInput: string` — controlled input inside the dialog.
- `pending: boolean` — from `useTransition`.
- `actionError: string | null`

**Props:**
```typescript
interface DeleteAccountSectionProps {
  hasActiveOrder: boolean
  fiscalRepExpiresAt: Date | null  // only relevant for Standard/Express orders
}
```

Behavior:
- Trigger button: destructive styling, `useTranslations('settings').deleteAccount.triggerButton`.
- Dialog body shows:
  - Active order warning (if `hasActiveOrder === true`)
  - Fiscal rep warning (if `fiscalRepExpiresAt` is not null and is in the future) — formatted date via `formatDate` utility.
  - Controlled `<Input>` for typing "DELETE". Reset to `""` when dialog closes.
- "Delete my account" confirm button: disabled when `confirmationInput !== 'DELETE'` OR `pending === true`. Apply `opacity-50 cursor-not-allowed` when disabled.
- On confirm click: call `deleteAccount()` inside `startTransition`. On `{ success: true }` → use `useRouter()` from `@/i18n/navigation` to `router.push('/')`.
- On `{ success: false }` → show `actionError` inside the dialog.

---

### 8. Create `app/[locale]/(dashboard)/settings/page.tsx`

Server Component. 

```typescript
// Fetches: current user order (for active order flag + fiscal rep expiry)
// Renders the page heading and the three section components
```

Data fetching:
- `const user = await getCurrentUser()` (already cached — no extra DB round-trip).
- `const order = await getUserActiveOrder(user.id)` — this query already exists (used by the dashboard page). Returns the active order or null.

Pass to `DeleteAccountSection`:
- `hasActiveOrder`: `order !== null && order.status !== 'delivered'`
- `fiscalRepExpiresAt`: `order?.fiscalRepExpiresAt ?? null`

Layout:
```tsx
<div className="max-w-xl mx-auto px-[length:var(--space-6)] py-[length:var(--space-12)]">
  <h1>{t('pageTitle')}</h1>
  <div className="flex flex-col gap-[length:var(--space-8)]">
    <ChangeEmailForm />
    <ChangePasswordForm />
    <DeleteAccountSection hasActiveOrder={...} fiscalRepExpiresAt={...} />
  </div>
</div>
```

---

### 9. Create `app/[locale]/(dashboard)/settings/loading.tsx`

Skeleton screen matching the three-card layout: three skeleton cards stacked vertically, each with placeholder lines for heading, description, and form fields. Use shadcn `Skeleton`.

---

### 10. Add "Account Settings" link to `DashboardHeader`

`DashboardHeader` is at `components/dashboard/DashboardHeader.tsx`. Add a link to `/settings` using `Link` from `@/i18n/navigation`. Use the i18n key `nav.accountSettings` — this key was already added in Feature 14c. Verify it exists before adding; if missing, add it to all 4 locale files now.

---

## Dependencies

No new packages required. All shadcn components used (`AlertDialog`, `Form`, `Input`, `Button`, `Skeleton`) are already installed.

---

## Scope Limits

- **No language preference setting** — that is Feature 17b. Do not add a language section to this page.
- **No renewal banner or fiscal rep UI** — the `fiscalRepExpiresAt` value is only used to surface a warning inside the delete-account dialog. No other fiscal rep UI belongs here.
- **No shared form hook** — the feature list notes mention evaluating a shared hook. Do not introduce one here. Three forms is not enough structural repetition to justify the abstraction cost. If a shared hook is needed, it belongs in a separate refactor task after Feature 19.
- **No email template** — the email-change verification email is sent automatically by Supabase. Do not add a custom Resend template for this.
- **No admin-side delete flow** — admins do not delete customer accounts through this UI. Admin account management is out of scope.
- **No `/account` route alias** — use `/settings` only. Do not create a redirect from `/account`.
- **Do not modify `app/actions/auth.ts`** — except the single `export` keyword addition to `strongPassword`.
- **Do not modify `components/ui/*`** — shadcn source is off-limits.

---

## Check When Done

- `app/[locale]/(dashboard)/settings/page.tsx` exists and renders without errors.
- `app/[locale]/(dashboard)/settings/loading.tsx` exists and shows a skeleton layout.
- `app/actions/settings.ts` exports `changeEmail`, `changePassword`, and `deleteAccount`.
- `lib/validations/settings.ts` exports all three schemas and their inferred types.
- `strongPassword` is exported from `lib/validations/auth.ts` and imported (not duplicated) in `settings.ts`.
- **Change Email flow**: submitting a valid new email + correct current password returns `{ success: true }` and shows the inline success message. Wrong current password shows a field-level error on the password input. Already-used email shows a field-level error on the email input.
- **Change Password flow**: submitting correct current password + matching new password updates the password and shows inline success. Wrong current password shows a field-level error. Mismatched confirm shows a field-level error. Weak new password is caught by Zod before submission.
- **Delete Account flow**: the "Delete my account" confirm button inside the AlertDialog is disabled until the user types `DELETE` exactly. Confirming calls `deleteAccount()`, which deletes the user from `auth.users` and redirects to the homepage. Session is cleared.
- Active order warning appears inside the delete dialog when the order status is not `delivered`.
- Fiscal rep warning (with formatted expiry date) appears inside the delete dialog when `fiscalRepExpiresAt` is a future date.
- All user-facing strings are i18n keys — no hardcoded English text in JSX.
- `settings` namespace exists in all four locale files (`en.json`, `fr.json`, `es.json`, `de.json`) with the full key structure defined above.
- `DashboardHeader` includes a working link to `/settings`.
- `npm run build` passes.
