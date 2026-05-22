import { z } from 'zod'
import { strongPassword } from '@/lib/validations/auth'
import { routing } from '@/i18n/routing'

// ---------------------------------------------------------------------------
// changeEmailSchema
// Requires the new email address and current password (for identity verification).
// ---------------------------------------------------------------------------
export const changeEmailSchema = z.object({
  newEmail: z.string().email(),
  currentPassword: z.string().min(1),
})

// ---------------------------------------------------------------------------
// changePasswordSchema
// Requires current password (verified server-side via signInWithPassword),
// a new strong password, and a confirmation that must match.
// ---------------------------------------------------------------------------
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: strongPassword,
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'settings.changePassword.errors.passwordMismatch',
    path: ['confirmPassword'],
  })

// ---------------------------------------------------------------------------
// deleteAccountSchema
// The user must type the exact string "DELETE" to confirm.
// Validated client-side (disables button) — schema exists for completeness.
// ---------------------------------------------------------------------------
export const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE'),
})

export type ChangeEmailInput = z.infer<typeof changeEmailSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>

// ---------------------------------------------------------------------------
// updateLanguagePreferenceSchema
// Accepts only the four supported locales, derived from the routing config
// so adding a new locale to i18n/routing.ts automatically updates validation.
// ---------------------------------------------------------------------------
export const updateLanguagePreferenceSchema = z.object({
  // Spread into a mutable tuple so z.enum() accepts it.
  // routing.locales is readonly — z.enum needs a mutable [string, ...string[]].
  language: z.enum([...routing.locales] as [string, ...string[]]),
})

export type UpdateLanguagePreferenceInput = z.infer<typeof updateLanguagePreferenceSchema>
