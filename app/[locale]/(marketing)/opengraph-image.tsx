import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { OG_COLORS, OG_SIZE, OG_FONT } from '@/lib/og'

// Metadata exports — Next.js reads these to emit the correct <meta> tags.
// og:image:alt, og:image:width, og:image:height are all auto-generated.
export const alt = 'RemoteNIF — Get your Portuguese NIF online, fully remote'
export const size = OG_SIZE
export const contentType = 'image/png'

/**
 * Homepage OG image (1200×630).
 *
 * Statically generated at build time by default — no request context needed.
 * Inherited by all route segments under (marketing)/ unless overridden by a
 * more specific opengraph-image.tsx file (e.g. pricing/).
 *
 * Font: Inter Bold loaded from public/fonts/Inter-Bold.woff.
 * Layout: flex column, left-aligned, brand blue background.
 */
export default async function Image() {
  // Load Inter Bold from the filesystem — runs once at build time.
  // Using readFile (not fetch) for reliability in CI environments with
  // restricted outbound network access.
  const fontData = await readFile(join(process.cwd(), 'public/fonts/Inter-Bold.woff'))

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          backgroundColor: OG_COLORS.background,
          padding: '60px 80px',
        }}
      >
        {/* Brand label — top, smaller */}
        <div
          style={{
            fontSize: 28,
            fontFamily: OG_FONT.family,
            fontWeight: OG_FONT.weight,
            color: OG_COLORS.text,
            marginBottom: 40,
            letterSpacing: '-0.5px',
            display: 'flex',
          }}
        >
          RemoteNIF
        </div>

        {/* Main headline */}
        <div
          style={{
            fontSize: 64,
            fontFamily: OG_FONT.family,
            fontWeight: OG_FONT.weight,
            color: OG_COLORS.text,
            lineHeight: 1.15,
            marginBottom: 28,
            display: 'flex',
          }}
        >
          Portuguese NIF — online, fully remote
        </div>

        {/* Subline */}
        <div
          style={{
            fontSize: 30,
            fontFamily: OG_FONT.family,
            fontWeight: OG_FONT.weight,
            color: OG_COLORS.subtext,
            display: 'flex',
          }}
        >
          Essential · Standard · Express
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        {
          name:   OG_FONT.family,
          data:   fontData.buffer as ArrayBuffer,
          weight: OG_FONT.weight,
          style:  OG_FONT.style,
        },
      ],
    }
  )
}
