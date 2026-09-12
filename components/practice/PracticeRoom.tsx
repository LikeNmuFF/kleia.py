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

const DIFFICULTY_COLORS = {
  easy: '#22c55e',
  medium: '#eab308',
  hard: '#ef4444',
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const color = DIFFICULTY_COLORS[difficulty as keyof typeof DIFFICULTY_COLORS] || '#6b7280'
  const bg = difficulty === 'easy'
    ? 'rgba(34,197,94,0.12)'
    : difficulty === 'medium'
      ? 'rgba(234,179,8,0.12)'
      : 'rgba(239,68,68,0.12)'
  return (
    <span
      className="px-2 py-0.5 text-[11px] font-semibold rounded"
      style={{ color: color, backgroundColor: bg }}
    >
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </span>
  )
}

function ChallengeTile({ challenge, data, onEdit }: { challenge: PracticeChallenge; data: PracticeRoomData; onEdit: () => void }) {
  const solved = data.attempts.some((attempt) => attempt.challenge_id === challenge.id && attempt.user_id === data.userId && attempt.is_correct)
  const ownFeedback = data.feedback.find((item) => item.challenge_id === challenge.id && item.user_id === data.userId)?.message ?? ''
  const attempts = data.attempts.filter((attempt) => attempt.challenge_id === challenge.id)
  const feedback = data.feedback.filter((item) => item.challenge_id === challenge.id)
  const difficultyColor = challenge.difficulty === 'easy' ? '#22c55e' : challenge.difficulty === 'hard' ? '#ef4444' : '#f59e0b'

  return (
    <Link
      key={challenge.id}
      href={`/practice/${challenge.room_id}`}
      className="group block rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg"
      style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
      }}
    >
      {/* Top bar: category icon + difficulty + points + solved status */}
      <div className="flex items-center justify-between p-4 pb-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">{challenge.category}</span>
          <DifficultyBadge difficulty={challenge.difficulty} />
          {solved && (
            <span
              className="px-2 py-0.5 text-[11px] font-semibold rounded flex items-center gap-1"
              style={{ color: '#22c55e', backgroundColor: 'rgba(34,197,94,0.14)' }}
            >
              ✓ Solved
            </span>
          )}
        </div>
        <div className="text-right">
          <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {challenge.points}
          </div>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Pts
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="px-4 py-3">
        <h3
          className="font-semibold text-base leading-snug group-hover:opacity-80 transition-opacity break-words"
          style={{ color: 'var(--text-primary)' }}
        >
          {challenge.title}
        </h3>
        {challenge.is_active === false && (
          <p className="mt-2 text-xs font-medium text-amber-400">
            Challenge is under maintenance.
          </p>
        )}
      </div>

      {/* Bottom bar: solves + hint */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 text-xs border-t"
        style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
      >
        <span className="flex items-center gap-1">
          <span>⛳</span>
          <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
            {attempts.length}
          </span>
          {attempts.length === 1 ? 'solve' : 'solves'}
        </span>
        {challenge.hint && (
          <span className="flex items-center gap-1">
            <span>💡</span>
            Hint
          </span>
        )}
      </div>
    </Link>
  )
}

const primaryButton = 'inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-violet-600 px-4 text-sm font-semibold text-white transition-[background-color,transform,opacity] duration-200 hover:bg-violet-500 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] disabled:cursor-not-allowed disabled:opacity-50'
const secondaryButton = 'inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-[10px] border px-3 text-sm font-semibold transition-[background-color,border-color,transform] duration-200 hover:bg-[var(--hover-bg)] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] disabled:cursor-not-allowed disabled:opacity-50'

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 px-4 py-1 first:pl-0 last:pr-0 sm:px-6">
      <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="mt-1 text-xs font-medium leading-4" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  )
}

function ActionForm({ challengeId, kind, initial }: { challengeId: string; kind: 'flag' | 'feedback'; initial?: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const isFlag = kind === 'flag'

  return (
    <form className="rounded-xl border p-4 sm:p-5" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)' }} action={(data) => {
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
      <div className="mb-3 flex items-center gap-2">
        {isFlag ? <ShieldCheck className="h-4 w-4" style={{ color: 'var(--accent)' }} aria-hidden /> : <MessageSquare className="h-4 w-4" style={{ color: 'var(--accent)' }} aria-hidden />}
        <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{isFlag ? 'Submit your flag' : 'Tester feedback'}</h4>
      </div>
      {isFlag ? (
        <div>
          <label htmlFor={`flag-${challengeId}`} className="sr-only">Challenge flag</label>
          <div className="flex gap-2">
            <input id={`flag-${challengeId}`} aria-label="Challenge flag" required maxLength={500} name="flag" autoComplete="off" className="input-field min-h-10 flex-1 font-mono" placeholder="flag{...}" />
            <button type="submit" aria-label={pending ? 'Checking flag' : 'Submit flag'} disabled={pending} className="group relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-violet-600 text-white transition-[background-color,transform,opacity] duration-200 hover:bg-violet-500 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] disabled:cursor-not-allowed disabled:opacity-50">
              <Send className="h-4 w-4" aria-hidden />
              <span role="tooltip" className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-[8px] border bg-[var(--bg-secondary)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" style={{ borderColor: 'var(--border-color)' }}>{pending ? 'Checking flag' : 'Submit flag'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div>
          <label htmlFor={`feedback-${challengeId}`} className="sr-only">Challenge feedback</label>
          <textarea id={`feedback-${challengeId}`} aria-label="Challenge feedback" required maxLength={2000} name="feedback" defaultValue={initial} rows={3} className="input-field w-full resize-y" placeholder="What worked, what was unclear, or what should change?" />
          <button disabled={pending} className={`${secondaryButton} mt-2`} style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>{pending ? 'Saving…' : 'Send feedback'}</button>
        </div>
      )}
      {message && <p role="status" className="mt-2 text-sm" style={{ color: message.includes('Correct') || message.includes('saved') || message.includes('solved') ? '#22c55e' : 'var(--text-secondary)' }}>{message}</p>}
    </form>
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
    <aside aria-label="Tester management" className="overflow-hidden rounded-2xl border lg:sticky lg:top-24" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
      <div className="border-b p-5" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2"><Users className="h-5 w-5" style={{ color: 'var(--accent)' }} aria-hidden /><h2 className="font-semibold">Tester access</h2></div>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>Invited accounts can discover and enter this lab.</p>
      </div>
      <div className="p-5">
      <label htmlFor="tester-search" className="text-sm font-semibold">Invite a tester</label>
      <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Search by display name.</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
        <input id="tester-search" aria-label="Search registered users" value={query} onChange={(event) => setQuery(event.target.value)} className="input-field min-w-0 flex-1" placeholder="Search users" />
        <button disabled={pending || query.trim().length < 2} className={primaryButton} onClick={() => startTransition(async () => {
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
      {users.length > 0 && <ul className="mt-3 space-y-2">{users.map((user) => <li key={user.id} className="flex items-center justify-between gap-2 rounded-xl border p-2.5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--input-bg)' }}><span className="truncate text-sm font-medium">{user.display_name}</span><button disabled={pending} className="rounded-[8px] bg-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" onClick={() => mutate(() => invitePracticeMember(data.room.id, user.id), 'Member invited.')}>Invite</button></li>)}</ul>}

      <div className="mt-6 flex items-center justify-between border-t pt-5" style={{ borderColor: 'var(--border-color)' }}>
        <h3 className="text-sm font-semibold">Invited testers</h3>
        <span className="font-mono text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>{data.members.length}</span>
      </div>
      {data.members.length === 0 ? <p className="mt-3 rounded-xl border border-dashed p-4 text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>No testers yet. Search above to invite the first one.</p> : <ul className="mt-2 space-y-1">{data.members.map((member) => <li key={member.user_id} className="rounded-xl px-3 py-3 transition-colors hover:bg-[var(--hover-bg)]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{member.display_name}</p><p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>Invited {new Date(member.invited_at).toLocaleDateString()}{member.last_reminded_at ? `, reminded ${new Date(member.last_reminded_at).toLocaleDateString()}` : ''}</p></div><div className="flex shrink-0 gap-1"><button aria-label={`Remind ${member.display_name}`} title="Send reminder" disabled={pending} onClick={() => mutate(() => remindPracticeMember(data.room.id, member.user_id), 'Reminder sent.')} className="min-h-8 rounded-[8px] border px-2.5 text-xs font-semibold transition-colors hover:bg-[var(--input-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>Remind</button><button aria-label={`Revoke ${member.display_name}'s access`} title="Revoke access" disabled={pending} onClick={() => mutate(() => revokePracticeMember(data.room.id, member.user_id), 'Access revoked.')} className="min-h-8 rounded-[8px] px-2.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">Revoke</button></div></div></li>)}</ul>}
      </div>
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
    <div className="space-y-8">
      <Link href={data.isAdmin ? '/admin' : '/practice'} className="inline-flex items-center gap-2 rounded-md text-sm font-medium transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" style={{ color: 'var(--text-muted)' }}><ArrowLeft className="h-4 w-4" aria-hidden />{data.isAdmin ? 'Back to admin workspace' : 'All Labs'}</Link>

      <section aria-label="Lab summary" className="relative overflow-hidden rounded-2xl border px-5 py-6 sm:px-7 sm:py-7" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
        <div aria-hidden className="absolute inset-y-0 left-0 w-1 bg-violet-600" />
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--accent)' }}><LockKeyhole className="h-4 w-4" aria-hidden />{data.isAdmin ? 'Lab control' : 'Private lab'}</div>
            <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl" style={{ color: 'var(--text-primary)' }}>{data.room.title}</h1>
            <p className="mt-2 max-w-[62ch] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{data.room.description}</p>
            <div className="mt-5 flex items-start gap-2 border-t pt-4 text-xs leading-relaxed" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}><FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /><span><strong style={{ color: 'var(--text-secondary)' }}>Lab points only.</strong> Solves do not affect XP, global scores, badges, teams, or first blood.</span></div>
          </div>
        </div>
      </section>

      {!data.isAdmin && (
        <section className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Your progress</h2><p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>{solvedCount} of {activeChallenges.length} complete</p></div><span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>{activeChallenges.length ? Math.round((solvedCount / activeChallenges.length) * 100) : 0}%</span></div>
          <div className="mt-4 h-2 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--input-bg)' }}><div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${activeChallenges.length ? (solvedCount / activeChallenges.length) * 100 : 0}%`, backgroundColor: 'var(--accent)' }} /></div>
        </section>
      )}

      <div className={data.isAdmin ? 'grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]' : ''}>
        <main className="min-w-0 space-y-5">
          {data.isAdmin && (
            <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: 'var(--border-color)' }}>
              <div><h2 className="text-2xl font-semibold tracking-tight">Build and validate</h2><p className="mt-1 max-w-xl text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>Test each challenge here, then publish a separate global snapshot.</p></div>
              <button className={primaryButton} onClick={() => setEditing('new')}><Plus className="h-4 w-4" aria-hidden />Add challenge</button>
            </div>
          )}

          {editing && <ChallengeEditor key={editing === 'new' ? 'new' : editing.id} roomId={data.room.id} challenge={editing === 'new' ? undefined : editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); router.refresh() }} />}

{data.challenges.length === 0 ? (
            <div className="rounded-2xl border px-6 py-14 text-center" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}><Lightbulb className="mx-auto h-8 w-8" style={{ color: 'var(--text-muted)' }} aria-hidden /><h3 className="mt-4 font-semibold">No challenges available</h3><p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>{data.isAdmin ? 'Add the first challenge when the lab brief is ready.' : 'The admin is still preparing this lab.'}</p></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{data.challenges.map((challenge) => <ChallengeTile key={challenge.id} challenge={challenge} data={data} onEdit={() => setEditing(challenge)} />)}</div>
          )}
        </main>
        {data.isAdmin && <TesterAccess data={data} />}
      </div>
    </div>
  )
}
