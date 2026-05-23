# 20b — Social Graph & Visual Discovery

Read before starting: `context/AGENTS.md`, `context/architecture-context.md`,
`context/progress-tracker.md`, `context/feature-specs/20a-seo-foundation.md`.

Add Open Graph and Twitter Card metadata so every public page produces a rich,
branded preview when shared on social networks, messaging apps, and link unfurlers.

---

## Constraints

### Tokens (UI features only)

OG images use inline CSS (Satori only supports a flexbox subset — no Tailwind, no
CSS variables). Use the hardcoded hex equivalents of the project's design tokens:

| Token | Value | Hex equivalent used in OG images |
|-------|-------|----------------------------------|
| `--brand-primary` | `oklch(60% 0.16 250)` | `#2563eb` |
| `--bg-base` | `oklch(98% 0.006 264)` | `#f8fafc` |
| `--text-primary` | `oklch(22% 0.04 264)` | `#0f172a` |
| `--text-on-accent` | `oklch(100% 0 0)` | `#ffffff` |
| `--brand-primary-dim` | `oklch(93% 0.04 250)` | `#dbeafe` |

> **Why hardcoded:** ImageResponse (Satori) renders JSX to PNG via a canvas-like
> engine. It does not parse CSS custom properties — only inline style strings.
> These hex values are the direct equivalents of the project tokens and must
> stay in sync if tokens ever change.

### Architecture

- OG image files live at `app/[locale]/(marketing)/opengraph-image.tsx` (homepage)
  and `app/[locale]/(marketing)/pricing/opengraph-image.tsx` (pricing).
  File-based placement auto-registers the image — no manual `openGraph.images` entry needed.
- `generateMetadata` in `app/[locale]/(marketing)/page.tsx` and
  `app/[locale]/(marketing)/pricing/page.tsx` are **extended** (not replaced) to add
  `openGraph` and `twitter` fields. The `alternates` and `canonical` from 20a are kept.
- Font data is loaded with Node.js `readFile` + `join(process.cwd(), ...)` — not `fetch`.
  This works because OG images are statically generated at build time by default.
- No new Server Actions, API routes, or DB queries — this is metadata + image only.
- `lib/og.ts` holds shared OG design constants (colors, sizes, font weight). Components
  do not import from it — it is only imported by the two `opengraph-image.tsx` files.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment.
- `params` in `opengraph-image.tsx` is `Promise<{ locale: string }>` in Next.js 16 — always `await` it.
- Export `alt`, `size`, and `contentType` as named constants (not inside the function).
- Use `import type { Locale } from '@/i18n/routing'` for the locale type.

### Validation

_No Zod schemas. No user input. No external data fetches in OG image generation._

### i18n

- OG image text is English-only for launch (consistent with 20a scope).
- `openGraph.title` and `twitter.title` in `generateMetadata` reuse the same English
  strings already defined in 20a — do not add new translation keys.
- Locale-specific OG image text is a stretch goal deferred to Feature 21.

---

## Design

### OG Image Layout (1200 × 630 px)

```
┌─────────────────────────────────────────────────────────────────┐
│  Brand blue (#2563eb) background — full bleed                   │
│                                                                 │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  RemoteNIF  (white, 28px, semibold, top-left)            │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  [Page headline]  (white, 64px, bold, centered)          │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  [Subline]  (light blue #dbeafe, 28px, centered)         │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  PT flag stripe (5px, bottom)  ████████████████████████████    │
└─────────────────────────────────────────────────────────────────┘
```

**Per-page content:**

| Page | Headline | Subline |
|------|----------|---------|
| Homepage | `Portuguese NIF — online, fully remote` | `Essential · Standard · Express` |
| Pricing | `NIF Application Plans` | `From €79 · AI document review included` |

**Rules:**
- Display: `flex`, `flexDirection: 'column'`, `justifyContent: 'center'`, `alignItems: 'flex-start'`
- All padding: 80px horizontal, 60px vertical
- Only flexbox — no `display: grid`, no `position: absolute` layering (breaks Satori)
- Font: Inter Bold loaded from `public/fonts/Inter-Bold.ttf`
- Font size scale: brand label 28px · headline 64px · subline 28px
- `contentType: 'image/png'`

---

## Prerequisites (manual step before implementation)

**Download Inter-Bold.ttf and place it at `public/fonts/Inter-Bold.ttf`.**

Steps:
1. Go to [fonts.google.com/specimen/Inter](https://fonts.google.com/specimen/Inter)
2. Click "Download family" → unzip
3. From the zip, copy `Inter_28pt-Bold.ttf` (or `Inter-Bold.ttf`) to `public/fonts/Inter-Bold.ttf`

> **Why local file, not CDN fetch:** `readFile` is synchronous-friendly and works
> at build time with zero network dependency. CDN fetches can fail in CI environments
> with restricted outbound access. The font is small (~300KB) and static — serve it
> from the repo.

---

## Implementation

### Step 1 — Create `lib/og.ts` (shared OG design constants)

```typescript
// Shared constants for OG image generation.
// Imported only by opengraph-image.tsx files — not by components or pages.

// Brand color hex equivalents of design tokens (CSS vars not supported in Satori)
export const OG_COLORS = {
  background: '#2563eb',   // --brand-primary
  text:       '#ffffff',   // --text-on-accent
  subtext:    '#dbeafe',   // --brand-primary-dim
  stripe:     '#1d4ed8',   // slightly darker blue for bottom accent
} as const

// Standard OG image dimensions (Facebook, Twitter, LinkedIn)
export const OG_SIZE = { width: 1200, height: 630 } as const

// Font config reused across both OG image files
export const OG_FONT = {
  family: 'Inter',
  weight: 700,
  style: 'normal',
} as const
```

---

### Step 2 — Create `app/[locale]/(marketing)/opengraph-image.tsx` (homepage)

```tsx
import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { OG_COLORS, OG_SIZE, OG_FONT } from '@/lib/og'

// Standard OG image metadata — auto-registered by Next.js file convention
export const alt = 'RemoteNIF — Get your Portuguese NIF online, fully remote'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image() {
  // Load Inter Bold from public/fonts — runs at build time (static generation)
  const fontData = await readFile(join(process.cwd(), 'public/fonts/Inter-Bold.ttf'))

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          backgroundColor: OG_COLORS.background,
          padding: '60px 80px',
        }}
      >
        {/* Brand label */}
        <div
          style={{
            fontSize: 28,
            fontFamily: OG_FONT.family,
            fontWeight: OG_FONT.weight,
            color: OG_COLORS.text,
            marginBottom: 40,
            letterSpacing: '-0.5px',
          }}
        >
          RemoteNIF
        </div>

        {/* Main headline */}
        <div
          style={{
            fontSize: 64,
            fontFamily: OG_FONT.family,
            fontWeight: OG_FONT.weight,
            color: OG_COLORS.text,
            lineHeight: 1.15,
            marginBottom: 24,
          }}
        >
          Portuguese NIF —
          online, fully remote
        </div>

        {/* Subline */}
        <div
          style={{
            fontSize: 28,
            fontFamily: OG_FONT.family,
            color: OG_COLORS.subtext,
          }}
        >
          Essential · Standard · Express
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        {
          name: OG_FONT.family,
          data: fontData.buffer as ArrayBuffer,
          weight: OG_FONT.weight,
          style: OG_FONT.style,
        },
      ],
    }
  )
}
```

---

### Step 3 — Create `app/[locale]/(marketing)/pricing/opengraph-image.tsx` (pricing)

Same structure as Step 2. Differences: headline and subline text only.

```tsx
import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { OG_COLORS, OG_SIZE, OG_FONT } from '@/lib/og'

export const alt = 'RemoteNIF Pricing — NIF application plans from €79'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image() {
  const fontData = await readFile(join(process.cwd(), 'public/fonts/Inter-Bold.ttf'))

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          backgroundColor: OG_COLORS.background,
          padding: '60px 80px',
        }}
      >
        {/* Brand label */}
        <div
          style={{
            fontSize: 28,
            fontFamily: OG_FONT.family,
            fontWeight: OG_FONT.weight,
            color: OG_COLORS.text,
            marginBottom: 40,
            letterSpacing: '-0.5px',
          }}
        >
          RemoteNIF
        </div>

        {/* Main headline */}
        <div
          style={{
            fontSize: 64,
            fontFamily: OG_FONT.family,
            fontWeight: OG_FONT.weight,
            color: OG_COLORS.text,
            lineHeight: 1.15,
            marginBottom: 24,
          }}
        >
          NIF Application Plans
        </div>

        {/* Subline */}
        <div
          style={{
            fontSize: 28,
            fontFamily: OG_FONT.family,
            color: OG_COLORS.subtext,
          }}
        >
          From €79 · AI document review included
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        {
          name: OG_FONT.family,
          data: fontData.buffer as ArrayBuffer,
          weight: OG_FONT.weight,
          style: OG_FONT.style,
        },
      ],
    }
  )
}
```

---

### Step 4 — Extend homepage `generateMetadata` to add `openGraph` + `twitter`

File: `app/[locale]/(marketing)/page.tsx`

Extend the existing `generateMetadata` return value. Keep all 20a fields (`title`,
`description`, `alternates`) unchanged — add the new fields alongside them.

```typescript
// Inside the existing generateMetadata return:
return {
  // --- 20a fields (keep as-is) ---
  title: 'Get Your Portuguese NIF Online — Fast & Fully Remote',
  description:
    'Apply for a Portuguese NIF (Tax Identification Number) from anywhere in the world. ' +
    'Choose Essential, Standard, or Express. No hidden fees. AI document review included.',
  alternates: { canonical, languages },

  // --- 20b additions ---
  openGraph: {
    title: 'Get Your Portuguese NIF Online — Fast & Fully Remote',
    description:
      'Apply for a Portuguese NIF from anywhere. Essential, Standard, or Express. ' +
      'No hidden fees. AI document review included.',
    url: canonical,
    siteName: 'RemoteNIF',
    type: 'website',
    // og:image is auto-registered by opengraph-image.tsx — do not set images here
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Get Your Portuguese NIF Online — Fast & Fully Remote',
    description:
      'Apply for a Portuguese NIF from anywhere. Essential, Standard, or Express.',
  },
}
```

> **Note on `openGraph.images`:** Do NOT add an `images` field here. When
> `opengraph-image.tsx` is co-located in the same route segment, Next.js
> automatically injects `og:image` from that file. Manually specifying `images`
> would cause duplicates.

---

### Step 5 — Extend pricing `generateMetadata` to add `openGraph` + `twitter`

File: `app/[locale]/(marketing)/pricing/page.tsx`

Same pattern as Step 4:

```typescript
// Inside the existing generateMetadata return:
return {
  // --- 20a fields (keep as-is) ---
  title: 'Pricing — NIF Application Plans',
  description:
    'Compare Essential (€79), Standard (€129), and Express (€179) NIF application plans. ' +
    'All include AI document review and admin verification. Choose the speed you need.',
  alternates: { canonical, languages },

  // --- 20b additions ---
  openGraph: {
    title: 'NIF Application Plans — RemoteNIF',
    description:
      'Compare Essential (€79), Standard (€129), and Express (€179) plans. ' +
      'All include AI document review and admin verification.',
    url: canonical,
    siteName: 'RemoteNIF',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NIF Application Plans — RemoteNIF',
    description:
      'Compare Essential (€79), Standard (€129), and Express (€179) plans. AI document review included.',
  },
}
```

---

## Dependencies

No new packages. `next/og` ships with Next.js — `ImageResponse` is available at
`import { ImageResponse } from 'next/og'` without any additional install.

---

## Scope Limits

- **Do not add JSON-LD** — that is Feature 20c.
- **Do not add `robots.ts`, `sitemap.ts`, or `llms.txt`** — that is Feature 20d.
- **Do not create `twitter-image.tsx` files** — Twitter/X falls back to `og:image`,
  and `twitter.card: 'summary_large_image'` in metadata is sufficient. A separate
  `twitter-image.tsx` would be redundant with the same content.
- **Do not add OG metadata to dashboard, admin, or operator pages** — they are noindexed
  (20a) and should not generate share previews.
- **Do not add per-locale OG image text** — English-only is the launch requirement.
  Locale-specific text is a stretch goal for Feature 21.
- **Do not modify `components/ui/*`** — no UI changes.
- **Do not add `opengraph-image.tsx` to the root `app/` or `app/[locale]/` level** —
  place only in `(marketing)` route group to avoid affecting protected routes.
- Keep `lib/og.ts` as constants only — no logic, no async functions, no React components.

---

## Check When Done

- [ ] `public/fonts/Inter-Bold.ttf` exists (manual prerequisite).
- [ ] `lib/og.ts` exists and exports `OG_COLORS`, `OG_SIZE`, `OG_FONT`.
- [ ] `app/[locale]/(marketing)/opengraph-image.tsx` exists and exports `alt`, `size`, `contentType`, and a default function.
- [ ] `app/[locale]/(marketing)/pricing/opengraph-image.tsx` exists with distinct headline/subline text.
- [ ] `GET /opengraph-image` (or `/_next/image?...`) returns a 200 PNG at 1200×630.
- [ ] Homepage `<head>` contains `og:title`, `og:description`, `og:url`, `og:type`, `og:image`, `og:image:width`, `og:image:height`.
- [ ] Pricing page `<head>` contains same OG tags with pricing-specific content.
- [ ] `<meta name="twitter:card" content="summary_large_image" />` present on homepage and pricing.
- [ ] `og:image` on homepage and pricing page point to different URLs (distinct images, not the same).
- [ ] `npm run build` passes with no errors.
