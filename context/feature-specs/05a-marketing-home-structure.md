# 05a — Marketing Home (Structure)

Read `context/AGENTS.md`, `context/progress-tracker.md` before starting.

Build the public homepage — Hero, How It Works, FAQ — in English only. All four locale files get identical English strings; translations come in 05b. Follows the mid-fidelity mobile mockup (`public/images/mid-fidelity_homepage.png`).

---

## Constraints

### Tokens

| Purpose | Token | Tailwind utility |
|---------|-------|-----------------|
| Page canvas | `var(--bg-base)` | `bg-[var(--bg-base)]` |
| Card / panel background | `var(--bg-surface)` | `bg-[var(--bg-surface)]` |
| Muted section background | `var(--bg-subtle)` | `bg-[var(--bg-subtle)]` |
| Primary heading | `var(--text-primary)` | `text-[var(--text-primary)]` |
| Supporting text | `var(--text-secondary)` | `text-[var(--text-secondary)]` |
| Muted / caption | `var(--text-muted)` | `text-[var(--text-muted)]` |
| Text on accent bg | `var(--text-on-accent)` | `text-[var(--text-on-accent)]` |
| Primary CTA bg | `var(--brand-primary)` | `bg-[var(--brand-primary)]` |
| Secondary accent | `var(--brand-secondary)` | `text-[var(--brand-secondary)]` |
| Standard border | `var(--border-default)` | `border-[var(--border-default)]` |
| Subtle border | `var(--border-subtle)` | `border-[var(--border-subtle)]` |
| Card shadow | `var(--shadow-md)` | `shadow-[var(--shadow-md)]` |
| Success color | `var(--status-success)` | `text-[var(--status-success)]` |

Rules always active:
- No raw Tailwind color classes. Tokens only.
- No hardcoded hex/rgb.
- Mobile-first — breakpoint variants only where layout actually changes.
- Border radius from scale only.
- Shadows from scale only.

### Architecture

- Purely presentational — no Server Actions, no DB queries.
- All components are Server Components except `LanguageSwitcher` (`"use client"`).
- Page: `app/[locale]/(marketing)/page.tsx`
- Marketing layout: `app/[locale]/(marketing)/layout.tsx`
- Section components: `components/marketing/`
- Shared layout components: `components/shared/`
- No API routes.

### TypeScript

- Strict mode. No `any`.
- `interface` for props. `type` for unions.
- No props needed on section components — they read translations internally via `useTranslations`.

### Validation

No forms. No Zod schemas needed.

### i18n

- All strings go in `messages/en.json` under the `home` namespace.
- Use `useTranslations('home')` in section components.
- No hardcoded English strings in JSX.
- Copy identical English strings to `fr.json`, `es.json`, `de.json` — real translations are 05b.
- Navigation strings (Sign In, Get Started) go under `common.nav`.

---

## Design

Follows the mid-fidelity mockup. Mobile-first — everything built for a ~375px viewport, enhanced for wider screens.

### Header (sticky)
- `sticky top-0 z-50 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]`
- Inner: `max-w-7xl mx-auto px-4 h-14 flex items-center justify-between`
- Left: "RemoteNIF" in `font-semibold text-[var(--text-primary)]`
- Right: "Sign In" — outline button style (`border border-[var(--border-default)] text-[var(--text-primary)]`), links to `/signin`
- No nav links on mobile — header stays minimal

### Hero Section
- `bg-[var(--bg-surface)] px-4 pt-10 pb-8`
- Headline: `text-3xl font-bold leading-tight text-[var(--text-primary)]` — "Get Your Portuguese NIF Online — Fast, Transparent, Reliable"
- Sub-headline: `text-base text-[var(--text-secondary)] mt-3 leading-relaxed` — addresses Marcus's problem (no hidden fees, deadline-aware, remote)
- CTA: full-width primary button `w-full mt-6` — "Get Started" → `/pricing`
- Secondary: full-width outline button `w-full mt-3` — "Learn More" → `#how-it-works`
- Stats grid: `mt-8 grid grid-cols-2 gap-4` — 4 items, each with a bold value and a muted label
  - Stats use real product facts: "From €79" / "5 days" / "48h Express" / "Zero hidden fees"

### How It Works Section
- `id="how-it-works"` on the section element
- `bg-[var(--bg-base)] px-4 py-12`
- Heading: `text-2xl font-bold text-[var(--text-primary)]` — "A Transparent 3-Step Process"
- Sub-heading: `text-sm text-[var(--text-secondary)] mt-2` — one line describing the simplification
- 3 steps stacked vertically on mobile (`flex flex-col gap-6 mt-8`), row on `md:`
- Each step card: `bg-[var(--bg-surface)] rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-md)]`
  - Step number badge: `text-4xl font-bold text-[var(--brand-primary)] opacity-20` (large, background-style)
  - Step title: `text-lg font-semibold text-[var(--text-primary)]`
  - Step description: `text-sm text-[var(--text-secondary)] mt-1`
- Steps: 01 Choose Your Tier / 02 Upload Your Documents / 03 Receive Your NIF

### FAQ Section
- `bg-[var(--bg-surface)] px-4 py-12`
- Heading: `text-2xl font-bold text-[var(--text-primary)]` — "Frequently Asked Questions"
- Sub-heading: `text-sm text-[var(--text-secondary)] mt-2`
- shadcn `Accordion` `type="single" collapsible` below heading, `mt-6`
- 5 items with specific Q&A (see i18n keys below)

### Footer
- `bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] px-4 py-8`
- Brand name top: `text-base font-semibold text-[var(--text-primary)]`
- Copyright line: `text-xs text-[var(--text-muted)] mt-1`
- Nav links row: `mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--text-secondary)]` — Pricing, Process, Terms of Service, Privacy Policy
- `<LanguageSwitcher />` below links

### Language Switcher
- `"use client"` — minimal `<select>` with options EN / FR / ES / DE
- `text-sm text-[var(--text-secondary)]`
- On change: `router.replace(pathname, { locale: value })` using `useRouter` and `usePathname` from `@/i18n/navigation`, `useLocale` from `next-intl`

---

## Implementation

1. Install shadcn accordion:
   ```
   npx shadcn add accordion
   ```

2. Create `app/[locale]/(marketing)/layout.tsx` — Server Component:
   - Imports `MarketingHeader` and `MarketingFooter`
   - Returns `<div className="min-h-screen bg-[var(--bg-base)]"><MarketingHeader /><main>{children}</main><MarketingFooter /></div>`

3. Create `components/shared/LanguageSwitcher.tsx` — `"use client"`:
   - `useLocale` from `next-intl`, `useRouter` + `usePathname` from `@/i18n/navigation`
   - `<select>` with options: `{ value: 'en', label: 'English' }` / `fr` / `es` / `de`
   - `onChange` calls `router.replace(pathname, { locale: e.target.value })`

4. Create `components/shared/MarketingHeader.tsx` — Server Component:
   - Sticky bar with brand name (Link to `/`) and Sign In button (Link to `/signin`)
   - Uses `useTranslations('common.nav')`

5. Create `components/shared/MarketingFooter.tsx` — Server Component:
   - Brand name, copyright, nav links (Pricing → `/pricing`, Process → `#how-it-works`, Terms → `#`, Privacy → `#`)
   - `<LanguageSwitcher />`
   - Uses `useTranslations('common')`

6. Create `components/marketing/HeroSection.tsx` — Server Component:
   - Headline, sub-headline, Get Started button (Link to `/pricing`), Learn More link (`href="#how-it-works"`)
   - Stats grid — 4 `<StatItem>` elements defined inline in this file (not extracted — 4 items used once)
   - Uses `useTranslations('home.hero')`

7. Create `components/marketing/HowItWorksSection.tsx` — Server Component:
   - Section with `id="how-it-works"`
   - 3 step cards rendered from a local array
   - Uses `useTranslations('home.howItWorks')`

8. Create `components/marketing/FAQSection.tsx` — Server Component:
   - shadcn `Accordion` with 5 items
   - Uses `useTranslations('home.faq')`

9. Update `app/[locale]/(marketing)/page.tsx`:
   - Remove placeholder
   - Import and render `HeroSection`, `HowItWorksSection`, `FAQSection`
   - Keep `setRequestLocale(locale)` and `use(params)`

10. Add `home` namespace to `messages/en.json`:

```json
"home": {
  "hero": {
    "headline": "Get Your Portuguese NIF Online — Fast, Transparent, Reliable",
    "subheadline": "No hidden fees. No surprises. Choose the tier that fits your deadline. Start your Portuguese journey with confidence and bureaucratic ease.",
    "cta": "Get Started",
    "learnMore": "Learn More",
    "stat1Value": "From €79",
    "stat1Label": "Transparent pricing",
    "stat2Value": "5 days",
    "stat2Label": "Standard delivery",
    "stat3Value": "48h",
    "stat3Label": "Express option",
    "stat4Value": "Zero",
    "stat4Label": "Hidden fees"
  },
  "howItWorks": {
    "title": "A Transparent 3-Step Process",
    "subtitle": "Getting your Portuguese tax identification shouldn't be a maze. We've distilled the complexity into three simple stages.",
    "step1Number": "01",
    "step1Title": "Choose Your Tier",
    "step1Description": "Select between Essential, Standard, or Express based on your deadline. Prices are clear upfront — no surprises.",
    "step2Number": "02",
    "step2Title": "Upload Your Documents",
    "step2Description": "Upload your passport and proof of address. Our system reviews them automatically so there are no delays.",
    "step3Number": "03",
    "step3Title": "Receive Your NIF",
    "step3Description": "Your NIF number is delivered to your secure dashboard. Use it for property purchases, bank accounts, and more."
  },
  "faq": {
    "title": "Frequently Asked Questions",
    "subtitle": "Everything you need to know about the process.",
    "q1": "How long does the process take?",
    "a1": "Standard orders take 5–10 business days from document approval. Express orders are submitted to Finanças within 48 hours of document approval. Finanças processing time after submission is outside our control.",
    "q2": "Do I need to be in Portugal?",
    "a2": "No. The entire process is remote. We act as your fiscal representative in Portugal and submit the application to Finanças on your behalf.",
    "q3": "What documents are required?",
    "a3": "You need a valid passport and proof of address dated within the last 3 months (utility bill, bank statement, or rental agreement). Phone and TV bills are not accepted.",
    "q4": "Do I need a fiscal representative?",
    "a4": "Non-EU residents currently require a licensed fiscal representative to apply for a NIF. This is included in the Standard and Express tiers. EU citizens can apply without one using our Essential tier.",
    "q5": "What changes in July 2026?",
    "a5": "Portugal's law changes on July 1, 2026: non-EU residents with no Portuguese tax obligations will no longer be legally required to appoint a fiscal representative. We will update our tiers and pricing to reflect this. Standard and Express customers will be notified in advance."
  }
},
"common": {
  "nav": {
    "signIn": "Sign In",
    "getStarted": "Get Started"
  }
}
```

11. Copy the identical `home` block to `fr.json`, `es.json`, `de.json` — same English strings for now.
    Also add `common.nav` to all four locale files.

12. Run `npm run build`.

---

## Dependencies

Install: `shadcn accordion` via `npx shadcn add accordion`

---

## Scope Limits

- Do not build the pricing page — Feature 06.
- Do not add auth logic — this is a public page.
- Do not localize copy — same English strings in all four locale files; real translations in 05b.
- Do not add Framer Motion animations.
- Do not add a blog, testimonials, or social proof statistics.
- No images in step cards — icon-free, text-only cards for 05a.
- Footer links for Terms and Privacy point to `#` — those pages are not in scope.

---

## Check When Done

- `app/[locale]/(marketing)/layout.tsx` wraps children with MarketingHeader and MarketingFooter
- `components/shared/LanguageSwitcher.tsx` is `"use client"`, switches locale on change
- `components/shared/MarketingHeader.tsx` renders brand name and Sign In link
- `components/shared/MarketingFooter.tsx` renders copyright, nav links, LanguageSwitcher
- `components/marketing/HeroSection.tsx` renders headline, sub-headline, Get Started CTA, Learn More link, 4 stats
- `components/marketing/HowItWorksSection.tsx` renders 3 step cards with `id="how-it-works"` on the section
- `components/marketing/FAQSection.tsx` renders 5 accordion items
- `app/[locale]/(marketing)/page.tsx` renders all three sections
- `messages/en.json` has `home` and `common.nav` namespaces
- `fr.json`, `es.json`, `de.json` have matching keys (English content)
- `/` loads without error
- `/fr`, `/es`, `/de` load without error (same English content)
- `npm run build` passes
