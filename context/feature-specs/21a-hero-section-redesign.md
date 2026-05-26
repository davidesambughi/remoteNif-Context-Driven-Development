# 21a — Hero Section Redesign (Photo Canvas)

<!-- Read before starting:
     context/AGENTS.md
     context/design-principles.md          ← visual judgment rules (the WHY)
     context/ui-context.md                 ← token reference
     context/architecture-context.md       ← invariants, file boundaries
     context/code-standards.md             ← styling, next/image, mobile-first
     context/progress-tracker.md           ← current state

     Reference image: public/Gemini_Generated_Image_wlahzvwlahzvwlah.png
     Hero background: public/hero-image.png -->

Replace the placeholder HeroSection with a full-viewport photo-canvas hero that
implements the two-world model, two-zone layout, glass navbar, and stats row
defined in design-principles.md.

---

## Constraints

### Tokens (UI features only)

**Step 1 of implementation adds new photo-canvas tokens to `globals.css`.**
All component JSX must reference these tokens — never raw opacity utilities like
`bg-white/10` or hardcoded `oklch()` values inside className strings.

New tokens to add to `globals.css` (under a new `PHOTO CANVAS` section, after `BRAND`):

```css
/* ==========================================
    PHOTO CANVAS
    Glass surfaces used on photo-background pages only.
    Never use these tokens on app-canvas pages (dashboard, admin, auth).
    ========================================== */
--glass-navbar-bg:      oklch(100% 0 0 / 0.10);  /* navbar background */
--glass-navbar-border:  oklch(100% 0 0 / 0.20);  /* navbar bottom border */
--glass-badge-bg:       oklch(100% 0 0 / 0.15);  /* badge pill background */
--glass-badge-border:   oklch(100% 0 0 / 0.40);  /* badge pill border */
--glass-separator:      oklch(100% 0 0 / 0.30);  /* stats row divider */
--glass-overlay:        oklch(0% 0 0 / 0.35);    /* photo darkening gradient start */
--glass-text:           oklch(100% 0 0);          /* all text on photo — same as --color-white */
--glass-text-dim:       oklch(100% 0 0 / 0.80);  /* subtext on photo (~80% white) */
```

Also add corresponding `@theme inline` entries so these become Tailwind utilities:

```css
--color-glass-navbar-bg:     var(--glass-navbar-bg);
--color-glass-navbar-border: var(--glass-navbar-border);
--color-glass-badge-bg:      var(--glass-badge-bg);
--color-glass-badge-border:  var(--glass-badge-border);
--color-glass-separator:     var(--glass-separator);
--color-glass-overlay:       var(--glass-overlay);
--color-glass-text:          var(--glass-text);
--color-glass-text-dim:      var(--glass-text-dim);
```

Full token reference for this feature:

| Purpose | Token | Tailwind utility |
|---------|-------|-----------------|
| Navbar background (glass) | `--glass-navbar-bg` | `bg-glass-navbar-bg` |
| Navbar border (glass) | `--glass-navbar-border` | `border-glass-navbar-border` |
| Badge background | `--glass-badge-bg` | `bg-glass-badge-bg` |
| Badge border | `--glass-badge-border` | `border-glass-badge-border` |
| Stats separator | `--glass-separator` | `border-glass-separator` |
| Photo overlay | `--glass-overlay` | `from-glass-overlay` (gradient start) |
| All text on photo | `--glass-text` | `text-glass-text` |
| Subtext on photo | `--glass-text-dim` | `text-glass-text-dim` |
| Navbar CTA pill bg | `--brand-primary` | `bg-brand-primary` |
| Navbar CTA pill text | `--color-white` | `text-white` (or `text-glass-text`) |
| Hero CTA bg | `--color-white` | `bg-white` |
| Hero CTA text | `--brand-primary` | `text-brand-primary` |
| Hero CTA radius | `--radius-full` | `rounded-full` |
| Badge radius | `--radius-full` | `rounded-full` |
| Headline font | `--font-serif` | `font-serif` |
| All other text | `--font-sans` | (body default) |
| Headline size | `--text-4xl` | `text-4xl` |
| Headline size mobile | `--text-3xl` | `text-3xl md:text-4xl` |
| Subtext size | `--text-lg` | `text-lg` |
| Badge text size | `--text-xs` | `text-xs` |
| Stat number size | `--text-2xl` | `text-2xl` |
| Stat label size | `--text-xs` | `text-xs` |
| Content bottom padding | `--space-12` | `pb-12` |
| Badge → headline gap | `--space-4` | `mt-4` |
| Headline → subtext gap | `--space-6` | `mt-6` |
| Subtext → CTA gap | `--space-8` | `mt-8` |
| Stats item side padding | `--space-6` | `px-6` |
| Page-edge padding mobile | `--space-6` | `px-6` |
| Page-edge padding desktop | `--space-16` | `md:px-16` |

Rules that always apply:
- No raw Tailwind color classes (`zinc-*`, `slate-*`) or hardcoded hex values.
- No inline `style={{}}` for colors, spacing, or layout.
- No `bg-white/10` or similar opacity shorthands — use the named glass tokens above.
- Mobile-first. Add `md:` variants only where layout actually changes.
- Shadows, radius, spacing from the token scale only.
- All text on photo surfaces is white (`--glass-text`). No exceptions.

### Architecture

- **New file**: `components/shared/GlassDetector.tsx` — a `'use client'` component
  (~15 lines). Sole responsibility: detect if the current URL is the homepage and
  return the correct className string to its single child. See Design section for
  the exact detection logic.
- **`MarketingHeader`** stays a Server Component. It imports `GlassDetector` and
  wraps the `<header>` element with it. No `'use client'` on the header itself.
- **`HeroSection`** stays a Server Component. No `'use client'` needed.
- **`app/layout.tsx`** — add `Playfair_Display` font (alongside existing `Inter`).
- **`app/globals.css`** — add the `PHOTO CANVAS` token block and `@theme inline`
  entries before any component work begins.
- No new routes. No changes to `MarketingLayout`. No changes to `page.tsx`.
- No Server Actions. No database queries.
- Hero background loaded via `<Image fill priority>` from `next/image` — required
  because this is the LCP element; `priority` tells Next.js to preload it.

### TypeScript

- Strict mode. No `any`.
- `GlassDetector` accepts `children: (className: string) => React.ReactNode`
  (render-prop pattern) OR `children: React.ReactElement` with `cloneElement`.
  Prefer the render-prop — it is explicit and type-safe.
- `StatItem` subcomponent inside `HeroSection` accepts
  `{ value: string; label: string; separator?: boolean }`.

### Validation

No user input. No Zod schemas needed.

### i18n

- All user-facing strings use `useTranslations('home.hero')`. No hardcoded English.
- Add one new key: `badge`. This is a **new UI element** (the glass pill above the
  headline) that does not exist in the current `HeroSection`. The existing
  `stat4Label: "Hidden fees"` is a stat-row fragment — it cannot be reused as a
  standalone phrase.
- The headline split (upright → italic) is handled in component logic by splitting
  `t('headline')` on ` — `. No new keys needed.
  Existing headline: `"Get Your Portuguese NIF Online — Fast, Transparent, Reliable"`
  → upright: `"Get Your Portuguese NIF Online"`
  → italic: `"Fast, Transparent, Reliable."`
  Add a trailing period to the italic span in the component (punctuation, not i18n).
  Defensive fallback: if ` — ` is missing, render the full string upright.
- The `learnMore` key stays in all locale files — do not delete it. It is simply
  not rendered by the new hero.
- Add `badge` to: `en.json`, `fr.json`, `es.json`, `de.json` under `home.hero`.

  Values:
  - `en`: `"No hidden fees"`
  - `fr`: `"Sans frais cachés"`
  - `es`: `"Sin cargos ocultos"`
  - `de`: `"Keine versteckten Gebühren"`

  Write files with `[System.Text.UTF8Encoding]::new($false)` — no BOM.
  Parse-check each file after writing.

---

## Design

Reference image: `public/Gemini_Generated_Image_wlahzvwlahzvwlah.png`
Background image: `public/hero-image.png`
Full visual rules: `context/design-principles.md` — read it in full before implementing.

### Overall viewport structure

The marketing layout wraps `<main>` with `pt-14` (56px) to clear the sticky `h-14`
header. The hero must bleed behind that header to fill the full viewport. This is
achieved with `mt-[-3.5rem]` on the hero's outermost element — it cancels the
`pt-14` without touching the layout. The hero adds `pt-14` to its own inner content
area so text is never hidden behind the navbar.

```
┌───────────────────────────────────────────────────────────┐  ← top of viewport (0)
│  MarketingHeader — glass on homepage, sticky, z-50, h-14  │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ← hero-image.png fills this entire area, object-cover → │
│                                                           │
│  ┌──────────────────────────┐                             │
│  │  LEFT ZONE (≤50% width)  │  RIGHT ZONE — empty        │
│  │  (desktop md+)           │  photo subject lives here  │
│  │                          │                            │
│  │  [badge]                 │                            │
│  │  [h1 upright + italic]   │                            │
│  │  [subtext]               │                            │
│  │  [CTA pill]              │                            │
│  └──────────────────────────┘                             │
│                                                           │
│                          [stats — absolute bottom-right]  │
└───────────────────────────────────────────────────────────┘  ← bottom of viewport
```

### `GlassDetector` — homepage detection (client sub-component)

This is the **only client component** added by this feature. It does one thing:
determine if the current page is the homepage and pass the appropriate className
to its children.

```tsx
'use client'

import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'

interface Props {
  // Render-prop: receives the resolved className string
  children: (className: string) => React.ReactNode
  glassClass: string   // className to apply on homepage
  solidClass: string   // className to apply on all other pages
}

export function GlassDetector({ children, glassClass, solidClass }: Props) {
  const pathname = usePathname()
  const locale = useLocale()
  // Homepage is exactly /{locale} or /{locale}/ — derived from the routing system
  const isHome =
    pathname === `/${locale}` || pathname === `/${locale}/` || pathname === '/'
  return <>{children(isHome ? glassClass : solidClass)}</>
}
```

**Why this pattern:** `MarketingHeader` remains a Server Component (translations,
links, LanguageSwitcher tree are all server-side). Only the 15-line `GlassDetector`
is a client component. The locale comes from `useLocale()` — same source of truth
as the routing config, no regex, no hardcoded string lengths.

### Glass navbar (`MarketingHeader` changes)

Wrap the `<header>` element's `className` via `GlassDetector`:

```tsx
<GlassDetector
  glassClass="sticky top-0 z-50 bg-glass-navbar-bg backdrop-blur-md border-b border-glass-navbar-border"
  solidClass="sticky top-0 z-50 bg-surface border-b border-border-subtle"
>
  {(cls) => (
    <header className={cls}>
      {/* ... existing inner content ... */}
    </header>
  )}
</GlassDetector>
```

Text colors must also change between glass and solid. Options:
- Pass a second render prop for text color, OR
- Use a CSS `data-glass` attribute on `<header>` and target it with Tailwind
  `data-[glass=true]:text-glass-text` variants.

**Recommended**: data attribute approach — keeps the text color cascade in CSS,
not in JS logic. Set `data-glass={isHome ? 'true' : 'false'}` on `<header>`.
Then use `data-[glass=true]:text-glass-text` on the brand name link and nav items.

The `GlassDetector` needs to expose `isHome` to set the data attribute. Adjust
the render-prop signature: `children: (isHome: boolean) => React.ReactNode`.

Navbar Sign In button on homepage (glass mode):
- Replace `<Button variant="outline" size="sm">` with a styled `<Link>`:
  `className="bg-brand-primary text-glass-text rounded-full px-4 py-1.5 text-sm font-[number:var(--font-semibold)] hover:opacity-90 transition-[var(--transition-base)]"`
- On all other pages: keep current `<Button variant="outline" size="sm">`.
- Use `isHome` boolean from the render prop to switch between the two.

Check `LanguageSwitcher` — its trigger renders text/icon that may not inherit
`text-glass-text` from the parent. If needed, add a `variant` prop to
`LanguageSwitcher` to support glass mode text colour. Do not assume it inherits
automatically — verify in the browser.

### Hero section layout

**Outer section:**
```
relative min-h-screen mt-[-3.5rem] flex flex-col overflow-hidden
```

**Background image (`next/image`):**
```tsx
<Image
  src="/hero-image.png"
  alt=""                  // decorative background — empty alt is correct for SEO
  fill
  priority               // LCP element — must preload
  className="object-cover object-center"
/>
```
`object-cover` is correct here — the photo must fill the frame without letterboxing.
The container is the positioned ancestor (`relative` on the section).

**Gradient overlay (left-side darkening):**
```
absolute inset-0 bg-gradient-to-r from-glass-overlay to-transparent pointer-events-none
```
The gradient darkens the left side for text legibility and fades out toward the
right (photo subject) — never covers the face/right zone with a solid overlay.
`pointer-events-none` so it doesn't block any clicks.

**Content + stats wrapper:**
```
relative z-10 flex flex-col flex-1 pt-14
```
`pt-14` offsets the sticky header height. `flex-col flex-1` fills the remaining
height so `justify-end` in the content block anchors text to the lower half.

### Content block (left zone — desktop)

```
flex flex-col justify-end flex-1 px-6 pb-12 md:px-16
```

Inner content cap — enforces the left-zone boundary:
```
max-w-full md:max-w-[50%]
```
On desktop, content never exceeds 50% of the viewport width. On mobile, full width.

**Badge:**
```tsx
<span className="inline-flex items-center
  bg-glass-badge-bg border border-glass-badge-border rounded-full
  px-[length:var(--space-4)] py-[length:var(--space-2)]
  text-[length:var(--text-xs)] font-[number:var(--font-medium)] text-glass-text">
  {t('badge')}
</span>
```

**Headline (`<h1>`):**
```tsx
<h1 className="mt-[length:var(--space-4)] leading-[var(--leading-tight)]">
  <span className="font-serif font-[number:var(--font-bold)]
    text-[length:var(--text-3xl)] md:text-[length:var(--text-4xl)]
    text-glass-text">
    {upright}
  </span>
  {' — '}
  <span className="font-serif font-[number:var(--font-bold)] italic
    text-[length:var(--text-3xl)] md:text-[length:var(--text-4xl)]
    text-glass-text">
    {italic}.
  </span>
</h1>
```
Split: `const [upright, italic] = t('headline').split(' — ')`
The ` — ` (em-dash with spaces) matches the existing EN headline. The period after
`{italic}` is decorative punctuation added in JSX, not from the translation key.

**Subtext:**
```tsx
<p className="mt-[length:var(--space-6)]
  text-[length:var(--text-lg)] text-glass-text-dim
  font-[number:var(--font-normal)] leading-[var(--leading-relaxed)]">
  {t('subheadline')}
</p>
```

**CTA button — white pill, orange text:**
Do NOT use the shadcn `<Button>` component here. The pill CTA has an inversion
treatment (`bg-white text-brand-primary`) that does not map to any Button variant
and would require overrides that pollute the component. Use a plain `<Link>`.
```tsx
<Link
  href="/pricing"
  className="mt-[length:var(--space-8)] self-start inline-flex items-center
    bg-white text-brand-primary rounded-full
    px-[length:var(--space-8)] py-[length:var(--space-3)]
    font-[number:var(--font-semibold)] text-[length:var(--text-base)]
    hover:opacity-90 transition-[var(--transition-base)]">
  {t('cta')}
</Link>
```
`self-start` prevents the button from stretching full-width on mobile.

### Stats row

Four stats, horizontal flex row, no backgrounds, separator lines only.

**`StatItem` props:** `{ value: string; label: string; separator?: boolean }`
When `separator` is true, apply `border-l border-glass-separator pl-[length:var(--space-6)]`
on the item's wrapper. Items 2–4 receive `separator`. Item 1 does not.

**Desktop (md+):** positioned `absolute bottom-[length:var(--space-12)] right-6 md:right-16 z-10`
```tsx
<div className="hidden md:flex items-end
  absolute bottom-[length:var(--space-12)] right-[length:var(--space-16)]">
  <StatItem value={t('stat1Value')} label={t('stat1Label')} />
  <StatItem value={t('stat2Value')} label={t('stat2Label')} separator />
  <StatItem value={t('stat3Value')} label={t('stat3Label')} separator />
  <StatItem value={t('stat4Value')} label={t('stat4Label')} separator />
</div>
```

**Mobile (<md):** static row, below CTA, centered. The stats are NOT absolutely
positioned on mobile — they flow in the document after the CTA button.
```tsx
<div className="flex md:hidden items-end justify-center
  mt-[length:var(--space-8)] pb-[length:var(--space-8)]">
  <StatItem value={t('stat1Value')} label={t('stat1Label')} />
  <StatItem value={t('stat2Value')} label={t('stat2Label')} separator />
  <StatItem value={t('stat3Value')} label={t('stat3Label')} separator />
  <StatItem value={t('stat4Value')} label={t('stat4Label')} separator />
</div>
```

`StatItem` rendering:
```tsx
function StatItem({ value, label, separator = false }: StatItemProps) {
  return (
    <div className={`flex flex-col items-center px-[length:var(--space-6)]
      ${separator ? 'border-l border-glass-separator' : ''}`}>
      <span className="text-[length:var(--text-2xl)] font-[number:var(--font-bold)]
        text-glass-text">
        {value}
      </span>
      <span className="text-[length:var(--text-xs)] font-[number:var(--font-normal)]
        text-glass-text">
        {label}
      </span>
    </div>
  )
}
```

---

## Implementation — ordered steps

Execute in this exact order. Do not start step N+1 until step N builds cleanly.

**1. Add photo-canvas tokens to `app/globals.css`**

Insert after the `BRAND` block and before `STATUS`:

```css
/* ==========================================
    PHOTO CANVAS
    Glass surfaces for photo-background pages (marketing hero).
    Never use on app-canvas pages (dashboard, admin, auth).
    ========================================== */
--glass-navbar-bg:      oklch(100% 0 0 / 0.10);
--glass-navbar-border:  oklch(100% 0 0 / 0.20);
--glass-badge-bg:       oklch(100% 0 0 / 0.15);
--glass-badge-border:   oklch(100% 0 0 / 0.40);
--glass-separator:      oklch(100% 0 0 / 0.30);
--glass-overlay:        oklch(0% 0 0 / 0.35);
--glass-text:           oklch(100% 0 0);
--glass-text-dim:       oklch(100% 0 0 / 0.80);
```

Add corresponding entries to the `@theme inline` block:

```css
--color-glass-navbar-bg:     var(--glass-navbar-bg);
--color-glass-navbar-border: var(--glass-navbar-border);
--color-glass-badge-bg:      var(--glass-badge-bg);
--color-glass-badge-border:  var(--glass-badge-border);
--color-glass-separator:     var(--glass-separator);
--color-glass-overlay:       var(--glass-overlay);
--color-glass-text:          var(--glass-text);
--color-glass-text-dim:      var(--glass-text-dim);
```

Run `npm run build` after this step — confirm zero errors before continuing.

**2. Load Playfair Display in `app/layout.tsx`**

Add alongside the existing `Inter` import:
```ts
import { Inter, JetBrains_Mono, Playfair_Display } from 'next/font/google'

const playfairDisplay = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['700'],
  style: ['normal', 'italic'],
})
```
Add `${playfairDisplay.variable}` to the `<html>` className.

Run `npm run build` after this step.

**3. Add `badge` key to all four locale files**

Use PowerShell `ConvertFrom-Json` + `Add-Member` + `ConvertTo-Json` — same pattern
used in previous sessions. Write with `[System.Text.UTF8Encoding]::new($false)`.
After writing, run a parse-check on each file (attempt `ConvertFrom-Json` and
confirm no error). Do this for all four locales in one script block, not one by one.

**4. Create `components/shared/GlassDetector.tsx`**

Implement the component as specified in the Design section. Export it as a named export.
The render-prop signature: `children: (isHome: boolean) => React.ReactNode`.

**5. Update `components/shared/MarketingHeader.tsx`**

- Import and wrap with `<GlassDetector>` as described.
- Apply glass/solid header classes via the `isHome` boolean from the render-prop.
- Use `data-glass={isHome}` on `<header>` for CSS cascade of child text colours.
- Switch Sign In button between glass pill and outline variant based on `isHome`.
- Inspect `LanguageSwitcher` — if its trigger text/icon does not inherit colour
  from the parent `data-glass` attribute, add a `variant?: 'glass' | 'default'`
  prop to `LanguageSwitcher` and pass it. Do not patch this with hardcoded colours.

Run `npm run build` after this step.

**6. Rewrite `components/marketing/HeroSection.tsx`**

Implement the full photo-canvas layout as specified in the Design section.
Remove the 2×2 stats grid, the `bg-brand-primary-dim` panel, and the `learnMore`
secondary button. Build desktop and mobile stats rows separately (`hidden md:flex`
and `flex md:hidden`) as specified.

Run `npm run build` after this step.

**7. Final verification**

- `npm run build` — zero errors.
- `npm test` — all tests pass. Report the exact count.
- Open the app in the browser. Confirm:
  - Homepage: glass navbar, hero photo fills viewport, badge, serif headline, white CTA pill.
  - Pricing page: solid navbar (bg-surface, dark text) — glass must NOT appear here.
  - Mobile viewport: two-zone collapses to full-width, stats appear below CTA.
  - No `MISSING_MESSAGE` warnings in the console.
  - Playfair Display loading confirmed (inspect headline element, font should show in browser devtools).

---

## Scope Limits

- Do NOT touch `HowItWorksSection`, `FAQSection`, `MarketingFooter`.
- Do NOT change `generateMetadata` or any SEO/JSON-LD in `page.tsx`.
- Do NOT modify `MarketingLayout` (`app/[locale]/(marketing)/layout.tsx`).
- Do NOT add `'use client'` to `MarketingHeader` or `HeroSection`.
- Do NOT modify `components/ui/*` (shadcn primitives).
- Do NOT add Framer Motion or any animation.
- Do NOT restructure routes or add new route groups.
- Do NOT delete `learnMore` from any locale file.
- Do NOT touch dashboard, admin, operator, or auth components.
- Keep this focused on: glass tokens, font, glass navbar toggle, hero visuals.

---

## Check When Done

- [ ] `globals.css` has `PHOTO CANVAS` token block with all 8 glass tokens
- [ ] `globals.css` `@theme inline` has all 8 `--color-glass-*` entries
- [ ] `app/layout.tsx` loads Playfair Display, `--font-playfair` variable on `<html>`
- [ ] All 4 locale files have `home.hero.badge` key — no BOM, valid JSON
- [ ] `GlassDetector.tsx` created — client component only, render-prop API, uses `useLocale()` + `usePathname()`
- [ ] `MarketingHeader` stays a Server Component — `GlassDetector` is the only client boundary
- [ ] Homepage navbar: glass styles (`bg-glass-navbar-bg`, `backdrop-blur-md`, white text)
- [ ] Pricing page navbar: solid styles (`bg-surface`, dark text) — glass does NOT leak
- [ ] Hero fills full viewport — header floats glass on top of photo
- [ ] Left zone content (badge, headline, subtext, CTA) confined to `≤50%` width on desktop
- [ ] Right zone: no UI elements — photo subject visible
- [ ] Headline: Playfair Display bold; opening clause upright, closing clause italic
- [ ] Badge: glass pill (`bg-glass-badge-bg`, `border-glass-badge-border`)
- [ ] CTA: white pill, orange text — `bg-white text-brand-primary`, NO shadcn Button
- [ ] Stats: no card backgrounds — separator lines only (`border-glass-separator`)
- [ ] Stats on desktop: `absolute` bottom-right
- [ ] Stats on mobile: static, centered, below CTA
- [ ] Hero image: `<Image fill priority>`, `alt=""`, `object-cover`
- [ ] No raw `oklch()` values in JSX — all colours via named tokens
- [ ] No inline `style={{}}` for colours or spacing
- [ ] `npm run build` passes — zero errors
- [ ] `npm test` passes — report exact count
