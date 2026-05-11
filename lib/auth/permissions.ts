import type { SelectUser } from '@/lib/db/schema'

export const isAdmin = (user: SelectUser) => user.role === 'admin'
export const isOperator = (user: SelectUser) => user.role === 'operator'
export const isCustomer = (user: SelectUser) => user.role === 'customer'
