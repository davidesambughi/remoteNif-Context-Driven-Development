import { useTranslations } from 'next-intl'

interface StepCardProps {
  number: string
  title: string
  description: string
}

// Single step card with oversized number as visual anchor
function StepCard({ number, title, description }: StepCardProps) {
  return (
    <div className="bg-surface border border-border-default border-t-4 border-t-brand-primary rounded-[length:var(--radius-lg)] p-5 shadow-[var(--shadow-md)]">
      <span
        className="block text-[length:var(--text-4xl)] font-[number:var(--font-bold)] text-brand-primary opacity-30 leading-none"
        aria-hidden="true"
      >
        {number}
      </span>
      <h3 className="mt-2 text-[length:var(--text-lg)] font-[number:var(--font-semibold)] text-text-primary">
        {title}
      </h3>
      <p className="mt-1 text-[length:var(--text-sm)] text-text-secondary leading-[var(--leading-relaxed)]">
        {description}
      </p>
    </div>
  )
}

// 3-step process — anchor target for "Learn More" link in hero
export function HowItWorksSection() {
  const t = useTranslations('home.howItWorks')

  return (
    <section id="how-it-works" className="bg-brand-primary-dim px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="border-l-4 border-brand-primary pl-[length:var(--space-4)]">
          <h2 className="text-[length:var(--text-2xl)] font-[number:var(--font-bold)] text-text-primary">
            {t('title')}
          </h2>
          <p className="mt-2 text-[length:var(--text-sm)] text-text-secondary">
            {t('subtitle')}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-[length:var(--space-6)] md:flex-row">
          <StepCard
            number={t('step1Number')}
            title={t('step1Title')}
            description={t('step1Description')}
          />
          <StepCard
            number={t('step2Number')}
            title={t('step2Title')}
            description={t('step2Description')}
          />
          <StepCard
            number={t('step3Number')}
            title={t('step3Title')}
            description={t('step3Description')}
          />
        </div>
      </div>
    </section>
  )
}
