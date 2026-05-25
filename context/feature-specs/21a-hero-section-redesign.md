# 21a — Hero Section Redesign

<!-- Read before starting: context/AGENTS.md, context/visual-director.md, context/ui-context.md, context/progress-tracker.md -->

Refactor `HeroSection` to apply the visual principles from `visual-director.md` — specifically: one primary action, spacious vertical rhythm, token-only spacing, and a stats layout that reads as a trust signal rather than filler.

---

## Constraints

### Tokens (UI features only)

All spacing, color, and radius must use tokens. No raw Tailwind scale classes.

| Purpose | Token | Tailwind utility |
|---|---|---|
| Section background | `var(--bg-base)` | `bg-base` |
| Headline text | `var(--text-primary)` | `text-text-primary` |
| Sub-headline text | `var(--text-secondary)` | `text-text-secondary` |
| Stat value text | `var(--text-primary)` | `text-text-primary` |
| Stat label text | `var(--text-muted)` | `text-text-muted` |
| Stats band background | `var(--brand-primary-dim)` | `bg-brand-primary-dim` |
| Stats band border radius | `var(--radius-lg)` | `rounded-lg` |
| Primary CTA background | `var(--brand-primary)` | `bg-brand-primary` |
| Primary CTA text | `var(--text-on-accent)` | `text-text-on-accent` |
| Divider between stat items | `var(--border-subtle)` | `border-border-subtle` |

Rules that always apply to UI work in this project:
- No raw Tailwind color classes (`zinc-*`, `slate-*`, `blue-*`). Tokens only.
- No hardcoded hex or rgb values.
- Mobile-first. Add breakpoint variants only where layout actually changes.
- Border radius from scale: `--radius-sm` / `md` / `lg` / `xl` / `2xl` / `full`.
- Shadows from scale: `--shadow-sm` / `md` / `lg` / `xl`.
- Shadcn components when possible.

### Architecture

- Component file: `components/marketing/HeroSection.tsx` — modify in place.
- Server Component — no `"use client"`.
- Uses `useTranslations('home.hero')` — translation keys are already in place, do not add or remove keys.
- No animation library. CSS transitions only (`transition-[var(--transition-base)]`).

### TypeScript

- Strict mode. No `any`. No type assertions.
- `StatItem` props interface stays as-is.

### i18n

- No new translation keys. Use the existing `home.hero` namespace.
- Do not change any copy — this is a structural and visual refactor only.

---

## Design

### The Problem with the Current Hero

The current hero has three violations of `visual-director.md`:

1. **Two competing primary actions.** A full-width `variant="default"` button and a full-width `variant="outline"` button stacked 12px apart communicate equal weight. The section has no clear primary action. Per the visual director: "A page with two primary buttons has no primary button."

2. **Tight vertical rhythm.** `pt-10 pb-8` (40px/32px) and `mt-3`, `mt-6`, `mt-8` are raw Tailwind values that don't respect the 8px token grid or the "Very spacious" density rule for marketing pages. The visual director specifies 80–128px between sections and generous space around high-emotional-weight content.

3. **Raw Tailwind spacing.** `px-4`, `mt-3`, `mt-6`, `mt-8`, `gap-4`, `p-6` — none of these use the token system.

### The Fix

**One primary CTA.** The primary button stays as-is (full-width, `variant="default"`). The "Learn more" secondary action becomes a ghost link-style button — smaller, less visual weight — not a competing full-width block.

**Spacious rhythm.** Apply token-based vertical spacing throughout. The section needs room to breathe: `py-[length:var(--space-16)]` (64px top/bottom) minimum on mobile, more on desktop.

**Stats as a horizontal trust band.** The current 2×2 grid works but reads as a content block rather than a trust signal. On `md` and up: 4 columns in one row, each stat separated by a subtle vertical divider. On mobile: 2×2 stays. This makes the stats read as a single coherent claim ("proof this works") rather than four disconnected data points.

**No decorative additions.** Do not add icons, illustrations, background patterns, or additional copy. The visual director is clear: "Never fill space to seem busy." The refactor is about removing noise and tightening decisions — not adding new elements.

### Layout Specification

```
[section — bg-base — py-16 on mobile, py-24 on md+]
  [container — max-w-2xl — mx-auto — px-6]

    [h1 — text-3xl/text-4xl — font-bold — leading-tight — text-primary]
    [p  — text-base — leading-relaxed — text-secondary — mt-6]

    [primary CTA — full width — mt-10]
    [secondary link — centered ghost — mt-4 — text-sm — text-secondary]

    [stats band — mt-12 — bg-brand-primary-dim — rounded-lg — p-6]
      mobile:  2×2 grid, gap-6
      md+:     4 columns, each item right-bordered by border-subtle (last: no border)
```

### What the Secondary Action Looks Like

Not a shadcn `Button variant="outline"`. A simple centered `<a>` or `Button variant="ghost"` with small text and a Lucide `ArrowDown` icon (`h-4 w-4`). The visual weight gap between primary and secondary must be unmistakable.

```tsx
// Example — exact implementation up to the agent
<Button variant="ghost" asChild className="w-full text-text-secondary text-[length:var(--text-sm)]">
  <a href="#how-it-works">
    {t('learnMore')} <ArrowDown className="h-4 w-4 ml-1" />
  </a>
</Button>
```

---

## Implementation

1. Open `components/marketing/HeroSection.tsx`.

2. Replace the `<section>` background from `bg-surface` to `bg-base`. The hero sits on the page canvas, not inside a card.

3. Replace all raw spacing (`px-4`, `pt-10`, `pb-8`) with token-based equivalents:
   - Section: `py-[length:var(--space-16)] md:py-[length:var(--space-24)] px-[length:var(--space-6)]`
   - Between headline and sub-headline: `mt-[length:var(--space-6)]`
   - Between sub-headline and primary CTA: `mt-[length:var(--space-10)]`
   - Between primary CTA and secondary: `mt-[length:var(--space-4)]`
   - Between CTAs and stats: `mt-[length:var(--space-12)]`

4. Change the secondary action from `Button variant="outline" asChild w-full` to `Button variant="ghost" asChild` with reduced text size (`text-[length:var(--text-sm)]`) and a `text-text-secondary` color. Add a Lucide `ArrowDown` icon inline after the text label.

5. Refactor the stats grid:
   - Mobile (default): `grid grid-cols-2 gap-[length:var(--space-6)]` — same as current.
   - `md+`: `md:grid-cols-4 md:gap-0` — four equal columns in one row.
   - Add a right border to each `StatItem` on `md+` using `border-r border-[var(--border-subtle)]`, except the last one (`last:border-r-0`). This visually separates the stats without heavy dividers.
   - Inside the `StatItem`, add `md:px-[length:var(--space-6)]` (first item: `md:pl-0`, last item: `md:pr-0`) to give each stat breathing room within the row.
   - The stats band `p-6` becomes `p-[length:var(--space-6)]` — same value, correct token.

6. Update `StatItem` to accept an optional `className` prop so the grid can pass per-item border styles without breaking the component interface.

7. Verify the component renders correctly at 375px (mobile), 768px (md), and 1280px (desktop) widths.

---

## Dependencies

No new packages. `ArrowDown` is already available from `lucide-react`.

---

## Scope Limits

- Do not change any translation keys or copy. This is structural and visual only.
- Do not add animations, Framer Motion, or scroll-triggered effects. CSS transitions only.
- Do not add new sections (trust logos, testimonials, etc.) — that belongs in a separate marketing expansion feature.
- Do not touch `MarketingHeader`, `HowItWorksSection`, or any other component.
- Do not change the `Button` shadcn component source.
- Do not add responsive behavior beyond the two breakpoints defined above (mobile / md+).
- Do not change the stats content (`value` / `label`) — translation keys stay as-is.

---

## Check When Done

- [ ] The section uses `bg-base`, not `bg-surface`.
- [ ] No raw Tailwind spacing classes remain (`px-4`, `mt-3`, `mt-6`, `mt-8`, `gap-4`, `p-6` etc.) — all replaced with `var(--space-*)` tokens.
- [ ] There is exactly one `variant="default"` button in the hero. The secondary action is `variant="ghost"` with visually lower weight.
- [ ] On `md+`, the stats render as a single horizontal row of 4 items with `border-subtle` dividers between them.
- [ ] On mobile, the stats remain a 2×2 grid.
- [ ] The `ArrowDown` icon appears inline in the secondary action.
- [ ] No hardcoded hex, rgb, or raw Tailwind color classes anywhere in the component.
- [ ] `npm run build` passes.
