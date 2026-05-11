import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailOtpType } from '@supabase/supabase-js'

// Handles Supabase email callback links (password recovery at this stage).
// Placed outside [locale] because Supabase email links do not carry a locale prefix.
// When sign-up confirmation is enabled (Feature 12), add a 'signup' type case here.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // "link-invalid" covers all failure modes: expired token, wrong type, tampered hash.
  return NextResponse.redirect(`${origin}/reset-password?error=link-invalid`)
}
