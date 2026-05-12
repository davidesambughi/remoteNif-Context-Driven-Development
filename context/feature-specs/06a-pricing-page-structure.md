# 06a — Pricing Page (Structure)

Read `context/AGENTS.md`, `context/progress-tracker.md`, `context/ui-context.md`, `context/architecture-context.md` before starting.

This unit builds the static pricing page: a hero headline, three tier cards read from `lib/pricing.ts`, and an "All tiers include" footer bar. Selecting a tier navigates to `/signup?tier=X` (unauthenticated) or `/dashboard?tier=X` (authenticated). All copy uses i18n keys.

---

## Constraints

### Tokens

| Purpose | Token | Tailwind utility |
|---------|-------|-----------------|
| Page canvas | `var(--bg-base)` | `bg-[var(--bg-base)]` |
| Card background | `var(--bg-surface)` | `bg-[var(--bg-surface)]` |
| Subtle background (includes bar) | `var(--bg-subtle)` | `bg-[var(--bg-subtle)]` |
| Heading / body text | `var(--text-primary)` | `text-[var(--text-primary)]` |
| Supporting text | `var(--text-secondary)` | `text-[var(--text-secondary)]` |
| Muted text (disabled feature) | `var(--text-muted)` | `text-[var(--text-muted)]` |
| Text on accent | `var(--text-on-accent)` | `text-[var(--text-on-accent)]` |
| Standard card border | `var(--border-default)` | `border-[var(--border-default)]` |
| Featured card border (Express) | `var(--brand-secondary)` | `border-[var(--brand-secondary)]` |
| Primary button | `var(--brand-primary)` | `bg-[var(--brand-primary)]` |
| Badge background (Express "Fastest") | `var(--brand-secondary)` | `bg-[var(--brand-secondary)]` |
| Success icon (check mark) | `var(--status-success)` | `text-[var(--status-success)]` |
| Card shadow | `var(--shadow-md)` | `shadow-[var(--shadow-md)]` |
| Card border radius | `var(--radius-lg)` | `rounded-[length:var(--radius-lg)]` |
| Badge border radius | `var(--radius-full)` | `rounded-[length:var(--radius-full)]` |
| Button border radius | `var(--radius-md)` | `rounded-[length:var(--radius-md)]` |

Rules that always apply:
- No raw Tailwind color classes. Tokens only.
- No hardcoded hex or rgb values.
- Mobile-first. Stack cards 1-col on mobile, 3-col on `lg`.
- Spacing must follow the 8px grid (`--space-*` tokens).

### Architecture

- **Page:** `app/[locale]/(marketing)/pricing/page.tsx` — Server Component. Uses `getTranslations('pricing')` from `next-intl/server` and `getCurrentUser()` from `lib/auth/session.ts` to determine the CTA href.
- **Card component:** `components/marketing/TierCard.tsx` — Server Component, receives all display strings and `href` as props. No logic inside.
- Tier price data comes from `TIERS` and `TIER_ORDER` in `lib/pricing.ts` — do not hardcode prices in the component.
- Price display: divide `priceEurCents` by 100 to get euros. Format as `€79` (no decimals).
- CTA routing logic lives in the page, not the card: `isAuthenticated ? '/dashboard?tier=X' : '/signup?tier=X'`.
- Use `Link` from `@/i18n/navigation` for all locale-aware links.
- **Card shell:** use shadcn `Card` from `@/components/ui/card` — `bg-card` and `text-card-foreground` are already mapped to our tokens. Pass custom `className` to override shadow and featured border.
- **CTA button:** use shadcn `Button` from `@/components/ui/button` with `asChild` prop and `Link` as the child. This provides focus ring (`ring-ring` → `--brand-primary`), keyboard navigation, and disabled state for free. Essential uses `variant="outline"`, Standard and Express use `variant="default"`.
- The shadcn CSS variable mapping in `globals.css` means `variant="default"` renders `bg-primary` (→ `--brand-primary`) and `variant="outline"` renders `border-input bg-background` (→ `--border-default`, `--bg-base`) — no `className` color overrides needed on the buttons.
- The marketing layout (`app/[locale]/(marketing)/layout.tsx`) already provides the header and footer — do not add them to the page.

### TypeScript

- Strict mode. No `any`.
- Props interface for `TierCard` must be explicit — see Design section for the full shape.
- `TIERS` and `TIER_ORDER` are already typed in `lib/pricing.ts` — import and use those types directly.

### i18n

- All user-facing strings go in `messages/en.json` under the `pricing` key.
- Use `getTranslations('pricing')` in the page (Server Component pattern).
- No hardcoded English strings in JSX.
- Add the same keys, fully translated, to `fr.json`, `es.json`, `de.json`.
- Do **not** use `TierConfig.deliveryDescription` from `lib/pricing.ts` in the UI — use translation keys instead (that field is a raw English string; replacing it is deferred to 06b).

---

## Design

### Page Layout

- Full-width page on `--bg-base` canvas.
- **Hero:** centered, `max-w-2xl`, top padding `--space-16`. Headline (`--text-4xl`, `--font-bold`), subheadline (`--text-base`, `--text-secondary`), gap `--space-4` between them.
- **Card grid:** `max-w-5xl`, centered, `mt-[--space-12]`. 1 column on mobile, 3 columns on `lg`. Gap `--space-6`.
- **"All tiers include" bar:** full-width, `bg-[var(--bg-subtle)]`, `mt-[--space-12]`, `py-[--space-6]`. Three items inline, centered, separated. On mobile: stacks to 1-col. On `md`: 3-col.
- Bottom of page: `pb-[--space-16]`.

### Tier Cards

**All cards — using shadcn `Card` as the shell:**
- Outer: `<Card className="flex flex-col shadow-[var(--shadow-md)] p-[length:var(--space-8)]">` — shadcn Card provides `rounded-lg border bg-card text-card-foreground`; we override shadow and add flex layout via className.
- Tier name: `--text-xl`, `--font-bold`, `--text-primary`.
- Price: `--text-4xl`, `--font-bold`, `--text-primary`. Euro symbol at `--text-2xl` aligned to top of the price number (superscript style via `items-start` flex).
- Subtitle (one line below price): `--text-sm`, `--text-secondary`.
- Divider: `border-t border-[var(--border-subtle)] my-[length:var(--space-6)]`.
- Feature list: `flex flex-col gap-[length:var(--space-3)]`. Each item: icon left, label right.
- CTA: `<Button variant={ctaVariant} size="lg" className="w-full mt-auto" asChild><Link href={href}>{cta}</Link></Button>`. The `mt-auto` on the button (with `flex flex-col` on the card) pushes it to the bottom regardless of feature list length.

**Essential card:**
- No extra border override — shadcn Card's default `border` (→ `--border-default`) is correct.
- CTA: `variant="outline"` on shadcn Button.
- Features: Clock + "5 business days delivery" (`--text-secondary`), Check + "NIF number" (`--status-success`), Minus + "No fiscal representation" (`--text-muted`, `line-through`).

**Standard card:**
- No extra border override.
- CTA: `variant="default"` on shadcn Button.
- Features: Clock + "5 business days delivery", Check + "NIF number", Check + "12 months fiscal rep".

**Express card:**
- Featured border override: add `border-2 border-[var(--brand-secondary)]` to Card's className.
- "Fastest" badge: positioned `absolute top-[length:var(--space-4)] right-[length:var(--space-4)]` inside a `relative` wrapper on the card. `bg-[var(--brand-secondary)] text-[var(--text-on-accent)]`, `--text-xs`, `--font-semibold`, `rounded-[length:var(--radius-full)]`, `px-[length:var(--space-3)] py-[length:var(--space-1)]`.
- CTA: `variant="default"` on shadcn Button.
- Features: Zap + "Application submitted in 48h" (`--status-success`), Check + "NIF number", Check + "12 months fiscal rep", Check + "Priority processing".

**Icons (Lucide React, stroke only):**
- Delivery time: `Clock` `h-4 w-4`
- Positive feature: `Check` `h-4 w-4 text-[var(--status-success)]`
- Express submission: `Zap` `h-4 w-4 text-[var(--status-success)]`
- Disabled feature: `Minus` `h-4 w-4 text-[var(--text-muted)]`

**"All tiers include" bar icons:**
- AI document review: `ScanSearch` `h-4 w-4`
- Admin verification: `UserCheck` `h-4 w-4`
- Priority email support: `Mail` `h-4 w-4`
- All icons: `text-[var(--brand-primary)]`. Label: `--text-sm`, `--text-secondary`.

### TierCard Props Interface

```typescript
interface FeatureItem {
  label: string
  icon: 'check' | 'clock' | 'zap' | 'disabled'
}

interface TierCardProps {
  name: string
  priceEurCents: number
  subtitle: string
  features: FeatureItem[]
  cta: string
  href: string
  isFeatured?: boolean            // Express — adds border-2 border-brand-secondary
  badge?: string                  // "Fastest" label (only rendered when isFeatured is true)
  ctaVariant: 'default' | 'outline'  // maps directly to shadcn Button variant prop
}
```

---

## Implementation

1. **Add `pricing` namespace to all four locale files** (`messages/en.json`, `fr.json`, `es.json`, `de.json`). Add the following keys — English content for `en.json`, proper translations for the other three:

   ```json
   "pricing": {
     "hero": {
       "headline": "When do you need your NIF?",
       "subheadline": "Transparent, flat-rate pricing for your Portuguese tax identification number. No hidden administrative fees."
     },
     "tiers": {
       "essential": {
         "name": "Essential",
         "subtitle": "NIF only, no fiscal representation",
         "features": {
           "delivery": "5 business days delivery",
           "nif": "NIF number",
           "noFiscalRep": "No fiscal representation"
         },
         "cta": "Select Essential"
       },
       "standard": {
         "name": "Standard",
         "subtitle": "NIF + 12 months fiscal representation",
         "features": {
           "delivery": "5 business days delivery",
           "nif": "NIF number",
           "fiscalRep": "12 months fiscal rep"
         },
         "cta": "Select Standard"
       },
       "express": {
         "name": "Express",
         "badge": "Fastest",
         "subtitle": "Fast-track submission within 48 hours",
         "features": {
           "submission": "Application submitted in 48h",
           "nif": "NIF number",
           "fiscalRep": "12 months fiscal rep",
           "priority": "Priority processing"
         },
         "cta": "Select Express"
       }
     },
     "includes": {
       "title": "All tiers include:",
       "aiReview": "AI document review",
       "adminVerification": "Admin verification",
       "emailSupport": "Priority email support"
     }
   }
   ```

   **French translations (`fr.json`):**
   - `hero.headline`: "Quand avez-vous besoin de votre NIF ?"
   - `hero.subheadline`: "Des tarifs fixes et transparents pour votre numéro d'identification fiscale portugais. Aucun frais administratif caché."
   - `tiers.essential.name`: "Essentiel"
   - `tiers.essential.subtitle`: "NIF uniquement, sans représentation fiscale"
   - `tiers.essential.features.delivery`: "Livraison en 5 jours ouvrables"
   - `tiers.essential.features.nif`: "Numéro NIF"
   - `tiers.essential.features.noFiscalRep`: "Sans représentation fiscale"
   - `tiers.essential.cta`: "Choisir Essentiel"
   - `tiers.standard.name`: "Standard"
   - `tiers.standard.subtitle`: "NIF + 12 mois de représentation fiscale"
   - `tiers.standard.features.delivery`: "Livraison en 5 jours ouvrables"
   - `tiers.standard.features.nif`: "Numéro NIF"
   - `tiers.standard.features.fiscalRep`: "12 mois de représentation fiscale"
   - `tiers.standard.cta`: "Choisir Standard"
   - `tiers.express.name`: "Express"
   - `tiers.express.badge`: "Le plus rapide"
   - `tiers.express.subtitle`: "Soumission rapide en moins de 48 heures"
   - `tiers.express.features.submission`: "Demande soumise en 48h"
   - `tiers.express.features.nif`: "Numéro NIF"
   - `tiers.express.features.fiscalRep`: "12 mois de représentation fiscale"
   - `tiers.express.features.priority`: "Traitement prioritaire"
   - `tiers.express.cta`: "Choisir Express"
   - `includes.title`: "Tous les forfaits incluent :"
   - `includes.aiReview`: "Vérification IA des documents"
   - `includes.adminVerification`: "Vérification administrative"
   - `includes.emailSupport`: "Support e-mail prioritaire"

   **Spanish translations (`es.json`):**
   - `hero.headline`: "¿Cuándo necesitas tu NIF?"
   - `hero.subheadline`: "Precios fijos y transparentes para tu número de identificación fiscal portugués. Sin tarifas administrativas ocultas."
   - `tiers.essential.name`: "Esencial"
   - `tiers.essential.subtitle`: "Solo NIF, sin representación fiscal"
   - `tiers.essential.features.delivery`: "Entrega en 5 días hábiles"
   - `tiers.essential.features.nif`: "Número de NIF"
   - `tiers.essential.features.noFiscalRep`: "Sin representación fiscal"
   - `tiers.essential.cta`: "Elegir Esencial"
   - `tiers.standard.name`: "Estándar"
   - `tiers.standard.subtitle`: "NIF + 12 meses de representación fiscal"
   - `tiers.standard.features.delivery`: "Entrega en 5 días hábiles"
   - `tiers.standard.features.nif`: "Número de NIF"
   - `tiers.standard.features.fiscalRep`: "12 meses de representación fiscal"
   - `tiers.standard.cta`: "Elegir Estándar"
   - `tiers.express.name`: "Express"
   - `tiers.express.badge`: "Más rápido"
   - `tiers.express.subtitle`: "Envío urgente en menos de 48 horas"
   - `tiers.express.features.submission`: "Solicitud enviada en 48h"
   - `tiers.express.features.nif`: "Número de NIF"
   - `tiers.express.features.fiscalRep`: "12 meses de representación fiscal"
   - `tiers.express.features.priority`: "Procesamiento prioritario"
   - `tiers.express.cta`: "Elegir Express"
   - `includes.title`: "Todos los planes incluyen:"
   - `includes.aiReview`: "Revisión de documentos con IA"
   - `includes.adminVerification`: "Verificación administrativa"
   - `includes.emailSupport`: "Soporte por email prioritario"

   **German translations (`de.json`):**
   - `hero.headline`: "Wann benötigen Sie Ihre NIF?"
   - `hero.subheadline`: "Transparente Festpreise für Ihre portugiesische Steueridentifikationsnummer. Keine versteckten Verwaltungsgebühren."
   - `tiers.essential.name`: "Essential"
   - `tiers.essential.subtitle`: "Nur NIF, ohne Steuervertretung"
   - `tiers.essential.features.delivery`: "Lieferung in 5 Werktagen"
   - `tiers.essential.features.nif`: "NIF-Nummer"
   - `tiers.essential.features.noFiscalRep`: "Keine Steuervertretung"
   - `tiers.essential.cta`: "Essential wählen"
   - `tiers.standard.name`: "Standard"
   - `tiers.standard.subtitle`: "NIF + 12 Monate Steuervertretung"
   - `tiers.standard.features.delivery`: "Lieferung in 5 Werktagen"
   - `tiers.standard.features.nif`: "NIF-Nummer"
   - `tiers.standard.features.fiscalRep`: "12 Monate Steuervertretung"
   - `tiers.standard.cta`: "Standard wählen"
   - `tiers.express.name`: "Express"
   - `tiers.express.badge`: "Schnellste"
   - `tiers.express.subtitle`: "Schnelleinreichung innerhalb von 48 Stunden"
   - `tiers.express.features.submission`: "Antrag in 48h eingereicht"
   - `tiers.express.features.nif`: "NIF-Nummer"
   - `tiers.express.features.fiscalRep`: "12 Monate Steuervertretung"
   - `tiers.express.features.priority`: "Prioritätsbearbeitung"
   - `tiers.express.cta`: "Express wählen"
   - `includes.title`: "Alle Pakete beinhalten:"
   - `includes.aiReview`: "KI-Dokumentenprüfung"
   - `includes.adminVerification`: "Admin-Verifizierung"
   - `includes.emailSupport`: "Prioritäts-E-Mail-Support"

2. **Create `components/marketing/TierCard.tsx`** — Server Component. Accepts `TierCardProps` (defined above).
   - Use shadcn `Card` from `@/components/ui/card` as the outer shell.
   - Use shadcn `Button` from `@/components/ui/button` with `asChild` for the CTA, wrapping `Link` from `@/i18n/navigation`.
   - Render the correct Lucide icon for each `FeatureItem.icon` variant.
   - No logic — pure display.

3. **Create `app/[locale]/(marketing)/pricing/page.tsx`** — Server Component.
   - Import `getTranslations` from `next-intl/server`.
   - Import `getCurrentUser` from `@/lib/auth/session`.
   - Import `TIERS`, `TIER_ORDER` from `@/lib/pricing`.
   - Import `TierCard` from `@/components/marketing/TierCard`.
   - Import `Link` from `@/i18n/navigation`.
   - Import Lucide icons: `ScanSearch`, `UserCheck`, `Mail`.
   - Call `getCurrentUser()` — if user exists, CTA href base is `/dashboard`; otherwise `/signup`.
   - Build the `href` for each tier as `${base}?tier=${tier.id}`.
   - Build the `features` array for each tier using translated strings and the correct icon variant (per the Design section above).
   - Render: hero section → card grid (3 × `TierCard`) → "All tiers include" bar.
   - The "All tiers include" bar is inline in the page (not a separate component file).

---

## Scope Limits

- No deadline-proximity logic (greying out cards, deadline input) — that is Feature 06b.
- No changes to `MarketingHeader` or `MarketingFooter`.
- No changes to `lib/pricing.ts` — use the existing config as-is.
- No new Stripe or checkout logic — the CTA is a plain link, not a checkout trigger.
- No `"use client"` — everything in this feature is static and server-rendered.
- Do not add a `loading.tsx` to the pricing route — that is introduced in Feature 08 per the build plan.

---

## Check When Done

- `app/[locale]/(marketing)/pricing/page.tsx` exists and renders without errors.
- `components/marketing/TierCard.tsx` exists.
- Visiting `/pricing` shows the hero, three cards, and the includes bar.
- Each card's CTA link is `/signup?tier=X` when not authenticated (no session).
- Essential CTA uses shadcn `Button variant="outline"`; Standard and Express use `variant="default"`.
- CTA buttons render as `<Link>` elements via `asChild` — they are keyboard-navigable and have a visible focus ring.
- Express card has the "Fastest" badge and a `brand-secondary` border.
- The "No fiscal representation" feature on Essential is rendered muted with a Minus icon.
- All `messages/*.json` files have the `pricing` namespace with all keys present.
- No hardcoded English strings in any `.tsx` file for this feature.
- No raw Tailwind color classes anywhere in the new files.
- `npm run build` passes.
