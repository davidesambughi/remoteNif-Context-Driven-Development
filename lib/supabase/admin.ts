import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

// Service role — bypasses RLS. Only use in server-side code that has already verified authorization.
export function createAdminClient() {
  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
