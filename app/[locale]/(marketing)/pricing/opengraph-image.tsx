import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { OG_COLORS, OG_SIZE, OG_FONT } from '@/lib/og'

// Metadata exports — Next.js reads these to emit the correct <meta> tags.
export const alt = 'RemoteNIF Pricing — NIF application plans from €79'
export const size = OG_SIZE
export const contentType = 'image/png'

/**
 * Pricing page OG image (1200×630).
 *
 * Statically generated at build time. Inherits the (marketing) segment font
 * loading pattern: readFile from public/fonts rather than fetch.
 *
 * Distinct from homepage OG image — headline and subline are pricing-specific.
 */
export default async function Image() {
  // Load Inter Bold from the filesystem — runs once at build time.
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

        {/* Main headline — pricing-specific */}
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
          NIF Application Plans
        </div>

        {/* Subline — pricing-specific */}
        <div
          style={{
            fontSize: 30,
            fontFamily: OG_FONT.family,
            fontWeight: OG_FONT.weight,
            color: OG_COLORS.subtext,
            display: 'flex',
          }}
        >
          From €79 · AI document review included
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
