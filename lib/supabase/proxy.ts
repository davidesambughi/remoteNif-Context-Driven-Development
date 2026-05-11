import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'

// Creates a Supabase client bound to the request/response cookie lifecycle.
// getClaims() refreshes expired access tokens and writes the new tokens
// into both request.cookies (visible to Server Components) and response (sent to browser).
// Returns hasValidSession from getClaims() directly — not a cookie-name heuristic.
export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; hasValidSession: boolean }> {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write to request so Server Components see the refreshed token
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          // Recreate response with updated request (carries new cookies)
          supabaseResponse = NextResponse.next({ request })
          // Write to response so the browser receives the new token
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // getClaims() validates the JWT locally — do NOT use getSession() here, it does not revalidate.
  // Returns { claims, header, signature } — sub is the user's UUID.
  const { data } = await supabase.auth.getClaims()
  const hasValidSession = !!data?.claims?.sub

  // Prevent CDNs from caching authenticated responses
  supabaseResponse.headers.set('Cache-Control', 'private, no-store')

  return { response: supabaseResponse, hasValidSession }
}
