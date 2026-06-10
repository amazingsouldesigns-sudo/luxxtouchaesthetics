import * as React from 'react'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'Luxx Touch Aesthetics'
const CONTACT_EMAIL = 'hello@luxxtouchaesthetics.com'
const CONTACT_SITE = 'luxxtouchaesthetics.com'

interface BookingReceiptProps {
  customerName?: string
  serviceName?: string
  serviceDuration?: string
  addOnNames?: string
  dateLabel?: string
  timeLabel?: string
  total?: string
  deposit?: string
  remaining?: string
  referenceNumber?: string
  issuedOn?: string
}

const BookingReceiptEmail = ({
  customerName = 'Valued Guest',
  serviceName = 'Your service',
  serviceDuration,
  addOnNames,
  dateLabel = '—',
  timeLabel = '—',
  total = '0.00',
  deposit = '0.00',
  remaining = '0.00',
  referenceNumber = '—',
  issuedOn,
}: BookingReceiptProps) => {
  const issued = issuedOn ?? new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your {SITE_NAME} booking receipt — Ref {referenceNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={brand}>{SITE_NAME}</Heading>
            <Text style={tagline}>Booking Receipt</Text>
          </Section>

          {/* Meta */}
          <Section style={metaBox}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={metaLabel}>Reference</td>
                  <td style={metaValue}>{referenceNumber}</td>
                </tr>
                <tr>
                  <td style={metaLabel}>Issued</td>
                  <td style={metaValue}>{issued}</td>
                </tr>
                <tr>
                  <td style={metaLabel}>Billed to</td>
                  <td style={metaValue}>{customerName}</td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Appointment */}
          <Section style={sectionBlock}>
            <Text style={sectionLabel}>APPOINTMENT</Text>
            <Text style={serviceTitle}>{serviceName}</Text>
            {serviceDuration ? <Text style={subtle}>{serviceDuration}</Text> : null}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
              <tbody>
                <tr>
                  <td style={cellLabel}>Date</td>
                  <td style={cellValue}>{dateLabel}</td>
                </tr>
                <tr>
                  <td style={cellLabel}>Time</td>
                  <td style={cellValue}>{timeLabel}</td>
                </tr>
                {addOnNames ? (
                  <tr>
                    <td style={cellLabel}>Add-ons</td>
                    <td style={cellValue}>{addOnNames}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </Section>

          <Hr style={hr} />

          {/* Payment */}
          <Section style={sectionBlock}>
            <Text style={sectionLabel}>PAYMENT</Text>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={payLabel}>Service total</td>
                  <td style={payValue}>${total}</td>
                </tr>
                <tr>
                  <td style={payLabelStrong}>Deposit paid (35%)</td>
                  <td style={payValueStrong}>${deposit}</td>
                </tr>
                <tr>
                  <td style={payLabel}>Remaining (cash at appointment)</td>
                  <td style={payValue}>${remaining}</td>
                </tr>
              </tbody>
            </table>
            <Section style={totalBar}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={totalLabel}>AMOUNT PAID</td>
                    <td style={totalValue}>${deposit}</td>
                  </tr>
                </tbody>
              </table>
            </Section>
            <Text style={fineprint}>
              The deposit is non-refundable. The remaining balance of ${remaining} is due in cash at your appointment.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Thank you */}
          <Section style={{ padding: '8px 0 0' }}>
            <Text style={thanks}>
              Thank you for choosing {SITE_NAME}. We appreciate your booking and look forward to serving you.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Questions? Reply to this email or contact us at{' '}
              <span style={{ color: '#7B1D26' }}>{CONTACT_EMAIL}</span>
            </Text>
            <Text style={footerText}>{CONTACT_SITE}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: BookingReceiptEmail,
  subject: (d: Record<string, any>) =>
    `Your ${SITE_NAME} booking receipt${d?.referenceNumber ? ` — Ref ${d.referenceNumber}` : ''}`,
  displayName: 'Booking receipt',
  previewData: {
    customerName: 'Jane Doe',
    serviceName: 'Classic Lash Set',
    serviceDuration: '90 minutes',
    addOnNames: 'Brow Tint, Lip Wax',
    dateLabel: 'Saturday, June 14',
    timeLabel: '2:30 PM',
    total: '180.00',
    deposit: '63.00',
    remaining: '117.00',
    referenceNumber: 'LX-8F3A21',
  },
} satisfies TemplateEntry

// Styles — mobile-friendly, white background, brand accents
const main: React.CSSProperties = {
  backgroundColor: '#f5f1ee',
  fontFamily: 'Helvetica, Arial, sans-serif',
  margin: 0,
  padding: '24px 0',
}
const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  maxWidth: '600px',
  margin: '0 auto',
  padding: '32px 28px',
  borderRadius: '6px',
  border: '1px solid #ece4e0',
}
const header: React.CSSProperties = {
  borderBottom: '2px solid #7B1D26',
  paddingBottom: '16px',
  marginBottom: '20px',
}
const brand: React.CSSProperties = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: '24px',
  color: '#4C1208',
  margin: 0,
  letterSpacing: '0.5px',
}
const tagline: React.CSSProperties = {
  fontSize: '11px',
  letterSpacing: '3px',
  color: '#7B1D26',
  margin: '6px 0 0',
  textTransform: 'uppercase',
}
const metaBox: React.CSSProperties = {
  backgroundColor: '#faf6f4',
  padding: '14px 16px',
  borderRadius: '4px',
  marginBottom: '20px',
}
const metaLabel: React.CSSProperties = {
  fontSize: '11px',
  color: '#8a7a76',
  textTransform: 'uppercase',
  letterSpacing: '1.2px',
  padding: '4px 8px 4px 0',
  width: '40%',
}
const metaValue: React.CSSProperties = {
  fontSize: '13px',
  color: '#2a1a18',
  padding: '4px 0',
  textAlign: 'right',
}
const sectionBlock: React.CSSProperties = { padding: '8px 0' }
const sectionLabel: React.CSSProperties = {
  fontSize: '10px',
  letterSpacing: '2.5px',
  color: '#7B1D26',
  margin: '0 0 8px',
  fontWeight: 600,
}
const serviceTitle: React.CSSProperties = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: '20px',
  color: '#2a1a18',
  margin: '0 0 4px',
}
const subtle: React.CSSProperties = {
  fontSize: '12px',
  color: '#8a7a76',
  margin: 0,
}
const cellLabel: React.CSSProperties = {
  fontSize: '12px',
  color: '#8a7a76',
  padding: '6px 8px 6px 0',
  width: '35%',
  verticalAlign: 'top',
}
const cellValue: React.CSSProperties = {
  fontSize: '13px',
  color: '#2a1a18',
  padding: '6px 0',
}
const hr: React.CSSProperties = { borderColor: '#ece4e0', margin: '20px 0' }
const payLabel: React.CSSProperties = {
  fontSize: '13px',
  color: '#55474a',
  padding: '6px 0',
}
const payValue: React.CSSProperties = {
  fontSize: '13px',
  color: '#2a1a18',
  padding: '6px 0',
  textAlign: 'right',
}
const payLabelStrong: React.CSSProperties = {
  ...payLabel,
  color: '#2a1a18',
  fontWeight: 600,
}
const payValueStrong: React.CSSProperties = {
  ...payValue,
  fontWeight: 600,
}
const totalBar: React.CSSProperties = {
  backgroundColor: '#7B1D26',
  borderRadius: '4px',
  padding: '14px 16px',
  marginTop: '14px',
}
const totalLabel: React.CSSProperties = {
  fontSize: '11px',
  letterSpacing: '2.5px',
  color: '#ffffff',
  fontWeight: 600,
}
const totalValue: React.CSSProperties = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: '22px',
  color: '#ffffff',
  textAlign: 'right',
}
const fineprint: React.CSSProperties = {
  fontSize: '11px',
  color: '#8a7a76',
  margin: '12px 0 0',
  lineHeight: '1.5',
}
const thanks: React.CSSProperties = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: '15px',
  fontStyle: 'italic',
  color: '#2a1a18',
  textAlign: 'center',
  lineHeight: '1.6',
  margin: '8px 0',
}
const footer: React.CSSProperties = {
  marginTop: '20px',
  paddingTop: '16px',
  borderTop: '1px solid #ece4e0',
  textAlign: 'center',
}
const footerText: React.CSSProperties = {
  fontSize: '11px',
  color: '#8a7a76',
  margin: '4px 0',
}
