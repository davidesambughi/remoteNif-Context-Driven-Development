/**
 * CoverSheet — @react-pdf/renderer template for the operator download package.
 * Rendered once per package download; never persisted to storage.
 *
 * Styling note: StyleSheet.create() is @react-pdf/renderer's own API — NOT web CSS.
 * Values here are intentionally plain (no brand tokens) — this is an internal
 * operational document for ebalcão entry, readability over aesthetics.
 */
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import { resolveCountry } from '@/lib/utils/countries'
import type { OperatorPackageData } from '@/lib/db/queries'

// ---------------------------------------------------------------------------
// Props — derived from OperatorPackageData to avoid redefining the shape
// ---------------------------------------------------------------------------

interface CoverSheetProps {
  order: OperatorPackageData['order']
}

// ---------------------------------------------------------------------------
// Named style constants — no magic values in JSX
// ---------------------------------------------------------------------------

const FONT = {
  regular: 'Helvetica',
  bold: 'Helvetica-Bold',
} as const

const SIZE = {
  headerTitle: 18,
  sectionHeading: 9,
  label: 9,
  value: 11,
  footer: 8,
} as const

const COLOR = {
  heading: '#111111',
  label: '#555555',
  value: '#111111',
  divider: '#CCCCCC',
  footer: '#888888',
} as const

const SPACING = {
  pagePaddingH: 56,
  pagePaddingTop: 56,
  pagePaddingBottom: 48,
  sectionGap: 20,
  fieldRowGap: 8,
  labelWidth: 170,
} as const

const s = StyleSheet.create({
  page: {
    fontFamily: FONT.regular,
    fontSize: SIZE.value,
    color: COLOR.value,
    paddingTop: SPACING.pagePaddingTop,
    paddingBottom: SPACING.pagePaddingBottom,
    paddingHorizontal: SPACING.pagePaddingH,
  },
  header: {
    marginBottom: SPACING.sectionGap,
  },
  headerTitle: {
    fontSize: SIZE.headerTitle,
    fontFamily: FONT.bold,
    color: COLOR.heading,
    marginBottom: 4,
  },
  headerOrderId: {
    fontSize: SIZE.label,
    color: COLOR.label,
  },
  divider: {
    borderBottom: `1 solid ${COLOR.divider}`,
    marginVertical: SPACING.sectionGap,
  },
  sectionHeading: {
    fontSize: SIZE.sectionHeading,
    fontFamily: FONT.bold,
    textTransform: 'uppercase',
    color: COLOR.label,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  // Two-column grid row: label on left, value on right
  fieldRow: {
    flexDirection: 'row',
    marginBottom: SPACING.fieldRowGap,
  },
  fieldLabel: {
    width: SPACING.labelWidth,
    fontSize: SIZE.label,
    fontFamily: FONT.bold,
    color: COLOR.label,
  },
  fieldValue: {
    flex: 1,
    fontSize: SIZE.value,
    color: COLOR.value,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: SPACING.pagePaddingH,
    right: SPACING.pagePaddingH,
    borderTop: `1 solid ${COLOR.divider}`,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: SIZE.footer,
    color: COLOR.footer,
  },
})

// ---------------------------------------------------------------------------
// Helper — format ISO date string ("YYYY-MM-DD") to "DD Mon YYYY"
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  // Split directly — avoid timezone shifts that Date() parsing can introduce
  const [year, month, day] = iso.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const monthName = months[parseInt(month ?? '1', 10) - 1] ?? month
  return `${day} ${monthName} ${year}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CoverSheet({ order }: CoverSheetProps) {
  const countryName = resolveCountry(order.nationality)

  return (
    <Document
      title={`NIF Application — ${order.id}`}
      author="RemoteNIF"
      subject="ebalcão submission cover sheet"
    >
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>NIF Application — RemoteNIF</Text>
          <Text style={s.headerOrderId}>Order ID: {order.id}</Text>
        </View>

        <View style={s.divider} />

        {/* Applicant details section */}
        <Text style={s.sectionHeading}>Applicant Details</Text>

        <View style={s.fieldRow}>
          <Text style={s.fieldLabel}>Full legal name</Text>
          <Text style={s.fieldValue}>{order.fullName}</Text>
        </View>

        <View style={s.fieldRow}>
          <Text style={s.fieldLabel}>Date of birth</Text>
          <Text style={s.fieldValue}>{formatDate(order.dateOfBirth)}</Text>
        </View>

        <View style={s.fieldRow}>
          <Text style={s.fieldLabel}>Nationality</Text>
          <Text style={s.fieldValue}>{countryName}</Text>
        </View>

        <View style={s.fieldRow}>
          <Text style={s.fieldLabel}>Passport number</Text>
          <Text style={s.fieldValue}>{order.passportNumber}</Text>
        </View>

        <View style={s.fieldRow}>
          <Text style={s.fieldLabel}>Passport expiry</Text>
          <Text style={s.fieldValue}>{formatDate(order.passportExpiry)}</Text>
        </View>

        <View style={s.fieldRow}>
          <Text style={s.fieldLabel}>Current address</Text>
          <Text style={s.fieldValue}>{order.address}</Text>
        </View>

        <View style={s.divider} />

        {/* Order details section */}
        <Text style={s.sectionHeading}>Order Details</Text>

        <View style={s.fieldRow}>
          <Text style={s.fieldLabel}>Tier</Text>
          {/* Capitalise first letter for readability */}
          <Text style={s.fieldValue}>{order.tier.charAt(0).toUpperCase() + order.tier.slice(1)}</Text>
        </View>

        <View style={s.fieldRow}>
          <Text style={s.fieldLabel}>Order ID</Text>
          <Text style={s.fieldValue}>{order.id}</Text>
        </View>

        {/* Footer — fixed so it appears on every page if the document ever grows */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Generated by RemoteNIF</Text>
          <Text style={s.footerText}>For ebalcão submission only — do not share with the applicant.</Text>
        </View>

      </Page>
    </Document>
  )
}

// ---------------------------------------------------------------------------
// Render utility — called by packageBuilder
// ---------------------------------------------------------------------------

/**
 * Renders the CoverSheet component to a Buffer synchronously in a server context.
 * Uses @react-pdf/renderer's renderToBuffer (Node.js only — never call from client).
 */
export async function renderCoverSheetPdf(
  order: OperatorPackageData['order'],
): Promise<Buffer> {
  // renderToBuffer expects a ReactElement — pass the component directly
  const buffer = await renderToBuffer(<CoverSheet order={order} />)
  return buffer
}
