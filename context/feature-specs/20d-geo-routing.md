# 20d — Technical Routing & GEO (Generative Engine Optimization)

Read before starting: `context/AGENTS.md`, `context/progress-tracker.md`, `context/architecture-context.md`.

Generate `robots.ts`, `sitemap.ts`, and `llms.txt` to give search engines and AI crawlers explicit machine-readable maps of the site's public content.

---

## Research notes (May 2026 — baked in, no need to re-search)

### AI Crawlers — Allow vs Block

| Crawler | Operator | Verdict | User-Agent strings |
|---------|----------|---------|-------------------|
| Googlebot | Google | ✅ Allow | `Googlebot` |
| Google-Extended | Google | ✅ Allow | `Google-Extended` |
| bingbot | Microsoft | ✅ Allow | `bingbot` |
| GPTBot | OpenAI | ✅ Allow (search/browse, respects robots.txt) | `GPTBot` |
| OAI-SearchBot | OpenAI | ✅ Allow | `OAI-SearchBot` |
| ChatGPT-User | OpenAI | ✅ Allow | `ChatGPT-User` |
| ClaudeBot | Anthropic | ✅ Allow (respects robots.txt) | `ClaudeBot` |
| Claude-SearchBot | Anthropic | ✅ Allow | `Claude-SearchBot` |
| PerplexityBot | Perplexity | ✅ Allow | `PerplexityBot` |
| Applebot | Apple | ✅ Allow | `Applebot` |
| Applebot-Extended | Apple | ✅ Allow | `Applebot-Extended` |
| meta-externalagent | Meta | ✅ Allow | `meta-externalagent` |
| DuckAssistBot | DuckDuckGo | ✅ Allow | `DuckAssistBot` |
| MistralAI-User | Mistral | ✅ Allow | `MistralAI-User` |
| Amazonbot | Amazon | ✅ Allow | `Amazonbot` |
| CCBot | Common Crawl | ❌ Block — documented non-compliance with robots.txt | `CCBot` |
| Bytespider | ByteDance | ❌ Block — documented non-compliance with robots.txt | `Bytespider` |

### llms.txt spec (from llmstxt.org — community standard as of May 2026)
- File must be at `/llms.txt` (root path)
- Format: plain Markdown
- Structure (order matters):
  1. `# H1` — site name (required, the only required element)
  2. `> blockquote` — short summary with key information
  3. Zero or more `## H2` sections containing markdown lists
  4. Each list item: `- [name](url): description`
  5. An `## Optional` section at the end for secondary content AI can skip under token pressure
- No HTML. No JSON. Pure Markdown only.

### Next.js file conventions
- `app/robots.ts` — exports a default function returning `MetadataRoute.Robots`; cached by default
- `app/sitemap.ts` — exports a default function returning `MetadataRoute.Sitemap[]`; cached by default; supports `alternates.languages` for hreflang per URL entry
- `public/llms.txt` — static file, served as-is at `/llms.txt` with no build step required; preferred over a route handler for maximum CDN cacheability

---

## Constraints

### Tokens (UI features only)

Not applicable — no rendered UI.

### Architecture

- `app/robots.ts` — Next.js metadata file convention. Default function, no params. Returns `MetadataRoute.Robots`. No `env` import needed — keep it self-contained; the `sitemap` URL can use `env.NEXT_PUBLIC_APP_URL`.
- `app/sitemap.ts` — Next.js metadata file convention. Default function, no params. Returns `MetadataRoute.Sitemap[]`. Imports `env` from `@/lib/env` and `routing` from `@/i18n/routing` to derive all locale-prefixed URLs. Uses the same URL construction logic as `lib/seo.ts` (`getPathname` from `@/i18n/navigation`).
- `public/llms.txt` — Static file. No imports. Written in Markdown following the llmstxt.org spec. Content is English-only; all URLs use the production base URL (no locale prefix variants needed — LLMs will follow links).
- Do NOT create a Route Handler for `llms.txt` — `public/` is simpler and more cache-friendly.
- No new packages required.

### TypeScript

- Strict mode. No `any`. No type assertions without a comment.
- `app/robots.ts` and `app/sitemap.ts` return types are inferred from Next.js built-in `MetadataRoute.Robots` and `MetadataRoute.Sitemap[]` — import from `'next'`.
- `public/llms.txt` is plain text — no TypeScript involved.

### Validation

No Zod schemas — these files produce output, not user input.

### i18n

Not applicable — `robots.ts` and `sitemap.ts` are crawler-facing. `llms.txt` is LLM-facing. All English, no next-intl.

---

## Design

Not applicable — no rendered UI.

---

## Implementation

### Step 1 — Create `app/robots.ts`

Default export returning `MetadataRoute.Robots`. Logic:

- `rules` array: one rule per crawler group, in this order:
  1. Wildcard `*` — Allow `/`, `/pricing`, `/fr/`, `/fr/pricing`, `/es/`, `/es/pricing`, `/de/`, `/de/pricing`. Disallow everything else (covers auth, dashboard, admin, operator routes).
  2. CCBot — `disallow: '/'` (block all — documented non-compliance)
  3. Bytespider — `disallow: '/'` (block all — documented non-compliance)
- `sitemap`: full URL to the sitemap, e.g. `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/sitemap.xml`
- Add a comment explaining why CCBot and Bytespider are blocked.

The wildcard rule's disallow list should include at minimum: `/dashboard`, `/admin`, `/operator`, `/signin`, `/signup`, `/reset-password`, `/new-password`, `/settings`, `/renewal`, `/auth`.

**Note on locale-prefixed disallows:** The `as-needed` setup means EN has no prefix. FR/ES/DE paths have `/fr/`, `/es/`, `/de/` prefixes. It is sufficient to disallow the unprefixed paths (e.g. `/dashboard`) — Googlebot applies disallows to all paths containing that segment. For stricter coverage, also add the prefixed variants (e.g. `/fr/dashboard`) — keep this list to the 4–5 most sensitive routes only.

### Step 2 — Create `app/sitemap.ts`

Default export returning `MetadataRoute.Sitemap[]`. Logic:

- Import `env` from `@/lib/env`, `routing` from `@/i18n/routing`, `getPathname` from `@/i18n/navigation`.
- Define public routes (the only two public marketing pages): `['/','  /pricing']`.
- Strip trailing slash from `env.NEXT_PUBLIC_APP_URL` for the base URL.
- For each route, build one sitemap entry per locale using `getPathname({ locale, href: route })` — same helper used in `lib/seo.ts`.
- Each entry shape:
  ```typescript
  {
    url: `${baseUrl}${path}`,
    lastModified: new Date(),   // build date — no CMS, so build time is the best proxy
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1.0 : 0.8,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map(l => [l, `${baseUrl}${getPathname({ locale: l, href: route })}`])
      ),
    },
  }
  ```
- Result: 2 routes × 4 locales = **8 sitemap entries** total, each with 4 hreflang alternates.
- Add comments explaining `lastModified: new Date()` is the build timestamp and why it's sufficient without a CMS.

### Step 3 — Create `public/llms.txt`

Static Markdown file at `public/llms.txt`. Content must follow the llmstxt.org spec exactly:

```markdown
# RemoteNIF

> Online Portuguese NIF (Tax Identification Number) application service. Apply fully remotely from anywhere in the world — no trip to Portugal required. Three service tiers with AI document review and human verification.

## Service

- [Homepage](https://remotenif.com/): Service overview, how the process works, and frequently asked questions
- [Pricing](https://remotenif.com/pricing): Three tiers — Essential (€79, NIF only, 5 business days), Standard (€129, NIF + 12 months fiscal representation, 5 business days), Express (€179, NIF + 12 months fiscal representation, application submitted to Finanças within 48 hours of document approval)

## Key Facts

- A Portuguese NIF (Número de Identificação Fiscal) is required for property purchases, bank account opening, signing contracts, and fulfilling tax obligations in Portugal
- The entire process is remote — customers never need to visit Portugal
- Required documents: valid passport and proof of address dated within the last 3 months (utility bill, bank statement, or rental agreement; phone and TV bills not accepted)
- Fiscal representation law (Decree-Law 44/2022): EU/EEA residents are never required to appoint a fiscal representative. Non-EU/EEA residents only need one if they have active Portuguese tax obligations such as property ownership, rental income, or business activity in Portugal
- All tiers include AI document review and admin verification

## Optional

- [FAQ](https://remotenif.com/#faq): Detailed answers on processing times, document requirements, and the current fiscal representation rules under Decree-Law 44/2022
```

Replace the `https://remotenif.com` placeholder URLs with `env.NEXT_PUBLIC_APP_URL` stripped of its trailing slash — but since this is a static file, hardcode `https://remotenif.com` directly (this is the production domain, not an env var). Add a comment at the top of the file: `# See llmstxt.org for the spec this file follows.`

### Step 4 — Verify build passes

Run `npm run build`. Confirm:
- No TypeScript errors in `app/robots.ts` or `app/sitemap.ts`.
- `public/llms.txt` is present at `public/llms.txt`.
- Build output still shows 66 static page routes (sitemap and robots are additional routes, count may increase slightly).

---

## Dependencies

No new packages required.

---

## Scope Limits

- Do not add any new public marketing pages — sitemap scope is exactly: `/` and `/pricing` in 4 locales.
- Do not modify `lib/seo.ts` — `buildAlternates` is for metadata, not sitemap; the sitemap builds its own URL list inline.
- Do not add `llms-full.txt` (the extended llmstxt.org variant) — the base `llms.txt` is sufficient.
- Do not add a Route Handler for `llms.txt` — `public/llms.txt` is the right approach.
- Do not add sitemap entries for auth, dashboard, admin, or operator routes — those have `noindex` and must stay out of the sitemap.
- Do not add image sitemaps or video sitemaps — out of scope.
- Do not add `<priority>` workarounds for Google (Google ignores `priority` in sitemaps since 2023, but Next.js includes it anyway — do not remove it).
- Keep this focused on three files: `app/robots.ts`, `app/sitemap.ts`, `public/llms.txt`.

---

## Check When Done

- `app/robots.ts` exists and exports a valid `MetadataRoute.Robots` object.
- The wildcard rule allows the 8 public URLs and disallows `/dashboard`, `/admin`, `/operator`, `/signin`, `/signup`, `/reset-password`, `/new-password`, `/settings`, `/renewal`, `/auth`.
- CCBot and Bytespider each have `disallow: '/'` rules with explanatory comments.
- `app/sitemap.ts` exists and generates 8 entries (2 routes × 4 locales), each with `alternates.languages` for all 4 locale variants.
- `public/llms.txt` exists, is valid Markdown following llmstxt.org spec (H1 → blockquote → sections → Optional), and all URLs point to the correct production domain.
- No TypeScript errors in either `.ts` file.
- No `any` types.
- `npm run build` passes.
