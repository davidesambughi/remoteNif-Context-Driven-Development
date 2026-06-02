import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// OAuth callback: Supabase redirects here after Google's OAuth flow completes.
// Outside [locale] so next-intl middleware does not intercept or prefix it.
// The proxy.ts matcher already excludes /auth/* — no matcher change needed.
//
// NOTE: This route is not unit-tested. The OAuth redirect loop and exchangeCodeForSession
// cannot be meaningfully unit-tested without E2E tooling. Manual testing required.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')
  const locale = searchParams.get('locale') ?? 'en'
  const tier = searchParams.get('tier')

  // No code — user cancelled or Google returned an error
  if (!code) {
    return NextResponse.redirect(`${origin}/signin?error=oauth_failed`)
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(`${origin}/signin?error=oauth_failed`)
  }

  // Workaround for supabase-js >=v2.91.0 issue: exchangeCodeForSession defers the
  // SIGNED_IN event via setTimeout, which may not fire before the Route Handler returns.
  // Yielding the event loop ensures cookies are written before the redirect response.
  await new Promise((resolve) => setTimeout(resolve, 0))

  // Patch the user's language preference in public.users.
  // The handle_new_user trigger defaults language to 'en' for OAuth users since Google
  // does not pass a language field in raw_user_meta_data. Only overwrite if still default.
  const validLocales = ['en', 'fr', 'es', 'de'] as const
  type Locale = (typeof validLocales)[number]
  const safeLocale: Locale = (validLocales as readonly string[]).includes(locale)
    ? (locale as Locale)
    : 'en'

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase
      .from('users')
      .update({ language: safeLocale })
      .eq('id', user.id)
      .eq('language', 'en') // only patch if still the trigger default
  }

  // Build post-auth destination — respects localePrefix: 'as-needed' (en has no prefix)
  const validTiers = ['essential', 'standard', 'express']
  const hasTier = tier && validTiers.includes(tier)
  const destination = hasTier ? '/dashboard?checkout_tier=' + tier : '/dashboard'
  const localePath = safeLocale === 'en' ? destination : `/${safeLocale}${destination}`

  return NextResponse.redirect(`${origin}${localePath}`)
}
