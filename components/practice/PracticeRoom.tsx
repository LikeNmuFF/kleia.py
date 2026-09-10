'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  ArrowLeft, BookOpen, CheckCircle2, Download, Edit3, FlaskConical, Lightbulb,
  LockKeyhole, MessageSquare, Plus, Rocket, Send, ShieldCheck, Users, XCircle,
} from 'lucide-react'
import {
  findPracticeUsers, invitePracticeMember, publishPracticeChallenge, remindPracticeMember,
  revokePracticeMember, savePracticeFeedback, submitPracticeFlag,
} from '@/app/actions/practice'
import ChallengeEditor from './ChallengeEditor'
import type { PracticeChallenge, PracticeRoomData } from '@/lib/practice/types'

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border px-4 py-3" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)' }}>
      <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  )
}

function ActionForm({ challengeId, kind, initial }: { challengeId: string; kind: 'flag' | 'feedback'; initial?: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const isFlag = kind === 'flag'

  return (
    <form className="rounded-xl border p-4" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)' }} action={(data) => {
      setMessage('')
      startTransition(async () => {
        try {
          const value = String(data.get(kind) || '')
          const result = isFlag ? await submitPracticeFlag(challengeId, value) : await savePracticeFeedback(challengeId, value)
          if ('error' in result) setMessage(result.error)
          else if (isFlag) {
            setMessage(result.correct ? (result.alreadySolved ? 'Already solved.' : 'Correct flag.') : 'That flag is not correct yet.')
            router.refresh()
          } else {
            setMessage('Feedback saved.')
            router.refresh()
          }
        } catch {
          setMessage(isFlag ? 'Unable to submit the flag. Please try again.' : 'Unable to save feedback. Please try again.')
        }
      })
    }}>
      <div className="mb-2 flex items-center gap-2">
        {isFlag ? <ShieldCheck className="h-4 w-4" style={{ color: 'var(--accent)' }} aria-hidden /> : <MessageSquare className="h-4 w-4" style={{ color: 'var(--accent)' }} aria-hidden />}
        <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{isFlag ? 'Submit your flag' : 'Tester feedback'}</h4>
      </div>
      {isFlag ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input aria-label="Challenge flag" required maxLength={500} name="flag" autoComplete="off" className="input-field min-h-10 flex-1 font-mono" placeholder="flag{...}" />
          <button disabled={pending} className="btn-primary inline-flex min-h-10 items-center justify-center gap-2 px-4 disabled:opacity-50"><Send className="h-4 w-4" aria-hidden />{pending ? 'Checking…' : 'Submit flag'}</button>
        </div>
      ) : (
        <div>
          <textarea aria-label="Challenge feedback" required maxLength={2000} name="feedback" defaultValue={initial} rows={3} className="input-field w-full resize-y" placeholder="What worked, what was unclear, or what should change?" />
          <button disabled={pending} className="mt-2 min-h-9 rounded-lg border px-3 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>{pending ? 'Saving…' : 'Send feedback'}</button>
        </div>
      )}
      {message && <p role="status" className="mt-2 text-sm" style={{ color: message.includes('Correct') || message.includes('saved') || message.includes('solved') ? '#22c55e' : 'var(--text-secondary)' }}>{message}</p>}
    </form>
  )
}

function ChallengeCard({ challenge, data, onEdit }: { challenge: PracticeChallenge; data: PracticeRoomData; onEdit: () => void }) {
  const [publishPending, startPublish] = useTransition()
  const [publishMessage, setPublishMessage] = useState('')
  const publication = data.publications.find((item) => item.practice_challenge_id === challenge.id)
  const [publishedId, setPublishedId] = useState(publication?.ctf_challenge_id)
  const solved = data.attempts.some((attempt) => attempt.challenge_id === challenge.id && attempt.user_id === data.userId && attempt.is_correct)
  const ownFeedback = data.feedback.find((item) => item.challenge_id === challenge.id && item.user_id === data.userId)?.message ?? ''
  const attempts = data.attempts.filter((attempt) => attempt.challenge_id === challenge.id)
  const feedback = data.feedback.filter((item) => item.challenge_id === challenge.id)
  const difficultyColor = challenge.difficulty === 'easy' ? '#22c55e' : challenge.difficulty === 'hard' ? '#ef4444' : '#f59e0b'

  return (
    <article className="overflow-hidden rounded-2xl border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider">
              <span className="rounded-full border px-2.5 py-1" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>{challenge.category}</span>
              <span className="rounded-full px-2.5 py-1" style={{ backgroundColor: `color-mix(in srgb, ${difficultyColor} 13%, transparent)`, color: difficultyColor }}>{challenge.difficulty}</span>
              <span className="rounded-full border px-2.5 py-1" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>{challenge.points} pts</span>
              {solved && <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-green-500"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden />Solved</span>}
              {!challenge.is_active && <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-red-500"><XCircle className="h-3.5 w-3.5" aria-hidden />Inactive</span>}
            </div>
            <h3 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>{challenge.title}</h3>
          </div>
          {data.isAdmin && <button onClick={onEdit} className="inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}><Edit3 className="h-4 w-4" aria-hidden />Edit</button>}
        </div>

        <p className="mt-4 whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{challenge.description}</p>

        {(challenge.learn_topic_slug || challenge.upload_id) && (
          <div className="mt-5 flex flex-wrap gap-2">
            {challenge.learn_topic_slug && challenge.learn_lesson_slug && <Link className="inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} href={`/learn/${challenge.learn_topic_slug}/${challenge.learn_lesson_slug}`}><BookOpen className="h-4 w-4" aria-hidden />Open linked lesson</Link>}
            {challenge.upload_id && <a className="inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} href={`/api/practice/files/${challenge.upload_id}`}><Download className="h-4 w-4" aria-hidden />Download attachment</a>}
          </div>
        )}

        <div className="mt-5 space-y-2">
          {challenge.hint && <details className="rounded-xl border px-4 py-3" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)' }}><summary className="cursor-pointer text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Hint</summary><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{challenge.hint}</p></details>}
          {challenge.explanation && <details className="rounded-xl border px-4 py-3" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)' }}><summary className="cursor-pointer text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Explanation</summary><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{challenge.explanation}</p></details>}
        </div>

        {challenge.is_active && <div className="mt-5 grid gap-3 xl:grid-cols-2"><ActionForm challengeId={challenge.id} kind="flag" /><ActionForm challengeId={challenge.id} kind="feedback" initial={ownFeedback} /></div>}
      </div>

      {data.isAdmin && (
        <div className="border-t p-5 sm:p-6" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--input-bg)' }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Release and review</h4>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>{attempts.length} attempts · {feedback.length} feedback entries</p>
            </div>
            {publishedId ? (
              <Link href={`/ctf/${publishedId}`} className="inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold" style={{ borderColor: 'var(--border-color)', color: 'var(--accent)' }}>View global copy</Link>
            ) : (
              <button disabled={publishPending} onClick={() => startPublish(async () => {
                try {
                  const result = await publishPracticeChallenge(challenge.id)
                  if ('error' in result) setPublishMessage(result.error)
                  else {
                    setPublishedId(result.id)
                    setPublishMessage('Published as a global snapshot. Later lab edits remain private.')
                  }
                } catch {
                  setPublishMessage('Unable to publish the challenge. Please try again.')
                }
              })} className="btn-primary inline-flex min-h-9 items-center gap-2 px-3 disabled:opacity-50"><Rocket className="h-4 w-4" aria-hidden />{publishPending ? 'Publishing…' : 'Publish global snapshot'}</button>
            )}
          </div>
          {publishMessage && <p role="status" className="mt-2 text-sm" style={{ color: publishMessage.startsWith('Published') ? '#22c55e' : '#ef4444' }}>{publishMessage}</p>}
          {(attempts.length > 0 || feedback.length > 0) && (
            <details className="mt-4 rounded-xl border bg-[var(--card-bg)] px-4 py-3" style={{ borderColor: 'var(--border-color)' }}>
              <summary className="cursor-pointer text-sm font-semibold">Review tester activity</summary>
              {attempts.length > 0 && <ul aria-label="Recent attempts" className="mt-3 space-y-2">{attempts.map((attempt) => <li key={attempt.id} className="flex flex-wrap justify-between gap-2 rounded-lg p-3 text-sm" style={{ backgroundColor: 'var(--input-bg)' }}><span><span className="font-medium">{data.members.find((member) => member.user_id === attempt.user_id)?.display_name ?? 'Tester'}</span> · <span className={attempt.is_correct ? 'text-green-500' : 'text-red-500'}>{attempt.is_correct ? 'Correct' : 'Incorrect'}</span></span><time className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(attempt.created_at).toLocaleString()}</time></li>)}</ul>}
              {feedback.length > 0 && <ul aria-label="Recent feedback" className="mt-3 space-y-2">{feedback.map((item) => <li key={`${item.challenge_id}-${item.user_id}`} className="rounded-lg p-3 text-sm" style={{ backgroundColor: 'var(--input-bg)' }}><span className="font-medium">{data.members.find((member) => member.user_id === item.user_id)?.display_name ?? 'Tester'}:</span> {item.message}<time className="mt-1 block text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(item.updated_at).toLocaleString()}</time></li>)}</ul>}
            </details>
          )}
        </div>
      )}
    </article>
  )
}

function TesterAccess({ data }: { data: PracticeRoomData }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<Array<{ id: string; display_name: string }>>([])
  const [message, setMessage] = useState('')
  const [pending, startTransition] = useTransition()

  const mutate = (fn: () => Promise<{ success: true } | { error: string }>, success: string) => startTransition(async () => {
    try {
      const result = await fn()
      setMessage('error' in result ? result.error : success)
      if (!('error' in result)) router.refresh()
    } catch {
      setMessage('Unable to complete that action. Please try again.')
    }
  })

  return (
    <aside className="rounded-2xl border p-5 lg:sticky lg:top-24" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
      <div className="flex items-center gap-2"><Users className="h-5 w-5" style={{ color: 'var(--accent)' }} aria-hidden /><h2 className="font-semibold">Tester access</h2></div>
      <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>Only invited accounts can discover and enter this room.</p>
      <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Invite member</h3>
      <div className="mt-2 flex gap-2">
        <input aria-label="Search registered users" value={query} onChange={(event) => setQuery(event.target.value)} className="input-field min-w-0 flex-1" placeholder="Search users" />
        <button disabled={pending || query.trim().length < 2} className="btn-primary px-3 disabled:opacity-50" onClick={() => startTransition(async () => {
          try {
            const found = await findPracticeUsers(query)
            setUsers(found)
            setMessage(found.length ? '' : 'No registered users found.')
          } catch {
            setUsers([])
            setMessage('Unable to search users. Please try again.')
          }
        })}>Search</button>
      </div>
      {message && <p className="mt-2 text-sm" role="status" style={{ color: message.includes('invited') || message.includes('sent') ? '#22c55e' : 'var(--text-secondary)' }}>{message}</p>}
      {users.length > 0 && <ul className="mt-3 space-y-2">{users.map((user) => <li key={user.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5" style={{ borderColor: 'var(--border-color)' }}><span className="truncate text-sm font-medium">{user.display_name}</span><button disabled={pending} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold" style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }} onClick={() => mutate(() => invitePracticeMember(data.room.id, user.id), 'Member invited.')}>Invite</button></li>)}</ul>}

      <div className="mt-6 flex items-center justify-between border-t pt-5" style={{ borderColor: 'var(--border-color)' }}>
        <h3 className="text-sm font-semibold">Invited testers</h3>
        <span className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-muted)' }}>{data.members.length}</span>
      </div>
      {data.members.length === 0 ? <p className="mt-3 rounded-lg p-3 text-sm" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-muted)' }}>No testers invited yet.</p> : <ul className="mt-2 divide-y" style={{ borderColor: 'var(--border-color)' }}>{data.members.map((member) => <li key={member.user_id} className="py-3"><p className="truncate text-sm font-medium">{member.display_name}</p><p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>Invited {new Date(member.invited_at).toLocaleDateString()}{member.last_reminded_at ? ` · reminded ${new Date(member.last_reminded_at).toLocaleDateString()}` : ''}</p><div className="mt-2 flex gap-2"><button disabled={pending} onClick={() => mutate(() => remindPracticeMember(data.room.id, member.user_id), 'Reminder sent.')} className="min-h-8 rounded-lg border px-2.5 text-xs font-semibold" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>Remind</button><button disabled={pending} onClick={() => mutate(() => revokePracticeMember(data.room.id, member.user_id), 'Access revoked.')} className="min-h-8 rounded-lg px-2.5 text-xs font-semibold text-red-500" style={{ backgroundColor: 'var(--input-bg)' }}>Revoke</button></div></li>)}</ul>}
    </aside>
  )
}

export default function PracticeRoom({ data }: { data: PracticeRoomData }) {
  const router = useRouter()
  const [editing, setEditing] = useState<PracticeChallenge | null | 'new'>(null)
  const activeChallenges = data.challenges.filter((challenge) => challenge.is_active)
  const solvedCount = activeChallenges.filter((challenge) => data.attempts.some((attempt) => attempt.challenge_id === challenge.id && attempt.user_id === data.userId && attempt.is_correct)).length
  const feedbackCount = data.feedback.length

  return (
    <div className="space-y-6">
      <Link href={data.isAdmin ? '/admin' : '/practice'} className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-muted)' }}><ArrowLeft className="h-4 w-4" aria-hidden />{data.isAdmin ? 'Back to admin workspace' : 'All Labs'}</Link>

      <section className="rounded-2xl border p-5 sm:p-7" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}><LockKeyhole className="h-4 w-4" aria-hidden />{data.isAdmin ? 'Lab control' : 'Private lab'}</div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: 'var(--text-primary)' }}>{data.room.title}</h1>
            <p className="mt-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{data.room.description}</p>
            <p className="mt-4 inline-flex items-start gap-2 rounded-lg border px-3 py-2 text-xs font-medium" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}><FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /><span><strong style={{ color: 'var(--text-secondary)' }}>Lab points only.</strong> Solves here do not affect XP, global scores, badges, teams, or first blood.</span></p>
          </div>
          <div className="grid grid-cols-3 gap-2 lg:min-w-80">
            {data.isAdmin ? <><Stat label="testers" value={data.members.length} /><Stat label="active challenges" value={activeChallenges.length} /><Stat label="feedback" value={feedbackCount} /></> : <><Stat label="completed" value={solvedCount} /><Stat label="available" value={activeChallenges.length} /><Stat label="lab points" value={activeChallenges.filter((challenge) => data.attempts.some((attempt) => attempt.challenge_id === challenge.id && attempt.user_id === data.userId && attempt.is_correct)).reduce((sum, challenge) => sum + challenge.points, 0)} /></>}
          </div>
        </div>
      </section>

      {!data.isAdmin && (
        <section className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Your progress</h2><p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>{solvedCount} of {activeChallenges.length} complete</p></div><span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>{activeChallenges.length ? Math.round((solvedCount / activeChallenges.length) * 100) : 0}%</span></div>
          <div className="mt-4 h-2 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--input-bg)' }}><div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${activeChallenges.length ? (solvedCount / activeChallenges.length) * 100 : 0}%`, backgroundColor: 'var(--accent)' }} /></div>
        </section>
      )}

      <div className={data.isAdmin ? 'grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]' : ''}>
        <div className="min-w-0 space-y-5">
          {data.isAdmin && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--accent)' }}>Challenge pipeline</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Build and validate</h2><p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Publishing creates a separate global snapshot. Lab edits remain private.</p></div>
              <button className="btn-primary inline-flex min-h-10 items-center justify-center gap-2 px-4" onClick={() => setEditing('new')}><Plus className="h-4 w-4" aria-hidden />Add challenge</button>
            </div>
          )}

          {editing && <ChallengeEditor key={editing === 'new' ? 'new' : editing.id} roomId={data.room.id} challenge={editing === 'new' ? undefined : editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); router.refresh() }} />}

          {data.challenges.length === 0 ? (
            <div className="rounded-2xl border px-6 py-14 text-center" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}><Lightbulb className="mx-auto h-8 w-8" style={{ color: 'var(--text-muted)' }} aria-hidden /><h3 className="mt-4 font-semibold">No challenges available</h3><p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>{data.isAdmin ? 'Add the first challenge when the lab brief is ready.' : 'The admin is still preparing this lab.'}</p></div>
          ) : (
            <div className="space-y-4">{data.challenges.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} data={data} onEdit={() => setEditing(challenge)} />)}</div>
          )}
        </div>
        {data.isAdmin && <TesterAccess data={data} />}
      </div>
    </div>
  )
}
