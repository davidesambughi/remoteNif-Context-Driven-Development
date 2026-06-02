RemoteNIF
AI-Assisted Development of a Production Web Application
Bachelor's Thesis
Davide Sambughi
ITS Turismo e Nuove Tecnologie Marche  — Full Stack Developer and Cloud Specialist — 2024/2026

1. Project Case Study
1a. Overview
RemoteNIF is a web application developed during an internship at a real estate startup operating in the Portuguese market. While similar services already exist, the company identified an opportunity to differentiate through a modern, transparent, and easy-to-use experience — reaching potential clients at the very start of their journey in Portugal, before any property search or banking relationship begins.
The goal was not to invent a new service, but to build a better one: clear in its process, reliable in its delivery, and trustworthy enough that a first-time user in a foreign country would feel confident handing over their documents and payment.
The NIF, which stands for Número de Identificação Fiscal,  is the Portuguese Tax Identification Number. It is a legal requirement for any foreigner who wants to buy property, open a bank account, or work in Portugal. Without it, nothing moves. Yet competing services often advertised low prices while hiding additional fees in the process. RemoteNIF was built to be different: everything shown upfront, no surprises. 
RemoteNIF replaces that process with a structured, end-to-end digital flow: the user selects a service tier based on their deadline, pays via Stripe, uploads their documents, and receives their NIF — with status updates at every step. Behind the scenes, an AI model pre-checks documents before a human operator reviews them, and a structured admin panel manages the entire fulfillment pipeline.
The application is complete and ready for production deployment, supporting four languages: English, French, Spanish, and Dutch.
1b. Screenshots
[Figure 1 — Dashboard view. Screenshots included in presentation slides.]
[Figure 2 — Checkout flow. Screenshots included in presentation slides.]
[Figure 3 — Admin panel. Screenshots included in presentation slides.]
1c. Live Demo
[Live demo link or recorded walkthrough — included in presentation slides.]
1d. Stack

Layer
Technology
Framework
Next.js 16.2 (App Router)
Language
TypeScript
Database
Supabase (PostgreSQL)
ORM
Drizzle ORM
Auth
Supabase Auth
Storage
Supabase Storage
Payments
Stripe
Email
Resend
AI
Groq API (Llama 4 Scout)
Internationalisation
next-intl
Styling
Tailwind CSS + shadcn/ui
Deployment
Vercel


1e. GitHub
https://github.com/davidesambughi/remoteNif-Context-Driven-Development

2. The Problem
For any foreigner living or working in Portugal, the NIF is not optional — it is a prerequisite for basic participation in everyday life. Opening a bank account requires one. Signing a rental contract that is legally registered with Finanças requires one — without it, the tenant has no legal protection against landlord abuses. In Lisbon, young residents under 23 can access free public transport through a personalised card, but applying for it requires a NIF. The list goes on.
The problem is not the NIF itself. The problem is getting one from abroad, or shortly after arriving, before you have had time to navigate Portuguese bureaucracy.
The traditional process involves either visiting a Finanças office in person — which requires already being in Portugal — or appointing a fiscal representative to act on your behalf remotely. That second option existed, but it was fragmented: handled via email, dependent on intermediaries with no standardised process, no status visibility, and no clear timeline. Users had no way of knowing where their application stood, or when they would receive their number.
RemoteNIF was built to fix exactly this: a structured, transparent, deadline-aware process for obtaining a NIF remotely — without email chains, without uncertainty, and without having to be physically present in Portugal. Competing services already exist, but they typically offer little transparency into the process and no modern digital experience. The opportunity was not just to solve a bureaucratic problem, but to do it in a way that builds trust from the very first interaction a potential customer has with the company.

3. The Solution
RemoteNIF positions the company at the earliest possible moment in a foreigner's Portugal journey — before the property search, before the bank account, before anything else. By offering a clear, trustworthy NIF application process, the company earns a relationship with the customer before any real estate transaction is even on the table.
The application was built from scratch as a complete end-to-end platform. Users select a service tier based on their deadline, complete a secure checkout, upload their documents, and receive their NIF — with full visibility into every step of the process. Behind the scenes, an AI model performs an initial document check, flagging issues before a human operator reviews them, reducing back-and-forth and accelerating delivery.
The result is a product that serves two purposes simultaneously: it solves a real, immediate problem for the user, and it creates a qualified lead for the company's core real estate business.

4. System Architecture
4a. Frontend
The frontend is built with Next.js 16.2 using the App Router. Pages are composed primarily of React Server Components, which render on the server and send only HTML to the browser — reducing the amount of JavaScript the user has to download. Client Components are used selectively, only where interactivity is required (forms, modals, status updates).
The UI is built with Tailwind CSS and shadcn/ui, using a consistent set of design tokens defined in a single CSS file. This ensures visual consistency across all pages without duplicating styles.
The application supports four languages — English, French, Spanish, and German — handled by next-intl, which manages locale routing and type-safe translation strings.
4b. Backend
There is no separate backend server. Business logic runs inside Next.js through two mechanisms: Server Actions (functions that run on the server, triggered directly from UI components) and API Routes (standard HTTP endpoints, used for external services like Stripe webhooks).
This means database access, payment processing, email sending, and AI document review all happen server-side, within the same codebase as the frontend. Secrets and credentials never reach the browser.
4c. Database
The database is a PostgreSQL instance managed by Supabase. The schema consists of seven tables: users, orders, documents, payments, operator notifications, and audit logs. All database access goes through Drizzle ORM, which provides a type-safe query layer — meaning database errors are caught at compile time, not at runtime.
4d. Auth
Authentication is handled by Supabase Auth using email and password. Sessions are stored in HTTP-only cookies, managed automatically by the Supabase SSR library. Every server-side mutation checks the session before executing — auth is enforced at the boundary, not assumed.
Three access roles exist in the system: customer, admin, and operator. Each role sees a different interface and can only perform actions permitted to that role.
4e. API
The application integrates with four external APIs:
Stripe — payment processing and webhook events (order confirmation, payment failure).
Groq (Llama 4 Scout) — AI-powered document pre-check. PDF text is first extracted using pdfjs-dist, then analysed by the model, returning a status of Clear, Flagged, or Error with actionable feedback.
Resend — transactional emails at every stage of the order lifecycle.
Supabase Storage — document uploads (passport, proof of address, signed Power of Attorney), stored in a private bucket accessible only to authorised roles.

5. AI-Assisted Development Process
The Core Problem with AI Coding Agents
AI coding assistants have become a standard part of the modern developer's toolkit. Their capabilities are well documented — but so are their failure modes.
Hallucinations: the model confidently generates code that looks correct but references functions that don't exist, APIs that work differently, or behavior that was never defined. Without verification, these errors propagate silently into the codebase.
Context drift: in long sessions, the model gradually loses track of earlier decisions. It contradicts architecture choices made three features ago, reintroduces patterns that were explicitly avoided, or forgets constraints that were clearly stated at the start.
Statelessness: every new conversation starts from zero. The model has no memory of what was built yesterday, what decisions were made last week, or what is explicitly out of scope for this project.
These are not bugs that will be fixed in the next model release. They are structural characteristics of how large language models work. The question is not when AI will stop having these limitations — it is how to build a development process that accounts for them now.
The approach taken in this project starts from a simple reframe: instead of waiting for a more capable model, understand the capabilities and limitations of the tools available, and build a framework around them. In this framework, the developer acts as the orchestrator — defining scope, making architectural decisions, and maintaining the system's memory. The AI acts as the developer — implementing what is defined, at a speed no human could match alone.
The Solution: A Context System
Before writing a single line of code, a set of structured documents was created to give the AI everything it needed to build the project — and to constrain what it was allowed to do. These documents form a persistent knowledge base that compensates for the AI's lack of memory.
The system consists of eight core files, each with a specific responsibility:
AGENTS.md — the entry point. Defines the exact reading order for all other files and states the non-negotiable rules: never invent missing behavior, never skip context, always update the progress tracker.
project-overview.md — the product brain. Defines who the product is for, what problem it solves, what is in scope, and critically, what is explicitly out of scope. Without this, the AI builds things that were never asked for.
user-flows.md — every screen, every user action, every error path. Written from the user's perspective. If a flow is not here, it does not get built.
ui-context.md — the design system contract. Every color, spacing value, typography decision, and component pattern — defined once as tokens. The AI uses this file to write consistent UI across every session.
architecture-context.md — the system rules. Stack, folder structure, system boundaries, and invariants — hard constraints the AI cannot violate even if a shortcut is tempting.
tech-spec.md — the implementation blueprint. Every data model, API route, environment variable, and business rule defined before the code that implements them.
code-standards.md — project-specific implementation rules. Overrides the AI's default habits with consistent conventions for this codebase.
progress-tracker.md — the AI's working memory across sessions. Tracks what is complete, what is in progress, what is next, and any open questions that must be resolved before continuing.
The Development Workflow
Each feature was built using a consistent, repeatable process:
1. A feature spec was written — a small, self-contained document describing exactly one feature unit: what to build, in what order, and explicitly what not to build. Each spec referenced which context files the AI needed to read before starting.
2. The AI read the context files, then implemented only what the spec defined — nothing adjacent, nothing assumed.
3. After completing the unit, the AI updated progress-tracker.md to reflect the new state before any new work began.
4. The next feature spec was only handed over once the previous unit was verified end-to-end.
This one-feature-at-a-time discipline was enforced strictly. The AI was never given two feature specs simultaneously, and it was never allowed to move forward if the current unit had open questions — those were logged and resolved first.
A parallel system handled bugs: current-issues files, structured the same way as feature specs, scoping the AI to fix only what was listed and verifying the build passed before closing the session.
What This Enabled
This system made it possible for a single developer to build a production-grade application — with payments, AI document review, multi-role access, internationalisation, and a complete admin pipeline — in a compressed timeline. The AI handled implementation at speed; the context system ensured that speed did not come at the cost of consistency or correctness.
The key insight is that the value of an AI coding agent is not raw capability — it is raw capability multiplied by the quality of the constraints you give it.

6. Technical Decisions
6a. Why Next.js
Next.js was chosen because it eliminates the need for a separate backend server. Server Components, Server Actions, and API Routes allow database access, payment processing, and email sending to live in the same codebase as the UI — with a clean separation between what runs on the server and what runs in the browser.
The alternative would have been a separate React frontend paired with an Express or similar API server. That architecture is valid but adds coordination overhead: two repositories, two deployment pipelines, and an explicit API contract to maintain between them. For a solo developer building at speed, that overhead has a real cost.
The tradeoff is framework lock-in. Business logic written with Server Actions and Next.js conventions does not port cleanly to another framework. That was an accepted risk given the development timeline and team size.
6b. Why Supabase and Drizzle ORM
Supabase provides a managed PostgreSQL database, authentication, and file storage under a single platform — removing the need to configure and connect three separate services. For a project of this scope, that consolidation significantly reduces infrastructure complexity.
Drizzle ORM sits on top of the Supabase database and provides type-safe query building. The schema is defined in TypeScript, which means the database structure and the application's type system stay in sync. Errors that would otherwise appear at runtime — wrong column name, missing field, incorrect type — are caught at compile time instead.
The alternative to Drizzle would have been Prisma, the more widely used ORM in the Next.js ecosystem. Drizzle was chosen for its lighter footprint, its SQL-like syntax that keeps queries readable, and its better compatibility with Supabase's connection model.
6c. Why next-intl
The application targets non-residents from across Europe, making internationalisation a core requirement rather than an afterthought. next-intl integrates directly with the Next.js App Router, handling locale-based routing and providing type-safe access to translation strings.
Type safety here is meaningful: if a translation key is referenced in the code but missing from a translation file, the TypeScript compiler catches it before the application builds. This prevents silent failures where a user sees a raw key string instead of translated text.
The alternative was to handle i18n manually or use a less integrated library. Given the App Router's specific routing model, a library built specifically for it was the pragmatic choice.
6d. Why Stripe
Stripe is the industry standard for payment processing in Europe and internationally. It handles card processing, strong customer authentication (SCA) compliance — required under EU regulations — and webhook delivery for asynchronous payment events.
The alternative of building a custom payment flow or using a less established provider would have introduced significant compliance and reliability risk for a real-money service. That tradeoff was never seriously considered.
The main constraint is cost: Stripe charges a percentage fee per transaction. At low order volumes this is acceptable; at scale it becomes a meaningful business cost.
6e. Why Resend
Resend was chosen for transactional email delivery. It allows email templates to be written as React components — using the same language and patterns as the rest of the application — rather than HTML strings or a separate templating system.
The alternative was SendGrid or Mailgun, both more established but with more complex APIs and separate templating systems. Resend's developer experience is significantly simpler for a Next.js project, and its deliverability is comparable to larger providers.
The tradeoff is maturity: Resend is a newer service with a smaller track record than the established alternatives. For a production application handling customer-facing order confirmations, that is a real consideration.

7. Challenges and Trade-offs
7a. AI Context and Assisted Development
The most persistent challenge of AI-assisted development is not technical — it is managerial. The AI will always do what it is told. The difficulty is telling it the right thing, at the right level of specificity, without either over-constraining it into rigidity or under-constraining it into chaos.
Early in the project, sessions without tight scoping produced code that was technically functional but architecturally inconsistent — components that mixed server and client concerns, queries written inline instead of in the shared query layer, patterns that contradicted decisions made in earlier sessions. None of these were bugs in the traditional sense. They were coherence failures: the AI made locally reasonable decisions that conflicted with the global system.
The solution was the context system described in Section 5. But maintaining it introduced its own overhead: every architectural decision had to be written down immediately, every context file had to stay current, and every feature spec had to be precise enough that the AI could not misinterpret it. The documentation was not optional overhead — it was the product of the development process itself.
A secondary challenge was the gap between the context files and the actual codebase. As the project evolved, small divergences accumulated between what the documents described and what the code actually did. Catching these required periodic audits — sessions dedicated entirely to reading the codebase and correcting the context files, rather than building new features.
7b. Design Tokens
Maintaining visual consistency across a multi-page, multi-role application — built incrementally over many AI sessions — required a strict design token system. All colors, spacing values, typography sizes, and border radii were defined once as CSS custom properties in a single file. Components were permitted to reference only these tokens, never raw values or Tailwind color classes.
The challenge was enforcement. The AI, left without explicit instruction, defaults to its training data — which includes a large amount of code using raw Tailwind classes. Without a clear rule in the context files, it would use bg-blue-600 instead of the project's semantic token. This happened repeatedly in early sessions and required correction passes.
The payoff was significant: when the visual direction changed mid-project, updating a single token in one file propagated the change across every surface that used it. What would have been a multi-file find-and-replace became a one-line edit.
7c. CI/CD
Continuous integration was enforced through a simple but non-negotiable rule: npm run build must pass before any session is considered complete. TypeScript compilation and Next.js build checks catch a wide class of errors — type mismatches, missing exports, invalid imports — that would otherwise reach production silently.
The tradeoff was speed. Build checks add time to every session, and the temptation to skip them when a change feels small is real. The rule existed precisely because small changes are where silent regressions hide.
A more mature CI pipeline — automated tests on every commit, preview deployments, integration test runs — was not implemented at this stage. The project reached production-readiness with build checks and a manual testing discipline, which was appropriate for the team size and timeline. The architecture is designed to accommodate a full CI pipeline when the project scales.
7d. Code Standards and AI
The code-standards.md file defined the implementation rules the AI was required to follow: strict TypeScript, no any types, Server Components by default, tokens only in styling, single-responsibility modules. These rules existed because the AI's defaults — shaped by its training data — do not match any specific project's conventions.
The practical challenge was that code standards alone are not self-enforcing. The AI follows rules it can see. If a rule was ambiguous, it defaulted to its own interpretation. If a rule was missing, it filled the gap with a habit from training. A quality audit conducted at the midpoint of the project identified fourteen code smell categories — not bugs, but deviations from the project's standards that had accumulated across sessions. Each required a targeted correction pass.
This is a fundamental characteristic of AI-assisted development: the quality of the output is a direct function of the quality of the constraints. Writing precise, unambiguous standards is a skill in itself — and one that compounds across a project's lifetime.

8. Results and Impact
8a. Development Velocity
The most measurable result of the AI-assisted development process was speed. Twenty feature units were completed across the full application lifecycle — from database schema and authentication to payment processing, document review, multi-role admin panels, internationalisation, SEO, and a renewal flow. Each unit was built, tested, and verified end-to-end before the next began.
The test suite grew alongside the codebase: 436 unit tests and a suite of integration tests were in place at feature completion. This was not a separate QA phase bolted on at the end — tests were written as part of each feature spec, treated as a deliverable condition rather than an afterthought.
This pace would not have been achievable by a single developer working without AI assistance. The context system was what made it sustainable: because the AI operated within defined constraints, speed did not accumulate technical debt in proportion to output.
8b. Code Quality
A formal quality audit was conducted at the midpoint of the project, covering all completed features at that point. The audit classified every finding into one of three categories: hard violations (rules broken, must fix), code smells (maintainability concerns, fix when convenient), and intentional exceptions (rule broken for a documented reason, accepted).
The audit found three hard violations — all resolved before new features were built on top of them. Fourteen code smells were identified and tracked. The majority were addressed in a dedicated correction pass before the end of the project. Zero intentional exceptions were left undocumented — every deviation from the standards had a written reason.
This level of auditability — knowing exactly where the codebase deviates from its own rules, and why — is itself a result of the structured development process. Without the code standards document as a reference, there would be no baseline to audit against.
8c. UX Improvements
Several UX decisions were made deliberately to reduce friction and build trust — two qualities that matter especially for a service handling legal documents and real money.
Deadline-aware pricing: instead of presenting tiers as abstract product names, the checkout asks users directly when they need their NIF. The tier selection follows from the answer. This removes a decision the user should not have to make.
Transparent status timeline: the customer dashboard shows a visual timeline of every stage in the application process, with an estimated delivery date. Users know exactly where their order stands at any moment — eliminating the need to contact support for status updates.
AI document pre-check with actionable feedback: when a document is flagged, the user receives a specific reason — not a generic rejection. 'Utility bill is older than 3 months' is actionable. 'Document rejected' is not. This reduces failed upload cycles and the frustration that comes with them.
Progressive escalation: after two failed upload attempts, the system automatically escalates to human review, with a clear message to the user. The AI handles what it can confidently handle; humans take over when confidence drops.

9. Lessons Learned
Avoid Bleeding-Edge Versions in Production Projects
Next.js 16.2 was chosen at the start of the project — a version released very recently at the time. In practice, this meant sparse official documentation, AI assistants whose training data did not fully cover the new patterns, and occasional situations where the correct approach had to be discovered through trial and error rather than looked up. For a project built under time pressure, this was an avoidable friction. The lesson is simple: unless there is a specific, compelling reason to use the latest release, prefer the most recent stable and well-documented version. Stability compounds — every hour not spent debugging framework behaviour is an hour spent building product.
The Spec Is the Product
The quality of every feature the AI delivered was a direct reflection of the quality of the feature spec that described it. A vague spec produced vague code — technically functional, but misaligned with the actual intent. A precise spec, with explicit scope limits and clear implementation steps, produced code that required minimal correction. Writing good feature specs turned out to be a skill in itself, one that takes as long to develop as writing good code. The investment in a well-written spec always paid back more than it cost.
Start with a Clear Visual Direction
Starting implementation without a precise mockup created problems that only became visible later. Design decisions that were left implicit — layout, hierarchy, spacing, component behaviour — were made by the AI based on its defaults, not on the product's actual needs. These decisions accumulated across features and required a dedicated refactor pass to correct. A detailed mockup, agreed upon before any code is written, is not a luxury — it is a prerequisite for consistent UI development at speed.
Understand Before You Build
One of the most important lessons of the project was also the most uncomfortable: it is easy to feel productive without actually making progress. The AI responds immediately, generates code confidently, and makes movement feel like advancement. But finishing a feature only to realise it did not make sense — or did not fit the broader system — is not progress. It is rework. Reading the spec carefully, understanding the user flow, and asking the right questions before starting implementation consistently saved more time than the delay cost. The developer's job is not to press 'go ahead' — it is to understand what 'go ahead' means before pressing it.
Documentation Must Stay in Sync
When the context files fell out of sync with the actual codebase, the AI began building against a reality that no longer existed. These divergences were silent — no error, no warning, just subtly wrong behaviour that only surfaced later. Keeping documentation current is not administrative overhead. In an AI-assisted workflow, it is the mechanism by which the system maintains coherence across sessions.
Test at the Speed You Build
When moving fast, testing feels like the first thing to defer. It is actually the last. The faster the development pace, the more silently regressions can be introduced — the AI has no memory of previous decisions and no awareness of side effects across the codebase. A test suite that grows alongside the features is not a quality measure. It is a structural safety net that makes speed sustainable.

10. Considerations and Next Steps
A New Development Paradigm
This project was built at a moment of genuine transition in software development. AI is not a tool that sits alongside the developer — it is becoming a layer of abstraction in its own right, comparable to what high-level languages did to assembly, or what frameworks did to raw HTTP handling. No one writes code in isolation anymore. The question is no longer whether to use AI, but how to use it well.
The answer this project points toward is clear: the developer becomes the orchestrator. That role combines engineering and architecture — knowing what to build, in what order, with what constraints, and why. It requires a solid foundation in coding principles and software design, because the orchestrator must be able to evaluate what the AI produces, catch what it gets wrong, and make decisions the AI cannot make alone. It also requires a deep understanding of how AI actually works — its capabilities, its failure modes, and the conditions under which it produces reliable output.
This is a higher-order skill than writing code. It is harder to teach, harder to evaluate, and harder to fake.
What This Project Points Toward
The development pattern that emerged in this project — spec → implementation → tests → commit, repeated consistently across features — suggests a natural next step: automation of the pipeline itself.
Given how reliably this cycle ran across the final features of the project, an AI system could plausibly run the entire loop autonomously: drafting a feature spec, waiting for asynchronous human approval, implementing, running unit, integration, and end-to-end tests, fixing failures, and opening a pull request with a complete commit message — overnight, unattended.
More advanced configurations could introduce parallel sub-agents with specialised responsibilities: one for code audits, one for localisation, one for test-driven self-healing bug fixes. Each operating within defined boundaries, reporting to a human orchestrator who approves, redirects, or rejects.
This may sound ambitious. It is. But the architecture for it already exists in embryonic form in this project — in the context system, the feature specs, the test suite, and the strict separation between what the AI decides and what the human decides.
A Final Thought
A system is not good because it never makes mistakes. At sufficient scale and speed, mistakes are inevitable — in human development and in AI-assisted development alike. A good system is one that is prepared for when mistakes happen: that catches them early, contains their impact, and makes them cheap to fix.
That principle shaped every decision in this project. It is also the principle that will shape whatever comes next.
