import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { getGroqModel, runGroqChat } from '@/lib/ai/groq'
import { getYouTubeTranscript } from '@/lib/ai/youtube-transcript'
import { getFeedVideoAssistantTarget } from '@/lib/ai/video-feed'
import { createTranscriptFromCaptionSegments, type VideoTranscript } from '@/lib/ai/transcript-source'
import {
  buildQuestionPrompt,
  buildSummaryPrompt,
  getAiLimitStatus,
  type AiChatMessage,
} from '@/lib/ai/video-assistant'
import type { LinkPreviewData } from '@/lib/feed/types'
import type { YouTubeData } from '@/lib/youtube/types'

export const dynamic = 'force-dynamic'

const DAY_MS = 24 * 60 * 60 * 1000

type Action = 'summary' | 'question'
type AiDatabase = Omit<ReturnType<typeof getServiceClient>, 'from'> & { from(table: string): any }

interface PostForAi {
  id: string
  content: string
  link_preview: LinkPreviewData | null
  youtube_data: YouTubeData | null
}

interface VideoAiMessage {
  role: 'user' | 'assistant'
  content: string
}

interface CachedSummary {
  summary: string
  model: string
  created_at: string
}

export async function POST(request: NextRequest) {
  const authSupabase = await createClient()
  const { data: { user } } = await authSupabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'You must be logged in' }, { status: 401 })
  }

  let body: { action?: Action; postId?: string; question?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (body.action !== 'summary' && body.action !== 'question') {
    return NextResponse.json({ error: 'Unsupported AI action' }, { status: 400 })
  }

  if (!body.postId) {
    return NextResponse.json({ error: 'Post is required' }, { status: 400 })
  }

  const supabase = getServiceClient() as AiDatabase
  const { data: rawPost, error: postError } = await supabase
    .from('posts')
    .select('id, content, link_preview, youtube_data')
    .eq('id', body.postId)
    .maybeSingle()

  if (postError) {
    return NextResponse.json({ error: postError.message }, { status: 500 })
  }

  if (!rawPost) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  const typedPost = rawPost as unknown as PostForAi
  const videoTarget = getFeedVideoAssistantTarget(typedPost) ?? getContentVideoAssistantTarget(typedPost.content)
  if (!videoTarget) {
    return NextResponse.json({ error: 'This post does not contain a supported YouTube video' }, { status: 400 })
  }

  const counters = await getCounters(supabase, user.id, typedPost.id)
  const limitStatus = getAiLimitStatus(counters)

  if (body.action === 'summary') {
    return generateOrReadSummary({
      supabase,
      userId: user.id,
      post: typedPost,
      videoId: videoTarget.videoId,
      videoUrl: videoTarget.videoUrl,
      title: videoTarget.title,
      limitStatus,
    })
  }

  if (!body.question?.trim()) {
    return NextResponse.json({ error: 'Question is required' }, { status: 400 })
  }

  if (!limitStatus.canAskQuestion) {
    return NextResponse.json({
      error: 'You reached the AI question limit for today.',
      limits: limitStatus,
    }, { status: 429 })
  }

  return answerQuestion({
    supabase,
    userId: user.id,
    post: typedPost,
    videoId: videoTarget.videoId,
    title: videoTarget.title,
    question: body.question,
    limitStatus,
  })
}

async function generateOrReadSummary({
  supabase,
  userId,
  post,
  videoId,
  videoUrl,
  title,
  limitStatus,
}: {
  supabase: AiDatabase
  userId: string
  post: PostForAi
  videoId: string
  videoUrl: string
  title: string
  limitStatus: ReturnType<typeof getAiLimitStatus>
}) {
  const { data: rawCached } = await supabase
    .from('video_ai_summaries')
    .select('summary, model, created_at')
    .eq('post_id', post.id)
    .maybeSingle()
  const cached = rawCached as unknown as CachedSummary | null

  if (cached) {
    return NextResponse.json({ summary: cached.summary, cached: true, limits: limitStatus })
  }

  if (!limitStatus.canGenerateSummary) {
    return NextResponse.json({
      error: 'This video summary was already generated today.',
      limits: limitStatus,
    }, { status: 429 })
  }

  let transcript: Awaited<ReturnType<typeof getYouTubeTranscript>>
  let summary: string
  try {
    transcript = await getTranscriptForPost(post, videoId)
    summary = await runGroqChat(buildSummaryPrompt({
      title,
      transcript: transcript.text,
    }))
  } catch (error) {
    return NextResponse.json({ error: getAiErrorMessage(error) }, { status: 502 })
  }

  const model = getGroqModel()
  const { error: insertError } = await supabase.from('video_ai_summaries').insert({
    post_id: post.id,
    video_id: videoId,
    video_url: videoUrl,
    title,
    transcript_hash: transcript.hash,
    summary,
    model,
    created_by: userId,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  await supabase.from('ai_rate_limit_events').insert({
    user_id: userId,
    post_id: post.id,
    action: 'video_summary',
  })

  return NextResponse.json({ summary, cached: false, limits: limitStatus })
}

async function answerQuestion({
  supabase,
  userId,
  post,
  videoId,
  title,
  question,
  limitStatus,
}: {
  supabase: AiDatabase
  userId: string
  post: PostForAi
  videoId: string
  title: string
  question: string
  limitStatus: ReturnType<typeof getAiLimitStatus>
}) {
  let transcript: VideoTranscript
  let answer: string
  try {
    transcript = await getTranscriptForPost(post, videoId)
  } catch (error) {
    return NextResponse.json({ error: getAiErrorMessage(error) }, { status: 502 })
  }

  const { data: rawPreviousMessages } = await supabase
    .from('video_ai_messages')
    .select('role, content')
    .eq('user_id', userId)
    .eq('post_id', post.id)
    .order('created_at', { ascending: false })
    .limit(4)

  const history = ((rawPreviousMessages ?? []) as unknown as VideoAiMessage[]).reverse() as AiChatMessage[]
  try {
    answer = await runGroqChat(buildQuestionPrompt({
      title,
      transcript: transcript.text,
      question,
      history,
    }))
  } catch (error) {
    return NextResponse.json({ error: getAiErrorMessage(error) }, { status: 502 })
  }

  const model = getGroqModel()
  const { error: messageError } = await supabase.from('video_ai_messages').insert([
    { post_id: post.id, user_id: userId, role: 'user', content: question.trim() },
    { post_id: post.id, user_id: userId, role: 'assistant', content: answer, model },
  ])

  if (messageError) {
    return NextResponse.json({ error: messageError.message }, { status: 500 })
  }

  await supabase.from('ai_rate_limit_events').insert({
    user_id: userId,
    post_id: post.id,
    action: 'video_question',
  })

  return NextResponse.json({ answer, limits: limitStatus })
}

async function getCounters(
  supabase: AiDatabase,
  userId: string,
  postId: string,
) {
  const since = new Date(Date.now() - DAY_MS).toISOString()
  const [{ count: dailyQuestions }, { count: videoQuestions }, { count: summaryGenerations }] = await Promise.all([
    supabase
      .from('ai_rate_limit_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', 'video_question')
      .gte('created_at', since),
    supabase
      .from('ai_rate_limit_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('post_id', postId)
      .eq('action', 'video_question')
      .gte('created_at', since),
    supabase
      .from('ai_rate_limit_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('post_id', postId)
      .eq('action', 'video_summary')
      .gte('created_at', since),
  ])

  return {
    dailyQuestions: dailyQuestions ?? 0,
    videoQuestions: videoQuestions ?? 0,
    summaryGenerations: summaryGenerations ?? 0,
  }
}

async function getTranscriptForPost(post: PostForAi, videoId: string): Promise<VideoTranscript> {
  const matchingVideo = post.youtube_data?.videos.find((video) => video.video_id === videoId)
  const storedTranscript = createTranscriptFromCaptionSegments(matchingVideo?.captions)

  if (storedTranscript) {
    return storedTranscript
  }

  return getYouTubeTranscript(videoId)
}

function findHttpsUrl(text: string): string | null {
  return text.match(/https:\/\/[^\s]+/)?.[0]?.replace(/[),.;!?]+$/, '') ?? null
}

function getContentVideoAssistantTarget(content: string) {
  const videoUrl = findHttpsUrl(content)
  const videoId = videoUrl ? getFeedVideoAssistantTarget({
    youtube_data: null,
    link_preview: {
      url: videoUrl,
      title: null,
      description: null,
      image: null,
      siteName: null,
    },
  }) : null

  return videoId
}

function getAiErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.includes('API key')) {
    return 'AI is not configured yet.'
  }

  if (error instanceof Error && error.message.toLowerCase().includes('transcript')) {
    return 'No transcript is available for this video yet.'
  }

  return 'AI is busy right now. Please try again later.'
}
