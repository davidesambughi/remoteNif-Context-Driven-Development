import { Html, Head, Body, Container, Section, Text, Hr, Link, Preview } from 'react-email'

interface AdminDocumentEscalatedEmailProps {
  orderId: string
  customerName: string
  documentType: string
  escalationReason: string
  adminOrderUrl: string
}

export function getAdminDocumentEscalatedSubject(
  customerName: string,
  orderId: string,
): string {
  return `Manual review required — ${customerName}, Order #${orderId}`
}

const fontStack = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

const styles = {
  body: { backgroundColor: '#f8fafc', fontFamily: fontStack },
  container: {
    backgroundColor: '#ffffff',
    maxWidth: '560px',
    margin: '40px auto',
    borderRadius: '8px',
    padding: '40px',
  },
  brand: { fontSize: '20px', fontWeight: '700', color: '#3b82f6', margin: '0 0 4px 0' },
  divider: { borderColor: '#e2e8f0', margin: '24px 0' },
  heading: { fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: '0 0 20px 0' },
  label: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    margin: '0 0 2px 0',
  },
  value: { fontSize: '15px', color: '#1e293b', margin: '0 0 14px 0' },
  ctaLink: { color: '#3b82f6', fontSize: '15px', fontWeight: '600', textDecoration: 'none' },
  footer: { fontSize: '12px', color: '#94a3b8', textAlign: 'center' as const, margin: '0' },
}

export function AdminDocumentEscalatedEmail({
  orderId,
  customerName,
  documentType,
  escalationReason,
  adminOrderUrl,
}: AdminDocumentEscalatedEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Manual review required — {customerName}, Order #{orderId}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>

          <Section>
            <Text style={styles.brand}>RemoteNIF</Text>
          </Section>

          <Hr style={styles.divider} />

          <Section>
            <Text style={styles.heading}>A document needs manual review.</Text>

            <Text style={styles.label}>Customer</Text>
            <Text style={styles.value}>{customerName}</Text>

            <Text style={styles.label}>Order</Text>
            <Text style={styles.value}>#{orderId}</Text>

            <Text style={styles.label}>Document</Text>
            <Text style={styles.value}>{documentType}</Text>

            <Text style={styles.label}>Reason</Text>
            <Text style={styles.value}>{escalationReason}</Text>

            <Link href={adminOrderUrl} style={styles.ctaLink}>View order →</Link>
          </Section>

          <Hr style={styles.divider} />

          <Section>
            <Text style={styles.footer}>RemoteNIF · remotenif.com</Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
