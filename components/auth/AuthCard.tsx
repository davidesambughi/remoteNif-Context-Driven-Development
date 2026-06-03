import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'

interface AuthCardProps {
  title: string
  children: React.ReactNode
}

// Shared card shell used on all auth pages: app name + back link above, titled card below.
export default async function AuthCard({ title, children }: AuthCardProps) {
  const t = await getTranslations('common')

  return (
    <div className="w-full max-w-[400px]">
      {/* App name — links back to homepage */}
      <Link
        href="/"
        className="flex items-center justify-center gap-[length:var(--space-2)] mb-[length:var(--space-6)] group"
      >
        <ArrowLeft className="h-4 w-4 text-text-muted transition-colors duration-200 group-hover:text-brand-primary flex-none" />
        <Image
          src="/images/logo.png"
          alt={t('appName')}
          width={160}
          height={54}
          priority
          className="[mix-blend-mode:multiply] group-hover:opacity-80 transition-opacity duration-200"
        />
      </Link>

      {/* Card */}
      <div
        className="w-full bg-surface border border-border-default border-t-4 border-t-brand-primary shadow-[var(--shadow-md)] rounded-[length:var(--radius-xl)] p-[length:var(--space-8)]"
      >
        <h1 className="text-[length:var(--text-xl)] font-[number:var(--font-bold)] text-text-primary mb-[length:var(--space-6)]">
          {title}
        </h1>
        {children}
      </div>
    </div>
  )
}
