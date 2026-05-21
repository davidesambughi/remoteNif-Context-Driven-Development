/**
 * packageBuilder — assembles the operator download ZIP in memory.
 * Generates a cover sheet PDF + downloads the 3 customer documents from
 * Supabase Storage, then packages them into a single ZIP buffer.
 * Nothing is persisted — generate, return, discard.
 */
import JSZip from 'jszip'
import type { SupabaseClient } from '@supabase/supabase-js'
import { renderCoverSheetPdf } from '@/lib/operator/CoverSheet'
import type { OperatorPackageData } from '@/lib/db/queries'

// ---------------------------------------------------------------------------
// MIME → file extension map
// ---------------------------------------------------------------------------

const MIME_EXTENSIONS: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
}

/** Maps document type enum value to a human-readable ZIP file name (without extension). */
const DOCUMENT_FILE_NAMES: Record<OperatorPackageData['documents'][number]['type'], string> = {
  passport: 'passport',
  proof_of_address: 'proof-of-address',
  signed_poa: 'signed-poa',
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Builds the operator download package.
 * Returns a Buffer containing the ZIP and the suggested download filename.
 *
 * @param data - Order details and document paths from getOperatorPackageData
 * @param supabaseAdmin - Service-role Supabase client (bypasses RLS for document download)
 */
export async function buildOperatorPackage(
  data: OperatorPackageData,
  supabaseAdmin: SupabaseClient,
): Promise<{ zipBuffer: Buffer; fileName: string }> {
  const folderName = `nif-application-${data.order.id}`

  // 1. Generate cover sheet PDF
  const coverSheetBuffer = await renderCoverSheetPdf(data.order)

  // 2. Download each of the 3 customer documents from Supabase Storage
  const documentEntries = await Promise.all(
    data.documents.map(async (doc) => {
      const { data: blob, error } = await supabaseAdmin.storage
        .from('documents')
        .download(doc.filePath)

      if (error || !blob) {
        throw new Error(
          `Failed to download document (${doc.type}) from path "${doc.filePath}": ${error?.message ?? 'blob was null'}`,
        )
      }

      // Convert Blob to Buffer — Blob.arrayBuffer() is available in Node 18+
      const arrayBuffer = await blob.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Derive the extension from MIME type; fall back to ".bin" for unknown types
      const ext = MIME_EXTENSIONS[doc.mimeType] ?? '.bin'
      const fileName = `${DOCUMENT_FILE_NAMES[doc.type]}${ext}`

      return { fileName, buffer }
    }),
  )

  // 3. Build the ZIP with all 4 files in a named folder
  const zip = new JSZip()

  zip.file(`${folderName}/cover-sheet.pdf`, coverSheetBuffer)

  for (const { fileName, buffer } of documentEntries) {
    zip.file(`${folderName}/${fileName}`, buffer)
  }

  // 4. Generate ZIP fully in memory — packages are small (3 docs + 1 PDF)
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

  return {
    zipBuffer,
    fileName: `${folderName}.zip`,
  }
}
