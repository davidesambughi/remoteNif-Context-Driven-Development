# Architecture Context

<!-- This file is the technical specification for how the system is built.
     It combines the tech spec, architecture diagram (described in prose), project tree, and system invariants.
     The AI must not violate the invariants defined here, even if a shortcut is technically possible. -->

---

## Stack

| Layer | Technology | Version | Role | Why This Choice |
| ----- | ---------- | ------- | ---- | --------------- |
| **Framework** | Next.js | 16.2.4 | Full-stack React framework with App Router | Server Components, Server Actions, built-in i18n support, Turbopack bundler |
| **Runtime** | React | 19.2.4 | UI library | Latest stable with Server Components support |
| **Language** | TypeScript | 5.x | Type safety across codebase | Compile-time error detection, better DX |
| **Bundler** | Turbopack | (built-in) | Development and production builds | Default in Next.js 16+, faster than Webpack |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS framework | Design token integration, rapid UI development |
| **UI Components** | shadcn/ui | Latest | Composable component library | Built on Radix UI, fully customizable, no runtime overhead |
| **Database** | Supabase PostgreSQL | Latest | Relational data persistence | Managed Postgres, real-time subscriptions, row-level security |
| **ORM** | Drizzle ORM | Latest | Type-safe database access | Lightweight, SQL-like syntax, excellent TypeScript support |
| **Auth** | Supabase Auth | Latest | User authentication and sessions | Email/password, OAuth providers, JWT-based sessions |
| **Storage** | Supabase Storage | Latest | Document and file storage | S3-compatible, integrated with Supabase Auth for access control |
| **Payments** | Stripe | Latest | Payment processing and webhooks | Industry standard, supports EU and international cards, webhook reliability |
| **Email** | Resend | Latest | Transactional email delivery | React Email templates, excellent deliverability, simple API |
| **Validation** | Zod | Latest | Runtime schema validation | Type inference, composable schemas, form validation |
| **i18n** | next-intl | Latest | Internationalization | App Router support, type-safe translations, locale routing |
| **AI** | Google Gemini | Latest | Document review and validation | Vision API for document analysis, cost-effective |

---

## Project Tree

```
nif3/
├── app/                          # Next.js 16 App Router
│   ├── [locale]/                 # Internationalized routes (en, fr, es, de)
│   │   ├── (marketing)/          # Public pages (no auth required)
│   │   │   ├── page.tsx          # Homepage
│   │   │   ├── pricing/          # Tier selection
│   │   │   └── about/            # About, legal pages
│   │   ├── (auth)/               # Authentication flows
│   │   │   ├── signin/           # Sign in
│   │   │   ├── signup/           # Account creation
│   │   │   └── reset-password/   # Password reset
│   │   ├── (dashboard)/          # Customer dashboard (auth required)
│   │   │   ├── layout.tsx        # Dashboard shell
│   │   │   ├── page.tsx          # Order status / document upload
│   │   │   └── settings/         # Account settings
│   │   ├── (admin)/              # Admin panel (admin role required)
│   │   │   ├── layout.tsx        # Admin shell
│   │   │   ├── page.tsx          # Order list
│   │   │   └── orders/[id]/      # Order detail
│   │   └── (operator)/           # Operator panel (operator role required)
│   │       ├── layout.tsx        # Operator shell
│   │       ├── page.tsx          # Submission queue
│   │       ├── submitted/        # Submitted orders archive
│   │       └── preferences/      # Notification settings
│   ├── api/                      # API routes (REST endpoints)
│   │   ├── webhooks/             # External webhooks
│   │   │   └── stripe/           # Stripe payment webhooks
│   │   └── documents/            # Document operations
│   │       └── review/           # AI document review endpoint
│   ├── actions/                  # Server Actions (mutations)
│   │   ├── auth.ts               # Auth actions (signin, signup, signout)
│   │   ├── orders.ts             # Order mutations (create, update status)
│   │   ├── documents.ts          # Document upload and review
│   │   ├── admin.ts              # Admin actions (approve, override)
│   │   └── operator.ts           # Operator actions (markAsSubmitted, deliverNIF, downloadPackage, updateOperatorPreferences)
│   ├── globals.css               # Design tokens and base styles
│   ├── layout.tsx                # Root layout
│   └── not-found.tsx             # 404 page
├── components/                   # React components
│   ├── ui/                       # shadcn/ui primitives (DO NOT MODIFY)
│   ├── marketing/                # Marketing page components
│   ├── dashboard/                # Dashboard components
│   ├── admin/                    # Admin panel components
│   ├── operator/                 # Operator panel components
│   └── shared/                   # Shared components (header, footer)
├── lib/                          # Shared infrastructure
│   ├── supabase/                 # Supabase clients
│   │   ├── client.ts             # Client-side Supabase client
│   │   ├── server.ts             # Server-side Supabase client
│   │   └── admin.ts              # Admin Supabase client (service role)
│   ├── db/                       # Database layer
│   │   ├── schema.ts             # Drizzle schema definitions
│   │   ├── queries.ts            # Reusable queries
│   │   └── migrations/           # Database migrations
│   ├── stripe/                   # Stripe integration
│   │   ├── client.ts             # Stripe client
│   │   └── webhooks.ts           # Webhook handlers
│   ├── email/                    # Email templates and sending
│   │   ├── templates/            # React Email templates
│   │   └── send.ts               # Email sending logic
│   ├── ai/                       # AI integrations
│   │   └── gemini.ts             # Document review with Gemini
│   ├── auth/                     # Auth utilities
│   │   ├── session.ts            # Session management
│   │   └── permissions.ts        # Role-based access control
│   ├── validations/              # Zod schemas
│   │   ├── auth.ts               # Auth schemas
│   │   ├── orders.ts             # Order schemas
│   │   └── documents.ts          # Document schemas
│   ├── utils/                    # Utility functions
│   │   ├── dates.ts              # Date formatting
│   │   ├── currency.ts           # Currency formatting
│   │   └── files.ts              # File handling
│   ├── env.ts                    # Zod env validation — validated at startup, imported wherever env vars are needed
│   └── pricing.ts                # Hardcoded tier + renewal pricing config
├── types/                        # TypeScript type definitions
│   ├── database.ts               # Database types (generated from Drizzle)
│   ├── supabase.ts               # Supabase types
│   └── index.ts                  # Shared types
├── messages/                     # i18n translation files
│   ├── en.json                   # English
│   ├── fr.json                   # French
│   ├── es.json                   # Spanish
│   └── de.json                   # German
├── public/                       # Static assets
│   ├── images/                   # Images
│   └── fonts/                    # Custom fonts (if any)
├── context/                      # Project documentation (this folder)
├── proxy.ts                      # Request proxy (replaces middleware.ts in Next.js 16)
├── i18n.ts                       # next-intl configuration
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── drizzle.config.ts             # Drizzle ORM configuration
└── package.json                  # Dependencies
```

---

## System Boundaries

<!-- Define what each part of the system is responsible for.
     These boundaries are enforced — mixing responsibilities across boundaries is an invariant violation. -->

| Boundary | Responsibility | What Lives Here | What Does NOT Live Here |
| -------- | -------------- | --------------- | ----------------------- |
| **`app/[locale]/(route-group)/`** | Route-specific UI and layouts | Page components, layouts, loading states, error boundaries | Business logic, database queries, validation |
| **`app/actions/`** | Server-side mutations | Form submissions, data updates, auth operations | Direct database access (use `lib/db`), UI components |
| **`app/api/`** | External-facing HTTP endpoints | Webhook handlers, third-party integrations | Internal mutations (use Server Actions instead) |
| **`components/`** | UI composition only | React components, client-side interactivity | Business logic, database queries, auth checks |
| **`lib/`** | Shared infrastructure | Database clients, API clients, utilities, validation schemas | UI components, route-specific logic |
| **`lib/db/`** | Database access layer | Drizzle queries, schema definitions, migrations | Business logic (belongs in `actions/`), UI |
| **`lib/validations/`** | Input validation | Zod schemas for forms, API inputs, env vars | Database queries, UI components |
| **`types/`** | Type definitions only | TypeScript interfaces, types, enums | Runtime logic, functions, components |
| **`messages/`** | Translations only | JSON translation files for i18n | Code, logic, components |

**Key principles:**
- **Server Actions** (`app/actions/`) handle all mutations — no direct database access from components
- **API routes** (`app/api/`) are for external webhooks only — internal mutations use Server Actions
- **Components** are pure UI — they receive data as props and call Server Actions for mutations
- **lib/** is infrastructure — reusable across the entire app, no route-specific logic

---

## Storage Model

<!-- Define what data lives where. One source of truth per data type. -->

| Data Type | Storage Layer | Access Pattern | Notes |
| --------- | ------------- | -------------- | ----- |
| **User identity** | Supabase Auth | `lib/supabase/server.ts` → `auth.getUser()` | Email/password, OAuth, JWT sessions |
| **User profile** | PostgreSQL `users` table | Drizzle ORM via `lib/db/` | Extended user data (language preference, role) |
| **Orders** | PostgreSQL `orders` table | Drizzle ORM via `lib/db/` | Order status, tier, timestamps, customer details |
| **Documents** | Supabase Storage | `lib/supabase/server.ts` → `storage` API | Passport, proof of address, signed POA |
| **Document metadata** | PostgreSQL `documents` table | Drizzle ORM via `lib/db/` | File paths, AI review results, upload timestamps |
| **Payments** | Stripe | Stripe API via `lib/stripe/` | Payment intents, customer IDs, subscription status |
| **Payment records** | PostgreSQL `payments` table | Drizzle ORM via `lib/db/` | Local copy of Stripe payment data for queries |
| **Translations** | JSON files in `messages/` | next-intl via `useTranslations()` | Static translations, no database |
| **Session state** | Supabase Auth cookies | Automatic via Supabase client | JWT tokens, refresh tokens |
| **Temporary uploads** | Supabase Storage temp bucket | Deleted after 24h if not confirmed | Pre-upload validation |

**Storage rules:**
- **Never store sensitive data in localStorage or cookies** — use Supabase Auth sessions
- **Never store large files in PostgreSQL** — use Supabase Storage, store URL reference in DB
- **Never duplicate Stripe data** — store only what's needed for queries (payment ID, amount, status)
- **Document files are immutable** — once uploaded and approved, never modified (only replaced with new upload)

---

## Auth and Access Model

**Auth provider:** Supabase Auth (email/password, JWT sessions)

**User roles:**
| Role | Database Column | Access Level |
| ---- | --------------- | ------------ |
| `customer` | `users.role = 'customer'` | Own orders, own documents, own account settings |
| `admin` | `users.role = 'admin'` | All orders, all documents, can override AI reviews, can update order status |
| `operator` | `users.role = 'operator'` | Orders in `documents_approved` status, can mark as submitted, cannot access admin panel |

**Access rules:**
1. **Authentication required for:**
   - All routes under `(dashboard)`, `(admin)`, `(operator)`
   - All Server Actions except auth actions (signin, signup, reset-password)
   - All document uploads and downloads

2. **Authorization checks:**
   - **Customers** can only access their own orders and documents
   - **Admins** can access all orders and documents
   - **Operators** can only access orders in `documents_approved` status
   - Role checks happen in Server Actions before any mutation

3. **Session management:**
   - Sessions are JWT tokens stored in HTTP-only cookies (managed by Supabase)
   - Session refresh happens automatically via Supabase client
   - Session expiry: 7 days (configurable in Supabase dashboard)

4. **Route protection:**
   - Implemented in `proxy.ts` (Next.js 16 replaces `middleware.ts`)
   - Redirects unauthenticated users to `/[locale]/signin`
   - Redirects unauthorized users to 403 page

**Implementation pattern:**
```typescript
// In Server Actions
export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')
  
  // Check role
  const userRole = await getUserRole(user.id)
  if (userRole !== 'admin') throw new Error('Forbidden')
  
  // Proceed with mutation
  // ...
}
```

---

## API Design

**Next.js 16 mutation patterns:**

### Server Actions (Preferred for Mutations)
- **Location:** `app/actions/*.ts`
- **Use for:** Form submissions, data mutations, auth operations
- **Pattern:**
  ```typescript
  'use server'
  
  export async function createOrder(formData: FormData) {
    // 1. Validate input with Zod
    const validated = orderSchema.parse(Object.fromEntries(formData))
    
    // 2. Auth check
    const user = await getCurrentUser()
    if (!user) throw new Error('Unauthorized')
    
    // 3. Business logic (thin — complex logic in lib/)
    const order = await db.insert(orders).values({...})
    
    // 4. Return result
    return { success: true, data: order }
  }
  ```

### API Routes (Only for External Webhooks)
- **Location:** `app/api/*/route.ts`
- **Use for:** Stripe webhooks, third-party callbacks
- **Pattern:**
  ```typescript
  export async function POST(request: Request) {
    // 1. Verify webhook signature
    const signature = request.headers.get('stripe-signature')
    const event = stripe.webhooks.constructEvent(body, signature, secret)
    
    // 2. Handle event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object)
        break
    }
    
    // 3. Return 200 (webhooks expect quick response)
    return Response.json({ received: true })
  }
  ```

**Key conventions:**
- All Server Actions validate input with Zod before any logic runs
- Auth and ownership checks run before any mutation
- Server Actions are thin — complex logic belongs in `lib/`
- API routes are for external webhooks only — internal mutations use Server Actions
- Long-running work (AI review, email sending) is handled asynchronously but within the same request (no separate queue needed at current scale)

---

## Next.js 16 Specific Patterns

### Proxy (Replaces Middleware)
- **File:** `proxy.ts` in project root
- **Purpose:** Request interception for auth checks, redirects, header manipulation
- **Key changes from middleware:**
  - Renamed from `middleware.ts` to `proxy.ts`
  - Function renamed from `middleware()` to `proxy()`
  - Same functionality, clearer naming

**Example:**
```typescript
// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // Auth check for protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('sb-access-token')
    if (!token) {
      return NextResponse.redirect(new URL('/signin', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/operator/:path*']
}
```

### Server Components (Default)
- All components in `app/` are Server Components by default
- Use `'use client'` directive only when needed:
  - Browser APIs (localStorage, window, etc.)
  - Event handlers (onClick, onChange, etc.)
  - React hooks (useState, useEffect, etc.)
  - Third-party libraries that require client-side rendering

### Server Actions
- Defined with `'use server'` directive
- Can be called from both Server and Client Components
- Automatically handle serialization and network transport
- Replace traditional API routes for mutations

### Caching Strategy (Next.js 16 Changes)
- **Default:** No caching (opt-in model in Next.js 16+)
- **Static pages:** Use `export const dynamic = 'force-static'`
- **Revalidation:** Use `revalidatePath()` or `revalidateTag()` after mutations
- **Data fetching:** Use `cache()` from React for request-level memoization

---

## Background Tasks

**Current approach:** Inline async operations (no separate queue)

**What runs inline:**
- AI document review (Gemini API) — ~2-3 seconds
- Email sending (Resend) — ~500ms
- Stripe API calls — ~1-2 seconds

**Why no queue at current scale:**
- Expected volume: <50 orders/day at launch
- All operations complete in <5 seconds
- User expects immediate feedback (especially for document review)
- Adding a queue adds complexity without clear benefit at this scale

**When to add a queue:**
- Volume exceeds 200 orders/day
- Operations start timing out (>30 seconds)
- Need retry logic for failed operations

**Future queue options:**
- Vercel Cron Jobs (for scheduled tasks)
- Inngest (for complex workflows)
- Trigger.dev (for background jobs)

---

## Refactoring Safety

<!-- The goal isn't to get everything right upfront — it's to make change cheap.
     These patterns ensure that mistakes are fixable and the codebase stays clean as it grows.
     The AI must follow these patterns from the first line of code. -->

### Design Tokens
All colors, spacing, typography, and other design values are defined as CSS custom properties in `app/globals.css` using the two-layer token system:
1. **Primitive colors** — raw OKLCH values (e.g., `--color-blue-600`)
2. **Semantic tokens** — role-based tokens (e.g., `--brand-primary`)

Components reference semantic tokens only — never primitives, never raw hex, never raw Tailwind color classes.

**Why:** Changing a color means updating one semantic token mapping. No find-and-replace across 50 files.

**Example:**
```tsx
// ❌ BAD
<button className="bg-blue-600 text-white">Click me</button>

// ✅ GOOD
<button className="bg-[var(--brand-primary)] text-[var(--text-on-accent)]">
  Click me
</button>
```

### Component Discipline
- **`components/ui/`** — shadcn/ui foundation. Do not modify these files directly.
- **`components/[feature]/`** — app-level components. One component per concept.
- **Rule:** Never copy-paste UI markup. If the same element appears in 3+ places, extract a component.

**Why:** Changing a button style means updating one file. All instances update automatically.

### Type-Safe Data Layer
Every data boundary is typed:
- **Database queries** return typed objects (Drizzle types)
- **API routes** validate request bodies with Zod, response shapes defined as TypeScript interfaces
- **Form inputs** typed via react-hook-form + Zod resolver
- **Environment variables** validated at startup with Zod

**Why:** TypeScript and Zod catch breaking changes at compile time, not in production.

**Example:**
```typescript
// lib/validations/orders.ts
import { z } from 'zod'

export const createOrderSchema = z.object({
  tier: z.enum(['essential', 'standard', 'express']),
  email: z.string().email(),
  // ...
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>

// app/actions/orders.ts
'use server'

export async function createOrder(input: unknown) {
  // Validate at runtime
  const validated = createOrderSchema.parse(input)
  
  // TypeScript knows the shape now
  const order = await db.insert(orders).values(validated)
  return order
}
```

### Separation of Concerns (Route Groups)
Isolate areas of the application into separate route groups so that changing one area cannot break another:
- **`app/[locale]/(marketing)/`** — public pages (homepage, pricing, about)
- **`app/[locale]/(auth)/`** — authentication flows (signin, signup, reset-password)
- **`app/[locale]/(dashboard)/`** — authenticated customer pages
- **`app/[locale]/(admin)/`** — internal admin panel
- **`app/[locale]/(operator)/`** — operator submission tool

**Why:** Each area is independently changeable. A refactor in admin cannot break the customer dashboard.

**Route group benefits:**
- Shared layouts per area (different headers for marketing vs dashboard)
- Separate loading and error states
- Clear mental model of the app structure

### Internationalization (i18n)
All user-facing text is translated using next-intl:
- **Translation files:** `messages/[locale].json`
- **Usage:** `useTranslations()` hook in components
- **Type safety:** TypeScript infers available keys from `messages/en.json`

**Why:** Adding a new language means adding one JSON file. No code changes required.

**Example:**
```typescript
// In component
import { useTranslations } from 'next-intl'

export function PricingCard() {
  const t = useTranslations('pricing')
  
  return (
    <div>
      <h2>{t('title')}</h2>
      <p>{t('description')}</p>
    </div>
  )
}

// messages/en.json
{
  "pricing": {
    "title": "Choose your tier",
    "description": "Select the plan that fits your timeline"
  }
}
```

### Feature Flags
For large changes that need to ship incrementally, use a simple flag pattern:
```typescript
// lib/flags.ts — feature flags as env-driven booleans
export const flags = {
  newCheckoutFlow: process.env.NEXT_PUBLIC_FLAG_NEW_CHECKOUT === 'true',
  aiDocumentReview: process.env.NEXT_PUBLIC_FLAG_AI_REVIEW === 'true',
}
```

Use when a feature is partially built, being tested, or not ready for all users. Do not use for every feature — only when a flag is genuinely needed.

---

## Invariants

<!-- Rules the AI must never violate. These are not guidelines — they are hard constraints.
     If a proposed implementation violates an invariant, stop and find a different approach. -->

1. **Server Actions handle all mutations** — no direct database access from components, no API routes for internal mutations.

2. **Metadata and files are stored in separate layers** — never put large blobs in PostgreSQL, always use Supabase Storage with URL reference in DB.

3. **Auth and ownership are verified at every mutation boundary** — never trust client-supplied IDs without checking, always verify user has permission.

4. **Client components (`"use client"`) are used only when necessary** — when the component needs browser APIs, event handlers, or React hooks. Default to Server Components.

5. **Business logic belongs in `lib/`** — Server Actions and API routes are thin, complex logic is extracted to reusable functions in `lib/`.

6. **Zod schemas validate all external input** — user input, API responses, environment variables, webhook payloads must have explicit Zod schemas.

7. **Never copy-paste UI** — extract a component if the same pattern appears in 3+ places.

8. **Never reference raw colors in components** — use design token CSS variables only (semantic tokens, not primitives).

9. **Every data boundary is typed** — API responses, form inputs, DB queries, and env variables must have explicit TypeScript types or Zod schemas.

10. **Translations are never hardcoded** — all user-facing text must use next-intl translation keys.

11. **File uploads go to Supabase Storage** — never store files in PostgreSQL, never store files on the filesystem.

12. **Proxy (`proxy.ts`) is for routing only** — no business logic, no database queries, no complex operations. Keep it fast and simple.

13. **Server Actions return structured results** — always return `{ success: true, data }` or `{ success: false, error }`, never throw errors to the client.

14. **Email templates are React components** — use React Email for all transactional emails, never string concatenation.

15. **Environment variables are validated at startup** — use Zod to validate all env vars in a single place, fail fast if misconfigured.

---

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run database migrations
npm run db:migrate

# Start development server (Turbopack)
npm run dev
```

### Database Migrations
```bash
# Generate migration from schema changes
npm run db:generate

# Apply migrations
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio
```

### Type Generation
```bash
# Generate TypeScript types from database schema
npm run db:generate

# Generate Supabase types
npm run supabase:types
```

### Testing
```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Run build (catches build-time errors)
npm run build
```

---

## Deployment

### Environment Variables (Production)
All environment variables from `.env.local` must be set in production:
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Resend: `RESEND_API_KEY`
- Gemini: `GEMINI_API_KEY`
- App: `NEXT_PUBLIC_APP_URL`

### Build Configuration
- **Bundler:** Turbopack (default in Next.js 16)
- **Output:** Standalone (for Docker/self-hosting) or Vercel (automatic)
- **Image optimization:** Next.js built-in (no external service needed)

### Deployment Targets
- **Vercel** (recommended): Zero-config deployment, automatic previews, edge functions
- **Self-hosted:** Docker container with standalone output
- **Other platforms:** Any Node.js hosting (Railway, Render, Fly.io)

---

## Performance Considerations

### Next.js 16 Optimizations
- **Turbopack:** ~400% faster dev startup, ~50% faster rendering
- **Server Components:** Reduce client-side JavaScript by default
- **Streaming:** Progressive rendering with Suspense boundaries
- **Image optimization:** Automatic WebP/AVIF conversion, lazy loading

### Caching Strategy
- **Static pages:** Marketing pages (homepage, pricing, about) are statically generated
- **Dynamic pages:** Dashboard, admin, operator pages are server-rendered on demand
- **Revalidation:** Use `revalidatePath()` after mutations to update cached pages
- **No aggressive caching:** Next.js 16 defaults to no caching (opt-in model)

### Database Optimization
- **Indexes:** Add indexes on frequently queried columns (user_id, order_id, status)
- **Connection pooling:** Supabase handles this automatically
- **Query optimization:** Use Drizzle's query builder for efficient queries

### File Storage Optimization
- **CDN:** Supabase Storage uses CDN for fast global delivery
- **Image resizing:** Use Supabase Storage transformations for thumbnails
- **Lazy loading:** Use Next.js Image component for automatic lazy loading

---

## Security Considerations

### Authentication
- **JWT tokens:** Stored in HTTP-only cookies (managed by Supabase)
- **Session refresh:** Automatic via Supabase client
- **Password requirements:** Min 8 characters, enforced by Supabase Auth

### Authorization
- **Row-level security:** Enabled on all Supabase tables
- **Role checks:** Verified in Server Actions before mutations
- **Ownership checks:** Users can only access their own data (except admins)

### Input Validation
- **Zod schemas:** All external input validated with Zod
- **File uploads:** Type and size validation before storage
- **SQL injection:** Prevented by Drizzle ORM (parameterized queries)

### Secrets Management
- **Environment variables:** Never commit `.env.local` to git
- **API keys:** Stored in environment variables, never in code
- **Webhook secrets:** Verified on every webhook request

### CORS and CSP
- **CORS:** Configured in `next.config.ts` for API routes
- **CSP:** Content Security Policy headers in `proxy.ts`
- **HTTPS:** Required in production (enforced by Vercel/hosting platform)

---

## Monitoring and Debugging

### Next.js 16 Debugging Features
- **Server Function logging:** Dev terminal shows function name, arguments, execution time
- **Hydration diff indicator:** Clear server/client diff in error overlay
- **`--inspect` flag:** Attach Node.js debugger to dev or production server
- **Error causes:** Error overlay shows full error cause chain

### Production Monitoring
- **Vercel Analytics:** Automatic performance monitoring (if deployed to Vercel)
- **Error tracking:** Consider Sentry for production error tracking
- **Logging:** Use `console.log` in Server Actions (visible in server logs)

### Performance Monitoring
- **Web Vitals:** Automatic tracking with Next.js
- **Database queries:** Monitor slow queries in Supabase dashboard
- **API latency:** Monitor Stripe, Resend, Gemini API response times

---

## Known Limitations and Trade-offs

### Current Scale Assumptions
- **Order volume:** <50 orders/day at launch, <200 orders/day in first year
- **Concurrent users:** <100 simultaneous users
- **File storage:** <10GB in first year

### Technical Debt Accepted
- **No background queue:** Inline async operations acceptable at current scale
- **No caching layer:** Next.js built-in caching sufficient for now
- **No CDN for API:** Vercel Edge Network sufficient for now
- **No separate admin database:** Single PostgreSQL instance for all data

### When to Revisit
- **Add background queue** when order volume exceeds 200/day
- **Add caching layer** when database queries become slow (>500ms)
- **Add CDN for API** when international latency becomes an issue
- **Separate admin database** when admin queries impact customer performance

---

## Future Architecture Considerations

### Potential Additions (Sprint 2+)
- **Real-time updates:** Supabase Realtime for live order status updates
- **Background jobs:** Inngest or Trigger.dev for complex workflows
- **Analytics:** PostHog or Mixpanel for product analytics
- **Feature flags:** LaunchDarkly or Vercel Flags for gradual rollouts
- **A/B testing:** Vercel Edge Config for experimentation

### Scalability Path
1. **Phase 1 (Current):** Monolithic Next.js app, single database, inline operations
2. **Phase 2 (200+ orders/day):** Add background queue, separate admin/customer databases
3. **Phase 3 (1000+ orders/day):** Microservices for document processing, separate API layer
4. **Phase 4 (10k+ orders/day):** Multi-region deployment, read replicas, CDN for API

---

## References

- [Next.js 16.2 Documentation](https://nextjs.org/docs)
- [Next.js 16.2 Release Notes](https://nextjs.org/blog/next-16-2)
- [Proxy Migration Guide](https://nextjs.org/docs/messages/middleware-to-proxy)
- [Supabase Documentation](https://supabase.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Resend Documentation](https://resend.com/docs)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
