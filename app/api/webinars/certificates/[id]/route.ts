import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function escapePdfText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function makePdf(lines: string[]) {
  const content = [
    'BT',
    '/F1 26 Tf',
    '72 720 Td',
    `(${escapePdfText('Kleia Certificate')}) Tj`,
    '/F1 14 Tf',
    '0 -50 Td',
    ...lines.flatMap((line) => [`(${escapePdfText(line)}) Tj`, '0 -26 Td']),
    'ET',
  ].join('\n')

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
    `5 0 obj\n<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream\nendobj`,
  ]

  const offsets: number[] = [0]
  let body = '%PDF-1.4\n'
  for (const object of objects) {
    offsets.push(Buffer.byteLength(body))
    body += `${object}\n`
  }

  const xrefOffset = Buffer.byteLength(body)
  body += `xref\n0 ${objects.length + 1}\n`
  body += '0000000000 65535 f \n'
  for (const offset of offsets.slice(1)) {
    body += `${String(offset).padStart(10, '0')} 00000 n \n`
  }
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

  return Buffer.from(body, 'utf8')
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: certificate } = await supabase
    .from('webinar_certificates')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!certificate) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
  }

  const [{ data: webinar }, { data: recipient }, { data: issuer }] = await Promise.all([
    supabase.from('webinars').select('title, certificate_title, provider_name, provider_type, verification_mode').eq('id', certificate.webinar_id).maybeSingle(),
    supabase.from('profiles').select('username, full_name').eq('id', certificate.user_id).maybeSingle(),
    supabase.from('profiles').select('username, full_name').eq('id', certificate.issued_by).maybeSingle(),
  ])

  const recipientName = recipient?.full_name || recipient?.username || 'Kleia learner'
  const issuerName = issuer?.full_name || issuer?.username || 'Kleia Faculty'
  const title = webinar?.certificate_title || webinar?.title || 'Webinar completion'
  const provider = webinar?.provider_name || (webinar?.provider_type === 'dict' ? 'DICT / external provider' : 'Kleia')
  const mode = webinar?.verification_mode === 'external_certificate'
    ? 'External certificate verified by Kleia staff'
    : 'Attendance verified by Kleia staff'

  const pdf = makePdf([
    `This certifies that ${recipientName}`,
    `completed: ${title}`,
    mode,
    `Provider: ${provider}`,
    `Certificate code: ${certificate.certificate_code}`,
    `Issued: ${new Date(certificate.issued_at).toLocaleDateString('en-US')}`,
    `Issued by: ${issuerName}`,
  ])

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${certificate.certificate_code}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
