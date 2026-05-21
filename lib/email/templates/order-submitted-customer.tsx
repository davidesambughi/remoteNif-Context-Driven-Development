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

interface OrderSubmittedCustomerEmailProps {
  locale: EmailLocale
  customerName: string  // caller should pass fullName ?? 'there'
  tier: string          // 'essential' | 'standard' | 'express'
  dashboardUrl: string
}

// All copy is defined here — email templates cannot use next-intl (no request context).
const copy = {
  en: {
    subject: 'Your NIF application has been submitted',
    preview: 'Your NIF application has been submitted to Finanças.',
    heading: 'Application submitted.',
    body: (name: string) =>
      `Hello ${name}, your NIF application has been submitted to Finanças. You will receive your NIF number once it has been issued.`,
    estimate:
      'Typically 5–10 business days from submission. This is an estimate — Finanças processing times are outside our control.',
    cta: 'View Dashboard',
  },
  fr: {
    subject: 'Votre demande de NIF a été soumise',
    preview: 'Votre demande de NIF a été soumise aux Finanças.',
    heading: 'Demande soumise.',
    body: (name: string) =>
      `Bonjour ${name}, votre demande de NIF a été soumise aux Finanças. Vous recevrez votre numéro NIF dès qu’il sera émis.`,
    estimate:
      `Généralement 5 à 10 jours ouvrables après la soumission. Il s’agit d’une estimation — les délais de traitement des Finanças échappent à notre contrôle.`,
    cta: 'Voir le tableau de bord',
  },
  es: {
    subject: 'Su solicitud de NIF ha sido presentada',
    preview: 'Su solicitud de NIF ha sido presentada ante Finanças.',
    heading: 'Solicitud presentada.',
    body: (name: string) =>
      `Hola ${name}, su solicitud de NIF ha sido presentada ante Finanças. Recibirá su número NIF una vez que haya sido emitido.`,
    estimate:
      'Normalmente entre 5 y 10 días hábiles desde la presentación. Esta es una estimación — los tiempos de procesamiento de Finanças están fuera de nuestro control.',
    cta: 'Ver panel de control',
  },
  de: {
    subject: 'Ihr NIF-Antrag wurde eingereicht',
    preview: 'Ihr NIF-Antrag wurde bei der Finanças eingereicht.',
    heading: 'Antrag eingereicht.',
    body: (name: string) =>
      `Hallo ${name}, Ihr NIF-Antrag wurde bei der Finanças eingereicht. Sie erhalten Ihre NIF-Nummer, sobald sie ausgestellt wurde.`,
    estimate:
      'In der Regel 5–10 Werktage nach der Einreichung. Dies ist eine Schätzung — die Bearbeitungszeiten der Finanças liegen außerhalb unserer Kontrolle.',
    cta: 'Dashboard anzeigen',
  },
}

export function getOrderSubmittedCustomerSubject(locale: EmailLocale): string {
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
  bodyText: { fontSize: '16px', color: '#1e293b', lineHeight: '1.6', margin: '0 0 16px 0' },
  // Estimate block uses a muted style to signal it's informational, not a guarantee
  estimateText: {
    fontSize: '14px',
    color: '#64748b',
    lineHeight: '1.6',
    fontStyle: 'italic',
    margin: '0 0 24px 0',
  },
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

export function OrderSubmittedCustomerEmail({
  locale,
  customerName,
  dashboardUrl,
}: OrderSubmittedCustomerEmailProps) {
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
            <Text style={styles.bodyText}>{t.body(customerName)}</Text>
            {/* Delivery estimate — muted italic to make clear it is not a guarantee */}
            <Text style={styles.estimateText}>{t.estimate}</Text>
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
