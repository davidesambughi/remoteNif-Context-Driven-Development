'use client'

import { usePathname } from 'next/navigation'
import { Link } from '@/i18n/navigation'

// Nav items for the operator panel — Queue, Archive, Preferences
const navItems = [
  { label: 'Queue', href: '/operator' },
  { label: 'Archive', href: '/operator/submitted' },
  { label: 'Preferences', href: '/operator/preferences' },
] as const

/**
 * Horizontal tab nav for the operator panel.
 * Uses usePathname to detect the active link — requires 'use client'.
 * Active link: brand-primary bottom border + primary text.
 * Inactive link: muted text with hover to primary.
 */
export function OperatorNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    // Exact match for /operator to avoid prefix-matching /operator/submitted
    if (href === '/operator') {
      // Match /<locale>/operator exactly (end of string or trailing slash)
      return /\/operator\/?$/.test(pathname)
    }
    return pathname.includes(href)
  }

  return (
    <nav
      className="bg-[var(--bg-surface)] border-b border-[var(--border-default)]"
      aria-label="Operator navigation"
    >
      <div className="max-w-5xl mx-auto px-4 md:px-6 flex gap-6">
        {navItems.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className={[
              'inline-block py-3 text-sm font-medium border-b-2 transition-colors',
              isActive(href)
                ? 'border-[var(--brand-primary)] text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            ].join(' ')}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
