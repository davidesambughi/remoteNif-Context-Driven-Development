# Design Principles

<!-- Source of truth hierarchy:
     globals.css            → token values (the numbers)
     ui-context.md          → component code patterns
     design-principles.md   → visual judgment rules (this file)

     Read all three together before implementing any screen.
     These principles describe what tokens alone cannot: the WHY behind every visual decision.
     They were derived from the reference image (public/Gemini_Generated_Image_wlahzvwlahzvwlah.png)
     and the description provided for the RemoteNIF hero. -->

---

## The Surface Model — Two Distinct Worlds

This product has two visually separate environments. Every screen belongs to one of them.

**World 1 — Photo canvas (marketing/hero surfaces)**
The background is a full-viewport lifestyle photo. All UI elements sit *on top* of the image. Text is always white. There are no cards, panels, or background colors — the photo is the surface. This world uses `--font-serif` for headlines.

**World 2 — App canvas (dashboard, admin, auth surfaces)**
The background is the token-based surface stack (`--bg-base` → `--bg-surface` → `--bg-elevated`). Text follows the token hierarchy (`--text-primary`, `--text-secondary`, `--text-muted`). Standard cards and borders apply. This world uses `--font-sans` only.

**The rule:** Never mix these worlds. Do not put photo-canvas patterns (white text, glass elements) on app-canvas pages, and do not put app-canvas patterns (card borders, token backgrounds) on photo-canvas pages.

---

## 1. Visual Hierarchy — The Photo Wins, Then the Headline

In the photo-canvas world, visual hierarchy has a fixed order that must never be disrupted:

1. **The photo** — dominant. It occupies the full viewport and is the first thing the eye lands on.
2. **The headline** — second. Large, white, serif. It is the only text element that competes for attention.
3. **The stats** — third. White, small, minimal. They confirm trust but do not demand attention.
4. **The navbar** — last. Glass, low contrast, recedes into the photo.

**The rule:** Nothing in the left content column competes with the headline in size or visual weight. The badge, subtext, and CTA button are all significantly smaller. If any element feels as prominent as the headline, it is wrong.

---

## 2. The Two-Zone Layout — Text Left, Face Right

The viewport is divided into two implicit zones. This division is never marked with a line or a background — it is created purely by content placement.

**Left zone (~50% width):** Contains all text content — badge, headline, subtext, CTA. Everything is left-aligned within this zone. Nothing exits the left half.

**Right zone (~50% width):** Reserved for the photo subject (the face). No text, no UI elements, no overlays enter this zone. The emptiness is intentional — it is the breathing room.

**The rule:** The right zone must remain empty of UI. If a design decision places text or interactive elements in the right half, it is wrong. The photo already provides the visual richness — the right half does not need filling.

---

## 3. Contrast on a Photo — White Only, No Exceptions

All text that sits on top of a photo must be white (`--color-white` / `oklch(100% 0 0)`). No greys, no dark text, no brand-colored text. Color contrast on a variable-tone photo is unreliable — only white guarantees legibility.

**Subtext opacity:** Subtext can use white at reduced opacity (approximately 80–85%) to create hierarchy relative to the headline without introducing a new color. This is the only permitted opacity reduction — it must remain clearly legible.

**The rule:** On photo surfaces, the hierarchy tool is size and weight, not color. White is the only text color. Opacity is the only way to de-emphasize.

---

## 4. Typography — Serif for Emotion, Sans for Information

The serif headline (Playfair Display) and the sans-serif subtext (Inter) serve different purposes and must not be swapped.

**Serif (`--font-serif`):** Used exclusively for the hero headline. Its role is warmth and emotional register — it signals that this product is human, not bureaucratic. It must be bold and italic in the hero context. Using it anywhere else dilutes this effect.

**Sans-serif (`--font-sans`):** Used for everything else — subtext, badges, stats, navbar links, buttons, all app-canvas text. Clean and readable at small sizes.

**The typographic scale in the hero:**
| Element | Size | Weight | Style |
|---|---|---|---|
| Headline — upright part | `--text-4xl` (40px) | bold | upright |
| Headline — italic part | `--text-4xl` (40px) | bold | italic |
| Subtext | `--text-lg` (18px) | normal | upright |
| Badge text | `--text-xs` (12px) | medium | upright |
| Stat number | `--text-2xl` (24px) | bold | upright |
| Stat label | `--text-xs` (12px) | normal | upright |
| Navbar links | `--text-sm` (14px) | medium | upright |

**The scale rule:** The jump from headline to subtext must span at least two steps. Headline is `--text-4xl`, subtext is `--text-lg` — that is a two-step drop. Never reduce this gap.

**The italic rule:** In the hero headline, the *last clause* is italic ("Fast, Transparent, Reliable."). The opening clause is upright. This contrast within the headline creates movement — the italic part is the emotional payoff. The split is always upright → italic, never italic → upright.

---

## 5. Whitespace — Vertical Concentration, Not Even Distribution

Whitespace in the hero is concentrated vertically around the text block. It is not evenly padded on all sides.

**Specific spacing in the hero:**
- Above the badge (from top of viewport): the content block sits in the **lower half** of the viewport — approximately 55–65% from the top. The photo fills the space above.
- Badge → headline: `--space-4` (16px)
- Headline → subtext: `--space-6` (24px)
- Subtext → CTA button: `--space-8` (32px)
- CTA button → bottom of viewport: `--space-12` (48px) minimum

**What even whitespace looks like and why it fails:** If equal padding is applied above and below the content block, the text floats in the center of the photo and loses its ground. The content should feel anchored to the bottom-left, not centered.

---

## 6. The Navbar — Glass, Not Solid

The navbar uses glassmorphism: semi-transparent white background with backdrop blur. It does not use a solid color — that would create a visual band that cuts the photo in two.

**Navbar token values:**
- Background: `oklch(100% 0 0 / 0.10)` (white at 10% opacity)
- Backdrop blur: `blur(16px)`
- Bottom border: `1px solid oklch(100% 0 0 / 0.20)` (white at 20% opacity)
- All text and icons: white (`--color-white`)

**CTA pill button in navbar:**
- Background: `--brand-primary` (warm orange)
- Text: white (`--text-on-accent`)
- Radius: `--radius-full` (pill)
- Padding: `--space-3` vertical, `--space-6` horizontal

**The rule:** The navbar must never use a solid background color on photo-canvas pages. On app-canvas pages (dashboard, auth), the navbar uses the standard token-based surface.

---

## 7. The Stats Row — Restraint Is the Design

The stats row uses no cards, no backgrounds, no shadows, no rounded corners. The only separator between items is a single thin vertical line.

**Stats row pattern:**
- Layout: horizontal flex row, bottom-right of viewport
- Each stat: bold large number on top, small label below
- Separator: `1px solid oklch(100% 0 0 / 0.30)` (white at 30% opacity), left border only on items 2+
- Gap between stat and separator: `--space-6` (24px) on each side
- Text: all white, no opacity reduction

**The rule:** Adding a card, background, or shadow to the stats row turns it into a UI component. It should feel like part of the photo, not an element placed on top of it. The restraint is deliberate.

---

## 8. The Badge — Glass, Not Solid

The small pill badge above the headline ("No hidden fees") uses glassmorphism, not a solid brand color.

**Badge pattern:**
- Background: `oklch(100% 0 0 / 0.15)` (white at 15% opacity)
- Border: `1px solid oklch(100% 0 0 / 0.40)` (white at 40% opacity)
- Text: white, `--text-xs`, `--font-medium`
- Radius: `--radius-full` (pill)
- Padding: `--space-2` vertical, `--space-4` horizontal

**The rule:** A solid-colored badge would create a competing focal point near the headline. Glass keeps it present but subordinate.

---

## 9. The CTA Button — White Pill, Orange Text

The primary CTA button on the photo canvas inverts the usual pattern: white background, brand-orange text. This is the reverse of the navbar pill (orange bg, white text).

**Hero CTA button:**
- Background: white (`--color-white`)
- Text: `--brand-primary` (warm orange)
- Radius: `--radius-full` (pill)
- Padding: `--space-3` vertical, `--space-8` horizontal
- Font: `--font-semibold`

**The inversion logic:** The navbar button draws attention by being the only orange element in the glass bar. The hero CTA draws attention by being the only white solid element in a photo-dominant section. Both use contrast against their immediate context — not the same treatment everywhere.

---

## Anti-Patterns

| Anti-pattern | Why it fails |
|---|---|
| Dark text on photo | Contrast is unpredictable on a variable-tone image |
| UI elements in the right half | Destroys the breathing room — right zone is reserved for the photo subject |
| Solid navbar background on photo canvas | Cuts the photo in two — always use glass |
| Stats in cards or with backgrounds | Turns trust signals into UI components — they should feel embedded in the photo |
| Serif font outside of hero headlines | Dilutes the warmth signal — serif is used once, intentionally |
| CTA button same style in navbar and hero | Loses the inversion logic — each context uses the opposite treatment |
| Content block centered vertically | Loses the bottom-anchored grounding — content sits in the lower half |
| Italic applied to the full headline | Loses the upright→italic movement — only the final clause is italic |

---

## Implementation Checklist

Before shipping any photo-canvas component:

- [ ] Text is white only — no greys, no brand colors, no dark text
- [ ] All UI elements are in the left half — right half is empty
- [ ] Content block is anchored to the bottom-left, not centered
- [ ] Navbar uses glass (10% white + blur), not solid
- [ ] Badge uses glass (15% white + border), not solid brand color
- [ ] Hero CTA is white pill with orange text
- [ ] Stats row has no cards, no backgrounds — separators only
- [ ] Headline uses `--font-serif`, bold, upright → italic split
- [ ] Subtext uses `--font-sans`, `--text-lg`, ~80% white opacity
- [ ] No token values are hardcoded — all reference `globals.css`
