# 20c — Structured Data (JSON-LD)

Read before starting: `context/AGENTS.md`, `context/progress-tracker.md`, `context/architecture-context.md`, `context/code-standards.md`.

Inject Schema.org JSON-LD structured data into the marketing pages so Google, Bing, and AI-search crawlers (Perplexity, ChatGPT, ClaudeBot) can parse explicit entities for the site, the pricing tiers, and the FAQ content.

---

## Research notes (May 2026 — baked in, no need to re-search)

| Finding | Impact on this spec |
|---------|---------------------|
| **Google deprecated FAQ rich results on May 7, 2026** (no longer shown in SERPs; Search Console support removed June 2026) | Still implement `FAQPage` — it remains valid schema.org markup and is parsed by AI crawlers. Do NOT write copy claiming it produces Google rich snippets. |
| **Next.js Server Components avoid the JSON-LD hydration duplication bug** that affects Client Components | All `JsonLd` usages must be in Server Components. Never add `"use client"` to `JsonLd`. |
| **XSS risk in `dangerouslySetInnerHTML`** — user-controlled strings embedded in JSON-LD can inject script if they contain `<` | Replace `<` with `<` in the serialized output before injecting. |
| **Product schema with `offers`** is the correct Google-eligible pattern for a service pricing page | Use `Product` + `Offer` per tier (not `SoftwareApplication` — RemoteNIF is a service, not software). |
| **No sitelinks searchbox** needed — RemoteNIF has no internal search feature | `WebSite` schema is included without `potentialAction`. |

---

## Constraints

### Tokens (UI features only)

Not applicable — JSON-LD is injected into `<head>` as a `<script>` tag, not rendered UI.

### Architecture

- `components/shared/JsonLd.tsx` — single reusable component. Server Component (no `"use client"`). Accepts `data: object`, serializes it safely, renders `<script type="application/ld+json">`.
- `lib/jsonld.ts` — pure builder functions that return typed schema objects. No React, no imports from Next.js. Takes plain arguments (strings, numbers). Returns plain objects.
- Builders go in `lib/jsonld.ts` — **not** inline in page files. Page files call builders and pass the result to `<JsonLd>`.
- Root layout (`app/[locale]/layout.tsx`) injects `Organization` + `WebSite` schemas — these belong to the site, not individual pages.
- Homepage (`app/[locale]/(marketing)/page.tsx`) injects `FAQPage` schema — built from the same FAQ data as the visible `<FAQSection>`.
- Pricing page (`app/[locale]/(marketing)/pricing/page.tsx`) injects three `Product` schemas — one per tier, derived from `TIERS` in `lib/pricing.ts`.
- Use `env.NEXT_PUBLIC_APP_URL` as the base URL (already validated by Zod in `lib/env.ts`). Strip trailing slash before concatenating paths.
- No new packages required — all functionality is achievable with `JSON.stringify` and plain objects.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment.
- Builder functions return `Record<string, unknown>` (Schema.org does not have an official TS type package — avoid inventing complex local types; plain objects are idiomatic here).
- `JsonLd` props: `{ data: Record<string, unknown> }`.

### Validation

No Zod schemas required — this feature produces output (script tags), not user input.

### i18n

- **No i18n keys** — JSON-LD is consumed by crawlers, not users. Always output in English regardless of locale.
- FAQ question/answer text must be hardcoded in English in `lib/jsonld.ts` (mirrors the `en.json` FAQ content exactly — keep them in sync manually).
- Do not call `getTranslations` or use next-intl inside `lib/jsonld.ts`.

---

## Design

Not applicable — no rendered UI.

---

## Implementation

### Step 1 — Create `components/shared/JsonLd.tsx`

Server Component that renders a `<script type="application/ld+json">` tag.

- Accepts `{ data: Record<string, unknown> }`.
- Serializes with `JSON.stringify(data)` then replaces all `<` characters with `<` (XSS mitigation — prevents `</script>` injection if any string value contains angle brackets).
- Renders: `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: sanitized }} />`.
- No `"use client"` directive.
- Add a comment explaining the `<` replacement.

### Step 2 — Create `lib/jsonld.ts`

Pure builder functions. No React imports. Each returns `Record<string, unknown>`.

**`buildOrganizationSchema(baseUrl: string)`** — returns:
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "RemoteNIF",
  "url": "<baseUrl>",
  "description": "Online Portuguese NIF application service. Apply fully remotely from anywhere in the world.",
  "areaServed": "Worldwide",
  "serviceType": "NIF Application"
}
```

**`buildWebSiteSchema(baseUrl: string)`** — returns:
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "RemoteNIF",
  "url": "<baseUrl>"
}
```
No `potentialAction` — no internal search.

**`buildProductSchemas(baseUrl: string)`** — returns an array of three `Product` objects, one per tier. Each product:
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "<tier name, e.g. 'Essential NIF Application'>",
  "description": "<tier description matching pricing page copy>",
  "url": "<baseUrl>/pricing",
  "brand": {
    "@type": "Brand",
    "name": "RemoteNIF"
  },
  "offers": {
    "@type": "Offer",
    "price": "<price in EUR as decimal, e.g. 79.00>",
    "priceCurrency": "EUR",
    "availability": "https://schema.org/InStock",
    "url": "<baseUrl>/pricing"
  }
}
```
Derive price from `TIERS[tier].priceEurCents / 100`. Format as a fixed 2-decimal string (`(cents / 100).toFixed(2)`).

Tier names and descriptions:
- Essential: `"Essential NIF Application"` / `"NIF number issued in 5 business days. No fiscal representation."`
- Standard: `"Standard NIF Application"` / `"NIF number in 5 business days, plus 12 months of licensed fiscal representation."`
- Express: `"Express NIF Application"` / `"NIF application submitted to Finanças within 48 hours of document approval. Includes 12 months of fiscal representation."`

**`buildFaqPageSchema()`** — returns:
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "<question text>",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "<answer text>"
      }
    }
    // … one entry per FAQ item
  ]
}
```
Hardcode all 5 FAQ entries in English, matching `messages/en.json` → `home.faq` keys exactly. Add a comment: `// Keep in sync with messages/en.json home.faq.*`.

### Step 3 — Inject Organization + WebSite into root layout

File: `app/[locale]/layout.tsx`.

- Import `JsonLd` and `buildOrganizationSchema`, `buildWebSiteSchema` from their paths.
- Derive `baseUrl` from `env.NEXT_PUBLIC_APP_URL` (import `env` from `@/lib/env`), strip trailing slash.
- In the layout's returned JSX, place two `<JsonLd>` components inside `<head>` — one for Organization, one for WebSite.
- **Do not change any other part of the layout** — no token changes, no structural changes.

### Step 4 — Inject FAQPage into homepage

File: `app/[locale]/(marketing)/page.tsx`.

- Import `JsonLd` and `buildFaqPageSchema`.
- This is already a Server Component — no `"use client"` needed.
- Add `<JsonLd data={buildFaqPageSchema()} />` inside the returned JSX, placed **after** the last rendered section (below `<FAQSection />`). This keeps the script tag in the page body (valid HTML5 — `<script>` is allowed in `<body>`), near the content it describes.
- Do not move it into `<head>` — root layout already owns `<head>` JSON-LD; page-level schema in the body is equally valid and avoids layout re-rendering.

### Step 5 — Inject Product schemas into pricing page

File: `app/[locale]/(marketing)/pricing/page.tsx`.

- Import `JsonLd`, `buildProductSchemas`, and `env`.
- Derive `baseUrl` from `env.NEXT_PUBLIC_APP_URL`, strip trailing slash.
- Call `buildProductSchemas(baseUrl)` — returns an array of 3 objects.
- Render one `<JsonLd>` per product, placed after the closing `</div>` of the page's outer container. Use `Array.map` with a stable `key` (use tier name or index).
- Do not change any existing JSX on the page.

### Step 6 — Verify build passes

Run `npm run build`. Confirm:
- No TypeScript errors.
- No missing import errors.
- The three page routes still generate correctly (check `(marketing)/page` and `(marketing)/pricing/page` in build output).

---

## Dependencies

No new packages required.

---

## Scope Limits

- Do not add `BreadcrumbList`, `LocalBusiness`, or any schema type not listed above — scope is exactly: Organization, WebSite, Product (×3), FAQPage.
- Do not translate JSON-LD content — it is always English, always crawler-facing.
- Do not add JSON-LD to any authenticated route (`/dashboard`, `/admin`, `/operator`) — this feature is marketing-only.
- Do not modify `components/ui/*`.
- Do not change any visual UI — this feature is purely `<script>` tag injection.
- Do not add rich results copy to any user-facing page — Google FAQ rich results are deprecated as of May 2026.
- Do not add `"use client"` to `JsonLd.tsx` under any circumstances.

---

## Check When Done

- `components/shared/JsonLd.tsx` exists and renders a `<script type="application/ld+json">` tag with `<` sanitization.
- `lib/jsonld.ts` exists with four exported builder functions: `buildOrganizationSchema`, `buildWebSiteSchema`, `buildProductSchemas`, `buildFaqPageSchema`.
- Root layout (`app/[locale]/layout.tsx`) injects both `Organization` and `WebSite` schemas.
- Homepage (`app/[locale]/(marketing)/page.tsx`) injects `FAQPage` schema.
- Pricing page (`app/[locale]/(marketing)/pricing/page.tsx`) injects three `Product` schemas.
- No `"use client"` directive in `JsonLd.tsx`.
- No `any` types in `lib/jsonld.ts` or `components/shared/JsonLd.tsx`.
- FAQ text in `lib/jsonld.ts` matches `messages/en.json` `home.faq.*` verbatim.
- Product prices match `lib/pricing.ts` TIERS (79.00, 129.00, 179.00).
- `npm run build` passes.
