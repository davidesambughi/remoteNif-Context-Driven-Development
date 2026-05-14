import { createElement } from 'react'
import type { ReactElement } from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import { PoaDocument } from './poa-template'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PersonalDetailsData } from '@/lib/validations/orders'

const BUCKET = 'documents'

/** Returns the storage path for a given order's generated POA. */
function poaPath(orderId: string): string {
  return `poa/${orderId}/poa-draft.pdf`
}

/**
 * Renders the POA PDF for the given order, uploads it to Supabase Storage,
 * and returns the storage path and a 1-hour signed download URL.
 * Throws on storage failure so the calling Server Action can catch and return an error result.
 */
export async function generateAndStorePoaPdf(
  orderId: string,
  details: PersonalDetailsData,
): Promise<{ path: string; signedUrl: string }> {
  const generatedDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Render the PDF document to a Node.js Buffer.
  // The type assertion is required because @react-pdf/renderer's renderToBuffer types
  // expect DocumentProps on the root element — they don't account for wrapper components.
  // At runtime the renderer traverses the component tree correctly.
  const buffer = await renderToBuffer(
    createElement(PoaDocument, { ...details, generatedDate }) as ReactElement<DocumentProps>,
  )

  const supabase = createAdminClient()
  const path = poaPath(orderId)

  // Upload — upsert:true overwrites any existing draft for this order
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: 'application/pdf', upsert: true })

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`)
  }

  const { data: urlData, error: urlError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600) // 1-hour signed URL

  if (urlError || !urlData) {
    throw new Error(`Signed URL generation failed: ${urlError?.message}`)
  }

  return { path, signedUrl: urlData.signedUrl }
}

/**
 * Deletes the stored POA PDF from Supabase Storage.
 * Called when the user re-saves personal details, forcing regeneration.
 * Failure is logged but not thrown — a stale file is a minor issue, not a blocker.
 */
export async function deleteStoredPoaPdf(path: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) {
    console.error('Failed to delete stored POA PDF:', error.message)
  }
}

/**
 * Generates a fresh 1-hour signed URL for an existing stored POA.
 * Used by the dashboard RSC to pre-fetch the download URL server-side.
 * Returns null if the path is invalid or signing fails.
 */
export async function getPoaSignedUrl(path: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600)

  if (error || !data) return null
  return data.signedUrl
}
