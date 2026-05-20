import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Preview,
} from 'react-email'

interface OperatorSubmissionReadyEmailProps {
  customerName: string
  tier: string
  orderId: string
  operatorQueueUrl: string
  slaNote?: string
}

export function getOperatorSubmissionReadySubject(customerName: string): string {
  return `New submission ready: ${customerName}`
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
  heading: { fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: '0 0 16px 0' },
  bodyText: { fontSize: '16px', color: '#1e293b', lineHeight: '1.6', margin: '0 0 12px 0' },
  button: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    padding: '12px 24px',
    borderRadius: '8px',
    textDecoration: 'none',
    display: 'inline-block',
    marginTop: '12px',
  },
  slaBox: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fee2e2',
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
  },
  slaText: { fontSize: '14px', color: '#991b1b', fontWeight: '600', margin: '0' },
  footer: { fontSize: '12px', color: '#94a3b8', textAlign: 'center' as const, margin: '0' },
}

export function OperatorSubmissionReadyEmail({
  customerName,
  tier,
  orderId,
  operatorQueueUrl,
  slaNote,
}: OperatorSubmissionReadyEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>A new NIF application is ready for submission.</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section>
            <Text style={styles.brand}>RemoteNIF Operator</Text>
          </Section>
          <Hr style={styles.divider} />
          <Section>
            <Text style={styles.heading}>Submission Ready</Text>
            <Text style={styles.bodyText}>
              <strong>Customer:</strong> {customerName}
            </Text>
            <Text style={styles.bodyText}>
              <strong>Tier:</strong> {tier.toUpperCase()}
            </Text>
            <Text style={styles.bodyText}>
              <strong>Order ID:</strong> {orderId}
            </Text>

            {slaNote && (
              <Section style={styles.slaBox}>
                <Text style={styles.slaText}>{slaNote}</Text>
              </Section>
            )}

            <Button href={operatorQueueUrl} style={styles.button}>
              View Operator Queue
            </Button>
          </Section>
          <Hr style={styles.divider} />
          <Section>
            <Text style={styles.footer}>RemoteNIF · Internal Operator System</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
