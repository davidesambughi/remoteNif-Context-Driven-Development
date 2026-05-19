import { Resend } from 'resend'
import { env } from '@/lib/env'

// Single Resend client instance — imported by sendEmail, never used directly elsewhere
export const resendClient = new Resend(env.RESEND_API_KEY)
