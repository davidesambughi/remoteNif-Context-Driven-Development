import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

// Use these everywhere instead of next/link or next/navigation directly —
// they are locale-aware and respect the routing config.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
