'use client'

import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

/** Ghost-style sign-out button for the operator top bar. */
export function OperatorSignOutButton() {
  return (
    <Button variant="ghost" size="sm" onClick={() => signOut()}>
      Sign out
    </Button>
  )
}
