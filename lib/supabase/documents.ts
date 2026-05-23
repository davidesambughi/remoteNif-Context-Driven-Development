import { createClient } from '@/lib/supabase/server'

// Signed URL expiry for admin document viewing — 60 minutes.
// Long enough for an admin to review and act; short enough to limit exposure.
const SIGNED_URL_EXPIRY_SECONDS = 3600

/**
 * Generates a short-lived signed URL for a document stored in Supabase Storage.
 * Returns null if the file does not exist or an error occurs — callers must
 * handle null by rendering a disabled / unavailable state rather than throwing.
 */
export async function getSignedDocumentUrl(filePath: string): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, SIGNED_URL_EXPIRY_SECONDS)
  if (error || !data?.signedUrl) return null
  return data.signedUrl
}
