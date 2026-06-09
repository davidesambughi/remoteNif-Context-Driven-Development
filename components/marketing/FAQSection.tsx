import Image from 'next/image'
import { useTranslations } from 'next-intl'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { AnimateOnScroll } from './AnimateOnScroll'

const FAQ_KEYS = ['1', '2', '3', '4', '5'] as const

// FAQ accordion — 5 items, single open at a time
export function FAQSection() {
  const t = useTranslations('home.faq')

  return (
    <section id="faq" className="relative overflow-hidden bg-surface px-4 py-12">

      {/* Decorative logo watermark — same treatment as admin/operator panels */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden="true">
        <Image
          src="/images/logo.png"
          alt=""
          width={480}
          height={160}
          className="opacity-[0.07] [mix-blend-mode:multiply]"
          style={{ height: 'auto' }}
        />
      </div>

      <AnimateOnScroll className="relative max-w-2xl mx-auto">
        <div className="border-l-4 border-brand-primary pl-[length:var(--space-4)]">
          <h2 className="font-serif text-[length:var(--text-2xl)] font-[number:var(--font-bold)] text-text-primary">
            {t('title')}
          </h2>
          <p className="mt-2 text-[length:var(--text-sm)] text-text-secondary">
            {t('subtitle')}
          </p>
        </div>

        <Accordion type="single" collapsible className="mt-6">
          {FAQ_KEYS.map((key) => (
            <AccordionItem
              key={key}
              value={`item-${key}`}
              className="border-b border-brand-primary/30"
            >
              <AccordionTrigger
                className={[
                  'text-left text-[length:var(--text-base)] font-[number:var(--font-semibold)] text-text-primary',
                  // smooth color transition on hover + open state
                  'transition-colors duration-200',
                  'hover:text-brand-primary',
                  'data-[state=open]:text-brand-primary',
                  '[&>svg]:text-brand-primary [&>svg]:shrink-0',
                ].join(' ')}
              >
                <h3 className="text-inherit font-inherit">{t(`q${key}`)}</h3>
              </AccordionTrigger>
              <AccordionContent
                className={[
                  'text-[length:var(--text-sm)] text-text-secondary leading-[var(--leading-relaxed)]',
                  'border-l-2 border-brand-primary/40 pl-[length:var(--space-4)] ml-[length:var(--space-1)]',
                ].join(' ')}
              >
                {t.rich(`a${key}`, {
                  b: (chunks) => <span className="font-bold text-text-primary">{chunks}</span>
                })}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </AnimateOnScroll>
    </section>
  )
}
