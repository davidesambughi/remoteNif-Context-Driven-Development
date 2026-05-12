'use client'

import { useEffect } from 'react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

// Global error boundary — catches unhandled throws in any layout or page.
// Locale context is unavailable here (this renders above the locale tree),
// so error copy is English-only.
export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-gray-500 max-w-sm">
        An unexpected error occurred. Please try again, or contact support if the problem persists.
      </p>
      <button
        onClick={reset}
        className="mt-2 px-4 py-2 rounded bg-black text-white text-sm hover:bg-gray-800"
      >
        Try again
      </button>
    </div>
  )
}
