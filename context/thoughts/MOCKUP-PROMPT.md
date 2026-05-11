# UI Mockup Generation Prompt

**Purpose:** Generate high-fidelity mockups for RemoteNIF v2 — Portuguese NIF Application Service

**Target:** Use this prompt with Claude, GPT-4, or specialized design AI tools (v0.dev, Galileo AI, etc.)

---

## Project Context

You are designing the UI for RemoteNIF, a web application that helps non-residents obtain Portuguese NIF (tax identification) numbers online. The service offers three tiers (Essential €79, Standard €129, Express €179) with different delivery speeds and fiscal representation options.

**Target users:**
- Marcus (44, American) — buying property in Lisbon, has a 3-week deadline
- Amira (31, French) — applying for D8 visa, needs NIF for consulate appointment

**Core value proposition:**
- Transparent pricing (no hidden fees)
- Deadline-aware tier selection
- Clear status tracking
- Honest communication about what we control vs. what Finanças controls

---

## Design System

### Color Tokens (OKLCH Format)

**Backgrounds (Light Theme):**
- `--bg-base`: oklch(98% 0.006 264) — Page canvas
- `--bg-surface`: oklch(100% 0 0) — Cards, panels (white)
- `--bg-elevated`: oklch(100% 0 0) — Modals, dropdowns (white)
- `--bg-subtle`: oklch(93% 0.04 250) — Muted sections, tags (light blue)

**Text:**
- `--text-primary`: oklch(22% 0.04 264) — Headings, body copy (dark slate)
- `--text-secondary`: oklch(45% 0.03 264) — Supporting text, labels (medium slate)
- `--text-muted`: oklch(62% 0.02 264) — Placeholders, captions (light slate)
- `--text-on-accent`: oklch(100% 0 0) — Text on colored backgrounds (white)

**Borders:**
- `--border-subtle`: oklch(96% 0.008 264) — Light dividers
- `--border-default`: oklch(92% 0.01 264) — Standard borders
- `--border-strong`: oklch(22% 0.04 264) — Emphasis borders

**Brand:**
- `--brand-primary`: oklch(60% 0.16 250) — Main CTAs (blue)
- `--brand-primary-dim`: oklch(93% 0.04 250) — Hover states (light blue)
- `--brand-secondary`: oklch(55% 0.18 275) — Secondary accents (indigo)

**Status:**
- `--status-success`: oklch(70% 0.14 165) — Success messages (emerald)
- `--status-warning`: oklch(78% 0.13 75) — Warnings (amber)
- `--status-error`: oklch(62% 0.18 25) — Errors (rose)
- `--status-info`: oklch(72% 0.11 230) — Info messages (sky)

### Typography

**Font families:**
- UI text: Inter
- Monospace: JetBrains Mono

**Type scale:**
- xs: 12px — Captions, badges
- sm: 14px — Small body text, labels
- base: 16px — Default body text
- lg: 18px — Emphasized body text
- xl: 20px — Small headings
- 2xl: 24px — Section headings
- 3xl: 32px — Page headings
- 4xl: 40px — Hero headings

**Font weights:**
- Normal: 400 — Body text
- Medium: 500 — Emphasized text, labels
- Semibold: 600 — Subheadings, buttons
- Bold: 700 — Headings

### Spacing (8px Grid)

- 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px

### Border Radius

- sm: 6px — Inline elements, badges
- md: 8px — Inputs, small components
- lg: 12px — Cards, panels
- xl: 16px — Large cards
- 2xl: 24px — Modals, sheets
- full: 9999px — Pills, avatars

### Shadows

- sm: Subtle lift
- md: Cards
- lg: Dropdowns
- xl: Modals

---

## Screen Specifications

### 1. Homepage (`/`)

**Purpose:** Build trust, explain service, drive CTA click

**Layout:**
- Hero section with headline, subheadline, primary CTA
- Trust indicators (testimonials, processing time, transparent pricing)
- Service explanation (3-step process)
- FAQ section
- Footer with language switcher

**Key elements:**
- **Headline:** "Get Your Portuguese NIF Online — Fast, Transparent, Reliable"
- **Subheadline:** "No hidden fees. No surprises. Choose the tier that fits your deadline."
- **Primary CTA:** "Get Started" (large button, brand-primary color)
- **Trust signals:** "500+ NIFs delivered" | "4.9/5 rating" | "48h Express option"
- **3-step process:**
  1. Choose your tier
  2. Upload documents
  3. Receive your NIF

**Visual style:**
- Clean, professional, not overly "startup-y"
- Generous whitespace
- Clear hierarchy (hero → trust → explanation → FAQ)

---

### 2. Pricing Page (`/pricing`)

**Purpose:** Deadline question + tier selection in one screen

**Layout:**
- Question at top: "When do you need your NIF?"
- Three tier cards side-by-side (desktop) or stacked (mobile)
- Each card shows: name, price, features, delivery time, CTA button

**Tier cards:**

**Essential (€79):**
- "NIF only, no fiscal representation"
- "5 business days delivery"
- Features: NIF number, No fiscal rep
- CTA: "Select Essential"

**Standard (€129):**
- "NIF + 12 months fiscal representation"
- "5 business days delivery"
- Features: NIF number, 12 months fiscal rep
- CTA: "Select Standard"

**Express (€179):**
- "Fast-track submission within 48 hours"
- "Application submitted in 48h"
- Features: NIF number, 12 months fiscal rep, Priority processing
- Badge: "Most Popular" or "Fastest"
- CTA: "Select Express"

**Visual hierarchy:**
- Express card slightly elevated (shadow-lg)
- Standard card has subtle highlight
- Essential card is neutral

**Below cards:**
- "All tiers include: AI document review, Admin verification, Email support"
- "Fiscal representation renewal: €89/year (Standard & Express only)"

---

### 3. Sign Up Page (`/signup`)

**Purpose:** Fast account creation before checkout

**Layout:**
- Centered card (max-width: 400px)
- Logo at top
- Form fields: Email, Password
- Submit button
- Link to sign in

**Form:**
- Email input (type: email, placeholder: "your@email.com")
- Password input (type: password, placeholder: "Min 8 characters")
- Submit button: "Create Account" (full width, brand-primary)
- Below button: "Already have an account? Sign in"

**Validation:**
- Inline error messages below fields
- Email format validation
- Password strength indicator (optional)

**Visual style:**
- Minimal, focused
- No distractions
- Clear error states

---

### 4. Dashboard — Documents Pending (`/dashboard`)

**Purpose:** Personal details form + document upload

**Layout:**
- Header: "Your Order" with status badge
- Personal details form (top section)
- Three document upload slots (below form)
- Each slot shows: icon, label, upload button, status

**Personal details form:**
- Full legal name (text input)
- Date of birth (date picker)
- Nationality (dropdown with country flags)
- Passport number (text input)
- Passport expiry date (date picker)
- Current address (textarea)
- Submit button: "Save and Generate POA"

**After form submission:**
- POA download link appears: "Your POA is ready. Download it here."
- Document upload slots become enabled

**Document upload slots:**

**Slot 1: Passport**
- Icon: Passport icon
- Label: "Passport (photo page)"
- Status: "Not uploaded" → "Uploading..." → "Reviewing..." → "Approved ✓" or "Flagged ⚠"
- Upload button: "Upload Passport"

**Slot 2: Proof of Address**
- Icon: Document icon
- Label: "Proof of address (utility bill or bank statement, <3 months old)"
- Status: Same as above
- Upload button: "Upload Proof of Address"

**Slot 3: Signed POA**
- Icon: Signature icon
- Label: "Signed Power of Attorney"
- Status: "Not uploaded" → "Uploading..." → "Approved ✓"
- Upload button: "Upload Signed POA"

**Visual states:**
- **Not uploaded:** Gray background, dashed border
- **Uploading:** Blue background, spinner
- **Reviewing:** Blue background, animated dots
- **Approved:** Green background, checkmark icon
- **Flagged:** Amber background, warning icon + specific reason + "Re-upload" button

---

### 5. Dashboard — Under Review (`/dashboard`)

**Purpose:** Show order status while waiting for admin approval

**Layout:**
- Status timeline (horizontal or vertical)
- Current status: "Under review"
- Message: "Our team is reviewing your documents. We'll notify you within 4 hours."
- No actions required

**Status timeline:**
- Documents uploaded ✓
- Under review (current, highlighted)
- Approved (pending)
- Submitted (pending)
- Delivered (pending)

**Visual style:**
- Timeline with progress indicator
- Current step highlighted with brand-primary color
- Completed steps with checkmarks
- Pending steps grayed out

---

### 6. Dashboard — Submitted (`/dashboard`)

**Purpose:** Show order status while waiting for Finanças

**Layout:**
- Status timeline (same as above)
- Current status: "Submitted to Finanças"
- Estimated delivery: "Typically 5–10 business days from submission"
- Honest copy: "This is an estimate — Finanças processing times are outside our control."
- Support link: "Need help? Contact support"
- Content section: "While you wait" with useful reading

**Content section:**
- "What to do after receiving your NIF"
- "How to open a Portuguese bank account"
- "What is NHR/IFICI?"

---

### 7. Dashboard — Delivered (`/dashboard`)

**Purpose:** Display NIF number and order completion

**Layout:**
- Large NIF number display (center, prominent)
- Copy button next to NIF
- "What comes next?" section below
- Order details (tier, date ordered, date delivered)

**NIF display:**
- Large font (3xl or 4xl)
- Monospace font (JetBrains Mono)
- Copy button with icon
- Success message: "Your NIF has been delivered!"

**What comes next section:**
- Opening a Portuguese bank account
- Registering property (if applicable)
- Understanding NHR/IFICI
- Links to guides or partner services

---

### 8. Admin — Order List (`/admin`)

**Purpose:** View all orders with filters

**Layout:**
- Header: "Orders" with filter controls
- Table with columns: Customer, Tier, Status, Date Ordered, Actions
- Express orders highlighted (red countdown if SLA at risk)

**Filters:**
- Status dropdown (All, Documents Pending, Under Review, Approved, Submitted, Delivered)
- Tier dropdown (All, Essential, Standard, Express)
- Search by customer name or order ID

**Table:**
- Customer name + email
- Tier badge (color-coded)
- Status badge (color-coded)
- Date ordered (relative time: "2 hours ago")
- Express SLA countdown (if applicable, color-coded: green → amber → red)
- Actions: "View Details" button

---

### 9. Admin — Order Detail (`/admin/orders/[id]`)

**Purpose:** Review documents, override AI, approve order

**Layout:**
- Order header (customer name, tier, status)
- Customer details section
- Documents section (3 documents with preview)
- Action buttons (Approve Order, Update Status, Resend Email)

**Documents section:**
- Each document shows: thumbnail, AI review result, admin override option
- AI review result: "Clear ✓" or "Flagged ⚠ [reason]"
- Admin actions: "Approve" or "Flag" buttons
- If flagged by admin: reason input (required)

**Approve Order button:**
- Only appears when all 3 documents approved
- Large, prominent button
- Confirmation dialog: "Are you sure? This will notify the operator and start the Express SLA timer (if applicable)."

---

### 10. Operator — Submission Queue (`/operator`)

**Purpose:** View orders ready for submission, prioritized by SLA

**Layout:**
- Two sections: Express orders (top), Standard orders (bottom)
- Each row shows: customer name, tier, SLA countdown (Express only), "Download Package" button, "Mark as Submitted" button

**Express section:**
- Sorted by SLA countdown (least time remaining first)
- SLA countdown color-coded: green (>24h) → amber (12-24h) → red (<12h)
- Large, prominent countdown

**Standard section:**
- Sorted by date ordered (oldest first)
- No countdown

**Actions:**
- "Download Package" — downloads ZIP with cover sheet + 3 documents
- "Mark as Submitted" — transitions order to submitted status

---

## Responsive Design

**Breakpoints:**
- Mobile: <640px
- Tablet: 640px - 1024px
- Desktop: >1024px

**Mobile considerations:**
- Tier cards stack vertically
- Forms use full width
- Document upload slots stack vertically
- Admin table becomes card-based layout
- Operator queue becomes card-based layout

---

## Interaction States

**Buttons:**
- Default: brand-primary background, white text
- Hover: 90% opacity or brand-primary-dim background
- Active: slightly darker
- Disabled: 50% opacity, cursor not-allowed
- Loading: spinner icon, disabled state

**Inputs:**
- Default: border-default
- Focus: border-brand-primary, outline ring
- Error: border-status-error, error message below
- Disabled: 50% opacity, cursor not-allowed

**Cards:**
- Default: bg-surface, border-default, shadow-md
- Hover: shadow-lg (if interactive)
- Selected: border-brand-primary

---

## Accessibility

- All interactive elements have visible focus states
- Color is never the only indicator (use icons + text)
- Minimum contrast ratio: 4.5:1 for body text
- All form inputs have labels (visible or aria-label)
- Buttons have descriptive text or aria-label

---

## Copy Tone

- **Concise and direct** — "Upload your documents" not "Documents can be uploaded"
- **Honest about limitations** — "Typically 5–10 business days" not "Lightning fast!"
- **Action-oriented** — Clear CTAs, no ambiguity
- **Error messages are specific** — "Passport photo is too blurry" not "Invalid file"
- **Success messages are reassuring** — "Your documents have been approved" not just "Success"

---

## Output Format

Please generate mockups for the following screens in priority order:

1. **Pricing page** (most critical — this is where conversion happens)
2. **Dashboard — Documents Pending** (core user flow)
3. **Dashboard — Delivered** (success state)
4. **Homepage** (first impression)
5. **Sign Up** (account creation)
6. **Admin — Order Detail** (admin workflow)
7. **Operator — Submission Queue** (operator workflow)

For each screen, provide:
- High-fidelity mockup (desktop and mobile views)
- Annotations for interactions (hover states, click actions)
- Spacing measurements (using 8px grid)
- Color values (using token names)
- Typography specifications (font size, weight, line height)

**Preferred format:**
- Figma file (if possible)
- PNG/SVG exports with annotations
- HTML/CSS prototypes (if using v0.dev or similar)

---

## Additional Context

**What makes this different from competitors:**
- Transparent pricing (no hidden fees)
- Deadline-aware tier selection (question + cards together)
- Honest communication (we don't control Finanças processing time)
- Clear status tracking (timeline with realistic estimates)
- Post-NIF journey guide (we help beyond just getting the NIF)

**Visual inspiration:**
- Stripe (clean, professional, generous whitespace)
- Linear (modern, fast, focused)
- Vercel (minimal, high contrast, clear hierarchy)

**NOT like:**
- Overly "startup-y" with illustrations everywhere
- Cluttered with too many CTAs
- Aggressive sales language
- Dark patterns or hidden information

---

## Questions to Consider

When generating mockups, think about:

1. **Does the pricing page make the tier choice obvious?** Can Marcus immediately see which tier fits his 3-week deadline?

2. **Does the document upload flow feel reassuring?** Does Amira understand what happens after she uploads her passport?

3. **Does the status page set realistic expectations?** Do users understand what we control vs. what Finanças controls?

4. **Does the admin panel make document review efficient?** Can an admin review and approve an order in <2 minutes?

5. **Does the operator queue make priority unmistakable?** Can an operator immediately see which Express order needs attention first?

---

## Success Criteria

The mockups are successful if:

- A user can understand the pricing and select a tier in <30 seconds
- The document upload flow feels clear and reassuring (not intimidating)
- The status page sets realistic expectations (no false promises)
- The admin panel makes document review fast and error-free
- The operator queue makes priority obvious at a glance

---

**Ready to generate mockups!** Use this prompt with your preferred AI design tool or LLM.
