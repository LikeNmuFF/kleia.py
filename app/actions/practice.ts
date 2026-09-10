'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getServiceClient } from '@/lib/supabase/service'
import { hashFlag } from '@/lib/utils/ctf'
import { canAccessPracticeRoom, isPracticeId, practiceCaller, practiceError } from '@/lib/practice/access'
import type { PracticeChallengeInput, PracticeResult, PracticeRoom, PracticeRoomData } from '@/lib/practice/types'

const challengeFields = 'id, room_id, title, description, category, difficulty, points, hint, explanation, upload_id, learn_topic_slug, learn_lesson_slug, is_active, created_at'
const roomFields = 'id, title, description, created_at'
const refreshRoom = (id: string) => { revalidatePath('/practice'); revalidatePath(`/practice/${id}`) }
const practiceService = (): SupabaseClient => getServiceClient() as SupabaseClient

export async function getPracticeRooms(): Promise<{ rooms: PracticeRoom[]; isAdmin: boolean; error?: string }> {
  try {
    const { supabase, isAdmin } = await practiceCaller()
    const { data, error } = await supabase.from('practice_rooms').select(roomFields).order('created_at', { ascending: false })
    if (error) throw error
    return { rooms: data ?? [], isAdmin }
  } catch (error) { return { rooms: [], isAdmin: false, ...practiceError(error, 'Could not load practice rooms.') } }
}

export async function getPracticeRoom(roomId: string): Promise<PracticeRoomData | null> {
  if (!isPracticeId(roomId)) return null
  const { supabase, user, isAdmin } = await practiceCaller()
  if (!(await canAccessPracticeRoom(supabase, roomId))) return null
  const { data: room, error: roomError } = await supabase.from('practice_rooms').select(roomFields).eq('id', roomId).maybeSingle()
  if (roomError) throw new Error('Could not load practice room')
  if (!room) return null
  const [{ data: challenges, error: challengeError }, { data: members, error: memberError }] = await Promise.all([
    supabase.from('practice_challenges').select(challengeFields).eq('room_id', roomId).order('created_at', { ascending: true }),
    supabase.from('practice_room_members').select('user_id, invited_at, last_reminded_at, profiles:user_id(username)').eq('room_id', roomId),
  ])
  if (challengeError || memberError) throw new Error('Could not load practice room')
  const ids = (challenges ?? []).map(row => row.id)
  const [attempts, feedback, publications, solvedAttempts] = ids.length ? await Promise.all([
    supabase.from('practice_attempts').select('id, challenge_id, user_id, is_correct, created_at').in('challenge_id', ids).order('created_at', { ascending: false }).limit(500),
    supabase.from('practice_feedback').select('challenge_id, user_id, message, updated_at').in('challenge_id', ids).order('updated_at', { ascending: false }).limit(500),
    supabase.from('practice_publications').select('practice_challenge_id, ctf_challenge_id, published_at').in('practice_challenge_id', ids),
    supabase.from('practice_attempts').select('id, challenge_id, user_id, is_correct, created_at').in('challenge_id', ids).eq('user_id', user.id).eq('is_correct', true),
  ]) : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }, { data: [], error: null }]
  if (attempts.error || feedback.error || publications.error || solvedAttempts.error) throw new Error('Could not load practice activity')
  return {
    room, userId: user.id, isAdmin, challenges: challenges ?? [],
    members: (members ?? []).map(member => {
      const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles
      return { user_id: member.user_id, invited_at: member.invited_at, last_reminded_at: member.last_reminded_at, display_name: profile?.username ?? 'Member' }
    }),
    attempts: Array.from(new Map([...(attempts.data ?? []), ...(solvedAttempts.data ?? [])].map(attempt => [attempt.id, attempt])).values()),
    feedback: feedback.data ?? [], publications: publications.data ?? [],
  }
}

export async function createPracticeRoom(input: { title: string; description: string }): Promise<PracticeResult> {
  try {
    const { user } = await practiceCaller(true)
    if (typeof input?.title !== 'string' || !input.title.trim() || input.title.trim().length > 120 || typeof input.description !== 'string' || input.description.length > 2000) return { error: 'Enter a title (up to 120 characters) and description (up to 2000 characters).' }
    const { data, error } = await practiceService().from('practice_rooms').insert({ title: input.title.trim(), description: input.description.trim(), created_by: user.id }).select('id').single()
    if (error || !data) return { error: 'Could not create the room.' }
    revalidatePath('/practice')
    return { success: true, id: data.id }
  } catch (error) { return practiceError(error) }
}

export async function findPracticeUsers(query: string): Promise<Array<{ id: string; display_name: string }>> {
  const { supabase } = await practiceCaller(true)
  if (typeof query !== 'string' || query.trim().length < 2 || query.length > 80) return []
  const escaped = query.trim().replace(/[\\%_]/g, '\\$&')
  const { data, error } = await supabase.from('profiles').select('id, username').ilike('username', `%${escaped}%`).order('username').limit(20)
  if (error) throw new Error('Could not find users')
  return (data ?? []).map(row => ({ id: row.id, display_name: row.username ?? 'Member' }))
}

async function inviteOrRemind(roomId: string, userId: string, remind: boolean): Promise<PracticeResult> {
  try {
    const { supabase } = await practiceCaller(true)
    if (!isPracticeId(roomId) || !isPracticeId(userId)) return { error: 'Invalid room or user.' }
    const { error } = await supabase.rpc('practice_invite', { p_room_id: roomId, p_user_id: userId, p_remind: remind })
    if (error) return { error: remind ? 'Could not send reminder. Check membership and wait five minutes between reminders.' : 'Could not invite this user.' }
    refreshRoom(roomId)
    return { success: true }
  } catch (error) { return practiceError(error) }
}

export async function invitePracticeMember(roomId: string, userId: string) { return inviteOrRemind(roomId, userId, false) }
export async function remindPracticeMember(roomId: string, userId: string) { return inviteOrRemind(roomId, userId, true) }

export async function revokePracticeMember(roomId: string, userId: string): Promise<PracticeResult> {
  try {
    await practiceCaller(true)
    if (!isPracticeId(roomId) || !isPracticeId(userId)) return { error: 'Invalid room or user.' }
    const { error } = await practiceService().from('practice_room_members').delete().eq('room_id', roomId).eq('user_id', userId)
    if (error) return { error: 'Could not revoke access.' }
    refreshRoom(roomId)
    return { success: true }
  } catch (error) { return practiceError(error) }
}

export async function savePracticeChallenge(roomId: string, challengeId: string | null, input: PracticeChallengeInput): Promise<PracticeResult> {
  try {
    const { supabase, user } = await practiceCaller(true)
    if (!isPracticeId(roomId) || (challengeId !== null && !isPracticeId(challengeId))) return { error: 'Invalid room or challenge.' }
    if (!input || typeof input.title !== 'string' || !input.title.trim() || input.title.length > 160 || typeof input.description !== 'string' || !input.description.trim() || input.description.length > 20000) return { error: 'Enter a title and description within the character limits.' }
    if (!['web', 'crypto', 'forensics', 'osint', 'misc'].includes(input.category) || !['easy', 'medium', 'hard'].includes(input.difficulty) || !Number.isInteger(input.points) || input.points < 1 || input.points > 10000 || typeof input.is_active !== 'boolean') return { error: 'Check the category, difficulty, points and availability.' }
    for (const text of [input.hint, input.explanation]) if (text !== undefined && (typeof text !== 'string' || text.length > 20000)) return { error: 'Hint or explanation is too long.' }
    if ((!challengeId && !input.flag?.trim()) || (input.flag !== undefined && (typeof input.flag !== 'string' || input.flag.length > 500))) return { error: 'Enter a flag of 1 to 500 characters.' }
    if (!(await canAccessPracticeRoom(supabase, roomId))) return { error: 'Room not found.' }
    const service = practiceService()
    let existing: { id: string; upload_id: string | null; created_by: string } | null = null
    if (challengeId) {
      const result = await service.from('practice_challenges').select('id, upload_id, created_by').eq('id', challengeId).eq('room_id', roomId).maybeSingle()
      if (result.error || !result.data) return { error: 'Challenge not found.' }
      existing = result.data
    }
    if (input.upload_id !== undefined && input.upload_id !== null) {
      if (!isPracticeId(input.upload_id)) return { error: 'Invalid attachment.' }
      const { data: upload, error } = await service.from('ctf_challenge_uploads').select('id, owner_id, scope_room_id, scope_season_id, challenge_id, scan_status').eq('id', input.upload_id).maybeSingle()
      if (error || !upload || upload.scope_room_id !== roomId || upload.scope_season_id || upload.challenge_id || upload.scan_status !== 'approved' || (upload.owner_id !== user.id && input.upload_id !== existing?.upload_id)) return { error: 'Attachment does not belong to this room.' }
    }
    const topic = input.learn_topic_slug?.trim() || null
    const lesson = input.learn_lesson_slug?.trim() || null
    if (Boolean(topic) !== Boolean(lesson) || (topic && !/^[a-z0-9-]+$/.test(topic)) || (lesson && !/^[a-z0-9-]+$/.test(lesson))) return { error: 'Enter both valid topic and lesson slugs, or leave both empty.' }
    if (topic && lesson) {
      const { data: topicRow } = await supabase.from('learn_topics').select('id').eq('slug', topic).maybeSingle()
      if (!topicRow) return { error: 'Learning topic not found.' }
      const { data: lessonRow } = await supabase.from('learn_lessons').select('id').eq('topic_id', topicRow.id).eq('slug', lesson).maybeSingle()
      if (!lessonRow) return { error: 'Learning lesson not found.' }
    }
    const values: Record<string, unknown> = {
      title: input.title.trim(), description: input.description.trim(), category: input.category, difficulty: input.difficulty,
      points: input.points, hint: input.hint?.trim() || null, explanation: input.explanation?.trim() || null,
      learn_topic_slug: topic, learn_lesson_slug: lesson, is_active: input.is_active,
    }
    if (input.flag?.trim()) values.flag_hash = hashFlag(input.flag)
    if (input.upload_id !== undefined) values.upload_id = input.upload_id
    const result = challengeId
      ? await service.from('practice_challenges').update(values).eq('id', challengeId).eq('room_id', roomId).select('id').single()
      : await service.from('practice_challenges').insert({ ...values, room_id: roomId, created_by: user.id }).select('id').single()
    if (result.error || !result.data) return { error: 'Could not save challenge. Check that its file is not attached to another challenge.' }
    refreshRoom(roomId)
    return { success: true, id: result.data.id }
  } catch (error) { return practiceError(error) }
}

export async function submitPracticeFlag(challengeId: string, flag: string): Promise<PracticeResult> {
  try {
    if (!isPracticeId(challengeId) || typeof flag !== 'string' || !flag.trim() || flag.length > 500) return { error: 'Enter a flag of 1 to 500 characters.' }
    const { supabase } = await practiceCaller()
    const { data, error } = await supabase.rpc('practice_submit', { p_challenge_id: challengeId, p_flag: flag })
    if (error || !data || typeof data.correct !== 'boolean') return { error: 'Submission unavailable. Check your room access, challenge availability, or wait before retrying.' }
    revalidatePath('/practice', 'layout')
    return { success: true, correct: data.correct, alreadySolved: data.alreadySolved === true }
  } catch (error) { return practiceError(error) }
}

export async function savePracticeFeedback(challengeId: string, message: string): Promise<PracticeResult> {
  try {
    if (!isPracticeId(challengeId) || typeof message !== 'string' || !message.trim() || message.length > 2000) return { error: 'Enter feedback of 1 to 2000 characters.' }
    const { supabase, user } = await practiceCaller()
    const { data: challenge, error: challengeError } = await supabase.from('practice_challenges').select('id, room_id').eq('id', challengeId).maybeSingle()
    if (challengeError || !challenge || !(await canAccessPracticeRoom(supabase, challenge.room_id))) return { error: 'Challenge unavailable.' }
    const { error } = await supabase.from('practice_feedback').upsert({ challenge_id: challengeId, user_id: user.id, message: message.trim(), updated_at: new Date().toISOString() }, { onConflict: 'challenge_id,user_id' })
    if (error) return { error: 'Could not save feedback.' }
    refreshRoom(challenge.room_id)
    return { success: true }
  } catch (error) { return practiceError(error) }
}

export async function publishPracticeChallenge(challengeId: string): Promise<PracticeResult> {
  try {
    if (!isPracticeId(challengeId)) return { error: 'Invalid challenge.' }
    const { supabase } = await practiceCaller(true)
    const { data, error } = await supabase.rpc('practice_publish', { p_challenge_id: challengeId })
    if (error || !isPracticeId(data)) return { error: 'Could not publish challenge. Verify its attachment and availability.' }
    revalidatePath('/practice', 'layout'); revalidatePath('/ctf'); revalidatePath('/admin/ctf')
    return { success: true, id: data }
  } catch (error) { return practiceError(error) }
}
