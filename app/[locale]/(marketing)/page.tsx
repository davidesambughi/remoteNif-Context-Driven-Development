import { use } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { HeroSection } from '@/components/marketing/HeroSection'
import { HowItWorksSection } from '@/components/marketing/HowItWorksSection'
import { FAQSection } from '@/components/marketing/FAQSection'
import type { Locale } from '@/i18n/routing'

export default function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = use(params)
  setRequestLocale(locale)

  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <FAQSection />
    </>
  )
}
