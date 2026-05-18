import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'

interface StatItemProps {
  value: string
  label: string
}

// Single stat cell in the 2×2 grid
function StatItem({ value, label }: StatItemProps) {
  return (
    <div className="flex flex-col gap-[length:var(--space-1)]">
      <span className="text-[length:var(--text-xl)] font-[number:var(--font-bold)] text-text-primary">
        {value}
      </span>
      <span className="text-[length:var(--text-xs)] text-text-muted">{label}</span>
    </div>
  )
}

// Hero — headline, sub-headline, CTA, stats grid
export function HeroSection() {
  const t = useTranslations('home.hero')

  return (
    <section className="bg-surface px-4 pt-10 pb-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-[length:var(--text-3xl)] md:text-[length:var(--text-4xl)] font-[number:var(--font-bold)] leading-[var(--leading-tight)] text-text-primary">
          {t('headline')}
        </h1>

        <p className="text-[length:var(--text-base)] text-text-secondary mt-3 leading-[var(--leading-relaxed)]">
          {t('subheadline')}
        </p>

        <Button variant="default" asChild className="w-full mt-6">
          <Link href="/pricing">{t('cta')}</Link>
        </Button>

        <Button variant="outline" asChild className="w-full mt-3">
          <a href="#how-it-works">{t('learnMore')}</a>
        </Button>

        {/* 2×2 stats grid — honest product facts, no made-up social proof */}
        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-border-subtle pt-6">
          <StatItem value={t('stat1Value')} label={t('stat1Label')} />
          <StatItem value={t('stat2Value')} label={t('stat2Label')} />
          <StatItem value={t('stat3Value')} label={t('stat3Label')} />
          <StatItem value={t('stat4Value')} label={t('stat4Label')} />
        </div>
      </div>
    </section>
  )
}
