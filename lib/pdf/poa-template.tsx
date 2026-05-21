import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { resolveCountry } from '@/lib/utils/countries'
import type { PersonalDetailsData } from '@/lib/validations/orders'

interface PoaDocumentProps extends PersonalDetailsData {
  generatedDate: string
}

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#111111',
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 60,
    lineHeight: 1.5,
  },
  draftBanner: {
    backgroundColor: '#FFF3CD',
    border: '1 solid #FFC107',
    borderRadius: 3,
    padding: '6 10',
    marginBottom: 20,
    textAlign: 'center',
  },
  draftBannerText: {
    fontSize: 8,
    color: '#856404',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    textAlign: 'center',
    color: '#666666',
    marginBottom: 28,
  },
  divider: {
    borderBottom: '1 solid #DDDDDD',
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#444444',
    marginBottom: 10,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  fieldLabel: {
    width: 185,
    fontSize: 9,
    color: '#666666',
    fontFamily: 'Helvetica-Bold',
  },
  fieldValue: {
    flex: 1,
    fontSize: 10,
    color: '#111111',
  },
  bodyText: {
    fontSize: 10,
    color: '#111111',
    marginBottom: 10,
    lineHeight: 1.6,
  },
  draftInline: {
    fontSize: 8,
    color: '#999999',
    fontFamily: 'Helvetica-Oblique',
  },
  signatureSection: {
    marginTop: 36,
  },
  signatureRow: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 16,
  },
  signatureBlock: {
    flex: 1,
  },
  signatureLine: {
    borderBottom: '1 solid #111111',
    marginBottom: 5,
    height: 28,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#666666',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 60,
    right: 60,
    borderTop: '1 solid #EEEEEE',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: '#AAAAAA',
  },
})

export function PoaDocument({
  fullName,
  dateOfBirth,
  nationality,
  passportNumber,
  passportExpiry,
  address,
  generatedDate,
}: PoaDocumentProps) {
  const countryName = resolveCountry(nationality)

  return (
    <Document
      title="Power of Attorney — NIF Application"
      author="RemoteNIF"
      subject="Procuração para obtenção de NIF"
    >
      <Page size="A4" style={s.page}>

        {/* Draft warning banner */}
        <View style={s.draftBanner}>
          <Text style={s.draftBannerText}>
            DRAFT — PENDING LEGAL REVIEW · DO NOT USE FOR SUBMISSION
          </Text>
        </View>

        {/* Title */}
        <Text style={s.title}>Procuração / Power of Attorney</Text>
        <Text style={s.subtitle}>
          For the purpose of obtaining a Portuguese Tax Identification Number (NIF)
        </Text>

        <View style={s.divider} />

        {/* Principal identification */}
        <Text style={s.sectionHeading}>Principal (Constituinte)</Text>

        <View style={s.fieldRow}>
          <Text style={s.fieldLabel}>Nome completo / Full legal name:</Text>
          <Text style={s.fieldValue}>{fullName}</Text>
        </View>
        <View style={s.fieldRow}>
          <Text style={s.fieldLabel}>Data de nascimento / Date of birth:</Text>
          <Text style={s.fieldValue}>{dateOfBirth}</Text>
        </View>
        <View style={s.fieldRow}>
          <Text style={s.fieldLabel}>Nacionalidade / Nationality:</Text>
          <Text style={s.fieldValue}>{countryName}</Text>
        </View>
        <View style={s.fieldRow}>
          <Text style={s.fieldLabel}>Número de passaporte / Passport number:</Text>
          <Text style={s.fieldValue}>{passportNumber}</Text>
        </View>
        <View style={s.fieldRow}>
          <Text style={s.fieldLabel}>Validade do passaporte / Passport expiry:</Text>
          <Text style={s.fieldValue}>{passportExpiry}</Text>
        </View>
        <View style={[s.fieldRow, { marginBottom: 20 }]}>
          <Text style={s.fieldLabel}>Morada atual / Current address:</Text>
          <Text style={s.fieldValue}>{address}</Text>
        </View>

        <View style={s.divider} />

        {/* Authorization */}
        <Text style={s.sectionHeading}>
          Authorization (Autorização) {'  '}
          <Text style={s.draftInline}>[DRAFT — REPLACE WITH LEGAL COPY]</Text>
        </Text>

        <Text style={s.bodyText}>
          By this instrument, I, {fullName}, hereby appoint and authorize the
          Fiscal Representative identified below to act on my behalf before the
          Portuguese Tax and Customs Authority (Autoridade Tributária e Aduaneira —
          AT/Finanças) for the sole and exclusive purpose of applying for and
          obtaining a Portuguese Tax Identification Number (Número de Identificação
          Fiscal — NIF).
        </Text>

        <Text style={s.bodyText}>
          Pelo presente instrumento, eu, {fullName}, nomeio e autorizo o
          Representante Fiscal identificado abaixo a agir em meu nome perante a
          Autoridade Tributária e Aduaneira para o único e exclusivo efeito de
          solicitar e obter um Número de Identificação Fiscal (NIF).
        </Text>

        <Text style={s.bodyText}>
          This authorization is limited to NIF registration and does not confer
          any other powers on the representative. {'  '}
          <Text style={s.draftInline}>[DRAFT — REPLACE WITH LEGAL COPY]</Text>
        </Text>

        <View style={s.divider} />

        {/* Representative */}
        <Text style={s.sectionHeading}>
          Fiscal Representative (Representante Fiscal) {'  '}
          <Text style={s.draftInline}>[TO BE CONFIRMED WITH FISCAL REP]</Text>
        </Text>

        <View style={s.fieldRow}>
          <Text style={s.fieldLabel}>Name / Firm:</Text>
          <Text style={[s.fieldValue, s.draftInline]}>[FISCAL REP NAME — TBC]</Text>
        </View>
        <View style={[s.fieldRow, { marginBottom: 0 }]}>
          <Text style={s.fieldLabel}>NIF / Tax number:</Text>
          <Text style={[s.fieldValue, s.draftInline]}>[FISCAL REP NIF — TBC]</Text>
        </View>

        {/* Signature block */}
        <View style={s.signatureSection}>
          <View style={s.divider} />
          <Text style={s.sectionHeading}>Signature (Assinatura)</Text>
          <Text style={[s.bodyText, { marginBottom: 20 }]}>
            Signed at _________________________, on {generatedDate}
          </Text>
          <View style={s.signatureRow}>
            <View style={s.signatureBlock}>
              <View style={s.signatureLine} />
              <Text style={s.signatureLabel}>Signature of Principal / Assinatura do Constituinte</Text>
            </View>
            <View style={s.signatureBlock}>
              <View style={s.signatureLine} />
              <Text style={s.signatureLabel}>Full name (print) / Nome completo (letra de imprensa)</Text>
            </View>
          </View>
        </View>

        {/* Footer — bilingual PT/EN */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Gerado por RemoteNIF / Generated by RemoteNIF · remotenif.com · {generatedDate}
          </Text>
          <Text style={s.footerText}>
            Requer assinatura manuscrita / Requires handwritten signature before submission.
          </Text>
        </View>

      </Page>
    </Document>
  )
}
