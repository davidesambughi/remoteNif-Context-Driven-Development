# 17b — Account Settings (Language Preference)

<!-- Read before starting: context/AGENTS.md, context/progress-tracker.md,
     context/architecture-context.md, context/tech-spec.md,
     context/code-standards.md, context/user-flows.md (Flow 9c) -->

Add a Language Preference card to the existing `/settings` page (below Delete Account) so authenticated users can change their stored locale, with the page reloading immediately in the selected language.

---

## Constraints

### Tokens (UI features only)

Tokens actually written in className props for this component. Tokens provided by shadcn internals (card bg, padding, radius, button bg/text, input focus ring) are NOT listed — don't add them manually.

| Purpose | Token | Tailwind utility |
|---------|-------|-----------------|
| Card border | `var(--border-default)` | `border-[var(--border-default)]` |
| Card shadow | `var(--shadow-md)` | `shadow-[var(--shadow-md)]` |
| Label / heading text | `var(--text-primary)` | `text-[var(--text-primary)]` |
| Description text | `var(--text-secondary)` | `text-[var(--text-secondary)]` |
| Success message text | `var(--status-success)` | `text-[var(--status-success)]` |
| Error message text | `var(--status-error)` | `text-[var(--status-error)]` |
| Message text size | `var(--text-sm)` | `text-[length:var(--text-sm)]` |
| Card title size | `var(--text-xl)` | `text-[length:var(--text-xl)]` |
| Card title weight | `var(--font-semibold)` | `font-[number:var(--font-semibold)]` |
| Section spacing (page stack) | `var(--space-8)` | `gap-[length:var(--space-8)]` |
| Skeleton card surface | `var(--bg-surface)` | `bg-[var(--bg-surface)]` |
| Skeleton card radius | `var(--radius-lg)` | `rounded-[length:var(--radius-lg)]` |
| Skeleton card padding | `var(--space-6)` | `p-[length:var(--space-6)]` |

Rules that always apply to UI work in this project:
- No raw Tailwind color classes (`zinc-*`, `slate-*`, `blue-*`). Tokens only.
- No hardcoded hex or rgb values.
- Mobile-first. Add breakpoint variants only where layout actually changes.
- Border radius from scale: `--radius-sm` / `md` / `lg` / `xl` / `2xl` / `full`.
- Shadows from scale: `--shadow-sm` / `md` / `lg` / `xl`.
- shadcn components when possible.

**⚠️ Dangerous shorthands — NEVER use these:**
These look valid but resolve to wrong colors via the shadcn variable mapping in `@theme inline`:
- `text-primary` → resolves to **brand blue** (not text color)
- `text-secondary` → resolves to **bg-subtle blue-100** (not text color)
- `text-muted` → resolves to **bg-subtle blue-100** (not text color)
- `bg-base` → `--color-base` is intentionally absent (would collide with `text-base` font-size utility)
Always use `text-[var(--text-primary)]`, `text-[var(--text-secondary)]`, `text-[var(--text-muted)]`, `bg-[var(--bg-base)]` instead.

### Architecture

- **Extend `app/actions/settings.ts`** — add one new exported action: `updateLanguagePreference`. Do NOT create a new file; `settings.ts` already owns all account mutations.
- **New DB query in `lib/db/queries.ts`** — `updateUserLanguage(userId: string, language: Locale)`. The action calls this; it must not write to the DB inline in the action.
- **New component `components/dashboard/settings/LanguagePreferenceForm.tsx`** — `'use client'` component. Follows the same pattern as `ChangeEmailForm` and `ChangePasswordForm`.
- **Extend `app/[locale]/(dashboard)/settings/page.tsx`** — pass the current user's stored `language` to `LanguagePreferenceForm` as a prop so the select pre-selects the saved value.
- Route reload after save: use `useRouter` from `@/i18n/navigation` and call `router.push('/settings', { locale: newLocale })` — this navigates to the same settings page in the new locale, triggering a full server re-render in the correct language. Do not use `window.location.href`.
- No API routes — this is a pure Server Action mutation.
- `revalidatePath` is NOT required — the `router.push` triggers a fresh navigation, so stale cache is not a concern.

### TypeScript

- Strict mode. No `any`. No type assertions without an explanatory comment.
- Infer types from Zod schemas with `z.infer<typeof Schema>` — no duplicate type definitions.
- Use `interface` for props; `type` for unions.
- The `Locale` type comes from `@/i18n/routing` — `(typeof routing.locales)[number]` — import it, do not redefine it.
- Server Action returns `ActionResult` (from `lib/types.ts`): `{ success: true }` or `{ success: false, error: string }` where `error` is an i18n key.

### Validation

```typescript
// lib/validations/settings.ts  — append to existing file

import { routing } from '@/i18n/routing'

export const updateLanguagePreferenceSchema = z.object({
  // Only accept the four supported locales — derived from routing config, not hardcoded
  language: z.enum(routing.locales as [string, ...string[]]),
})

export type UpdateLanguagePreferenceInput = z.infer<typeof updateLanguagePreferenceSchema>
```

> `routing.locales` is `['en', 'fr', 'es', 'de']` from `i18n/routing.ts`. Deriving the schema from it means adding a new locale to the routing config automatically updates this validation — no duplicate string literals.

### i18n

- All user-facing strings go in `messages/en.json` under the existing `settings` key — append a new `languagePreference` sub-key.
- Use `useTranslations('settings.languagePreference')` in the Client Component — same pattern as the other forms (`ChangeEmailForm` uses `'settings.changeEmail'`, etc.). Then call `t('heading')`, `t('options.en')`, etc.
- No hardcoded English strings in JSX.
- Add the same keys (untranslated) to `fr.json`, `es.json`, `de.json`.

**Required i18n key structure (append to `settings` in all 4 locale files):**

```json
"languagePreference": {
  "heading": "Language Preference",
  "description": "Choose the language you'd like to use for this dashboard and all emails we send you.",
  "selectLabel": "Language",
  "options": {
    "en": "English",
    "fr": "Français",
    "es": "Español",
    "de": "Deutsch"
  },
  "submitButton": "Save preference",
  "successMessage": "Language preference saved.",
  "errors": {
    "generic": "Something went wrong. Please try again."
  }
}
```

> Language option names (`"English"`, `"Français"`, etc.) are intentionally NOT translated — they must always appear in their own language so a user who doesn't read the current language can still find and switch to theirs.

---

## Design

The Language Preference card is a fourth card stacked below the Delete Account card. It matches the existing three-card layout exactly.

```
┌─────────────────────────────────────┐
│ Language Preference          (card) │
│ Choose the language you'd like…     │ ← description
│                                     │
│ Language                            │ ← label
│ ┌─────────────────────────────┐     │
│ │ English              ▾      │     │ ← shadcn Select, pre-filled from DB
│ └─────────────────────────────┘     │
│                                     │
│ [Save preference]                   │ ← primary button
│ ✓ Language preference saved.        │ ← inline success (below button)
└─────────────────────────────────────┘
```

**Rules:**
- Use shadcn `Card` with only `border-[var(--border-default)] shadow-[var(--shadow-md)]` on the className. shadcn Card already provides bg, padding, and border-radius internally — do NOT add `bg-[var(--bg-surface)]`, `rounded-[length:var(--radius-lg)]`, or `p-[length:var(--space-6)]` manually on the Card.
  ```tsx
  <Card className="border-[var(--border-default)] shadow-[var(--shadow-md)]">
  ```
- Use shadcn `Select` for the language dropdown — not a native `<select>`.
- No react-hook-form needed — this is a single-field select, not a multi-field form. Use `useState` for the selected value and call the action directly on button click.
- Submit button: `<Button type="submit" className="w-full sm:w-auto">` — full width on mobile, auto on `sm+`. Shows `Loader2` spinner (`animate-spin h-4 w-4 mr-2`) and is `disabled` while pending. Also disabled when `selected === currentLanguage`.
- Success message: `CheckCircle2` icon (Lucide, `h-4 w-4 shrink-0`) + success text. Full pattern:
  ```tsx
  <p className="flex items-center gap-2 text-[length:var(--text-sm)] text-[var(--status-success)]">
    <CheckCircle2 className="h-4 w-4 shrink-0" />
    {t('successMessage')}
  </p>
  ```
- Error message pattern:
  ```tsx
  <p className="text-[length:var(--text-sm)] text-[var(--status-error)]">{actionError}</p>
  ```
- No toast — these are quiet inline confirmations.
- After a successful save, the success message shows briefly, then the page navigates to `/settings` in the new locale — the reload itself makes the success message disappear naturally.

---

## Implementation

### 1. Add DB query `updateUserLanguage` to `lib/db/queries.ts`

```typescript
/**
 * Persists the user's chosen language preference to public.users.
 * Called only after the action has verified the locale is valid.
 */
export async function updateUserLanguage(
  userId: string,
  language: Locale,
): Promise<void> {
  await db
    .update(users)
    .set({ language, updatedAt: new Date() })
    .where(eq(users.id, userId))
}
```

Import `Locale` from `@/i18n/routing`.

---

### 2. Extend `lib/validations/settings.ts`

Append `updateLanguagePreferenceSchema` and its inferred type as defined in the Validation section above.

---

### 3. Add `updateLanguagePreference` action to `app/actions/settings.ts`

```typescript
// updateLanguagePreference
// Validates the locale, then persists it to public.users.language.
// The component handles the locale-aware navigation redirect after success.
export async function updateLanguagePreference(input: unknown): Promise<ActionResult> {
  // 1. Validate — rejects any string not in ['en', 'fr', 'es', 'de']
  const parsed = updateLanguagePreferenceSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'settings.languagePreference.errors.generic' }
  }

  // 2. Require authenticated session
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: 'settings.languagePreference.errors.generic' }
  }

  // 3. Persist to DB
  await updateUserLanguage(user.id, parsed.data.language as Locale)

  return { success: true }
}
```

Import `updateLanguagePreferenceSchema` from `@/lib/validations/settings` and `updateUserLanguage` from `@/lib/db/queries`.

---

### 4. Add i18n keys

Append the `languagePreference` block defined in the i18n section above to:
- `messages/en.json` — under `settings`, after `deleteAccount`
- `messages/fr.json` — same structure, same English values for now
- `messages/es.json` — same
- `messages/de.json` — same

---

### 5. Create `components/dashboard/settings/LanguagePreferenceForm.tsx`

`'use client'` component.

**Props:**
```typescript
interface LanguagePreferenceFormProps {
  // Current saved language — used to pre-select the correct option and
  // disable the save button when selection matches the stored value.
  currentLanguage: Locale
}
```

**State:**
- `selected: Locale` — initialised to `currentLanguage`; updated when the user changes the select.
- `pending` — from `useTransition`; disables the button and shows spinner.
- `success: boolean` — shows the inline success message briefly before navigation.
- `actionError: string | null` — stores i18n key for unexpected failures.

**On submit:**
1. Call `updateLanguagePreference({ language: selected })` inside `startTransition`.
2. If `result.success`:
   - Set `success = true`.
   - After a short delay (200ms is enough for the success message to be visible), call `router.push('/settings', { locale: selected })` to reload the page in the new language.
3. If `!result.success` — set `actionError`.

**Render:**
- shadcn `Card` with `className="border-[var(--border-default)] shadow-[var(--shadow-md)]"`. Use `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` — same structure as the other three cards.
  - `CardTitle`: `className="text-[length:var(--text-xl)] font-[number:var(--font-semibold)] text-[var(--text-primary)]"`
  - `CardDescription`: `className="text-[var(--text-secondary)]"`
- A `<label>` with `className="... text-[length:var(--text-sm)] font-[number:var(--font-medium)] text-[var(--text-primary)]"` tied to the Select via `htmlFor`.
- shadcn `Select` with four `SelectItem` entries — values `'en'`, `'fr'`, `'es'`, `'de'`. Labels come from `t('options.en')` etc. (namespace is already `settings.languagePreference`).
- Submit `Button`: `className="w-full sm:w-auto"`, disabled when `selected === currentLanguage || isPending`. Shows `Loader2 animate-spin` when pending.
- Success `<p>`: `className="flex items-center gap-2 text-[length:var(--text-sm)] text-[var(--status-success)]"` with `CheckCircle2 h-4 w-4 shrink-0`.
- Error `<p>`: `className="text-[length:var(--text-sm)] text-[var(--status-error)]"`, shown when `actionError` is set.

---

### 6. Extend `app/[locale]/(dashboard)/settings/page.tsx`

**Add to data fetching** — the `getCurrentUser()` call already runs. The user record returned by `getCurrentUser()` contains `language`. Pass it down:

```tsx
// getCurrentUser() returns the user record from public.users which includes language.
// Guaranteed non-null here — the layout's auth guard redirects to /signin if missing.
const currentLanguage = (user?.language ?? 'en') as Locale

// Pass to the new form
<LanguagePreferenceForm currentLanguage={currentLanguage} />
```

**Add the card to the JSX**, after `<DeleteAccountSection .../>`:

```tsx
<LanguagePreferenceForm currentLanguage={currentLanguage} />
```

Import `LanguagePreferenceForm` from `@/components/dashboard/settings/LanguagePreferenceForm`.

---

### 7. Extend `app/[locale]/(dashboard)/settings/loading.tsx`

The existing `loading.tsx` already has a reusable `SettingsCardSkeleton` component (defined in the same file) that takes a `rows` prop for input-row skeletons.

Add one call below the existing three:

```tsx
{/* Language Preference card skeleton — 1 row for the select field */}
<SettingsCardSkeleton rows={1} />
```

No other changes needed — `SettingsCardSkeleton` already handles heading, description, N input rows, and button.

---

## Dependencies

No new packages required. shadcn `Select` is already installed.

---

## Scope Limits

- **No language auto-detection on this page** — the stored preference is loaded from the DB and shown directly. Browser detection already happens at the proxy level (Feature 03). Do not re-implement it here.
- **No changes to `LanguageSwitcher`** — the header switcher already works. This card adds a persistent stored preference alongside it; it does not replace the switcher.
- **No email re-send on language change** — changing the language does not trigger any email. All future emails already read from `users.language` at send time.
- **No form validation UI beyond the inline error** — this is a single-select with a fixed list of valid values. There is no user-typeable field, so there is nothing to validate visually.
- **No changes to `app/actions/auth.ts`** — all account mutations belong in `settings.ts`.
- **Do not modify `components/ui/*`** — shadcn source is off-limits.
- **No fiscal rep or renewal UI** — this card is for language only.

---

## Check When Done

- `updateLanguagePreference` is exported from `app/actions/settings.ts` and follows the validate → auth check → act → return `ActionResult` pattern.
- `updateUserLanguage` exists in `lib/db/queries.ts` and updates `users.language` and `users.updatedAt`.
- `updateLanguagePreferenceSchema` is in `lib/validations/settings.ts` and derives its enum from `routing.locales`.
- `LanguagePreferenceForm` renders a shadcn `Select` pre-selected to the user's stored language.
- Selecting a different language enables the Save button; selecting the current language keeps it disabled.
- Saving triggers the action, shows a brief success message, then navigates to `/settings` in the new locale — the page reloads with all text in the selected language.
- After reloading, the Select pre-selects the newly saved language.
- `settings.languagePreference.*` keys exist in all four locale files (`en.json`, `fr.json`, `es.json`, `de.json`).
- Language option labels (`"English"`, `"Français"`, `"Español"`, `"Deutsch"`) are always rendered in their own language regardless of the current UI locale.
- The loading skeleton has four cards (three existing + one new).
- `npm run build` passes.
