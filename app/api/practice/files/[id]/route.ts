import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { getChallengeFileDownloadUrl } from '@/lib/ctf/uploads/cloudinary'
import { isPracticeId } from '@/lib/practice/access'
import { resolvePracticeFile } from '@/lib/practice/files'

export const runtime = 'nodejs'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unavailable = () => NextResponse.json({ error: 'File not found' }, { status: 404, headers: { 'Cache-Control': 'private, no-store' } })
  try {
    const { id } = await params
    if (!isPracticeId(id)) return unavailable()
    const client = await createClient()
    const upload = await resolvePracticeFile(client, getServiceClient(), id)
    if (!upload) return unavailable()
    const url = await getChallengeFileDownloadUrl(upload.cloudinary_public_id, upload.extension)
    const upstream = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(30000) })
    if (!upstream.ok) return unavailable()
    return new NextResponse(upstream.body, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${upload.stored_name.replace(/[^a-zA-Z0-9._-]/g, '_')}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch { return unavailable() }
}
