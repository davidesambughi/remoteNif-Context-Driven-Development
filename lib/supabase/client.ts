import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/lib/env'

// Factory — do not export a singleton (SSR safety)
export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  )
}
