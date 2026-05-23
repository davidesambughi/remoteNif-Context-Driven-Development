'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// Omit 'type' — this component owns the input type internally (password / text toggle)
type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, 'type'>

/**
 * Password input with a press-to-toggle visibility icon.
 * Drop-in replacement for <Input type="password" /> across all auth forms.
 * Each instance maintains its own show/hide state independently.
 */
export default function PasswordInput({ className, ...rest }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        // Extra right padding to prevent text overlapping the toggle icon
        className={cn('pr-10', className)}
        {...rest}
      />
      <button
        type="button" // Must be 'button' — never 'submit' inside a form
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-0 top-0 h-full px-3 flex items-center text-text-muted hover:text-text-secondary transition-[var(--transition-fast)]"
        tabIndex={-1} // Exclude from tab order — password toggle is a convenience, not a critical action
      >
        {visible ? (
          <EyeOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Eye className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
