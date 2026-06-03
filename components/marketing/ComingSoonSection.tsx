import { getTranslations } from 'next-intl/server'
import { ComingSoonCarousel } from './ComingSoonCarousel'
import { AnimateOnScroll } from './AnimateOnScroll'

// Server Component — renders the heading server-side; carousel is a Client Island.
export async function ComingSoonSection() {
  const t = await getTranslations('home.comingSoon')

  return (
    <section className="bg-[var(--bg-base)] px-[length:var(--space-4)] py-[length:var(--space-16)]">
      <div className="max-w-5xl mx-auto">

        {/* Section heading — matches the pattern used in HowItWorksSection */}
        <AnimateOnScroll>
          <div className="text-center mb-[length:var(--space-10)]">
            <h2
              className={[
                'font-serif font-[number:var(--font-bold)]',
                'text-[length:var(--text-3xl)] text-text-primary',
                'leading-[var(--leading-tight)]',
              ].join(' ')}
            >
              {t('titleBefore')}
              {/* "next" — brand orange + italic, matching hero/HowItWorks highlight pattern */}
              <span className="text-brand-primary italic">{t('titleHighlight')}</span>
            </h2>

            <p className="mt-[length:var(--space-2)] text-[length:var(--text-sm)] font-[number:var(--font-normal)] text-text-muted">
              {t('subtitle')}
            </p>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delay={100}>
          <ComingSoonCarousel />
        </AnimateOnScroll>

      </div>
    </section>
  )
}
