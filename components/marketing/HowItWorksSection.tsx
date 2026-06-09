import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { AnimateOnScroll } from './AnimateOnScroll'

interface StepCardProps {
  number: string
  title: string
  description: string
  // Illustration image shown at the bottom of the card
  imageSrc: string
  imageAlt: string
}

// Single step card: step number → serif title → serif body → bottom illustration
function StepCard({ number, title, description, imageSrc, imageAlt }: StepCardProps) {
  return (
    // Warm surface, subtle shadow with lift on hover — h-full fills the AnimateOnScroll wrapper
    <article className="flex flex-col h-full bg-surface rounded-[length:var(--radius-xl)] p-[length:var(--space-6)] shadow-[var(--shadow-md)] hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] transition-[transform,box-shadow] duration-200">

      {/* Small orange step number (01, 02, 03) */}
      <span
        className="text-[length:var(--text-xs)] font-[number:var(--font-semibold)] text-brand-primary"
        aria-hidden="true"
      >
        {number}
      </span>

      {/* Step title — serif, bold, dark */}
      <h3 className="mt-[length:var(--space-2)] font-serif font-[number:var(--font-bold)] text-[length:var(--text-xl)] text-text-primary leading-[var(--leading-tight)]">
        {title}
      </h3>

      {/* Step description — serif, dark, normal weight */}
      <p className="mt-[length:var(--space-2)] font-serif font-[number:var(--font-normal)] text-[length:var(--text-sm)] text-text-primary leading-[var(--leading-relaxed)]">
        {description}
      </p>

      {/* Illustration pushed to the bottom of the card */}
      <div className="mt-auto pt-[length:var(--space-6)] flex justify-center">
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={240}
          height={160}
          className="object-contain w-auto h-auto"
        />
      </div>

    </article>
  )
}

// 3-step process section — anchor target for "Learn More" link in hero
export function HowItWorksSection() {
  const t = useTranslations('home.howItWorks')

  // Split the title to highlight the word "transparent" in brand color with underline.
  // Works by finding the word in the translated string; if absent (other locales),
  // the title renders as plain text with no highlight.
  const titleText = t('title')
  const targetWord = 'transparent'
  const splitIndex = titleText.toLowerCase().indexOf(targetWord)
  const hasSplit = splitIndex >= 0
  const before = hasSplit ? titleText.slice(0, splitIndex) : titleText
  const highlight = hasSplit ? titleText.slice(splitIndex, splitIndex + targetWord.length) : null
  const after = hasSplit ? titleText.slice(splitIndex + targetWord.length) : null

  return (
    <section id="how-it-works" className="bg-brand-primary-dim px-[length:var(--space-4)] py-[length:var(--space-16)]">
      <div className="max-w-5xl mx-auto">

        {/* Centered section heading */}
        <AnimateOnScroll>
          <div className="text-center mb-[length:var(--space-10)]">
            <h2 className="font-serif font-[number:var(--font-bold)] text-[length:var(--text-3xl)] text-text-primary leading-[var(--leading-tight)]">
              {before}
              {/* "transparent" rendered in brand color with underline when present */}
              {highlight && (
                <span className="text-brand-primary underline underline-offset-4 decoration-brand-primary italic">
                  {highlight}
                </span>
              )}
              {after}
            </h2>
            <p className="mt-[length:var(--space-2)] font-[number:var(--font-normal)] text-[length:var(--text-sm)] text-text-secondary">
              {t('subtitle')}
            </p>
          </div>
        </AnimateOnScroll>

        {/* Cards: stacked on mobile, 3-column on md+ */}
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-[length:var(--space-6)] list-none p-0 m-0">
          <li className="h-full">
            <AnimateOnScroll delay={0} className="h-full">
              <StepCard
                number={t('step1Number')}
                title={t('step1Title')}
                description={t('step1Description')}
                imageSrc="/images/card1.png"
                imageAlt={t('step1Title')}
              />
            </AnimateOnScroll>
          </li>
          <li className="h-full">
            <AnimateOnScroll delay={100} className="h-full">
              <StepCard
                number={t('step2Number')}
                title={t('step2Title')}
                description={t('step2Description')}
                imageSrc="/images/card2.png"
                imageAlt={t('step2Title')}
              />
            </AnimateOnScroll>
          </li>
          <li className="h-full">
            <AnimateOnScroll delay={200} className="h-full">
              <StepCard
                number={t('step3Number')}
                title={t('step3Title')}
                description={t('step3Description')}
                imageSrc="/images/card3.png"
                imageAlt={t('step3Title')}
              />
            </AnimateOnScroll>
          </li>
        </ol>

      </div>

    </section>
  )
}
