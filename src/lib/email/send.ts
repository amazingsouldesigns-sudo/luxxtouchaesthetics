// Server-side helper to send transactional emails directly via Resend.
// Used inside server routes (e.g., Stripe verify) where we hold the
// service role key and there is no user JWT to forward.
//
// Flow: suppression check -> ensure unsubscribe token -> render template
// -> send via Resend -> record an audit row in email_send_log.
import * as React from 'react'
import { render } from '@react-email/components'
import { createClient } from '@supabase/supabase-js'
import { TEMPLATES } from '@/lib/email-templates/registry'

const DEFAULT_FROM = 'Luxx Touch Aesthetics <noreply@luxxtouchaesthetics.com>'

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export interface SendTransactionalEmailParams {
  templateName: string
  recipientEmail: string
  idempotencyKey?: string
  templateData?: Record<string, any>
}

export async function sendTransactionalEmailServer(params: SendTransactionalEmailParams) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const resendApiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM || DEFAULT_FROM
  const siteUrl = process.env.SITE_URL // optional, used for one-click unsubscribe header

  if (!supabaseUrl || !serviceKey) throw new Error('Email config missing (Supabase)')
  if (!resendApiKey) throw new Error('Email config missing (RESEND_API_KEY)')

  const supabase = createClient(supabaseUrl, serviceKey)
  const template = TEMPLATES[params.templateName]
  if (!template) throw new Error(`Unknown template ${params.templateName}`)

  const recipient = (template.to || params.recipientEmail).toLowerCase()
  if (!recipient) throw new Error('Missing recipient')
  const messageId = crypto.randomUUID()
  const idempotencyKey = params.idempotencyKey || messageId

  const logRow = (status: string, error_message?: string) =>
    supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: params.templateName,
      recipient_email: recipient,
      status,
      ...(error_message ? { error_message: error_message.slice(0, 1000) } : {}),
    })

  // Suppression check — never email someone who unsubscribed/bounced.
  const { data: suppressed } = await supabase
    .from('suppressed_emails').select('id').eq('email', recipient).maybeSingle()
  if (suppressed) {
    await logRow('suppressed')
    return { success: false, reason: 'email_suppressed' as const }
  }

  // Ensure a stable unsubscribe token for this recipient.
  const { data: existing } = await supabase
    .from('email_unsubscribe_tokens').select('token, used_at').eq('email', recipient).maybeSingle()
  let unsubscribeToken: string
  if (existing && !existing.used_at) {
    unsubscribeToken = existing.token
  } else {
    unsubscribeToken = generateToken()
    await supabase.from('email_unsubscribe_tokens').upsert(
      { token: unsubscribeToken, email: recipient },
      { onConflict: 'email', ignoreDuplicates: true },
    )
    const { data: stored } = await supabase
      .from('email_unsubscribe_tokens').select('token').eq('email', recipient).maybeSingle()
    if (stored?.token) unsubscribeToken = stored.token
  }

  const data = params.templateData ?? {}
  const element = React.createElement(template.component, data)
  const html = await render(element)
  const text = await render(element, { plainText: true })
  const subject = typeof template.subject === 'function' ? template.subject(data) : template.subject

  const headers: Record<string, string> = {}
  if (siteUrl) {
    const unsubUrl = `${siteUrl.replace(/\/$/, '')}/email/unsubscribe?token=${unsubscribeToken}`
    headers['List-Unsubscribe'] = `<${unsubUrl}>`
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
  }

  await logRow('pending')

  let res: Response
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        from,
        to: recipient,
        subject,
        html,
        text,
        ...(Object.keys(headers).length ? { headers } : {}),
      }),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await logRow('failed', msg)
    throw new Error(`Resend request failed: ${msg}`)
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => `${res.status}`)
    await logRow('failed', errText)
    throw new Error(`Resend error ${res.status}: ${errText}`)
  }

  await logRow('sent')
  return { success: true as const }
}
