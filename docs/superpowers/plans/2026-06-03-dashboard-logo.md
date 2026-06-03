# Customer Dashboard Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the text-based app name in the customer dashboard header with the official logo image, matching the styling used in Admin and Operator layouts.

**Architecture:** Update the `DashboardHeader` server component to use `next/image` within the existing `<Link>` component. Apply specific styles (`h-24`, `w-auto`, `[mix-blend-mode:multiply]`) and ensure the parent header handles overflow.

**Tech Stack:** Next.js (App Router), `next-intl` for translations (aria-label), `next/image` for optimized assets, Tailwind CSS.

---

### Task 1: Update DashboardHeader Component

**Files:**
- Modify: `components/dashboard/DashboardHeader.tsx`

- [ ] **Step 1: Replace text link with Logo image**

Modify `components/dashboard/DashboardHeader.tsx` to import `Image` and replace the app name text with the logo.

```tsx
import { getTranslations } from 'next-intl/server'
import { Settings } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { DashboardSignOutButton } from './DashboardSignOutButton'
import Image from 'next/image' // Added import

/**
 * Server component — sticky header for the customer dashboard.
 * Brand link returns to marketing home; LanguageSwitcher and sign-out are always visible.
 */
export async function DashboardHeader() {
  const t = await getTranslations('common')

  return (
    /* Glass header — backdrop-blur keeps it readable over any background image */
    /* Added overflow-hidden to match Admin/Operator headers for large logo blend */
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/30 shadow-sm overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        {/* Brand — locale-aware link back to marketing home */}
        <Link
          href="/"
          className="flex-none hover:opacity-80 transition-[var(--transition-base)]"
        >
          <Image
            src="/images/logo.png"
            alt={t('appName')}
            width={480}
            height={160}
            className="h-24 w-auto block [mix-blend-mode:multiply]"
            priority
          />
        </Link>

        {/* Right side: settings link + language switcher + sign out */}
        <div className="flex items-center gap-4">
          {/* Gear icon — icon-only link, aria-label satisfies accessibility requirement */}
          <Link
            href="/settings"
            aria-label={t('nav.accountSettings')}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-[var(--transition-base)]"
          >
            <Settings className="h-5 w-5" />
          </Link>
          <LanguageSwitcher />
          <DashboardSignOutButton />
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Verify linting**

Run: `npx eslint components/dashboard/DashboardHeader.tsx`
Expected: No errors.

- [ ] **Step 3: Commit changes**

```bash
git add components/dashboard/DashboardHeader.tsx
git commit -m "feat(dashboard): replace header text with logo"
```
