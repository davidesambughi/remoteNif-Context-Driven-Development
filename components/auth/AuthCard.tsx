import { getTranslations } from 'next-intl/server'

interface AuthCardProps {
  title: string
  children: React.ReactNode
}

// Shared card shell used on all auth pages: app name above, titled card below.
export default async function AuthCard({ title, children }: AuthCardProps) {
  const t = await getTranslations('common')

  return (
    <div className="w-full max-w-[400px]">
      {/* App name */}
      <p className="text-center text-[length:var(--text-2xl)] font-[number:var(--font-bold)] text-text-primary mb-[length:var(--space-6)]">
        {t('appName')}
      </p>

      {/* Card */}
      <div
        className="w-full bg-surface border border-border-default shadow-[var(--shadow-md)] rounded-[length:var(--radius-xl)] p-[length:var(--space-8)]"
      >
        <h1 className="text-[length:var(--text-xl)] font-[number:var(--font-bold)] text-text-primary mb-[length:var(--space-6)]">
          {title}
        </h1>
        {children}
      </div>
    </div>
  )
}
