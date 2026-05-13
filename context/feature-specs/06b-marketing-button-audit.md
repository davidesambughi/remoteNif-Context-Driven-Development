# 06b — Marketing Button Audit

Read `context/AGENTS.md`, `context/progress-tracker.md` before starting.

Replace custom-styled link/anchor CTAs in existing marketing components with shadcn `Button asChild`, so that all interactive elements in the marketing layer have a consistent, accessible focus ring via shadcn's built-in `focus-visible:ring`.

---

## Constraints

### Tokens (UI features only)

| Purpose | Token | Tailwind utility |
|---------|-------|-----------------|
| Primary button background | `var(--brand-primary)` | `bg-[var(--brand-primary)]` |
| Primary button text | `var(--text-on-accent)` | `text-[var(--text-on-accent)]` |
| Secondary button border | `var(--border-default)` | `border-[var(--border-default)]` |
| Secondary button text | `var(--text-primary)` | `text-[var(--text-primary)]` |
| Secondary button hover bg | `var(--bg-subtle)` | `hover:bg-[var(--bg-subtle)]` |
| Base transition | `var(--transition-base)` | `transition-[var(--transition-base)]` |
| Radius | `var(--radius-md)` | `rounded-[length:var(--radius-md)]` |
| Spacing — padding X | `var(--space-6)` | `px-[length:var(--space-6)]` |
| Spacing — padding Y | `var(--space-3)` | `py-[length:var(--space-3)]` |
| Spacing — padding Y (header) | `var(--space-2)` | `py-[length:var(--space-2)]` |

Rules that always apply to UI work in this project:
- No raw Tailwind color classes (`zinc-*`, `slate-*`, `blue-*`). Tokens only.
- No hardcoded hex or rgb values.
- Mobile-first. Add breakpoint variants only where layout actually changes.
- Border radius from scale: `--radius-sm` / `md` / `lg` / `xl` / `2xl` / `full`.
- Shadows from scale: `--shadow-sm` / `md` / `lg` / `xl`.

### Architecture

- This is a pure UI refactor — no new routes, no Server Actions, no data changes.
- Components are Server Components — do not add `"use client"` to any of the three files.
- `Button` is imported from `@/components/ui/button` (shadcn). Do not modify its source.
- `asChild` prop delegates all rendering to the child element (`Link` or `<a>`), so href, className extensions, and children all belong on the child, not on `Button`. The child element carries the classes; `Button` provides variant + focus-visible ring behaviour.
- `Link` for internal routes comes from `@/i18n/navigation` (locale-aware). Raw `<a>` is only acceptable for in-page anchor (`#how-it-works`).

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- No new types or interfaces needed for this feature — all props are passed through to the child via `asChild`.

### Validation

No form inputs. No Zod schema required.

### i18n

No new translation keys. All existing translation keys (`home.hero.cta`, `home.hero.learnMore`, `common.nav.signIn`) stay unchanged.

---

## Design

### HeroSection — two CTAs stacked

**"Get Started" (primary):**
- `Button` with `variant="default"` (maps to brand primary background, white text), `asChild`, `className="w-full mt-6"`.
- Child: `<Link href="/pricing">`. Text from `{t('cta')}`.

**"Learn More" (secondary):**
- `Button` with `variant="outline"` (border + transparent bg, hover to subtle bg), `asChild`, `className="w-full mt-3"`.
- Child: `<a href="#how-it-works">`. Text from `{t('learnMore')}`.

Both buttons are full-width on all breakpoints (no change from current layout). Visual appearance must remain the same — the only visible difference is the addition of the shadcn focus ring on keyboard focus.

### MarketingHeader — Sign In CTA

**"Sign In" (ghost / secondary style):**
- `Button` with `variant="outline"`, `asChild`.
- Child: `<Link href="/signin">`. Text from `{t('nav.signIn')}`.
- No size change. The header is compact; use shadcn's default `sm` size or match the current inline size manually with className overrides if needed so it doesn't change the header height.

### What does NOT change

- `StepCard` divs in `HowItWorksSection` — display only, no interaction.
- `MarketingFooter` links — navigation links, not CTAs; leave as plain `Link`.
- `LanguageSwitcher` — left as-is.
- `TierCard` CTA — already uses `Button asChild` (done in 06a).
- `FAQSection` — accordion, already using shadcn.

---

## Implementation

1. Open `components/marketing/HeroSection.tsx`.

   - Add `import { Button } from '@/components/ui/button'`.
   - Replace the `<Link href="/pricing" className="...">` block with:
     ```tsx
     <Button variant="default" asChild className="w-full mt-6">
       <Link href="/pricing">{t('cta')}</Link>
     </Button>
     ```
   - Replace the `<a href="#how-it-works" className="...">` block with:
     ```tsx
     <Button variant="outline" asChild className="w-full mt-3">
       <a href="#how-it-works">{t('learnMore')}</a>
     </Button>
     ```
   - Remove the hand-rolled className strings from the replaced elements (they are no longer on the outer element — Button provides the base styles; only layout overrides like `w-full` and `mt-*` stay on `Button`'s className).

2. Open `components/shared/MarketingHeader.tsx`.

   - Add `import { Button } from '@/components/ui/button'`.
   - Replace the `<Link href="/signin" className="...">` block with:
     ```tsx
     <Button variant="outline" size="sm" asChild>
       <Link href="/signin">{t('nav.signIn')}</Link>
     </Button>
     ```
   - Remove the hand-rolled className string from the replaced `Link`.

3. Verify visually (dev server is running): open `http://localhost:3000/en` in a browser, tab through the page, and confirm focus rings appear on all three updated CTAs.

---

## Dependencies

No new packages. `@/components/ui/button` is already installed (added in Feature 04).

---

## Scope Limits

- Do not touch `HowItWorksSection` — `StepCard` divs are display-only, no interaction to fix.
- Do not touch `MarketingFooter` — nav links are not primary CTAs.
- Do not touch `TierCard` — already done in Feature 06a.
- Do not touch `FAQSection` — already uses shadcn Accordion.
- Do not modify `components/ui/button.tsx` (shadcn source — invariant).
- Do not add new functionality, new routes, new animations, or new copy.
- Do not change any translation keys or message files.
- Visual appearance must stay the same — focus ring is the only new visible change.

---

## Check When Done

- `HeroSection` "Get Started" link is wrapped in `<Button variant="default" asChild>` with `<Link href="/pricing">` as the child.
- `HeroSection` "Learn More" anchor is wrapped in `<Button variant="outline" asChild>` with `<a href="#how-it-works">` as the child.
- `MarketingHeader` "Sign In" link is wrapped in `<Button variant="outline" size="sm" asChild>` with `<Link href="/signin">` as the child.
- No hand-rolled className strings remain on the replaced elements.
- Tabbing through `http://localhost:3000/en` shows a visible focus ring on all three updated CTAs.
- `StepCard` divs, footer links, `LanguageSwitcher`, `TierCard`, and `FAQSection` are unchanged.
- `npm run build` passes.
