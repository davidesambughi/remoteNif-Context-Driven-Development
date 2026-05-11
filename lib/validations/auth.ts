import { z } from 'zod'

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  language: z.enum(['en', 'fr', 'es', 'de']),
})

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
  locale: z.enum(['en', 'fr', 'es', 'de']),
})

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'auth.newPassword.errors.passwordMismatch',
    path: ['confirmPassword'],
  })

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>
