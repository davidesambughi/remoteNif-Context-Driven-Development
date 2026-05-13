import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailOtpType } from '@supabase/supabase-js'

// Handles all Supabase email callback links: signup confirmation and password recovery.
// Placed outside [locale] so Supabase email links (which carry no locale prefix) resolve correctly.
// Excluded from next-intl middleware via the `auth` entry in proxy.ts matcher.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  // Supabase appends ?error=access_denied&error_code=otp_expired for expired links.
  if (searchParams.get('error')) {
    return NextResponse.redirect(`${origin}/signin?error=link_expired`)
  }

  const next = searchParams.get('next') ?? '/dashboard'
  const supabase = await createClient()

  // PKCE flow — Supabase verifies the token on their server and redirects here with `code`.
  // Used for: email confirmation, password recovery (Supabase default since ~2023).
  const code = searchParams.get('code')
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    return NextResponse.redirect(`${origin}/signin?error=link_expired`)
  }

  // OTP flow — older email templates send token_hash + type directly.
  // Kept as fallback in case Supabase email template format changes back.
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    return NextResponse.redirect(`${origin}/signin?error=link_expired`)
  }

  // No recognisable params — link is malformed or tampered.
  return NextResponse.redirect(`${origin}/reset-password?error=link-invalid`)
}
