import type { Metadata } from 'next'
import type { Locale } from '@/i18n/routing'
import { buildAlternates } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const { canonical, languages } = buildAlternates(locale, '/terms')

  return {
    title: 'Terms of Service — RemoteNIF',
    description:
      'The terms and conditions governing your use of RemoteNIF, the Portuguese NIF application service.',
    alternates: { canonical, languages },
    robots: { index: true, follow: true },
  }
}

// Static legal page — English only. The English version is the binding legal text.
// No i18n for body content: legal accuracy requires a qualified translator per locale.
export default function TermsPage() {
  return (
    <div className="bg-[var(--bg-base)] py-[length:var(--space-16)] px-[length:var(--space-4)]">
      <article className="max-w-3xl mx-auto">

        <header className="mb-[length:var(--space-10)]">
          <h1 className="font-serif font-[number:var(--font-bold)] text-[length:var(--text-4xl)] text-text-primary leading-[var(--leading-tight)]">
            Terms of Service
          </h1>
          <p className="mt-[length:var(--space-2)] text-[length:var(--text-sm)] text-text-muted">
            Last updated: June 2026
          </p>
          <p className="mt-[length:var(--space-4)] text-[length:var(--text-base)] text-text-secondary leading-[var(--leading-relaxed)]">
            These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the RemoteNIF service
            (&ldquo;Service&rdquo;), operated by [COMPANY NAME] (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;). By creating an
            account or placing an order, you agree to these Terms. If you do not agree, do not
            use the Service.
          </p>
        </header>

        <Section title="1. About the Service">
          <p>
            RemoteNIF is an administrative assistance service that collects your documents and
            submits a Portuguese NIF (Número de Identificação Fiscal) application to the
            Portuguese Tax and Customs Authority (AT — Autoridade Tributária e Aduaneira) on
            your behalf.
          </p>
          <p>
            <strong>RemoteNIF is not a law firm and does not provide legal advice.</strong> The
            NIF is issued solely at the discretion of AT. We cannot guarantee approval, and we
            are not responsible for any decision made by AT.
          </p>
          <p>
            Delivery timescales stated on our pricing page are estimates based on AT&apos;s current
            processing times and are not contractual guarantees.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <p>
            You must be at least 18 years old to use the Service. By creating an account, you
            confirm that you are 18 or older and that all information you provide is accurate,
            complete, and your own. You may not use the Service to apply on behalf of another
            person without that person&apos;s explicit written consent.
          </p>
        </Section>

        <Section title="3. Your Documents">
          <p>
            To submit your NIF application, you must provide:
          </p>
          <ul>
            <li>A clear scan or photograph of your valid passport photo page</li>
            <li>A proof of address dated within the last 3 months (accepted types listed on the upload page)</li>
            <li>A signed Power of Attorney (Standard and Express tiers only)</li>
          </ul>
          <p>
            You confirm that all documents you upload are genuine, unaltered, and belong to you.
            Uploading fraudulent, altered, or third-party documents without authorisation is
            grounds for immediate termination and may be reported to relevant authorities.
          </p>
          <p>
            Your documents are processed in accordance with our{' '}
            <a href="/privacy" className="text-brand-primary hover:underline">
              Privacy Policy
            </a>
            . They are used solely to submit your NIF application and are deleted within 90 days
            of submission.
          </p>
        </Section>

        <Section title="4. Payment">
          <p>
            All prices are shown in Euros (€) and are inclusive of applicable taxes where stated.
            Payment is charged at the time of order, before document review begins.
          </p>
          <p>
            Payments are processed by Stripe, Inc. By placing an order, you also agree to
            Stripe&apos;s{' '}
            <a href="https://stripe.com/legal/ssa" className="text-brand-primary hover:underline" target="_blank" rel="noopener noreferrer">
              Terms of Service
            </a>
            . We do not store your card details.
          </p>
          <p>
            If you are an EU consumer, VAT may apply based on your country of residence in
            accordance with EU VAT OSS rules.
          </p>
        </Section>

        <Section title="5. Right of Withdrawal and Refund Policy">
          <p>
            Under the EU Consumer Rights Directive (2011/83/EU), you have the right to withdraw
            from this contract within 14 days of purchase without giving any reason.
          </p>
          <p>
            <strong>
              However, by placing an order you expressly request that we begin performing the
              Service immediately. You acknowledge that by requesting this immediate performance,
              you waive your right of withdrawal once document review has commenced.
            </strong>{' '}
            This acknowledgement is presented as a checkbox at checkout before payment is
            processed.
          </p>
          <p>
            Refund eligibility is as follows:
          </p>
          <ul>
            <li>
              <strong>Full refund</strong> — if you cancel before uploading any documents and
              before document review has commenced.
            </li>
            <li>
              <strong>No refund</strong> — once document review has commenced (whether by AI
              or by an operator), the right of withdrawal is waived and no refund is available,
              regardless of the outcome of your application with AT.
            </li>
          </ul>
          <p>
            To cancel before review begins, contact{' '}
            <a href="mailto:support@remotenif.com" className="text-brand-primary hover:underline">
              support@remotenif.com
            </a>{' '}
            immediately after purchase.
          </p>
        </Section>

        <Section title="6. Prohibited Uses">
          <p>You may not use the Service to:</p>
          <ul>
            <li>Submit false, fraudulent, or altered documents</li>
            <li>Apply for a NIF on behalf of another person without their explicit consent</li>
            <li>Circumvent or attempt to manipulate our AI document review system</li>
            <li>Use the Service for any purpose that violates Portuguese or EU law</li>
            <li>Engage in any activity that disrupts, damages, or overloads our systems</li>
          </ul>
        </Section>

        <Section title="7. Intellectual Property">
          <p>
            All software, brand assets, and processes that constitute the RemoteNIF service are
            our proprietary property. Your uploaded documents remain yours — we claim no rights
            over them and use them solely to deliver the Service.
          </p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>
            To the maximum extent permitted by applicable law, our total liability to you for any
            claim arising from your use of the Service is limited to the amount you paid for the
            specific order giving rise to the claim.
          </p>
          <p>
            We are not liable for indirect, consequential, or special damages, including loss of
            profit, loss of data, or AT&apos;s delay or refusal to issue a NIF.
          </p>
          <p>
            Nothing in these Terms limits liability for fraud, death, or personal injury caused
            by our negligence, as required by EU consumer law.
          </p>
        </Section>

        <Section title="9. Termination">
          <p>
            We may suspend or terminate your account if you breach these Terms, submit fraudulent
            documents, or engage in prohibited conduct. Upon termination, your personal data will
            be handled in accordance with our{' '}
            <a href="/privacy" className="text-brand-primary hover:underline">
              Privacy Policy
            </a>
            .
          </p>
          <p>
            You may delete your account at any time from your account settings. Any pending
            orders that have already been submitted to AT cannot be recalled.
          </p>
        </Section>

        <Section title="10. Governing Law and Disputes">
          <p>
            These Terms are governed by Portuguese law. Any disputes arising from these Terms
            will be subject to the jurisdiction of the Portuguese courts.
          </p>
          <p>
            As required by EU Regulation 524/2013, we note that the European Commission provides
            an online dispute resolution platform for consumers. You can access it at:{' '}
            <a
              href="https://ec.europa.eu/consumers/odr/"
              className="text-brand-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              ec.europa.eu/consumers/odr
            </a>
            . Our contact for ODR purposes is{' '}
            <a href="mailto:support@remotenif.com" className="text-brand-primary hover:underline">
              support@remotenif.com
            </a>
            .
          </p>
          <p>
            EU consumers retain the right to bring proceedings in the courts of their country of
            residence regardless of the choice of law above, as provided by EU consumer
            protection rules.
          </p>
        </Section>

        <Section title="11. Changes to These Terms">
          <p>
            We may update these Terms from time to time. If we make material changes, we will
            notify you by email or via an in-app notice at least 14 days before the changes take
            effect. Your continued use of the Service after that date constitutes acceptance of
            the updated Terms.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            For questions about these Terms, contact us at:{' '}
            <a href="mailto:support@remotenif.com" className="text-brand-primary hover:underline">
              support@remotenif.com
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
      <div className="space-y-[length:var(--space-3)] text-[length:var(--text-base)] text-text-secondary leading-[var(--leading-relaxed)] [&_ul]:list-disc [&_ul]:pl-[length:var(--space-6)] [&_ul]:space-y-[length:var(--space-2)] [&_strong]:text-text-primary [&_a]:text-brand-primary [&_a:hover]:underline">
        {children}
      </div>
    </section>
  )
}
