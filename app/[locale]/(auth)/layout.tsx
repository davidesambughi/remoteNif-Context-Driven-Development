import type { Metadata } from 'next'

// Auth pages are not public content — suppress indexing across all child routes.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

// Minimal full-page shell for customer auth routes (signin, signup, reset-password, new-password).
// No navigation bar. Admin and operator signin pages have their own layouts.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[url('/images/sign-in-up-background.png')] bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center px-[length:var(--space-4)]">
      {children}
    </div>
  )
}
