'use server'

import { createClient } from '@/lib/supabase/server'
import { isFillAnswerCorrect, type LearnQuestion } from '@/lib/utils/learn'

export async function completeLesson(
  lessonId: string,
  answers: Record<string, string>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { data: lesson } = await supabase
    .from('learn_lessons')
    .select('id, xp_reward, questions')
    .eq('id', lessonId)
    .single()

  if (!lesson) return { error: 'Lesson not found' }

  const questions = lesson.questions as LearnQuestion[]

  // Re-verify every answer against the stored lesson
  let allCorrect = true
  for (const q of questions) {
    const submitted = (answers[String(q.id)] ?? '').trim()
    if (!submitted) {
      allCorrect = false
      break
    }

    if (q.type === 'mcq') {
      if (submitted !== q.answer) {
        allCorrect = false
        break
      }
    } else {
      if (!isFillAnswerCorrect(submitted, q)) {
        allCorrect = false
        break
      }
    }
  }

  if (!allCorrect) return { error: 'Some answers are incorrect' }

  const { data: existing } = await supabase
    .from('learn_progress')
    .select('id')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .maybeSingle()

  if (existing) {
    return { success: true, xpEarned: 0, alreadyCompleted: true }
  }

  const { error } = await supabase.from('learn_progress').insert({
    user_id: user.id,
    lesson_id: lessonId,
    xp_earned: lesson.xp_reward,
  })

  if (error) {
    if (error.message?.includes('learn_progress_user_id_lesson_id_key')) {
      return { success: true, xpEarned: 0, alreadyCompleted: true }
    }
    return { error: 'Failed to save progress' }
  }

  const { addXp } = await import('./gamification')
  const { completeMission } = await import('./gamification')
  await addXp(lesson.xp_reward, 'learn')
  await completeMission('learn')

  return { success: true, xpEarned: lesson.xp_reward, alreadyCompleted: false }
}

export async function getLearnData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: topics } = await supabase
    .from('learn_topics')
    .select('*')
    .order('sort_order', { ascending: true })

  const { data: lessons } = await supabase
    .from('learn_lessons')
    .select('id, topic_id, slug, title, sort_order, xp_reward')
    .order('sort_order', { ascending: true })

  let completedLessonIds: string[] = []
  let totalXp = 0

  if (user) {
    const { data: progress } = await supabase
      .from('learn_progress')
      .select('lesson_id, xp_earned')
      .eq('user_id', user.id)

    completedLessonIds = (progress || []).map((p) => p.lesson_id)
    totalXp = (progress || []).reduce((sum, p) => sum + p.xp_earned, 0)
  }

  return {
    topics: topics || [],
    lessons: lessons || [],
    completedLessonIds,
    totalXp,
  }
}
