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
        <h2 className="text-[length:var(--text-2xl)] font-[number:var(--font-bold)] text-text-primary">
          {t('title')}
        </h2>
        <p className="mt-2 text-[length:var(--text-sm)] text-text-secondary">
          {t('subtitle')}
        </p>

        <Accordion type="single" collapsible className="mt-6">
          {FAQ_KEYS.map((key) => (
            <AccordionItem key={key} value={`item-${key}`}>
              <AccordionTrigger className="text-left text-[length:var(--text-sm)] font-[number:var(--font-medium)] text-text-primary">
                {t(`q${key}`)}
              </AccordionTrigger>
              <AccordionContent className="text-[length:var(--text-sm)] text-text-secondary leading-[var(--leading-relaxed)]">
                {t(`a${key}`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
