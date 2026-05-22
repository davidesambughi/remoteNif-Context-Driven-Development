'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/session'
import { changeEmailSchema, changePasswordSchema, updateLanguagePreferenceSchema } from '@/lib/validations/settings'
import { updateUserLanguage } from '@/lib/db/queries'
import type { Locale } from '@/i18n/routing'
import type { ActionResult } from '@/lib/types'

// ---------------------------------------------------------------------------
// changeEmail
// Verifies the current password before updating the email address.
// Supabase sends a verification link to the new address automatically —
// the old email stays active until the user clicks the link.
// ---------------------------------------------------------------------------
export async function changeEmail(input: unknown): Promise<ActionResult> {
  // 1. Validate input
  const parsed = changeEmailSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'settings.changeEmail.errors.generic' }

  const { newEmail, currentPassword } = parsed.data

  // 2. Require authenticated session
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'settings.changeEmail.errors.generic' }

  const supabase = await createClient()

  // 3. Verify current password by attempting sign-in — this is the only way to
  //    confirm the caller owns the account before mutating the email address.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (verifyError) {
    return { success: false, error: 'settings.changeEmail.errors.incorrectPassword' }
  }

  // 4. Update email — Supabase sends a verification link to newEmail
  const { error: updateError } = await supabase.auth.updateUser({ email: newEmail })
  if (updateError) {
    // Supabase returns a unique-constraint message when the email is already in use
    if (
      updateError.message.toLowerCase().includes('already') ||
      updateError.message.toLowerCase().includes('unique')
    ) {
      return { success: false, error: 'settings.changeEmail.errors.emailInUse' }
    }
    return { success: false, error: 'settings.changeEmail.errors.generic' }
  }

  return { success: true }
}

// ---------------------------------------------------------------------------
// changePassword
// Verifies the current password before setting the new one.
// confirmPassword matching is enforced by the Zod schema refine — it will
// never reach this action unless the two passwords match.
// ---------------------------------------------------------------------------
export async function changePassword(input: unknown): Promise<ActionResult> {
  // 1. Validate input (refine also catches mismatch client-side before server call)
  const parsed = changePasswordSchema.safeParse(input)
  if (!parsed.success) {
    // Expose the specific refine error key so the client can place it on the right field
    const firstIssue = parsed.error.issues[0]
    return {
      success: false,
      error: firstIssue?.message ?? 'settings.changePassword.errors.generic',
    }
  }

  const { currentPassword, newPassword } = parsed.data

  // 2. Require authenticated session
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'settings.changePassword.errors.generic' }

  const supabase = await createClient()

  // 3. Verify current password — same pattern as changeEmail
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (verifyError) {
    return { success: false, error: 'settings.changePassword.errors.incorrectPassword' }
  }

  // 4. Set new password
  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
  if (updateError) {
    return { success: false, error: 'settings.changePassword.errors.generic' }
  }

  return { success: true }
}

// ---------------------------------------------------------------------------
// updateLanguagePreference
// Validates the locale value then persists it to public.users.language.
// The component handles the locale-aware router.push redirect after success.
// ---------------------------------------------------------------------------
export async function updateLanguagePreference(input: unknown): Promise<ActionResult> {
  // 1. Validate — rejects any string not in ['en', 'fr', 'es', 'de']
  const parsed = updateLanguagePreferenceSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'settings.languagePreference.errors.generic' }
  }

  // 2. Require authenticated session
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: 'settings.languagePreference.errors.generic' }
  }

  // 3. Persist to DB — cast is safe because the schema enum matches Locale exactly
  await updateUserLanguage(user.id, parsed.data.language as Locale)

  return { success: true }
}

// ---------------------------------------------------------------------------
// deleteAccount
// Uses the admin Supabase client to delete from auth.users.
// The onDelete('cascade') FK chain removes the public.users row automatically.
// After deletion, the caller is responsible for redirecting to the homepage.
// ---------------------------------------------------------------------------
export async function deleteAccount(): Promise<ActionResult> {
  // 1. Require authenticated session
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'settings.deleteAccount.dialog.errors.generic' }

  // 2. Delete from auth.users using the admin client (service role bypasses RLS).
  //    public.users is removed via cascade.
  const adminClient = createAdminClient()
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)
  if (deleteError) {
    return { success: false, error: 'settings.deleteAccount.dialog.errors.generic' }
  }

  // 3. Invalidate the current session — the user's auth cookie is now stale
  const supabase = await createClient()
  await supabase.auth.signOut()

  return { success: true }
}
