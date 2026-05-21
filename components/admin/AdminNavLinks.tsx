'use client'

import { usePathname } from 'next/navigation'
import { Link } from '@/i18n/navigation'

const NAV_ITEMS = [
  { label: 'Orders', href: '/admin' },
] as const

/**
 * Client component — renders admin tab links with active indicator.
 * Uses usePathname from next/navigation (includes locale prefix) so regex matches correctly.
 * Active state: bottom border + primary text. Inactive: transparent border + muted text.
 */
export function AdminNavLinks() {
  const pathname = usePathname()

  /** Returns true when the given href matches the current path. */
  function isActive(href: string): boolean {
    // /admin root also matches the orders sub-tree
    if (href === '/admin') {
      return /\/admin\/?$/.test(pathname) || pathname.includes('/admin/orders')
    }
    return pathname.includes(href)
  }

  return (
    <nav className="flex items-center sm:ml-8" aria-label="Admin navigation">
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
