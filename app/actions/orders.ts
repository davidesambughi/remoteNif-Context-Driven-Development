'use server'

import { requireAuth } from '@/lib/auth/session'
import {
  updateOrderPersonalDetails,
  updateOrderPoaPath,
  getOrderPersonalDetails,
  getUserActiveOrder,
  dismissFiscalRepForOrder,
} from '@/lib/db/queries'
import { PersonalDetailsSchema, GeneratePoaSchema } from '@/lib/validations/orders'
import type { PersonalDetailsData } from '@/lib/validations/orders'
import type { ActionResult } from '@/lib/types'
import { generateAndStorePoaPdf, deleteStoredPoaPdf } from '@/lib/pdf/generator'
import { revalidatePath } from 'next/cache'

/**
 * Saves the personal details for a specific order.
 * If a POA was previously generated, deletes the stored file and clears the path
 * so the user must regenerate after editing their details.
 */
export async function savePersonalDetails(
  orderId: string,
  data: PersonalDetailsData,
): Promise<ActionResult<void>> {
  try {
    // 1. Validate all input at the boundary
    const validatedId = GeneratePoaSchema.safeParse({ orderId })
    if (!validatedId.success) {
      return { success: false, error: 'personalDetails.save.validationError' }
    }

    const validated = PersonalDetailsSchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: 'personalDetails.save.validationError' }
    }

    // 2. Auth check
    const user = await requireAuth()

    // 3. Fetch current POA path before overwriting details (need it to delete the file)
    const current = await getOrderPersonalDetails(validatedId.data.orderId, user.id)

    // 4. Update personal details with ownership check
    await updateOrderPersonalDetails(validatedId.data.orderId, user.id, validated.data)

    // 5. If a POA was previously generated, delete the stale file and clear the DB path
    if (current?.poaGeneratedPath) {
      await deleteStoredPoaPdf(current.poaGeneratedPath)
      await updateOrderPoaPath(validatedId.data.orderId, user.id, null)
    }

    return { success: true }
  } catch {
    return { success: false, error: 'personalDetails.save.error' }
  }
}

/**
 * Generates a pre-filled POA PDF from the order's saved personal details,
 * stores it in Supabase Storage, and returns a 1-hour signed download URL.
 */
export async function generatePoa(
  orderId: string,
): Promise<ActionResult<{ signedUrl: string }>> {
  try {
    // 1. Validate input at the boundary
    const validatedId = GeneratePoaSchema.safeParse({ orderId })
    if (!validatedId.success) {
      return { success: false, error: 'personalDetails.poa.error' }
    }

    // 2. Auth check
    const user = await requireAuth()

    // 3. Fetch the order's saved personal details
    const order = await getOrderPersonalDetails(validatedId.data.orderId, user.id)
    if (!order) {
      return { success: false, error: 'personalDetails.poa.error' }
    }

    // 4. Safety check — all fields must be present before rendering the PDF
    const { fullName, dateOfBirth, nationality, passportNumber, passportExpiry, address } = order
    if (!fullName || !dateOfBirth || !nationality || !passportNumber || !passportExpiry || !address) {
      return { success: false, error: 'personalDetails.poa.error' }
    }

    // 5. Render PDF and upload to Storage (business logic lives in lib/pdf/generator.ts)
    const { path, signedUrl } = await generateAndStorePoaPdf(
      validatedId.data.orderId,
      { fullName, dateOfBirth, nationality, passportNumber, passportExpiry, address },
    )

    // 6. Persist the storage path so the dashboard RSC can re-fetch the signed URL on reload
    await updateOrderPoaPath(validatedId.data.orderId, user.id, path)

    return { success: true, data: { signedUrl } }
  } catch {
    return { success: false, error: 'personalDetails.poa.error' }
  }
}

/**
 * Marks the customer's fiscal representation as dismissed.
 * Sets fiscalRepDismissedAt = NOW(), which permanently hides the renewal banner
 * and suppresses all future renewal reminder emails for this order.
 *
 * Validates ownership: the order must belong to the currently authenticated user.
 * Uses GeneratePoaSchema to validate the orderId UUID before any DB access.
 */
export async function dismissFiscalRep(orderId: string): Promise<ActionResult<void>> {
  try {
    // 1. Validate input — reuses the existing UUID schema
    const validated = GeneratePoaSchema.safeParse({ orderId })
    if (!validated.success) {
      return { success: false, error: 'dashboard.renewalBanner.errors.generic' }
    }

    // 2. Auth check
    const user = await requireAuth()

    // 3. Ownership check — verify the order belongs to this user before mutating
    const order = await getUserActiveOrder(user.id)
    if (!order || order.id !== validated.data.orderId) {
      return { success: false, error: 'dashboard.renewalBanner.errors.generic' }
    }

    // 4. Set fiscalRepDismissedAt — suppresses banner and future cron emails
    await dismissFiscalRepForOrder(validated.data.orderId)

    // 5. Revalidate the dashboard so the banner disappears immediately
    revalidatePath('/dashboard')

    return { success: true }
  } catch {
    return { success: false, error: 'dashboard.renewalBanner.errors.generic' }
  }
}
