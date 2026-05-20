'use client'

import { useRouter } from '@/i18n/navigation'

interface Props {
  href: string
  className?: string
  children: React.ReactNode
}

/** Clickable table row that navigates to the order detail page on click. */
export function OrderRow({ href, className, children }: Props) {
  const router = useRouter()

  return (
    <tr
      onClick={() => router.push(href)}
      className={className}
    >
      {children}
    </tr>
  )
}
