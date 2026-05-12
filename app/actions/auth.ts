'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserById } from '@/lib/db/queries'
import { env } from '@/lib/env'
import {
  signUpSchema,
  signInSchema,
  requestPasswordResetSchema,
  updatePasswordSchema,
} from '@/lib/validations/auth'

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string }

// ---------------------------------------------------------------------------
// signUp
// ---------------------------------------------------------------------------

export async function signUp(input: unknown): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'auth.signUp.errors.generic' }

  const { email, password, language } = parsed.data
  const supabase = await createClient()

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // language written to raw_user_meta_data — the handle_new_user trigger reads it
      data: { language },
    },
  })

  if (error) {
    console.error('[signUp] Supabase error:', error.message, error.status)
    // Intentionally surfaced per user-flows.md Flow 2 — showing "email in use" is a
    // deliberate UX choice for the checkout funnel, not an accidental enumeration leak.
    if (error.message.includes('User already registered')) {
      return { success: false, error: 'auth.signUp.errors.emailInUse' }
    }
    return { success: false, error: 'auth.signUp.errors.generic' }
  }

  // Guard against Supabase still having email confirmation enabled (should be off after P1)
  if (!data.session) {
    return { success: false, error: 'auth.signUp.errors.emailConfirmationRequired' }
  }
  

  return { success: true }
}

// ---------------------------------------------------------------------------
// _signInWithRole — private helper shared by signIn, adminSignIn, operatorSignIn
// ---------------------------------------------------------------------------

async function _signInWithRole(
  input: unknown,
  requiredRole?: 'admin' | 'operator' | 'customer',
  errorKey: string = 'auth.signIn.errors.invalidCredentials',
): Promise<ActionResult<{ role: string }>> {
  const parsed = signInSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: errorKey }

  const { email, password } = parsed.data
  const supabase = await createClient()

  const { error, data } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { success: false, error: errorKey }

  if (requiredRole) {
    const user = await getUserById(data.user.id)
    if (!user || user.role !== requiredRole) {
      // Sign out to avoid leaving an orphaned session, then return the same opaque error
      // — do not reveal whether it was wrong password vs wrong role
      await supabase.auth.signOut()
      return { success: false, error: errorKey }
    }
    return { success: true, data: { role: user.role } }
  }

  const user = await getUserById(data.user.id)
  return { success: true, data: { role: user?.role ?? 'customer' } }
}

// ---------------------------------------------------------------------------
// signIn — accepts any valid account; returns role for client-side redirect
// ---------------------------------------------------------------------------

export async function signIn(
  input: unknown,
): Promise<ActionResult<{ role: string }>> {
  return _signInWithRole(input)
}

// ---------------------------------------------------------------------------
// adminSignIn — only accepts admin accounts
// ---------------------------------------------------------------------------

export async function adminSignIn(
  input: unknown,
): Promise<ActionResult<{ role: string }>> {
  return _signInWithRole(input, 'admin', 'auth.admin.signIn.errors.invalidCredentials')
}

// ---------------------------------------------------------------------------
// operatorSignIn — only accepts operator accounts
// ---------------------------------------------------------------------------

export async function operatorSignIn(
  input: unknown,
): Promise<ActionResult<{ role: string }>> {
  return _signInWithRole(input, 'operator', 'auth.operator.signIn.errors.invalidCredentials')
}

// ---------------------------------------------------------------------------
// signOut
// ---------------------------------------------------------------------------

export async function signOut(): Promise<never> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

// ---------------------------------------------------------------------------
// requestPasswordReset — always returns success to prevent account enumeration
// ---------------------------------------------------------------------------

export async function requestPasswordReset(input: unknown): Promise<ActionResult> {
  const parsed = requestPasswordResetSchema.safeParse(input)
  if (!parsed.success) return { success: true } // never reveal enumeration info

  const { email, locale } = parsed.data
  const supabase = await createClient()

  // Build the Supabase confirm URL with a next param pointing to the new-password page.
  // Default locale (en) has no URL prefix due to localePrefix: 'as-needed'.
  const nextPath = locale === 'en' ? '/new-password' : `/${locale}/new-password`
  const redirectTo = `${env.NEXT_PUBLIC_APP_URL}/auth/confirm?next=${nextPath}`

  await supabase.auth.resetPasswordForEmail(email, { redirectTo })

  // Always return success — never reveal whether the email is registered
  return { success: true }
}

// ---------------------------------------------------------------------------
// updatePassword
// ---------------------------------------------------------------------------

export async function updatePassword(input: unknown): Promise<ActionResult> {
  const parsed = updatePasswordSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'auth.newPassword.errors.generic' }

  const { password } = parsed.data
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { success: false, error: 'auth.newPassword.errors.generic' }

  return { success: true }
}
