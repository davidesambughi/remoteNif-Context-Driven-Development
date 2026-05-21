'use client'

import { useTranslations } from 'next-intl'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

/** Client component — calls signOut server action on click. */
export function DashboardSignOutButton() {
  const t = useTranslations('common')

  return (
    <Button variant="ghost" size="sm" onClick={() => signOut()}>
      {t('nav.signOut')}
    </Button>
  )
}
