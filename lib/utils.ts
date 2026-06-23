import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind CSS classes intelligently.
 * 
 * Uses 'clsx' to handle conditional classes and 'tailwind-merge' to ensure
 * that the last class wins in case of conflicts (e.g., 'px-2 px-4' becomes 'px-4').
 * This is the standard utility for shadcn/ui components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
