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
import type { EmailLocale } from '../send'

interface DocumentsApprovedCustomerEmailProps {
  locale: EmailLocale
  customerName: string
  tier: string
  dashboardUrl: string
}

const copy = {
  en: {
    subject: 'Your documents have been approved',
    preview: 'Your NIF application is being prepared for submission.',
    heading: 'Documents approved.',
    body: (tier: string) => {
      const base = 'Your documents have been approved. Your application is being prepared for submission to Finanças.'
      if (tier === 'express') {
        return `${base} Your application will be submitted within 48 hours.`
      }
      return base
    },
    cta: 'View Dashboard',
  },
  fr: {
    subject: 'Vos documents ont été approuvés',
    preview: 'Votre demande de NIF est en cours de préparation pour soumission.',
    heading: 'Documents approuvés.',
    body: (tier: string) => {
      const base = 'Vos documents ont été approuvés. Votre demande est en cours de préparation pour soumission aux Finanças.'
      if (tier === 'express') {
        return `${base} Votre demande sera soumise dans les 48 heures.`
      }
      return base
    },
    cta: 'Voir le tableau de bord',
  },
  es: {
    subject: 'Sus documentos han sido aprobados',
    preview: 'Su solicitud de NIF se está preparando para su presentación.',
    heading: 'Documentos aprobados.',
    body: (tier: string) => {
      const base = 'Sus documentos han sido aprobados. Su solicitud se está preparando para su presentación ante Finanças.'
      if (tier === 'express') {
        return `${base} Su solicitud será presentada en un plazo de 48 horas.`
      }
      return base
    },
    cta: 'Ver panel de control',
  },
  de: {
    subject: 'Ihre Dokumente wurden genehmigt',
    preview: 'Ihr NIF-Antrag wird für die Einreichung vorbereitet.',
    heading: 'Dokumente genehmigt.',
    body: (tier: string) => {
      const base = 'Ihre Dokumente wurden genehmigt. Ihr Antrag wird für die Einreichung bei Finanças vorbereitet.'
      if (tier === 'express') {
        return `${base} Ihr Antrag wird innerhalb von 48 Stunden eingereicht.`
      }
      return base
    },
    cta: 'Dashboard anzeigen',
  },
}

export function getDocumentsApprovedCustomerSubject(locale: EmailLocale): string {
  return copy[locale].subject
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
  bodyText: { fontSize: '16px', color: '#1e293b', lineHeight: '1.6', margin: '0 0 24px 0' },
  button: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    padding: '12px 24px',
    borderRadius: '8px',
    textDecoration: 'none',
  },
  footer: { fontSize: '12px', color: '#94a3b8', textAlign: 'center' as const, margin: '0' },
}

export function DocumentsApprovedCustomerEmail({
  locale,
  customerName,
  tier,
  dashboardUrl,
}: DocumentsApprovedCustomerEmailProps) {
  const t = copy[locale]

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section>
            <Text style={styles.brand}>RemoteNIF</Text>
          </Section>
          <Hr style={styles.divider} />
          <Section>
            <Text style={styles.heading}>{t.heading}</Text>
            <Text style={styles.bodyText}>Hello {customerName},</Text>
            <Text style={styles.bodyText}>{t.body(tier)}</Text>
            <Button href={dashboardUrl} style={styles.button}>
              {t.cta}
            </Button>
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
