import { z } from 'zod'
import { routing } from '@/i18n/routing'

// Single source of truth — locale values come from the routing config, not a duplicated literal array
const localeEnum = z.enum(routing.locales as unknown as [string, ...string[]])

// Strong password: 8+ chars, upper, lower, digit. No special-char requirement —
// avoids UX friction without meaningful security loss at this level.
// Exported so settings.ts (change-password) can reuse the same rule without duplication.
export const strongPassword = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

export const signUpSchema = z.object({
  email: z.string().email(),
  password: strongPassword,
  language: localeEnum,
})

// Sign-in intentionally accepts any non-empty password — user may have an older account.
export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
  locale: localeEnum,
})

export const updatePasswordSchema = z
  .object({
    password: strongPassword,
    // confirmPassword only needs to match — strength is enforced on `password`
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'auth.newPassword.errors.passwordMismatch',
    path: ['confirmPassword'],
  })

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>
