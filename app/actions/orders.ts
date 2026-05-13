'use server'
import { requireAuth } from '@/lib/auth/session'
import { updateOrderPersonalDetails } from '@/lib/db/queries'
import { PersonalDetailsSchema } from '@/lib/validations/orders'
import type { PersonalDetailsData } from '@/lib/validations/orders'
import type { ActionResult } from '@/lib/types'

/**
 * Saves the personal details for a specific order.
 * Validates the input data and ensures the user owns the order.
 */
export async function savePersonalDetails(
  orderId: string,
  data: PersonalDetailsData
): Promise<ActionResult<void>> {
  try {
    // 1. Validate input with Zod
    const validated = PersonalDetailsSchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: 'personalDetails.save.validationError' }
    }

    // 2. Auth check
    const user = await requireAuth()

    // 3. Update DB with ownership check
    await updateOrderPersonalDetails(orderId, user.id, validated.data)

    // 4. Return success
    return { success: true }
  } catch {
    return { success: false, error: 'personalDetails.save.error' }
  }
}
