import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'
import { updateSession } from './lib/supabase/proxy'

const handleI18n = createMiddleware(routing)

// Routes that require an authenticated session (session presence only — role checks are in pages/actions)
const PROTECTED = /\/(dashboard|admin|operator)(\/|$)/
// Dedicated sign-in pages for internal roles are public — exclude them from the session guard.
const AUTH_PAGES = /\/(admin|operator)\/signin(\/|$)/
// Only dashboard routes preserve the original URL for post-login redirect.
// Admin/operator routes have dedicated sign-in pages (/admin/signin, /operator/signin)
// and SignInForm already redirects by role — redirectTo would be redundant there.
const CUSTOMER_PROTECTED = /\/dashboard(\/|$)/

export default async function proxy(request: NextRequest) {
  // Refresh Supabase session — hasValidSession comes from getClaims(), not a cookie regex
  const { response: supabaseResponse, hasValidSession } = await updateSession(request)

  const { pathname } = request.nextUrl

  if (PROTECTED.test(pathname) && !AUTH_PAGES.test(pathname) && !hasValidSession) {
    const localeFromPath = routing.locales.find(
      (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`,
    )
    const locale = localeFromPath ?? routing.defaultLocale

    // With localePrefix 'as-needed', default locale (en) has no prefix
    const signinPath =
      locale === routing.defaultLocale ? '/signin' : `/${locale}/signin`

    const redirectResponse = NextResponse.redirect(
      new URL(
        CUSTOMER_PROTECTED.test(pathname)
          ? `${signinPath}?redirectTo=${encodeURIComponent(pathname)}`
          : signinPath,
        request.url,
      ),
    )
    // Carry refreshed Supabase cookies onto the redirect so the browser keeps them
    supabaseResponse.cookies
      .getAll()
      .forEach((c) => redirectResponse.cookies.set(c.name, c.value, c))
    return redirectResponse
  }

  // Run next-intl locale routing
  const i18nResponse = handleI18n(request)

  // Copy Supabase auth cookies onto the i18n response
  supabaseResponse.cookies
    .getAll()
    .forEach((c) => i18nResponse.cookies.set(c.name, c.value, c))

  return i18nResponse
}

export const config = {
  matcher: '/((?!api|auth|_next|_vercel|.*\\..*).*)',
}
