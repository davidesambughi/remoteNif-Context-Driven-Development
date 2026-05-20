'use client'

import { useTranslations } from 'next-intl'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

/** Ghost-style sign-out button for the admin top bar. */
export function AdminSignOutButton() {
  const t = useTranslations('admin')

  return (
    <Button variant="ghost" size="sm" onClick={() => signOut()}>
      {t('signOut')}
    </Button>
  )
}
