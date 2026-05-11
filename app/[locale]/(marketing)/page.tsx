import { use } from 'react'
import { useTranslations } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

// Placeholder — replaced entirely by Feature 05 (Homepage)
export default function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = use(params)
  setRequestLocale(locale)

  const t = useTranslations('common')

  return <p>{t('appName')}</p>
}
