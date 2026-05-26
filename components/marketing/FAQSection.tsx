import { useTranslations } from 'next-intl'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const FAQ_KEYS = ['1', '2', '3', '4', '5'] as const

// FAQ accordion — 5 items, single open at a time
export function FAQSection() {
  const t = useTranslations('home.faq')

  return (
    <section className="bg-surface px-4 py-12">
      <div className="max-w-2xl mx-auto">
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
                {t(`q${key}`)}
              </AccordionTrigger>
              <AccordionContent
                className={[
                  'text-[length:var(--text-sm)] text-text-secondary leading-[var(--leading-relaxed)]',
                  'border-l-2 border-brand-primary/40 pl-[length:var(--space-4)] ml-[length:var(--space-1)]',
                ].join(' ')}
              >
                {t(`a${key}`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
