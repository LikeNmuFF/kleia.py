import { createHash, randomUUID } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'

import { createClient } from '@supabase/supabase-js'
import { v2 as cloudinary } from 'cloudinary'

const LAB_TITLE = 'Cl4ud3x_'
const here = resolve(fileURLToPath(new URL('.', import.meta.url)))

function loadManifest(output) {
  const manifest = JSON.parse(readFileSync(join(output, 'manifest.json'), 'utf8'))
  if (!Array.isArray(manifest) || manifest.length !== 20) throw new Error('Expected exactly 20 HackForGov definitions')
  if (new Set(manifest.map(item => item.title)).size !== 20) throw new Error('Challenge titles must be unique')
  return manifest
}

function requireEnvironment(names) {
  for (const name of names) if (!process.env[name]) throw new Error(`Missing environment variable: ${name}`)
}

function uploadArchive(archive, ownerId) {
  const publicId = `kleia-ctf-files/${ownerId}/${randomUUID()}`
  return new Promise((resolvePromise, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      public_id: publicId,
      resource_type: 'raw',
      type: 'authenticated',
      context: { owner_id: ownerId, original_name: archive.item.filename, stored_name: archive.item.filename, sha256: archive.sha256 },
    }, (error, response) => {
      if (error || !response) reject(error ?? new Error('Challenge archive upload failed'))
      else resolvePromise({ assetId: response.asset_id, publicId: response.public_id })
    })
    Readable.from(archive.buffer).pipe(stream)
  })
}

async function main(args) {
  const apply = args.includes('--apply')
  const output = args.find(arg => arg.startsWith('--output='))?.slice('--output='.length) ?? join(here, '.artifacts')
  const manifest = loadManifest(output)
  for (const item of manifest) {
    const path = join(output, 'archives', item.filename)
    if (!existsSync(path)) throw new Error(`Missing archive ${item.filename}`)
  }
  if (!apply) {
    console.log(`Dry run validated ${manifest.length}/20 private HackForGov challenges; no external writes performed.`)
    return
  }

  requireEnvironment(['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'])
  const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  cloudinary.config({ cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true })

  const roomResult = await service.from('practice_rooms').select('id,title,created_by').eq('title', LAB_TITLE)
  if (roomResult.error) throw roomResult.error
  if (roomResult.data?.length !== 1) throw new Error(`Expected exactly one private lab named ${LAB_TITLE}`)
  const room = roomResult.data[0]
  const adminResult = await service.from('profiles').select('role').eq('id', room.created_by).maybeSingle()
  if (adminResult.error || adminResult.data?.role !== 'admin') throw new Error('Private lab creator is not an admin')

  const titles = manifest.map(item => item.title)
  const existing = await service.from('practice_challenges').select('id,title').eq('room_id', room.id).in('title', titles)
  if (existing.error) throw existing.error
  if (existing.data?.length) {
    if (existing.data.length === 20) { console.log(`Verified 20 existing challenges in ${LAB_TITLE}; no writes performed.`); return }
    throw new Error('A partial HackForGov challenge set already exists; refusing to create duplicates')
  }

  const uploaded = []
  const uploadRows = []
  const challengeRows = []
  try {
    for (const item of manifest) {
      const buffer = readFileSync(join(output, 'archives', item.filename))
      const sha256 = createHash('sha256').update(buffer).digest('hex')
      const result = await uploadArchive({ item, buffer, sha256 }, room.created_by)
      uploaded.push(result)
      uploadRows.push({
        id: randomUUID(), owner_id: room.created_by, challenge_id: null, scope_season_id: null, scope_room_id: room.id,
        cloudinary_asset_id: result.assetId, cloudinary_public_id: result.publicId, original_name: item.filename, stored_name: item.filename,
        extension: 'zip', size_bytes: buffer.length, sha256, scan_status: 'approved', scan_provider: 'local_static_validation',
        scan_result: { scanning: 'local_static_validation', executable: false, traversal: false, source: 'hack4gov-private-pack' }, scanned_at: new Date().toISOString(),
      })
    }
    const uploadInsert = await service.from('ctf_challenge_uploads').insert(uploadRows)
    if (uploadInsert.error) throw uploadInsert.error
    for (const [index, item] of manifest.entries()) {
      challengeRows.push({
        id: randomUUID(), room_id: room.id, title: item.title, description: item.description, category: item.category,
        difficulty: item.difficulty, points: item.points, hint: item.hint, explanation: item.explanation,
        flag_hash: createHash('sha256').update(item.flag.trim().toUpperCase()).digest('hex'), upload_id: uploadRows[index].id,
        learn_topic_slug: null, learn_lesson_slug: null, is_active: true, created_by: room.created_by,
      })
    }
    const challengeInsert = await service.from('practice_challenges').insert(challengeRows)
    if (challengeInsert.error) throw challengeInsert.error
    const verify = await service.from('practice_challenges').select('id,title,room_id,upload_id,is_active').eq('room_id', room.id).in('title', titles)
    if (verify.error || verify.data?.length !== 20 || verify.data.some(row => row.room_id !== room.id || !row.upload_id || !row.is_active)) throw new Error('Post-seed private challenge verification failed')
    console.log(`Seeded and verified 20 HackForGov challenges in ${LAB_TITLE}.`)
  } catch (error) {
    if (challengeRows.length) await service.from('practice_challenges').delete().in('id', challengeRows.map(row => row.id))
    if (uploadRows.length) await service.from('ctf_challenge_uploads').delete().in('id', uploadRows.map(row => row.id))
    for (const result of uploaded.reverse()) await cloudinary.uploader.destroy(result.publicId, { resource_type: 'raw', type: 'authenticated', invalidate: true }).catch(() => undefined)
    throw error
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => {
    const message = error instanceof Error ? error.message : error?.message || error?.error?.message || 'Private HackForGov seed failed'
    console.error(message)
    process.exitCode = 1
  })
}
