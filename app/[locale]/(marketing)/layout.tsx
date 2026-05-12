import { MarketingHeader } from '@/components/shared/MarketingHeader'
import { MarketingFooter } from '@/components/shared/MarketingFooter'

interface Props {
  children: React.ReactNode
}

// Public marketing layout — no auth required
export default function MarketingLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <MarketingHeader />
      {/* pt-14 matches the sticky header's h-14 so content starts below it */}
      <main className="pt-14">{children}</main>
      <MarketingFooter />
    </div>
  )
}
