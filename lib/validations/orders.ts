import { z } from 'zod'

export const PersonalDetailsSchema = z.object({
  fullName: z.string().min(2, { message: 'validation.fullName.required' }).max(150),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'validation.dateOfBirth.invalid' }),
  nationality: z.string().length(2, { message: 'validation.nationality.invalid' }), // ISO 3166-1 alpha-2
  passportNumber: z.string().min(3).max(20, { message: 'validation.passportNumber.invalid' }),
  passportExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'validation.passportExpiry.invalid' }),
  address: z.string().min(5, { message: 'validation.address.required' }).max(500),
})

export type PersonalDetailsData = z.infer<typeof PersonalDetailsSchema>
