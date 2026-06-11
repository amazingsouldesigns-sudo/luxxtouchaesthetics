import * as React from 'react'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'Luxx Touch Aesthetics'
const CONTACT_EMAIL = 'hello@luxxtouchaesthetics.com'
const CONTACT_SITE = 'luxxtouchaesthetics.com'

interface AppointmentReminderProps {
  customerName?: string
  serviceName?: string
  serviceDuration?: string
  addOnNames?: string
  dateLabel?: string
  timeLabel?: string
  remaining?: string
  /** Human label for how far out the appointment is, e.g. "24 hours" or "12 hours". */
  reminderWindow?: string
}

const AppointmentReminderEmail = ({
  customerName = 'Valued Guest',
  serviceName = 'Your appointment',
  serviceDuration,
  addOnNames,
  dateLabel = '—',
  timeLabel = '—',
  remaining,
  reminderWindow = 'soon',
}: AppointmentReminderProps) => {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Reminder: your {SITE_NAME} appointment is in {reminderWindow}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={brand}>{SITE_NAME}</Heading>
            <Text style={tagline}>Appointment Reminder</Text>
          </Section>

          <Section style={{ padding: '4px 0 8px' }}>
            <Text style={intro}>
              Hi {customerName}, this is a friendly reminder that your appointment is coming up in{' '}
              <strong>{reminderWindow}</strong>. We look forward to seeing you!
            </Text>
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

          {remaining ? (
            <>
              <Hr style={hr} />
              <Section style={sectionBlock}>
                <Text style={sectionLabel}>BALANCE DUE</Text>
                <Text style={balanceText}>
                  Please bring <strong>${remaining}</strong> in cash to settle the remaining balance at your appointment.
                </Text>
              </Section>
            </>
          ) : null}

          <Hr style={hr} />

          <Section style={sectionBlock}>
            <Text style={fineprint}>
              Need to make a change? Reply to this email as soon as possible. Please note our cancellation
              window: changes within 24 hours of your appointment may affect your deposit.
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
  component: AppointmentReminderEmail,
  subject: (d: Record<string, any>) =>
    `Reminder: your ${SITE_NAME} appointment is in ${d?.reminderWindow ?? 'soon'}`,
  displayName: 'Appointment reminder',
  previewData: {
    customerName: 'Jane Doe',
    serviceName: 'Classic Lash Set',
    serviceDuration: '90 minutes',
    addOnNames: 'Brow Tint',
    dateLabel: 'Saturday, June 14, 2026',
    timeLabel: '2:30 PM',
    remaining: '117.00',
    reminderWindow: '24 hours',
  },
} satisfies TemplateEntry

// Styles — mirror the booking receipt for a consistent brand look.
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
const intro: React.CSSProperties = {
  fontSize: '14px',
  color: '#2a1a18',
  lineHeight: '1.6',
  margin: 0,
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
const balanceText: React.CSSProperties = {
  fontSize: '13px',
  color: '#2a1a18',
  lineHeight: '1.6',
  margin: 0,
}
const fineprint: React.CSSProperties = {
  fontSize: '11px',
  color: '#8a7a76',
  margin: 0,
  lineHeight: '1.5',
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
