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

interface StatusUpdateWithNoteEmailProps {
  locale: EmailLocale
  customerName: string
  note: string
  newStatus: string
  dashboardUrl: string
}

const copy = {
  en: {
    subject: 'Update on your NIF application',
    preview: "There's an update on your NIF application.",
    heading: 'Update on your application.',
    statusLabels: {
      documents_pending: 'Upload documents',
      documents_under_review: 'Under review',
      documents_approved: 'Approved — preparing submission',
      submitted: 'Submitted to Finanças',
      delivered: 'Delivered',
    },
    statusLine: (statusLabel: string) =>
      `Your application status has been updated to: ${statusLabel}.`,
    noteLabel: 'Message from our team:',
    cta: 'View Dashboard',
  },
  fr: {
    subject: 'Mise à jour de votre demande de NIF',
    preview: 'Il y a une mise à jour concernant votre demande de NIF.',
    heading: 'Mise à jour de votre demande.',
    statusLabels: {
      documents_pending: 'Télécharger les documents',
      documents_under_review: "En cours d'examen",
      documents_approved: 'Approuvé — préparation de la soumission',
      submitted: 'Soumis aux Finanças',
      delivered: 'Livré',
    },
    statusLine: (statusLabel: string) =>
      `Le statut de votre demande a été mis à jour : ${statusLabel}.`,
    noteLabel: 'Message de notre équipe :',
    cta: 'Voir le tableau de bord',
  },
  es: {
    subject: 'Actualización sobre su solicitud de NIF',
    preview: 'Hay una actualización sobre su solicitud de NIF.',
    heading: 'Actualización de su solicitud.',
    statusLabels: {
      documents_pending: 'Subir documentos',
      documents_under_review: 'En revisión',
      documents_approved: 'Aprobado — preparando la presentación',
      submitted: 'Presentado ante Finanças',
      delivered: 'Entregado',
    },
    statusLine: (statusLabel: string) =>
      `El estado de su solicitud ha sido actualizado a: ${statusLabel}.`,
    noteLabel: 'Mensaje de nuestro equipo:',
    cta: 'Ver panel de control',
  },
  de: {
    subject: 'Update zu Ihrem NIF-Antrag',
    preview: 'Es gibt ein Update zu Ihrem NIF-Antrag.',
    heading: 'Update zu Ihrem Antrag.',
    statusLabels: {
      documents_pending: 'Dokumente hochladen',
      documents_under_review: 'In Prüfung',
      documents_approved: 'Genehmigt — Einreichung wird vorbereitet',
      submitted: 'Bei Finanças eingereicht',
      delivered: 'Zugestellt',
    },
    statusLine: (statusLabel: string) =>
      `Der Status Ihres Antrags wurde aktualisiert auf: ${statusLabel}.`,
    noteLabel: 'Nachricht von unserem Team:',
    cta: 'Dashboard anzeigen',
  },
}

export function getStatusUpdateWithNoteSubject(locale: EmailLocale): string {
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
  noteLabel: { fontSize: '12px', fontWeight: '600', color: '#64748b', margin: '0 0 8px 0', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  noteBlock: {
    backgroundColor: '#f8fafc',
    borderLeft: '4px solid #e2e8f0',
    padding: '16px',
    borderRadius: '4px',
    margin: '0 0 24px 0',
  },
  noteText: { fontSize: '16px', color: '#1e293b', lineHeight: '1.6', margin: '0' },
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

export function StatusUpdateWithNoteEmail({
  locale,
  customerName,
  note,
  newStatus,
  dashboardUrl,
}: StatusUpdateWithNoteEmailProps) {
  const t = copy[locale]
  const statusLabel = t.statusLabels[newStatus as keyof typeof t.statusLabels] ?? newStatus

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
            <Text style={styles.bodyText}>{t.statusLine(statusLabel)}</Text>
            <Text style={styles.noteLabel}>{t.noteLabel}</Text>
            <div style={styles.noteBlock}>
              <Text style={styles.noteText}>{note}</Text>
            </div>
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
