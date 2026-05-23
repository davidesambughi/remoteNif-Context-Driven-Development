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

// Reminder intervals the cron sends — determines subject line and body copy.
export type RenewalReminderInterval = '30_days' | '15_days' | 'expired'

interface RenewalReminderEmailProps {
  locale: EmailLocale
  interval: RenewalReminderInterval
  customerName: string  // order.fullName ?? email local-part fallback
  renewalUrl: string    // /[locale]/renewal?orderId=[orderId]
}

// All copy lives here — email templates cannot use next-intl (no request context).
// Matches the three-email sequence defined in user-flows.md § Flow 11a.
const copy: Record<
  EmailLocale,
  Record<
    RenewalReminderInterval,
    { subject: string; preview: string; heading: string; body: (name: string) => string; urgencyNote: string }
  > & { expiryWarning: string; cta: string }
> = {
  en: {
    expiryWarning:
      'If you have Portuguese tax obligations (property, rental income, employment), not having a fiscal representative may result in fines.',
    cta: 'Renew Now — €89/year',
    '30_days': {
      subject: 'Your fiscal representation expires in 30 days',
      preview: 'Renew your fiscal representation to stay covered in Portugal.',
      heading: 'Your fiscal representation expires in 30 days.',
      body: (name: string) =>
        `Hello ${name}, your fiscal representation in Portugal expires in 30 days. Renew for €89/year to stay correctly registered.`,
      urgencyNote: 'Renewal takes less than 5 minutes.',
    },
    '15_days': {
      subject: 'Your fiscal representation expires in 15 days',
      preview: 'Your fiscal representation expires soon — renew now to stay covered.',
      heading: 'Your fiscal representation expires in 15 days.',
      body: (name: string) =>
        `Hello ${name}, your fiscal representation in Portugal expires in 15 days. Renew now to avoid a lapse in coverage.`,
      urgencyNote: 'Don\'t wait — renew now to stay correctly registered.',
    },
    expired: {
      subject: 'Your fiscal representation has expired',
      preview: 'Your fiscal representation expired today. Renew to stay covered.',
      heading: 'Your fiscal representation has expired.',
      body: (name: string) =>
        `Hello ${name}, your fiscal representation in Portugal has expired today. Renew now to restore your coverage.`,
      urgencyNote: 'Renew as soon as possible to avoid potential penalties.',
    },
  },
  fr: {
    expiryWarning:
      "Si vous avez des obligations fiscales portugaises (propriété, revenus locatifs, emploi), l'absence de représentant fiscal peut entraîner des amendes.",
    cta: 'Renouveler maintenant — 89 €/an',
    '30_days': {
      subject: 'Votre représentation fiscale expire dans 30 jours',
      preview: 'Renouvelez votre représentation fiscale pour rester couvert au Portugal.',
      heading: 'Votre représentation fiscale expire dans 30 jours.',
      body: (name: string) =>
        `Bonjour ${name}, votre représentation fiscale au Portugal expire dans 30 jours. Renouvelez pour 89 €/an afin de rester correctement enregistré.`,
      urgencyNote: 'Le renouvellement prend moins de 5 minutes.',
    },
    '15_days': {
      subject: 'Votre représentation fiscale expire dans 15 jours',
      preview: 'Votre représentation fiscale expire bientôt — renouvelez maintenant.',
      heading: 'Votre représentation fiscale expire dans 15 jours.',
      body: (name: string) =>
        `Bonjour ${name}, votre représentation fiscale au Portugal expire dans 15 jours. Renouvelez maintenant pour éviter une interruption de couverture.`,
      urgencyNote: "N'attendez pas — renouvelez maintenant pour rester correctement enregistré.",
    },
    expired: {
      subject: 'Votre représentation fiscale a expiré',
      preview: "Votre représentation fiscale a expiré aujourd'hui. Renouvelez pour rester couvert.",
      heading: 'Votre représentation fiscale a expiré.',
      body: (name: string) =>
        `Bonjour ${name}, votre représentation fiscale au Portugal a expiré aujourd'hui. Renouvelez maintenant pour rétablir votre couverture.`,
      urgencyNote: 'Renouvelez dès que possible pour éviter de potentielles pénalités.',
    },
  },
  es: {
    expiryWarning:
      'Si tienes obligaciones fiscales portuguesas (propiedad, ingresos por alquiler, empleo), no tener un representante fiscal puede resultar en multas.',
    cta: 'Renovar ahora — €89/año',
    '30_days': {
      subject: 'Tu representación fiscal expira en 30 días',
      preview: 'Renueva tu representación fiscal para seguir cubierto en Portugal.',
      heading: 'Tu representación fiscal expira en 30 días.',
      body: (name: string) =>
        `Hola ${name}, tu representación fiscal en Portugal expira en 30 días. Renueva por €89/año para seguir correctamente registrado.`,
      urgencyNote: 'La renovación tarda menos de 5 minutos.',
    },
    '15_days': {
      subject: 'Tu representación fiscal expira en 15 días',
      preview: 'Tu representación fiscal expira pronto — renueva ahora para seguir cubierto.',
      heading: 'Tu representación fiscal expira en 15 días.',
      body: (name: string) =>
        `Hola ${name}, tu representación fiscal en Portugal expira en 15 días. Renueva ahora para evitar una interrupción en tu cobertura.`,
      urgencyNote: 'No esperes — renueva ahora para seguir correctamente registrado.',
    },
    expired: {
      subject: 'Tu representación fiscal ha expirado',
      preview: 'Tu representación fiscal expiró hoy. Renueva para seguir cubierto.',
      heading: 'Tu representación fiscal ha expirado.',
      body: (name: string) =>
        `Hola ${name}, tu representación fiscal en Portugal ha expirado hoy. Renueva ahora para restaurar tu cobertura.`,
      urgencyNote: 'Renueva lo antes posible para evitar posibles sanciones.',
    },
  },
  de: {
    expiryWarning:
      'Wenn Sie portugiesische Steuerpflichten haben (Immobilien, Mieteinnahmen, Beschäftigung), kann das Fehlen eines Steuervertreters zu Bußgeldern führen.',
    cta: 'Jetzt verlängern — 89 €/Jahr',
    '30_days': {
      subject: 'Ihre steuerliche Vertretung läuft in 30 Tagen ab',
      preview: 'Verlängern Sie Ihre steuerliche Vertretung, um in Portugal abgesichert zu bleiben.',
      heading: 'Ihre steuerliche Vertretung läuft in 30 Tagen ab.',
      body: (name: string) =>
        `Hallo ${name}, Ihre steuerliche Vertretung in Portugal läuft in 30 Tagen ab. Verlängern Sie für 89 €/Jahr, um korrekt registriert zu bleiben.`,
      urgencyNote: 'Die Verlängerung dauert weniger als 5 Minuten.',
    },
    '15_days': {
      subject: 'Ihre steuerliche Vertretung läuft in 15 Tagen ab',
      preview:
        'Ihre steuerliche Vertretung läuft bald ab — verlängern Sie jetzt, um abgesichert zu bleiben.',
      heading: 'Ihre steuerliche Vertretung läuft in 15 Tagen ab.',
      body: (name: string) =>
        `Hallo ${name}, Ihre steuerliche Vertretung in Portugal läuft in 15 Tagen ab. Verlängern Sie jetzt, um eine Unterbrechung des Versicherungsschutzes zu vermeiden.`,
      urgencyNote: 'Warten Sie nicht — verlängern Sie jetzt, um korrekt registriert zu bleiben.',
    },
    expired: {
      subject: 'Ihre steuerliche Vertretung ist abgelaufen',
      preview: 'Ihre steuerliche Vertretung ist heute abgelaufen. Verlängern Sie jetzt.',
      heading: 'Ihre steuerliche Vertretung ist abgelaufen.',
      body: (name: string) =>
        `Hallo ${name}, Ihre steuerliche Vertretung in Portugal ist heute abgelaufen. Verlängern Sie jetzt, um Ihren Schutz wiederherzustellen.`,
      urgencyNote: 'Verlängern Sie so schnell wie möglich, um mögliche Strafen zu vermeiden.',
    },
  },
}

/** Returns the subject line for the given locale + interval combination. */
export function getRenewalReminderSubject(
  locale: EmailLocale,
  interval: RenewalReminderInterval,
): string {
  return copy[locale][interval].subject
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
  bodyText: { fontSize: '16px', color: '#1e293b', lineHeight: '1.6', margin: '0 0 16px 0' },
  urgencyNote: { fontSize: '14px', color: '#475569', lineHeight: '1.5', margin: '0 0 24px 0' },
  // Warning block — amber tint matches --status-warning-subtle token intent
  warningBlock: {
    backgroundColor: '#fffbeb',
    border: '1px solid #f59e0b',
    borderRadius: '8px',
    padding: '16px 20px',
    margin: '0 0 32px 0',
  },
  warningText: { fontSize: '13px', color: '#92400e', lineHeight: '1.5', margin: '0' },
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

export function RenewalReminderEmail({
  locale,
  interval,
  customerName,
  renewalUrl,
}: RenewalReminderEmailProps) {
  const t = copy[locale]
  const c = t[interval]

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{c.preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>

          {/* Brand header */}
          <Section>
            <Text style={styles.brand}>RemoteNIF</Text>
          </Section>

          <Hr style={styles.divider} />

          {/* Reminder body */}
          <Section>
            <Text style={styles.heading}>{c.heading}</Text>
            <Text style={styles.bodyText}>{c.body(customerName)}</Text>
            <Text style={styles.urgencyNote}>{c.urgencyNote}</Text>

            {/* Regulatory context — honest note on who actually needs fiscal rep */}
            <Section style={styles.warningBlock}>
              <Text style={styles.warningText}>{t.expiryWarning}</Text>
            </Section>

            <Button href={renewalUrl} style={styles.button}>
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
