import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailOtpType } from '@supabase/supabase-js'

// Handles Supabase email callback links (password recovery at this stage).
// Placed outside [locale] because Supabase email links do not carry a locale prefix.
// When sign-up confirmation is enabled (Feature 12), add a 'signup' type case here.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  // Supabase sends ?error=access_denied&error_code=otp_expired when a link has expired.
  // Redirect to sign-in with a visible error rather than silently landing on a broken page.
  if (searchParams.get('error')) {
    return NextResponse.redirect(`${origin}/signin?error=link_expired`)
  }

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

  // "link-invalid" covers all remaining failure modes: wrong type, tampered hash.
  return NextResponse.redirect(`${origin}/reset-password?error=link-invalid`)
}
