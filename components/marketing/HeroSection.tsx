import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

interface StatItemProps {
  value: string
  label: string
}

// Single stat cell in the 2×2 grid
function StatItem({ value, label }: StatItemProps) {
  return (
    <div className="flex flex-col gap-[length:var(--space-1)]">
      <span className="text-[length:var(--text-xl)] font-[number:var(--font-bold)] text-[var(--text-primary)]">
        {value}
      </span>
      <span className="text-[length:var(--text-xs)] text-[var(--text-muted)]">{label}</span>
    </div>
  )
}

// Hero — headline, sub-headline, CTA, stats grid
export function HeroSection() {
  const t = useTranslations('home.hero')

  return (
    <section className="bg-[var(--bg-surface)] px-4 pt-10 pb-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-[length:var(--text-3xl)] md:text-[length:var(--text-4xl)] font-[number:var(--font-bold)] leading-[var(--leading-tight)] text-[var(--text-primary)]">
          {t('headline')}
        </h1>

        <p className="text-[length:var(--text-base)] text-[var(--text-secondary)] mt-3 leading-[var(--leading-relaxed)]">
          {t('subheadline')}
        </p>

        <Link
          href="/pricing"
          className="mt-6 flex items-center justify-center w-full
            bg-[var(--brand-primary)] text-[var(--text-on-accent)]
            rounded-[length:var(--radius-md)] py-[length:var(--space-4)]
            text-[length:var(--text-base)] font-[number:var(--font-semibold)]
            hover:opacity-90 transition-[var(--transition-base)]"
        >
          {t('cta')}
        </Link>

        <a
          href="#how-it-works"
          className="mt-3 flex items-center justify-center w-full
            border border-[var(--border-default)] text-[var(--text-primary)]
            rounded-[length:var(--radius-md)] py-[length:var(--space-4)]
            text-[length:var(--text-base)] font-[number:var(--font-semibold)]
            hover:bg-[var(--bg-subtle)] transition-[var(--transition-base)]"
        >
          {t('learnMore')}
        </a>

        {/* 2×2 stats grid — honest product facts, no made-up social proof */}
        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-[var(--border-subtle)] pt-6">
          <StatItem value={t('stat1Value')} label={t('stat1Label')} />
          <StatItem value={t('stat2Value')} label={t('stat2Label')} />
          <StatItem value={t('stat3Value')} label={t('stat3Label')} />
          <StatItem value={t('stat4Value')} label={t('stat4Label')} />
        </div>
      </div>
    </section>
  )
}
