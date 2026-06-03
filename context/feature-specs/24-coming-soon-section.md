# 24 — Coming Soon Section

<!-- Read before starting: context/AGENTS.md, context/progress-tracker.md,
     context/ui-context.md, context/architecture-context.md, context/code-standards.md -->

Adds a center-focused card carousel section to the homepage, placed just before the footer,
showcasing 6 upcoming resource topics (all marked "Coming Soon") to give depth to the homepage.

---

## Constraints

### Tokens (UI features only)

| Purpose                        | Token                        | Tailwind utility                      |
|--------------------------------|------------------------------|---------------------------------------|
| Section background             | `var(--bg-base)`             | `bg-[var(--bg-base)]`                 |
| Card background                | `var(--bg-surface)`          | `bg-surface`                          |
| Card border                    | `var(--border-default)`      | `border-border-default`               |
| Card shadow                    | `var(--shadow-md)`           | `shadow-[var(--shadow-md)]`           |
| Section title text             | `var(--text-primary)`        | `text-text-primary`                   |
| Highlighted word ("next")      | `var(--brand-primary)`       | `text-brand-primary`                  |
| Section subtitle               | `var(--text-muted)`          | `text-text-muted`                     |
| Card title                     | `var(--text-primary)`        | `text-text-primary`                   |
| Card description               | `var(--text-secondary)`      | `text-text-secondary`                 |
| Badge background               | `var(--brand-primary-dim)`   | `bg-brand-primary-dim`                |
| Badge text                     | `var(--brand-primary)`       | `text-brand-primary`                  |
| Active dot                     | `var(--brand-primary)`       | `bg-brand-primary`                    |
| Inactive dot                   | `var(--border-default)`      | `bg-border-default`                   |
| Card border radius             | `var(--radius-xl)`           | `rounded-[length:var(--radius-xl)]`   |
| Badge border radius            | `var(--radius-full)`         | `rounded-[length:var(--radius-full)]` |
| Transition                     | `var(--transition-smooth)`   | `transition-all duration-300 ease-out`|

Rules that always apply to UI work in this project:
- No raw Tailwind color classes (`zinc-*`, `slate-*`, `blue-*`). Tokens only.
- No hardcoded hex or rgb values.
- Mobile-first. Add breakpoint variants only where layout actually changes.
- Border radius from scale: `--radius-sm` / `md` / `lg` / `xl` / `2xl` / `full`.
- Shadows from scale: `--shadow-sm` / `md` / `lg` / `xl`.
- Shadcn components when possible.

### Architecture

- `ComingSoonSection` is a Server Component — it renders the section heading and passes static card data down to the carousel. No `'use client'`.
- `ComingSoonCarousel` is a Client Component (`'use client'`) — it owns all carousel state (selected index, dot rendering), Embla event subscriptions, and the scale/opacity logic for non-center cards.
- `ComingSoonCard` is a pure presentational component — no state, no hooks. It receives props and renders the card UI. It lives in `components/marketing/ComingSoonCard.tsx`.
- Static card data (title, description, image path, image alt) is defined as a typed constant array inside `ComingSoonCarousel.tsx`. It does not come from the database or any API.
- The carousel config uses `opts={{ align: 'center', loop: true }}`.
- All components live in `components/marketing/`.
- The section is wired into `app/[locale]/(marketing)/page.tsx` after `<FAQSection />`.
- No Server Actions. No DB queries. No API routes.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment explaining why.
- Define a `ComingSoonCardData` interface for the static card items: `{ titleKey, descriptionKey, imageSrc, imageAlt }` where title/description keys are i18n keys.
- Use `z.infer` pattern only if a Zod schema is added — not required here since there is no external input.
- Use `interface` for props and data shapes.

### Validation

No external input — no Zod schema required for this feature.

### i18n

- All user-facing strings go in `messages/en.json` under the `home.comingSoon` namespace.
- Use `getTranslations('home.comingSoon')` in `ComingSoonSection` (Server Component).
- Use `useTranslations('home.comingSoon')` in `ComingSoonCarousel` (Client Component).
- Add the same keys (untranslated — copy English values) to `fr.json`, `es.json`, `de.json`.

Keys to add under `home.comingSoon`:

```json
{
  "titleBefore": "What comes ",
  "titleHighlight": "next",
  "subtitle": "Everything you need to settle in Portugal — guides coming soon.",
  "badge": "Coming Soon",
  "card1Title": "Open a Portuguese Bank Account",
  "card1Description": "From Millennium BCP to Revolut — find the right account for your situation.",
  "card1ImageAlt": "Bank account illustration",
  "card2Title": "Apply for a Portuguese Visa",
  "card2Description": "Passive income, digital nomad, or remote work — understand which visa fits you.",
  "card2ImageAlt": "Visa illustration",
  "card3Title": "Buy Property in Portugal",
  "card3Description": "From promissory contract to deed — what your NIF is needed for and when.",
  "card3ImageAlt": "Property illustration",
  "card4Title": "Understand the NHR & IFICI Tax Regimes",
  "card4Description": "Flat-rate tax benefits for new residents — who qualifies and how to apply.",
  "card4ImageAlt": "Tax regime illustration",
  "card5Title": "Register for Social Security (NISS)",
  "card5Description": "Required if you work or live in Portugal — how to get your number fast.",
  "card5ImageAlt": "Social security illustration",
  "card6Title": "Access the Portuguese Health System (SNS)",
  "card6Description": "Register at your local health centre and get your SNS user number.",
  "card6ImageAlt": "Healthcare illustration"
}
```

---

## Design

### Section heading

```
What comes next
```

- "What comes " — `font-serif` (Playfair Display), bold, `text-text-primary`
- "next" — `font-serif`, bold, **italic**, `text-brand-primary`
- Subtitle below in `font-sans`, normal weight, `text-text-muted`, smaller size (`--text-sm`)
- Heading centered on all breakpoints

### Carousel layout

- Section background: `--bg-base`
- Visible area shows the center card fully + partial glimpse of left and right cards
- Card fixed width: `280px` on mobile, `320px` on desktop (`md:`)
- Center card (active): `scale-100`, `opacity-100`, full shadow (`--shadow-md`)
- Adjacent cards (distance 1 from center): `scale-[0.88]`, `opacity-60`, no shadow
- Far cards (distance 2+): `scale-[0.80]`, `opacity-40`, no shadow
- Scale and opacity change uses `transition-all duration-300 ease-out`
- The carousel container uses `overflow: visible` on each slide so scaled cards peek in from sides

### Card anatomy (top to bottom)

1. **"Coming Soon" badge** — top-right corner, small pill (`--radius-full`), `--brand-primary-dim` background, `--brand-primary` text, `text-xs`
2. **Card title** — `font-serif`, bold, `text-text-primary`, `text-xl`, `leading-tight`
3. **Card description** — `font-sans`, normal weight, `text-text-secondary`, `text-sm`, `leading-relaxed`
4. **Illustration image** — pushed to bottom via `mt-auto`, `object-contain`, fixed height `160px`, centered

### Pagination dots

- Row of 6 dots centered below the carousel, `mt-8`
- Active dot: 10px circle, `--brand-primary`
- Inactive dot: 8px circle, `--border-default`
- Clicking a dot scrolls the carousel to that slide
- Dots update in sync with carousel scroll/swipe

---

## Implementation

1. Install the shadcn `carousel` component:
   ```
   npx shadcn@latest add carousel
   ```

2. Create `components/marketing/ComingSoonCard.tsx` — pure presentational component:
   - Props: `title`, `description`, `imageSrc`, `imageAlt`, `badgeLabel`, `isActive`, `distance` (number — 0 = center, 1 = adjacent, 2+ = far)
   - Renders the card structure (badge top-right, serif title, sans description, image at bottom)
   - Applies scale and opacity classes based on `distance`:
     - `distance === 0`: `scale-100 opacity-100 shadow-[var(--shadow-md)]`
     - `distance === 1`: `scale-[0.88] opacity-60`
     - `distance >= 2`: `scale-[0.80] opacity-40`
   - Wraps all classes with `transition-all duration-300 ease-out`

3. Create `components/marketing/ComingSoonCarousel.tsx` — Client Component (`'use client'`):
   - Defines the `CARDS` constant array (6 items) with i18n keys and image paths:
     ```
     { titleKey: 'card1Title', descriptionKey: 'card1Description',
       imageSrc: '/images/comingsoon-card1-image.png', imageAltKey: 'card1ImageAlt' }
     ```
     ...repeated for cards 2–6.
   - Uses `useTranslations('home.comingSoon')` to resolve all text.
   - Uses the shadcn `Carousel`, `CarouselContent`, `CarouselItem` primitives with `opts={{ align: 'center', loop: true }}`.
   - Imports `CarouselApi` type from `@/components/ui/carousel`.
   - Holds `api` in `useState<CarouselApi>()` and passes it to `<Carousel setApi={setApi}>`.
   - Tracks `selectedIndex` in `useState` (default: `0`).
   - Subscribes to the Embla `select` event inside `useEffect([api])`: calls `api.on('select', () => setSelectedIndex(api.selectedScrollSnap()))` — `selectedScrollSnap()` is the correct Embla method for the current snap index.
   - Computes `distance` for each card: `Math.min(Math.abs(index - selectedIndex), CARDS.length - Math.abs(index - selectedIndex))` (accounts for loop wrap).
   - Renders `<ComingSoonCard>` inside each `CarouselItem`, passing `distance`.
   - Renders pagination dots row below the carousel: 6 dots, active dot uses brand color and larger size, clicking calls `api.scrollTo(index)`.
   - Does **not** render shadcn's `CarouselPrevious` / `CarouselNext` buttons — navigation is via swipe and dots only.

4. Create `components/marketing/ComingSoonSection.tsx` — Server Component:
   - Uses `getTranslations('home.comingSoon')` to pass the heading strings as props.
   - Renders the section wrapper (`<section>`) with `bg-[var(--bg-base)]` and vertical padding.
   - Renders the centered heading block:
     - `<h2>` with `font-serif font-bold text-3xl text-text-primary`
     - "titleBefore" text + `<span>` for "titleHighlight" in `text-brand-primary italic`
   - Renders the subtitle `<p>` in `text-text-muted text-sm font-sans`
   - Renders `<ComingSoonCarousel />` below the heading.

5. Add `home.comingSoon` keys to `messages/en.json` (under the `home` object, as a new `comingSoon` sub-object with all 14 keys listed in the i18n section above).

6. Add the same keys (same English values, untranslated) to `messages/fr.json`, `messages/es.json`, `messages/de.json`.

7. Wire the section into `app/[locale]/(marketing)/page.tsx`:
   - Import `ComingSoonSection` from `@/components/marketing/ComingSoonSection`
   - Add `<ComingSoonSection />` after `<FAQSection />` and before the `<JsonLd>` block.

---

## Dependencies

Install: `embla-carousel-react` (installed automatically via shadcn carousel — do not install separately)

Run: `npx shadcn@latest add carousel`

---

## Scope Limits

- Do not make the cards link anywhere — all links are deferred to post-launch.
- Do not add hover states that suggest the card is clickable (no cursor-pointer, no link underlines).
- Do not add any new color tokens or primitives — use existing tokens only.
- Do not modify `components/ui/carousel.tsx` after shadcn generates it.
- Do not build the resource pages themselves — this feature is the teaser section only.
- Do not add autoplay — the carousel only moves on user interaction (swipe, drag, dot click).
- Do not add prev/next arrow buttons — navigation is via swipe and dots only.
- Keep this focused on the static marketing section.

---

## Check When Done

- Section appears on the homepage after `<FAQSection />` and before the footer.
- Section heading reads "What comes next" with "next" in brand orange and italic using Playfair Display.
- Subtitle renders in Inter, muted color.
- All 6 cards appear in the carousel with title (Playfair, bold), description (Inter), image, and "Coming Soon" badge.
- Center card is full size and full opacity; adjacent cards are visibly smaller and faded; far cards are further faded.
- Scrolling/swiping animates the scale and opacity transition smoothly.
- Pagination dots update to reflect the current center card.
- Clicking a dot scrolls to that card.
- Loop works: swiping past card 6 wraps back to card 1.
- All 6 card images render correctly from `/images/comingsoon-card*-image.png`.
- No hardcoded English strings — all text comes from `messages/*.json`.
- All 4 locale files have the `home.comingSoon` keys.
- `npm run build` passes.
