'use server'

import nodemailer from 'nodemailer'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'

interface SendResult {
  email: string
  ok: boolean
  error?: string
}

function getTransporter() {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !port || !user || !pass) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.')
  }
  return nodemailer.createTransport({
    host,
    port: Number(port),
    secure: true, // smtp.titan.email:465 uses SSL/TLS
    auth: { user, pass },
  })
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// CAP: Vercel Hobby functions time out at 300s; each SMTP send takes ~1-3s, so
// a full 500-recipient batch could exceed the limit. ~40 invitees is well within.
const MAX_RECIPIENTS = 500

export async function sendInviteEmails(
  recipients: string[],
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string; sent: number; failed: number; results: SendResult[] }> {
  const supabase = await createClient()
  await requireAdmin(supabase)

  const cleanedSubject = subject.trim()
  const cleanedBody = body.trim()
  if (!cleanedSubject || !cleanedBody) {
    return { success: false, error: 'Subject and body are required.', sent: 0, failed: 0, results: [] }
  }

  const uniqueEmails = [...new Set(recipients.map(r => r.trim().toLowerCase()).filter(Boolean))]
  if (uniqueEmails.length === 0) {
    return { success: false, error: 'No valid recipient addresses provided.', sent: 0, failed: 0, results: [] }
  }
  if (uniqueEmails.length > MAX_RECIPIENTS) {
    return { success: false, error: `Too many recipients (max ${MAX_RECIPIENTS}).`, sent: 0, failed: 0, results: [] }
  }

  const invalid = uniqueEmails.filter(e => !EMAIL_RE.test(e))
  if (invalid.length > 0) {
    return { success: false, error: `Invalid email address(es): ${invalid.join(', ')}`, sent: 0, failed: 0, results: [] }
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@localhost'
  const fromName = process.env.SMTP_FROM_NAME || 'Kleia'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kleia.site'
  const htmlBody = cleanedBody
    .split('\n')
    .map(line => line.trim() ? `<p>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>` : '')
    .join('\n')

  let transporter: ReturnType<typeof getTransporter>
  try {
    transporter = getTransporter()
  } catch (err) {
    return { success: false, error: (err as Error).message, sent: 0, failed: 0, results: [] }
  }

  const results: SendResult[] = []
  let sent = 0
  let failed = 0

  for (const email of uniqueEmails) {
    try {
      await transporter.sendMail({
        from: `"${fromName}" <${from}>`,
        to: email,
        subject: cleanedSubject,
        text: `${cleanedBody}\n\nJoin here: ${siteUrl}/signup`,
        html: `<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #111;">${cleanedSubject.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h2>
  ${htmlBody}
  <p style="margin-top: 24px;">
    <a href="${siteUrl}/signup" style="display: inline-block; padding: 12px 24px; background-color: #22c55e; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">
      Join Now
    </a>
  </p>
  <p style="color: #888; font-size: 12px; margin-top: 24px;">You are receiving this because you're invited to join Kleia.</p>
</div>`,
      })
      sent++
      results.push({ email, ok: true })
    } catch (err) {
      failed++
      results.push({ email, ok: false, error: (err as Error).message })
    }
  }

  return { success: failed === 0, error: failed > 0 ? `${failed} email(s) failed to send.` : undefined, sent, failed, results }
}