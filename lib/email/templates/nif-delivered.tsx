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

interface NifDeliveredEmailProps {
  locale: EmailLocale
  customerName: string  // order.fullName ?? 'there'
  nifNumber: string     // 9-digit NIF — always set at this point
  dashboardUrl: string
}

// All copy lives here — email templates cannot use next-intl (no request context).
// Intentionally minimal: just the NIF number and a dashboard link.
// Post-NIF guidance (bank accounts, property, NHR/IFICI) is a v2 content feature
// on the website — not in this email.
const copy = {
  en: {
    subject: 'Your Portuguese NIF has been issued',
    preview: 'Your NIF number is ready — log in to your dashboard to see it.',
    heading: 'Your NIF has arrived.',
    body: (name: string) =>
      `Hello ${name}, your Portuguese Tax Identification Number (NIF) has been officially issued by Finanças. Your NIF is displayed below and permanently saved in your dashboard.`,
    nifLabel: 'Your NIF number',
    cta: 'View My Dashboard',
  },
  fr: {
    subject: 'Votre NIF portugais a été émis',
    preview: 'Votre numéro NIF est prêt — connectez-vous à votre tableau de bord pour le consulter.',
    heading: 'Votre NIF est arrivé.',
    body: (name: string) =>
      `Bonjour ${name}, votre Numéro d'Identification Fiscale (NIF) portugais a été officiellement émis par les Finanças. Votre NIF est affiché ci-dessous et enregistré définitivement dans votre tableau de bord.`,
    nifLabel: 'Votre numéro NIF',
    cta: 'Voir mon tableau de bord',
  },
  es: {
    subject: 'Su NIF portugués ha sido emitido',
    preview: 'Su número NIF está listo — inicie sesión en su panel de control para verlo.',
    heading: 'Su NIF ha llegado.',
    body: (name: string) =>
      `Hola ${name}, su Número de Identificación Fiscal (NIF) portugués ha sido emitido oficialmente por Finanças. Su NIF aparece a continuación y está guardado de forma permanente en su panel de control.`,
    nifLabel: 'Su número NIF',
    cta: 'Ver mi panel de control',
  },
  de: {
    subject: 'Ihre portugiesische NIF wurde ausgestellt',
    preview: 'Ihre NIF-Nummer ist bereit — melden Sie sich in Ihrem Dashboard an, um sie zu sehen.',
    heading: 'Ihre NIF ist da.',
    body: (name: string) =>
      `Hallo ${name}, Ihre portugiesische Steueridentifikationsnummer (NIF) wurde offiziell von Finanças ausgestellt. Ihre NIF wird unten angezeigt und dauerhaft in Ihrem Dashboard gespeichert.`,
    nifLabel: 'Ihre NIF-Nummer',
    cta: 'Mein Dashboard anzeigen',
  },
}

export function getNifDeliveredSubject(locale: EmailLocale): string {
  return copy[locale].subject
}

// Inline styles — no Tailwind, no CSS variables (email client constraints)
const fontStack = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
const monoStack = "'JetBrains Mono', 'Courier New', Courier, monospace"

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
  // NIF block — brand-tinted background to make the number visually prominent
  nifBlock: {
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    padding: '20px 24px',
    margin: '0 0 32px 0',
    textAlign: 'center' as const,
  },
  nifLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#3b82f6',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    margin: '0 0 8px 0',
  },
  nifNumber: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1e293b',
    fontFamily: monoStack,
    letterSpacing: '0.12em',
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

export function NifDeliveredEmail({
  locale,
  customerName,
  nifNumber,
  dashboardUrl,
}: NifDeliveredEmailProps) {
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

          {/* Delivery confirmation + NIF number */}
          <Section>
            <Text style={styles.heading}>{t.heading}</Text>
            <Text style={styles.bodyText}>{t.body(customerName)}</Text>

            {/* NIF number — visually prominent, monospace, brand-tinted block */}
            <Section style={styles.nifBlock}>
              <Text style={styles.nifLabel}>{t.nifLabel}</Text>
              <Text style={styles.nifNumber}>{nifNumber}</Text>
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
