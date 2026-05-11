import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserById } from '@/lib/db/queries'
import type { SelectUser } from '@/lib/db/schema'

// Returns the public.users row for the currently authenticated user, or null.
// Uses getClaims() (validates JWT locally) rather than getSession() which does not revalidate.
export async function getCurrentUser(): Promise<SelectUser | null> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  // getClaims() returns { claims, header, signature } — sub is the user's UUID
  if (!data?.claims?.sub) return null
  return getUserById(data.claims.sub)
}

// Like getCurrentUser() but redirects to /signin if there is no session.
export async function requireAuth(): Promise<SelectUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/signin')
  return user
}

// Like requireAuth() but also enforces a specific role.
// Wrong role → redirect to / (access denied without exposing admin route existence).
export async function requireRole(
  role: 'admin' | 'operator' | 'customer',
): Promise<SelectUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/signin')
  if (user.role !== role) redirect('/')
  return user
}
