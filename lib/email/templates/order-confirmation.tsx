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

interface OrderConfirmationEmailProps {
  locale: EmailLocale
  orderId: string
  tier: string
  amountEur: string
  dashboardUrl: string
}

// All copy lives here — no i18n library, no external files
const copy = {
  en: {
    subject: (id: string) => `Your NIF application is confirmed — Order #${id}`,
    preview: 'Your NIF application is confirmed. Upload your documents to get started.',
    heading: 'Your order is confirmed.',
    body: "We've received your payment. Your NIF application is now open — upload your documents to start the process.",
    cta: 'Upload your documents',
    summaryTitle: 'Order summary',
    tierLabel: 'Plan',
    orderLabel: 'Order ID',
    amountLabel: 'Amount paid',
    tierNames: { essential: 'Essential', standard: 'Standard', express: 'Express' },
  },
  fr: {
    subject: (id: string) => `Votre demande de NIF est confirmée — Commande #${id}`,
    preview: 'Votre demande de NIF est confirmée. Téléchargez vos documents pour commencer.',
    heading: 'Votre commande est confirmée.',
    body: 'Nous avons bien reçu votre paiement. Votre demande de NIF est maintenant ouverte — téléchargez vos documents pour lancer la procédure.',
    cta: 'Télécharger mes documents',
    summaryTitle: 'Récapitulatif de commande',
    tierLabel: 'Formule',
    orderLabel: 'Numéro de commande',
    amountLabel: 'Montant payé',
    tierNames: { essential: 'Essentiel', standard: 'Standard', express: 'Express' },
  },
  es: {
    subject: (id: string) => `Su solicitud de NIF está confirmada — Pedido #${id}`,
    preview: 'Su solicitud de NIF está confirmada. Suba sus documentos para comenzar.',
    heading: 'Su pedido está confirmado.',
    body: 'Hemos recibido su pago. Su solicitud de NIF ya está abierta — suba sus documentos para iniciar el proceso.',
    cta: 'Subir mis documentos',
    summaryTitle: 'Resumen del pedido',
    tierLabel: 'Plan',
    orderLabel: 'Número de pedido',
    amountLabel: 'Importe pagado',
    tierNames: { essential: 'Esencial', standard: 'Standard', express: 'Express' },
  },
  de: {
    subject: (id: string) => `Ihr NIF-Antrag wurde bestätigt — Bestellung #${id}`,
    preview: 'Ihr NIF-Antrag wurde bestätigt. Laden Sie Ihre Dokumente hoch, um zu beginnen.',
    heading: 'Ihre Bestellung ist bestätigt.',
    body: 'Wir haben Ihre Zahlung erhalten. Ihr NIF-Antrag ist jetzt geöffnet — laden Sie Ihre Dokumente hoch, um den Prozess zu starten.',
    cta: 'Dokumente hochladen',
    summaryTitle: 'Bestellübersicht',
    tierLabel: 'Tarif',
    orderLabel: 'Bestellnummer',
    amountLabel: 'Gezahlter Betrag',
    tierNames: { essential: 'Grundlegend', standard: 'Standard', express: 'Express' },
  },
}

export function getOrderConfirmationSubject(locale: EmailLocale, orderId: string): string {
  return copy[locale].subject(orderId)
}

// Inline styles — no Tailwind, no CSS variables (email client constraints)
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
  summaryTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    margin: '0 0 12px 0',
  },
  row: { margin: '6px 0' },
  rowLabel: { fontSize: '14px', color: '#64748b', display: 'inline-block', width: '140px' },
  rowValue: { fontSize: '14px', color: '#1e293b', fontWeight: '500' },
  footer: { fontSize: '12px', color: '#94a3b8', textAlign: 'center' as const, margin: '0' },
}

export function OrderConfirmationEmail({
  locale,
  orderId,
  tier,
  amountEur,
  dashboardUrl,
}: OrderConfirmationEmailProps) {
  const t = copy[locale]
  const tierName = t.tierNames[tier as keyof typeof t.tierNames] ?? tier

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

          {/* Main content */}
          <Section>
            <Text style={styles.heading}>{t.heading}</Text>
            <Text style={styles.bodyText}>{t.body}</Text>
            <Button href={dashboardUrl} style={styles.button}>
              {t.cta}
            </Button>
          </Section>

          <Hr style={styles.divider} />

          {/* Order summary */}
          <Section>
            <Text style={styles.summaryTitle}>{t.summaryTitle}</Text>
            <Text style={styles.row}>
              <span style={styles.rowLabel}>{t.tierLabel}</span>
              <span style={styles.rowValue}>{tierName}</span>
            </Text>
            <Text style={styles.row}>
              <span style={styles.rowLabel}>{t.orderLabel}</span>
              <span style={styles.rowValue}>#{orderId}</span>
            </Text>
            <Text style={styles.row}>
              <span style={styles.rowLabel}>{t.amountLabel}</span>
              <span style={styles.rowValue}>{amountEur}</span>
            </Text>
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
