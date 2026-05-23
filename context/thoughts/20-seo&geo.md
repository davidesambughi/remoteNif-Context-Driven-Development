20 — SEO & Metadata (Updated 2026)
Implement robust, dynamic metadata management, technical SEO foundations, and AI-readiness optimizations to improve search visibility, social sharing, rich results, and discovery by both traditional engines and LLMs/AI systems.
Core Goals:

Ensure excellent crawlability, indexability, and user/AI experience.
Support multi-locale setups with proper canonicals and hreflang.
Optimize for Google, Bing, and AI-driven search (Generative Engine Optimization / GEO).
Follow EEAT (Experience, Expertise, Authoritativeness, Trust) signals through structured, clear content.

Done When:
Metadata & Per-Page Optimization

Every public page has a unique, descriptive title (under ~60 chars) and description (ideally 150-160 chars) in the root language (English), with proper localization support.
Use Next.js Metadata API (metadata export or generateMetadata) in App Router for static + dynamic metadata. Set metadataBase correctly in root layout for relative URLs.
Open Graph + Social Tags: Full OG tags (og:title, og:description, og:image 1200x630, og:url, og:type, etc.) + Twitter/X Card tags on all public-facing pages. Use dynamic OG image generation where beneficial.
Additional social/Platform tags (e.g., LinkedIn, Pinterest) as relevant.

Structured Data & Rich Results

JSON-LD structured data (Schema.org) added where relevant: Organization, WebSite, BreadcrumbList, FAQPage, Product, Article, LocalBusiness, etc. Prioritize homepage, pricing, blog posts, and key landing pages.
Validate with Google Rich Results Test. Use one primary format: JSON-LD in <script type="application/ld+json">.
Entity-based markup to support Knowledge Graph and AI understanding.

Technical Files (Dynamic Generation)

sitemap.ts (or index) generated dynamically — include only canonical/indexable URLs, with accurate <lastmod>, priority, and changefreq. Split large sitemaps if needed (e.g., by content type). Submit via Search Console + reference in robots.txt.
robots.ts generated dynamically: Proper allow/disallow rules, crawl directives for main bots + AI crawlers (e.g., GPTBot, Google-Extended, ClaudeBot if desired). Include Sitemap: directive.
llms.txt (optional but recommended for 2026 AI visibility): Plain-text/Markdown file at root summarizing site purpose, key pages, and high-value content for LLMs (ChatGPT, Claude, Perplexity, etc.). Helps with Generative Engine Optimization.
Correct canonical URLs across all locales and variants (use alternates in Next.js metadata for hreflang).

Advanced / 2026+ Considerations

Core Web Vitals optimized (focus on INP, CLS, LCP) — metadata should not block rendering.
Mobile-first, semantic HTML, fast loading.
EEAT signals: Author markup, clear sourcing, updated content.
AI/Agent readiness: Clear, structured content that’s easy for LLMs to cite; consider llms-full.txt for deeper content.
International SEO: Proper locale handling, hreflang, and translated metadata.
Monitoring: Setup Search Console, Bing Webmaster, and AI visibility tracking tools.

Implementation Notes for Your Agent:

Leverage Next.js 15/16+ Metadata API heavily (static where possible, dynamic for user-specific or frequently changing pages).
Avoid client-side only metadata — ensure server rendering.
Test thoroughly: Google Search Console, Rich Results Test, Lighthouse, mobile previews, and social debuggers (Facebook Sharing Debugger, Twitter Card Validator).
For dynamic generation: Use route handlers or generateSitemaps / robots exports in Next.js.