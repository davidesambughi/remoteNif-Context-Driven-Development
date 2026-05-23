// Shared constants for OG image generation.
// Imported only by opengraph-image.tsx files — not by page components.
//
// All colors are hex equivalents of the project's design token CSS variables.
// CSS custom properties (var(--...)) are NOT supported by Satori (the rendering
// engine behind ImageResponse), so hardcoded hex values are required here.

/** Hex equivalents of the project's design tokens for use in OG images. */
export const OG_COLORS = {
  background: '#2563eb', // --brand-primary  oklch(60% 0.16 250)
  text:       '#ffffff', // --text-on-accent  oklch(100% 0 0)
  subtext:    '#dbeafe', // --brand-primary-dim  oklch(93% 0.04 250)
} as const

/** Standard 1200×630 OG image size — required by Facebook, LinkedIn, Twitter. */
export const OG_SIZE = { width: 1200, height: 630 } as const

/**
 * Font config for Inter Bold, loaded from public/fonts/Inter-Bold.woff.
 * Woff format is supported by Satori (ttf, otf, woff — NOT woff2).
 */
export const OG_FONT = {
  family: 'Inter',
  weight: 700,
  style:  'normal',
} as const satisfies { family: string; weight: number; style: 'normal' | 'italic' }
