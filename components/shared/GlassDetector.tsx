'use client'

// usePathname from @/i18n/navigation returns the locale-STRIPPED path:
//   /en   → /
//   /en/pricing → /pricing
// So isHome is simply pathname === '/' — no useLocale() needed.
import { usePathname } from '@/i18n/navigation'

interface Props {
  // Render-prop: children receives the resolved isHome boolean.
  // Both GlassDetector and its parent (MarketingHeader) are client components,
  // so passing a function across this boundary is safe.
  children: (isHome: boolean) => React.ReactNode
}

/**
 * Detects whether the current URL is the marketing homepage.
 * Encapsulates all pathname logic so MarketingHeader stays focused on rendering.
 */
export function GlassDetector({ children }: Props) {
  // Locale prefix is stripped by @/i18n/navigation — homepage is always '/'
  const pathname = usePathname()
  const isHome = pathname === '/' || pathname === ''

  return <>{children(isHome)}</>
}
