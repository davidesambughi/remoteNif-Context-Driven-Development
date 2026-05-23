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

interface FiscalRepRenewalConfirmationEmailProps {
  locale: EmailLocale
  customerName: string  // order.fullName ?? email local-part fallback
  newExpiresAt: string  // pre-formatted date string (formatted in send.ts)
  dashboardUrl: string
}

// All copy lives here — email templates cannot use next-intl (no request context).
// Intentionally minimal: just the renewal confirmation, new expiry date, and dashboard link.
const copy = {
  en: {
    subject: 'Your fiscal representation has been renewed',
    preview: 'Your fiscal representation has been extended for another 12 months.',
    heading: 'Renewal confirmed.',
    body: (name: string) =>
      `Hello ${name}, your fiscal representation in Portugal has been successfully renewed for 12 months. Your new coverage period is shown below.`,
    expiryLabel: 'Coverage active until',
    cta: 'View My Dashboard',
  },
  fr: {
    subject: 'Votre représentation fiscale a été renouvelée',
    preview: 'Votre représentation fiscale a été prolongée de 12 mois supplémentaires.',
    heading: 'Renouvellement confirmé.',
    body: (name: string) =>
      `Bonjour ${name}, votre représentation fiscale au Portugal a été renouvelée avec succès pour 12 mois. Votre nouvelle période de couverture est indiquée ci-dessous.`,
    expiryLabel: 'Couverture active jusqu\'au',
    cta: 'Voir mon tableau de bord',
  },
  es: {
    subject: 'Tu representación fiscal ha sido renovada',
    preview: 'Tu representación fiscal ha sido extendida por 12 meses más.',
    heading: 'Renovación confirmada.',
    body: (name: string) =>
      `Hola ${name}, tu representación fiscal en Portugal ha sido renovada con éxito por 12 meses. Tu nuevo período de cobertura se muestra a continuación.`,
    expiryLabel: 'Cobertura activa hasta',
    cta: 'Ver mi panel de control',
  },
  de: {
    subject: 'Ihre steuerliche Vertretung wurde verlängert',
    preview: 'Ihre steuerliche Vertretung wurde um weitere 12 Monate verlängert.',
    heading: 'Verlängerung bestätigt.',
    body: (name: string) =>
      `Hallo ${name}, Ihre steuerliche Vertretung in Portugal wurde erfolgreich um 12 Monate verlängert. Ihr neuer Abdeckungszeitraum ist unten angegeben.`,
    expiryLabel: 'Abdeckung aktiv bis',
    cta: 'Mein Dashboard anzeigen',
  },
}

export function getFiscalRepRenewalConfirmationSubject(locale: EmailLocale): string {
  return copy[locale].subject
}

// Inline styles — no Tailwind, no CSS variables (email client constraints).
// Values mirror the project's design tokens converted to static hex for email.
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
  // Expiry block — brand-tinted background makes the key date visually prominent.
  // Mirrors the NIF number block in nif-delivered.tsx for visual consistency.
  expiryBlock: {
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    padding: '20px 24px',
    margin: '0 0 32px 0',
    textAlign: 'center' as const,
  },
  expiryLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#3b82f6',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    margin: '0 0 8px 0',
  },
  expiryDate: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0',
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

export function FiscalRepRenewalConfirmationEmail({
  locale,
  customerName,
  newExpiresAt,
  dashboardUrl,
}: FiscalRepRenewalConfirmationEmailProps) {
  const t = copy[locale]

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>

          {/* Brand header */}
          <Section>
            <Text style={styles.brand}>RemoteNIF</Text>
          </Section>

          <Hr style={styles.divider} />

          {/* Renewal confirmation + expiry date */}
          <Section>
            <Text style={styles.heading}>{t.heading}</Text>
            <Text style={styles.bodyText}>{t.body(customerName)}</Text>

            {/* New expiry date — brand-tinted block for visual prominence */}
            <Section style={styles.expiryBlock}>
              <Text style={styles.expiryLabel}>{t.expiryLabel}</Text>
              <Text style={styles.expiryDate}>{newExpiresAt}</Text>
            </Section>

            <Button href={dashboardUrl} style={styles.button}>
              {t.cta}
            </Button>
          </Section>

          <Hr style={styles.divider} />

          {/* Footer */}
          <Section>
            <Text style={styles.footer}>RemoteNIF · remotenif.com</Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
