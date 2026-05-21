'use client'

import { usePathname } from 'next/navigation'
import { Link } from '@/i18n/navigation'

const NAV_ITEMS = [
  { label: 'Queue', href: '/operator' },
  { label: 'Archive', href: '/operator/submitted' },
  { label: 'Preferences', href: '/operator/preferences' },
] as const

/**
 * Client component — renders operator tab links with active indicator.
 * Uses usePathname from next/navigation (includes locale prefix) so regex matches correctly.
 * Active state: bottom border + primary text. Inactive: transparent border + muted text.
 */
export function OperatorNavLinks() {
  const pathname = usePathname()

  /** Returns true when the given href matches the current path. */
  function isActive(href: string): boolean {
    // Exact match for root /operator to avoid false positives on sub-routes
    if (href === '/operator') return /\/operator\/?$/.test(pathname)
    return pathname.includes(href)
  }

  return (
    <nav className="flex items-center sm:ml-8" aria-label="Operator navigation">
      {NAV_ITEMS.map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          className={[
            'h-14 flex items-center px-2 mr-4 sm:mr-6 text-sm font-medium border-b-2',
            'transition-[var(--transition-base)]',
            isActive(href)
              ? 'border-brand-primary text-text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary',
          ].join(' ')}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
