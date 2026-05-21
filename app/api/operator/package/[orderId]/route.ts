/**
 * GET /api/operator/package/[orderId]
 *
 * Returns a ZIP file containing the cover sheet PDF and all 3 customer documents
 * for the given order. Used by the operator queue "Download package" button.
 *
 * Architecture note: this is an API route (not a Server Action) because it returns
 * a binary application/zip response. Server Actions cannot return binary streams.
 *
 * Auth: operator role only. Returns 401 if unauthenticated, 403 if wrong role.
 */
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserById, getOperatorPackageData } from '@/lib/db/queries'
import { buildOperatorPackage } from '@/lib/operator/packageBuilder'

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

const ParamsSchema = z.object({
  orderId: z.string().uuid(),
})
// Typed result — do not redeclare orderId: string manually
type Params = z.infer<typeof ParamsSchema>

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
): Promise<Response> {
  try {
    // 1. Validate the route parameter
    const rawParams = await params
    let validatedParams: Params
    try {
      validatedParams = ParamsSchema.parse(rawParams)
    } catch {
      return new Response('Invalid order ID — must be a UUID.', { status: 400 })
    }

    const { orderId } = validatedParams

    // 2. Auth — verify session and operator role
    const supabase = await createClient()
    const { data: claimsData } = await supabase.auth.getClaims()
    const userId = claimsData?.claims?.sub

    if (!userId) {
      return new Response('Unauthorized — no active session.', { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user || user.role !== 'operator') {
      return new Response('Forbidden — operator role required.', { status: 403 })
    }

    // 3. Fetch order + documents — returns null if order is not in documents_approved
    //    status, if personal details are incomplete, or if not all 3 docs are approved
    const packageData = await getOperatorPackageData(orderId)
    if (!packageData) {
      return new Response(
        'Not found — order does not exist, is not ready for download, or documents are incomplete.',
        { status: 404 },
      )
    }

    // 4. Build the ZIP (cover sheet PDF + 3 documents downloaded via service-role client)
    //    The admin client bypasses RLS — operator does not own these files
    const supabaseAdmin = createAdminClient()
    const { zipBuffer, fileName } = await buildOperatorPackage(packageData, supabaseAdmin)

    // 5. Return the ZIP as an attachment download.
    // Uint8Array is required — Buffer is not assignable to BodyInit in Next.js 16's type env.
    return new Response(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': String(zipBuffer.byteLength),
      },
    })
  } catch (error) {
    // Return plain text — not JSON — since the client expects binary and the error
    // is surfaced in the browser's download failure state, not parsed as JSON
    console.error('[operator/package] Unexpected error:', error)
    return new Response('Internal server error — package generation failed.', { status: 500 })
  }
}
