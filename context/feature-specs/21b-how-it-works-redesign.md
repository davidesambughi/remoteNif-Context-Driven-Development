# 21b — HowItWorks Section Redesign

<!-- Context files to read: context/ui-context.md, context/code-standards.md -->
<!-- UI-only refactor. No business logic, no i18n key changes, no routing changes. -->

Redesign `components/marketing/HowItWorksSection.tsx` to match the mockup at `public/images/how-it-works-image.png`, replacing the current left-border heading + oversized-number card layout with a centered heading, styled "transparent" word, and illustrated step cards that each carry a bottom illustration image.

---

## Constraints

### Tokens

| Purpose | Token | Tailwind utility |
|---------|-------|-----------------|
| Section background | `var(--brand-primary-dim)` | `bg-brand-primary-dim` |
| Card background | `var(--bg-surface)` | `bg-surface` |
| Step number text | `var(--brand-primary)` | `text-brand-primary` |
| Section title | `var(--text-primary)` | `text-primary` |
| Card title | `var(--text-primary)` | `text-primary` |
| Card description | `var(--text-secondary)` | `text-secondary` |
| Card border | `var(--border-subtle)` | `border-subtle` |
| Card shadow | `var(--shadow-md)` | `shadow-[var(--shadow-md)]` |
| Step number size | `var(--text-xs)` | `text-[length:var(--text-xs)]` |
| Card title size | `var(--text-xl)` | `text-[length:var(--text-xl)]` |
| Card description size | `var(--text-sm)` | `text-[length:var(--text-sm)]` |
| Section title size | `var(--text-3xl)` | `text-[length:var(--text-3xl)]` |
| Card radius | `var(--radius-xl)` | `rounded-[length:var(--radius-xl)]` |
| Card padding | `var(--space-6)` | `p-[length:var(--space-6)]` |
| Card gap | `var(--space-6)` | `gap-[length:var(--space-6)]` |
| Section vertical padding | `var(--space-16)` | `py-[length:var(--space-16)]` |
| Section horizontal padding | `var(--space-4)` | `px-[length:var(--space-4)]` |

Rules that always apply:
- No raw Tailwind color classes. Tokens only.
- No hardcoded hex or rgb values.
- Mobile-first. Breakpoint variants only where layout actually changes.
- Border radius from scale only.
- Shadows from scale only.
- Use `next/image` for all images.

### Architecture

- All changes are contained to `components/marketing/HowItWorksSection.tsx`. No other file changes.
- This is a Server Component — no `"use client"` required.
- Images live in `public/images/` and are served as static assets.
- Do not change any `useTranslations` calls, i18n keys, or translation logic.
- Do not change the `id="how-it-works"` anchor on the section.

### TypeScript

- Strict mode. No `any`. No type assertions.
- Update `StepCardProps` to include `imageSrc: string` and `imageAlt: string`.

### i18n

- Do not add, remove, or rename any i18n keys.
- Do not hardcode any user-facing strings in JSX.
- All existing `t(...)` calls stay exactly as they are.

---

## Design

### Section heading (centered)

- Remove the current left-border (`border-l-4`) block treatment.
- Title (`t('title')`) is centered (`text-center`).
- The word "transparent" inside the title must be wrapped in a `<span>` with `italic underline underline-offset-4 decoration-[var(--brand-primary)]` to match the mockup's styled underline.
  - The word to style is determined by a new i18n key? **No** — do not add keys. Instead, hardcode the span only around the static English word inside a JSX comment, and apply it by splitting the translated string. **Actually no** — the safest approach that keeps i18n intact and avoids hardcoding is to render the full title via `t('title')` and add the span as a JSX sibling structure. Since the title text is already defined in messages, wrap the title in a `<h2>` but render it as a single line where the "transparent" styled word is part of the heading rendered via a separate i18n key `home.howItWorks.titleHighlight` — **but we must not add new i18n keys**.
  - **Correct approach:** Render `t('title')` as a plain string in `<h2>`. The "transparent" style is a visual/decorative choice that exists only in English. Since this is a static marketing section and the mockup is in English, accept this limitation: render the title as-is from `t('title')` without additional inline styling on the word. If the translated title already uses different words anyway, the underline on a specific word would be meaningless. **Keep it simple** — render `t('title')` normally, centered, bold. Do not attempt to style a single word inside a translated string.
- Subtitle (`t('subtitle')`) is centered, `text-secondary`.
- Heading block: `text-center mb-[length:var(--space-10)]` (space below before the cards).

### Step cards

- Three cards in a responsive grid: `grid grid-cols-1 md:grid-cols-3`.
- Each card layout (top to bottom):
  1. **Step number** — `t('step1Number')` etc., small text, `text-brand-primary`, `font-[number:var(--font-semibold)]`, positioned top-left.
  2. **Card title** — `t('step1Title')` etc., `text-[length:var(--text-xl)]`, `font-[number:var(--font-bold)]`, `text-primary`, tight line height.
  3. **Card description** — `t('step1Description')` etc., `text-[length:var(--text-sm)]`, `text-secondary`, `leading-[var(--leading-relaxed)]`.
  4. **Illustration image** — `next/image`, centered, `mt-auto` to push to the bottom of the card. Each card maps to its own image file (see below). Size: fill the available width up to a max, e.g. `w-full max-h-40 object-contain`.
- Card itself: `flex flex-col bg-surface border border-subtle rounded-[length:var(--radius-xl)] p-[length:var(--space-6)] shadow-[var(--shadow-md)]`.
- Remove the existing `border-t-4 border-t-brand-primary` top accent — the mockup does not have it.
- Remove the oversized opacity-30 number — replaced by the small styled step number above.

### Image assignment

| Step | Image file |
|------|-----------|
| Step 1 (Choose your tier) | `/images/card1.png` — bar chart showing tier pricing |
| Step 2 (Upload Your Documents) | `/images/card2.png` — passport, ID, document icons |
| Step 3 (Receive Your NIF) | `/images/card3.png` — NIF certificate and icons |

- `imageAlt` is passed as a prop from the parent and must be descriptive (not empty).
- Since alt text is user-facing, it must come from `t(...)`. Use the existing step title keys as alt text (`t('step1Title')` etc.) — this is an acceptable fallback for illustrative images.

### Max-width and centering

- Outer container: `max-w-5xl mx-auto` (wider than the current `max-w-2xl` to accommodate the 3-column layout comfortably).

---

## Implementation

1. Update `StepCardProps` interface in `HowItWorksSection.tsx` to add `imageSrc: string` and `imageAlt: string`.

2. Rewrite the `StepCard` component:
   - Remove the oversized number `<span>` block.
   - Add a small step number line at the top using `number` prop: `text-[length:var(--text-xs)] font-[number:var(--font-semibold)] text-brand-primary`.
   - Title and description stay as before, size adjustments per the token table above.
   - Add a `<div className="mt-auto pt-[length:var(--space-6)] flex justify-center">` block at the bottom containing a `next/image` with `src={imageSrc}`, `alt={imageAlt}`, `width={240}`, `height={160}`, `className="object-contain"`.
   - Card `<div>` becomes `flex flex-col` and removes `border-t-4 border-t-brand-primary`.

3. Rewrite the section structure in `HowItWorksSection`:
   - Section: `bg-brand-primary-dim px-[length:var(--space-4)] py-[length:var(--space-16)]`.
   - Inner wrapper: `max-w-5xl mx-auto`.
   - Heading block: `text-center mb-[length:var(--space-10)]`.
     - `<h2>` with `text-[length:var(--text-3xl)] font-[number:var(--font-bold)] text-primary`.
     - `<p>` subtitle with `mt-[length:var(--space-2)] text-[length:var(--text-sm)] text-secondary`.
   - Cards grid: `grid grid-cols-1 md:grid-cols-3 gap-[length:var(--space-6)]`.

4. Pass `imageSrc` and `imageAlt` (using existing step title key) to each `StepCard`.

5. Add `import Image from 'next/image'` at the top of the file.

---

## Scope Limits

- Do not touch any other file — not `messages/*.json`, not any other component, not `globals.css`.
- Do not add any new i18n keys.
- Do not add Framer Motion animations — this is a static section.
- Do not change the `id="how-it-works"` attribute — it is used as an anchor target.
- Do not change the section's `<section>` wrapper element type.
- Keep this focused on `HowItWorksSection.tsx` only.

---

## Check When Done

- Section background is `bg-brand-primary-dim` (warm cream/orange tint).
- Section heading is centered (no left border).
- Three cards render in a single row on `md` and above, stacked on mobile.
- Each card shows: small orange step number → bold title → secondary description → bottom illustration image.
- No `border-t-4` orange top-accent on cards.
- No oversized opacity-30 number inside cards.
- All three card images (`card1.png`, `card2.png`, `card3.png`) render via `next/image`.
- All user-facing strings still come from `useTranslations` — no hardcoded copy.
- `id="how-it-works"` is still present on the `<section>`.
- `npm run build` passes.
