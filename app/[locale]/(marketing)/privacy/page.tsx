import type { Metadata } from 'next'
import type { Locale } from '@/i18n/routing'
import { buildAlternates } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const { canonical, languages } = buildAlternates(locale, '/privacy')

  return {
    title: 'Privacy Policy — RemoteNIF',
    description:
      'How RemoteNIF collects, uses, and protects your personal data when you apply for a Portuguese NIF number.',
    alternates: { canonical, languages },
    robots: { index: true, follow: true },
  }
}

// Static legal page — English only. The English version is the binding legal text.
// No i18n for body content: legal accuracy requires a qualified translator per locale.
export default function PrivacyPage() {
  return (
    <div className="bg-[var(--bg-base)] py-[length:var(--space-16)] px-[length:var(--space-4)]">
      <article className="max-w-3xl mx-auto prose-legal">

        <header className="mb-[length:var(--space-10)]">
          <h1 className="font-serif font-[number:var(--font-bold)] text-[length:var(--text-4xl)] text-text-primary leading-[var(--leading-tight)]">
            Privacy Policy
          </h1>
          <p className="mt-[length:var(--space-2)] text-[length:var(--text-sm)] text-text-muted">
            Last updated: June 2026
          </p>
          <p className="mt-[length:var(--space-4)] text-[length:var(--text-base)] text-text-secondary leading-[var(--leading-relaxed)]">
            This policy explains how RemoteNIF (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) collects, uses, and
            protects your personal data when you use our NIF application service. We are committed
            to full compliance with the EU General Data Protection Regulation (GDPR) and Portuguese
            law (Lei 58/2019).
          </p>
        </header>

        <Section title="1. Data Controller">
          <p>
            The data controller for your personal data is:
          </p>
          <address className="not-italic mt-[length:var(--space-2)] p-[length:var(--space-4)] bg-surface border border-border-subtle rounded-[length:var(--radius-md)] text-[length:var(--text-sm)] text-text-secondary leading-[var(--leading-relaxed)]">
            <strong className="text-text-primary">[COMPANY NAME]</strong><br />
            [REGISTERED ADDRESS]<br />
            Portugal<br />
            Privacy contact:{' '}
            <a href="mailto:privacy@remotenif.com" className="text-brand-primary hover:underline">
              privacy@remotenif.com
            </a>
          </address>
          <p className="mt-[length:var(--space-3)] text-[length:var(--text-sm)] text-text-muted">
            Note: a formal legal entity is being registered. This notice will be updated with the
            registered company name and address upon completion.
          </p>
        </Section>

        <Section title="2. Data We Collect">
          <p>We collect the following categories of personal data:</p>
          <ul>
            <li>
              <strong>Account data</strong> — name, email address, and password (stored as a
              one-way hash). Collected when you create an account.
            </li>
            <li>
              <strong>Identity documents</strong> — a scan or photo of your passport photo page
              and a proof of address document. Required to submit your NIF application to the
              Portuguese Tax and Customs Authority (AT).
            </li>
            <li>
              <strong>Signed Power of Attorney (Standard and Express tiers)</strong> — a signed
              authorisation document allowing a fiscal representative to act on your behalf.
            </li>
            <li>
              <strong>Transaction data</strong> — the tier selected, amount paid, and payment
              status. Card details are processed exclusively by Stripe and are never stored on
              our systems.
            </li>
            <li>
              <strong>Technical data</strong> — session tokens and server-side access logs used
              for authentication and security. No analytics or advertising cookies are used.
            </li>
          </ul>
        </Section>

        <Section title="3. Why We Process Your Data and Our Legal Basis">
          <p>
            Each processing activity rests on a specific lawful basis under GDPR Article 6:
          </p>
          <table className="w-full text-[length:var(--text-sm)] border-collapse">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left py-[length:var(--space-2)] pr-[length:var(--space-4)] text-text-primary font-[number:var(--font-semibold)]">Data</th>
                <th className="text-left py-[length:var(--space-2)] pr-[length:var(--space-4)] text-text-primary font-[number:var(--font-semibold)]">Purpose</th>
                <th className="text-left py-[length:var(--space-2)] text-text-primary font-[number:var(--font-semibold)]">Lawful Basis</th>
              </tr>
            </thead>
            <tbody className="text-text-secondary">
              <tr className="border-b border-border-subtle">
                <td className="py-[length:var(--space-2)] pr-[length:var(--space-4)] align-top">Account data</td>
                <td className="py-[length:var(--space-2)] pr-[length:var(--space-4)] align-top">Create and manage your account, send service emails</td>
                <td className="py-[length:var(--space-2)] align-top">Art. 6(1)(b) — performance of a contract</td>
              </tr>
              <tr className="border-b border-border-subtle">
                <td className="py-[length:var(--space-2)] pr-[length:var(--space-4)] align-top">Identity documents</td>
                <td className="py-[length:var(--space-2)] pr-[length:var(--space-4)] align-top">Submit NIF application to AT; AI-assisted document review</td>
                <td className="py-[length:var(--space-2)] align-top">Art. 6(1)(b) — performance of a contract</td>
              </tr>
              <tr className="border-b border-border-subtle">
                <td className="py-[length:var(--space-2)] pr-[length:var(--space-4)] align-top">Transaction data</td>
                <td className="py-[length:var(--space-2)] pr-[length:var(--space-4)] align-top">Fulfil your order; comply with tax record obligations</td>
                <td className="py-[length:var(--space-2)] align-top">Art. 6(1)(b) and Art. 6(1)(c) — legal obligation</td>
              </tr>
              <tr>
                <td className="py-[length:var(--space-2)] pr-[length:var(--space-4)] align-top">Technical data</td>
                <td className="py-[length:var(--space-2)] pr-[length:var(--space-4)] align-top">Fraud prevention; service security and integrity</td>
                <td className="py-[length:var(--space-2)] align-top">Art. 6(1)(f) — legitimate interest</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-[length:var(--space-3)] text-[length:var(--text-sm)] text-text-muted">
            We do not process special category data (biometric data, health data) as defined
            under GDPR Article 9. Passport images are used solely for document authenticity
            verification (checking validity and readability) — no facial recognition or biometric
            matching is performed.
          </p>
        </Section>

        <Section title="4. AI-Assisted Document Review">
          <p>
            When you upload documents, our system uses an AI model (provided by Groq, Inc.) to
            automatically review them for common issues: whether the document is the correct type,
            whether the image is sufficiently clear, and — for passports — whether the document
            is still valid.
          </p>
          <p>
            This automated review assists our team but does not make final decisions without
            human oversight. Specifically:
          </p>
          <ul>
            <li>
              If the AI returns a <em>clear</em> result, the document proceeds to our operator
              queue for human review before submission to AT.
            </li>
            <li>
              If the AI flags an issue, you are notified and asked to re-upload. An operator
              reviews any disputed flag before it becomes final.
            </li>
            <li>
              If the AI cannot analyse the document (error state), it is automatically escalated
              to manual review.
            </li>
          </ul>
          <p>
            In accordance with GDPR Article 13(2)(f), we disclose that automated processing
            contributes to document assessment. You have the right to request human review of any
            AI-generated flag by contacting{' '}
            <a href="mailto:privacy@remotenif.com" className="text-brand-primary hover:underline">
              privacy@remotenif.com
            </a>
            .
          </p>
        </Section>

        <Section title="5. Data Retention">
          <p>We retain your data only as long as necessary for the purpose it was collected:</p>
          <ul>
            <li>
              <strong>Identity documents (passport, proof of address, signed POA)</strong> —
              deleted within 90 days of your NIF application being submitted to AT, or sooner
              upon your written request.
            </li>
            <li>
              <strong>Account data</strong> — retained for the duration of your account. If you
              delete your account, personal data is removed within 30 days, subject to legal
              retention obligations below.
            </li>
            <li>
              <strong>Transaction records</strong> — retained for 10 years to comply with
              Portuguese and EU tax record obligations (Art. 6(1)(c)).
            </li>
            <li>
              <strong>Server logs</strong> — retained for up to 90 days for security purposes,
              then deleted.
            </li>
          </ul>
        </Section>

        <Section title="6. Service Providers and Sub-processors">
          <p>
            We share your data only with the service providers necessary to deliver our service.
            Each provider is bound by a Data Processing Agreement (DPA) incorporating EU Standard
            Contractual Clauses (SCCs) where applicable:
          </p>
          <ul>
            <li>
              <strong>Supabase</strong> (database and file storage) — hosted in the EU (Frankfurt
              region). DPA with EU SCCs.{' '}
              <a href="https://supabase.com/privacy" className="text-brand-primary hover:underline" target="_blank" rel="noopener noreferrer">
                Supabase Privacy Policy
              </a>
            </li>
            <li>
              <strong>Vercel</strong> (application hosting and CDN) — DPA with EU SCCs for
              any US-routed traffic.{' '}
              <a href="https://vercel.com/legal/privacy-policy" className="text-brand-primary hover:underline" target="_blank" rel="noopener noreferrer">
                Vercel Privacy Policy
              </a>
            </li>
            <li>
              <strong>Groq, Inc.</strong> (AI document review) — US-based. Your document images
              are transmitted to Groq solely for the purpose of automated review and are not
              used to train models. Transfer is governed by EU SCCs under Groq&apos;s DPA.
            </li>
            <li>
              <strong>Stripe, Inc.</strong> (payment processing) — independent data controller
              for your payment card data. We receive only transaction metadata (amount, status,
              timestamp).{' '}
              <a href="https://stripe.com/privacy" className="text-brand-primary hover:underline" target="_blank" rel="noopener noreferrer">
                Stripe Privacy Policy
              </a>
            </li>
            <li>
              <strong>Resend</strong> (transactional email) — used to deliver service
              notifications (order confirmations, document status, NIF delivery).{' '}
              <a href="https://resend.com/privacy" className="text-brand-primary hover:underline" target="_blank" rel="noopener noreferrer">
                Resend Privacy Policy
              </a>
            </li>
          </ul>
          <p>
            We do not sell your data to third parties. We do not use your data for advertising.
          </p>
        </Section>

        <Section title="7. International Data Transfers">
          <p>
            Our primary infrastructure is hosted in the EU. However, our AI document review
            provider (Groq, Inc.) is based in the United States. When your document images are
            analysed by the AI, they are transferred to the US under EU Standard Contractual
            Clauses (SCCs) as the appropriate safeguard under GDPR Article 46(2)(c). Groq&apos;s
            DPA confirms this safeguard is in place.
          </p>
        </Section>

        <Section title="8. Your Rights">
          <p>
            Under GDPR, you have the following rights regarding your personal data. To exercise
            any of these rights, contact us at{' '}
            <a href="mailto:privacy@remotenif.com" className="text-brand-primary hover:underline">
              privacy@remotenif.com
            </a>
            . We will respond within 30 days.
          </p>
          <ul>
            <li><strong>Access (Art. 15)</strong> — request a copy of the data we hold about you.</li>
            <li><strong>Rectification (Art. 16)</strong> — correct inaccurate data.</li>
            <li>
              <strong>Erasure (Art. 17)</strong> — request deletion of your data. Note: we may
              be required to retain certain records (e.g. transaction data) to comply with legal
              obligations.
            </li>
            <li><strong>Restriction (Art. 18)</strong> — restrict how we process your data while a dispute is resolved.</li>
            <li>
              <strong>Portability (Art. 20)</strong> — receive your account and transaction data
              in a structured, machine-readable format.
            </li>
            <li>
              <strong>Objection (Art. 21)</strong> — object to processing based on legitimate
              interest (server logs and security data).
            </li>
            <li>
              <strong>Human review of automated decisions (Art. 22)</strong> — request that a
              human operator review any AI-generated document flag before it is acted upon.
            </li>
          </ul>
          <p>
            You also have the right to lodge a complaint with the Portuguese data protection
            supervisory authority:
          </p>
          <address className="not-italic mt-[length:var(--space-2)] p-[length:var(--space-4)] bg-surface border border-border-subtle rounded-[length:var(--radius-md)] text-[length:var(--text-sm)] text-text-secondary leading-[var(--leading-relaxed)]">
            <strong className="text-text-primary">CNPD — Comissão Nacional de Proteção de Dados</strong><br />
            Av. D. Carlos I, 134 — 1º, 1200-651 Lisboa, Portugal<br />
            <a href="https://www.cnpd.pt" className="text-brand-primary hover:underline" target="_blank" rel="noopener noreferrer">
              www.cnpd.pt
            </a>
          </address>
        </Section>

        <Section title="9. Cookies">
          <p>
            We use only strictly necessary cookies — session tokens required for authentication
            and security. These cookies do not track you across websites and do not require your
            consent under the ePrivacy Directive.
          </p>
          <p>
            We do not use analytics, advertising, or third-party tracking cookies of any kind.
          </p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>
            We may update this policy as our service evolves or as legal requirements change.
            Material changes will be notified by email or via an in-app notice at least 14 days
            before they take effect. The &ldquo;Last updated&rdquo; date at the top of this page reflects
            the most recent version.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            For any privacy-related questions or to exercise your rights, contact us at:{' '}
            <a href="mailto:privacy@remotenif.com" className="text-brand-primary hover:underline">
              privacy@remotenif.com
            </a>
          </p>
        </Section>

      </article>
    </div>
  )
}

// Reusable section wrapper for consistent heading + spacing
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-[length:var(--space-10)]">
      <h2 className="font-serif font-[number:var(--font-bold)] text-[length:var(--text-2xl)] text-text-primary leading-[var(--leading-tight)] mb-[length:var(--space-4)]">
        {title}
      </h2>
      <div className="space-y-[length:var(--space-3)] text-[length:var(--text-base)] text-text-secondary leading-[var(--leading-relaxed)] [&_ul]:list-disc [&_ul]:pl-[length:var(--space-6)] [&_ul]:space-y-[length:var(--space-2)] [&_strong]:text-text-primary [&_a]:text-brand-primary [&_a:hover]:underline [&_table]:w-full">
        {children}
      </div>
    </section>
  )
}
