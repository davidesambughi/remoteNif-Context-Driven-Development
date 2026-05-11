**\# Project Workflow Template**  
\*\*Your reusable mental map for shipping products fast\*\*

\---

**\#\# Phase 0: Idea Validation (1-2 days max)**

**\#\#\# Goal: Decide if this is worth building**

\*\*Questions to answer:\*\*  
1\. Who is this for? (Specific person, not "everyone")  
2\. What problem does it solve? (Concrete pain, not nice-to-have)  
3\. How will I know it worked? (1 metric that matters)  
4\. Can I build an MVP in 4 weeks? (If no, scope down)

\*\*Deliverable:\*\* 1-page doc with answers to these 4 questions

\*\*Stop if:\*\*  
\- You can't name a specific person with this problem  
\- The problem isn't painful enough for someone to pay  
\- You can't measure success  
\- MVP would take \> 4 weeks

\---

**\#\# Phase 1: Planning (3-5 days max)**

**\#\#\# Goal: Define what to build (not how to build it)**

\*\*Day 1-2: Write PRD\*\*  
\- Who is this for? (Personas)  
\- What problem does it solve?  
\- What are we building? (Features)  
\- What are we NOT building? (Scope limits)  
\- How do we know it worked? (Metrics)  
\- What are the constraints? (Time, tech, budget)

\*\*Template:\*\* \`context/project-overview.md\`

\---

\*\*Day 3-4: Map user flows\*\*  
\- List every screen (screen inventory)  
\- Map primary flows (happy paths)  
\- Map error flows (what breaks)  
\- Map edge cases (what if user does X?)

\*\*Template:\*\* \`context/user-flows.md\`

\*\*Rule:\*\* If a flow isn't documented, it doesn't exist. Don't build undocumented features.

\---

\*\*Day 5: Lock in design direction\*\*  
\- Pick a color palette (10 minutes, use design-tokens.css)  
\- Define semantic tokens (30 minutes)  
\- Test on 1 component (design-playground.html)  
\- Lock it in, move on

\*\*Template:\*\* \`design-tokens.css\` \+ \`design-playground.html\`

\*\*Rule:\*\* Good enough \> perfect. You can refine after shipping.

\---

\*\*Stop after 5 days. If you're still planning on day 6, you're over-thinking.\*\*

\---

**\#\# Phase 2: Foundation (2 days max)**

**\#\#\# Goal: Set up architecture that makes refactoring cheap**

\*\*Day 1: Project setup\*\*  
\`\`\`bash  
*\# Next.js \+ TypeScript*  
npx create-next-app@latest my-project \--typescript \--tailwind \--app

*\# Install essentials*  
npm install @supabase/supabase-js  
npm install stripe  
npm install resend  
npx shadcn@latest init

*\# Add core components*  
npx shadcn@latest add button  
npx shadcn@latest add input  
npx shadcn@latest add card  
npx shadcn@latest add select  
\`\`\`

\*\*Folder structure:\*\*  
\`\`\`  
app/  
  (marketing)/     \# Public pages  
  (dashboard)/     \# Authenticated user pages  
  (admin)/         \# Admin pages (if needed)  
lib/  
  types.ts         \# All TypeScript interfaces  
  supabase.ts      \# Supabase client  
  stripe.ts        \# Stripe client  
components/  
  ui/              \# shadcn components  
  \[custom\].tsx     \# Your custom components  
public/  
  design-tokens.css  
  design-playground.html  
\`\`\`

\---

\*\*Day 2: Core types \+ design tokens\*\*

\*\*Define core types:\*\*  
\`\`\`typescript  
*// lib/types.ts*  
export interface User {  
  id: string  
  email: string  
  created\_at: string  
}

export interface Order {  
  id: string  
  user\_id: string  
  status: 'pending' | 'processing' | 'completed'  
  amount: number  
  created\_at: string  
}

*// Add more as needed*  
\`\`\`

\*\*Add design tokens to globals.css:\*\*  
\`\`\`css  
@layer base {  
  :root {  
    /\* Copy from design-tokens.css \*/  
  }  
}  
\`\`\`

\*\*Configure Tailwind:\*\*  
\`\`\`ts  
*// tailwind.config.ts*  
theme: {  
  extend: {  
    colors: {  
      'bg-page': 'var(--bg-page)',  
      'bg-surface': 'var(--bg-surface)',  
      *// Map all tokens*  
    }  
  }  
}  
\`\`\`

\---

\*\*Stop after 2 days. If you're still setting up on day 3, you're over-engineering.\*\*

\---

**\#\# Phase 3: Build MVP (2-3 weeks)**

**\#\#\# Goal: Ship the minimum viable product**

\*\*Week 1: Core flow (customer-facing)\*\*  
\- Day 1-2: Landing page \+ pricing  
\- Day 3-4: Checkout (Stripe)  
\- Day 5: Dashboard (authenticated home)

\*\*Deliverable:\*\* Customer can pay you

\---

\*\*Week 2: Fulfillment (admin-facing)\*\*  
\- Day 1-2: Admin panel (view orders)  
\- Day 3-4: Core admin actions (approve, reject, update status)  
\- Day 5: Email notifications (Resend)

\*\*Deliverable:\*\* You can fulfill orders

\---

\*\*Week 3: Polish \+ Launch\*\*  
\- Day 1-2: Test full flow, fix critical bugs  
\- Day 3: Deploy to production (Vercel)  
\- Day 4-5: Get first customer (friends, Twitter, Reddit)

\*\*Deliverable:\*\* First paying customer

\---

\*\*Rules for MVP:\*\*  
1\. \*\*No feature takes \> 2 days\*\* — If it does, scope it down  
2\. \*\*Reuse components\*\* — If you copy-paste 3 times, make it a component  
3\. \*\*Manual is fine\*\* — Don't automate until you have 10+ customers  
4\. \*\*Ship ugly\*\* — 70% design is enough for MVP  
5\. \*\*One language\*\* — Add i18n after first customers

\---

**\#\# Phase 4: Iterate (ongoing)**

**\#\#\# Goal: Build what customers actually need**

\*\*After first customer:\*\*  
1\. Watch them use the product (screen share or analytics)  
2\. Ask: "What's confusing?" (not "What features do you want?")  
3\. Fix the top 3 pain points  
4\. Repeat

\*\*After 10 customers:\*\*  
1\. Look at support tickets — what's asked most?  
2\. Look at analytics — where do people drop off?  
3\. Build the top 3 most-requested features  
4\. Repeat

\*\*After 100 customers:\*\*  
1\. Now you can optimize (performance, design, UX)  
2\. Now you can automate (AI features, integrations)  
3\. Now you can scale (infrastructure, team)

\---

\*\*Rule:\*\* Don't build features customers haven't asked for. Build what they're struggling with.

\---

**\#\# Mental Map: The Decision Tree**

\`\`\`  
New project idea  
    ↓  
Can I name a specific person with this problem?  
    ↓ No → Stop, find a real problem  
    ↓ Yes  
    ↓  
Can I build MVP in 4 weeks?  
    ↓ No → Scope down or stop  
    ↓ Yes  
    ↓  
Write PRD (2 days)  
    ↓  
Map user flows (2 days)  
    ↓  
Lock in design (1 day)  
    ↓  
Set up foundation (2 days)  
    ↓  
Build MVP (3 weeks)  
    ↓  
Get first customer  
    ↓  
Iterate based on feedback  
    ↓  
Repeat until product-market fit  
\`\`\`

\---

**\#\# Time Budgets (Forcing Functions)**

| Phase | Time Budget | Stop Signal |  
|-------|-------------|-------------|  
| Idea validation | 2 days | If you can't answer the 4 questions, stop |  
| Planning (PRD \+ flows) | 5 days | If you're still planning on day 6, stop |  
| Foundation setup | 2 days | If you're still setting up on day 3, stop |  
| MVP build | 3 weeks | If you're not deployed by week 4, scope down |  
| First customer | 1 week | If you can't get 1 customer in 1 week, pivot |

\*\*Total: 4 weeks from idea to first customer\*\*

\---

**\#\# The "Good Enough" Checklist**

Before moving to the next phase, ask:

\*\*Planning → Foundation:\*\*  
\- \[ \] I know who this is for  
\- \[ \] I know what problem it solves  
\- \[ \] I have a 1-page PRD  
\- \[ \] I have user flows documented  
\- \[ \] I have a color palette locked in

\*\*Foundation → Build:\*\*  
\- \[ \] Project is set up (Next.js \+ TypeScript \+ Tailwind)  
\- \[ \] Core types are defined  
\- \[ \] Design tokens are in globals.css  
\- \[ \] Folder structure is ready  
\- \[ \] shadcn/ui is installed

\*\*Build → Launch:\*\*  
\- \[ \] Customer can complete the core flow  
\- \[ \] I can fulfill the service  
\- \[ \] Critical bugs are fixed  
\- \[ \] App is deployed to production  
\- \[ \] I have a way to get first customers

\*\*Launch → Iterate:\*\*  
\- \[ \] I have 1 paying customer  
\- \[ \] I've watched them use the product  
\- \[ \] I know what's confusing  
\- \[ \] I have a list of top 3 pain points

\---

**\#\# Common Traps (And How to Avoid Them)**

**\#\#\# Trap 1: "I need to plan more before building"**  
\*\*Reality:\*\* You learn more from building 1 screen than planning 10 screens.

\*\*Fix:\*\* Timebox planning to 5 days. If you're not building by day 6, you're overthinking.

\---

**\#\#\# Trap 2: "I need the perfect design before launching"**  
\*\*Reality:\*\* Customers care about solving their problem, not perfect design.

\*\*Fix:\*\* Ship at 70% design quality. Refine after first customers.

\---

**\#\#\# Trap 3: "I need to build all features before launching"**  
\*\*Reality:\*\* Most features you build won't be used.

\*\*Fix:\*\* Ship the minimum viable product. Add features based on customer requests.

\---

**\#\#\# Trap 4: "I need to automate everything"**  
\*\*Reality:\*\* Manual processes are fine until you have 10+ customers.

\*\*Fix:\*\* Do things that don't scale first. Automate when manual becomes painful.

\---

**\#\#\# Trap 5: "I need to refactor before adding features"**  
\*\*Reality:\*\* Refactoring without customer feedback is guessing.

\*\*Fix:\*\* Build with good foundations (tokens, types, components), then refactor based on real pain points.

\---

**\#\# The One-Page Project Checklist**

Copy this for every new project:

\`\`\`markdown  
**\# \[Project Name\]**

**\#\# Validation**  
\- \[ \] Who is this for? (Specific person)  
\- \[ \] What problem does it solve? (Concrete pain)  
\- \[ \] How will I know it worked? (1 metric)  
\- \[ \] Can I build MVP in 4 weeks? (Yes/No)

**\#\# Planning (5 days max)**  
\- \[ \] PRD written (project-overview.md)  
\- \[ \] User flows mapped (user-flows.md)  
\- \[ \] Design tokens locked in (design-tokens.css)

**\#\# Foundation (2 days max)**  
\- \[ \] Project setup (Next.js \+ TypeScript \+ Tailwind)  
\- \[ \] Core types defined (lib/types.ts)  
\- \[ \] Design tokens in globals.css  
\- \[ \] Folder structure ready  
\- \[ \] shadcn/ui installed

**\#\# MVP (3 weeks max)**  
\- \[ \] Week 1: Core flow (customer can pay)  
\- \[ \] Week 2: Fulfillment (I can deliver)  
\- \[ \] Week 3: Polish \+ launch (deployed \+ first customer)

**\#\# Iterate (ongoing)**  
\- \[ \] First customer acquired  
\- \[ \] Top 3 pain points identified  
\- \[ \] Top 3 pain points fixed  
\- \[ \] Repeat  
\`\`\`

\---

**\#\# Reusable File Templates**

\*\*Save these in a \`project-templates/\` folder:\*\*

1\. \`project-overview.md\` — PRD template  
2\. \`user-flows.md\` — User flows template  
3\. \`design-tokens.css\` — Design tokens  
4\. \`design-playground.html\` — Visual testing tool  
5\. \`PROJECT-WORKFLOW-TEMPLATE.md\` — This file

\*\*For every new project:\*\*  
1\. Copy templates folder  
2\. Fill in project-specific details  
3\. Follow the workflow  
4\. Ship in 4 weeks

\---

**\#\# The Core Philosophy**

\*\*Plan enough to start building.\*\*    
\*\*Build enough to get feedback.\*\*    
\*\*Iterate based on reality, not assumptions.\*\*

\*\*Speed comes from:\*\*  
1\. Good foundations (tokens, types, components)  
2\. Ruthless scope control (MVP only)  
3\. Shipping before perfect (70% is enough)  
4\. Learning from customers (not guessing)

\*\*You're not slow because you're bad at building.\*\*    
\*\*You're slow because you're building the wrong things.\*\*

\*\*This workflow ensures you build the right things, fast.\*\*

\---

**\#\# Next Steps**

1\. Save this file as your project template  
2\. Use it for RemoteNIF (you're already on track)  
3\. Use it for your next 10 projects  
4\. Refine it based on what works for you  
5\. In 6 months, you'll ship projects in 2 weeks instead of 4

\*\*You've got this. Now go build.\*\* 🚀

