import { BarChart3, Clock, Flame, ShieldCheck, Sparkles, Trophy } from 'lucide-react'
import type { SkillSnapshot } from '@/lib/skill-analytics/types'

interface SkillAnalyticsDashboardProps {
  snapshot: SkillSnapshot | null
}

const numberFormatter = new Intl.NumberFormat('en-US')

function formatNumber(value: number | null | undefined) {
  return numberFormatter.format(value ?? 0)
}

function formatDuration(seconds: number | null) {
  if (!seconds) return 'No data'
  if (seconds < 60) return `${Math.round(seconds)}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
}

function formatActivity(value: string | null) {
  if (!value) return 'No activity yet'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

export default function SkillAnalyticsDashboard({ snapshot }: SkillAnalyticsDashboardProps) {
  if (!snapshot) {
    return (
      <section className="card">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-violet-500/10 p-2 text-violet-300">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Skill Analytics
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Start lessons, CTFs, Regex Golf, or Daily Cipher to build your snapshot.
            </p>
          </div>
        </div>
      </section>
    )
  }

  const skillCards = [
    {
      label: 'Learn',
      value: formatNumber(snapshot.learn_completed_count),
      meta: `${formatNumber(snapshot.learn_xp)} XP`,
    },
    {
      label: 'CTF',
      value: formatNumber(snapshot.ctf_solved_count),
      meta: `${formatNumber(snapshot.ctf_points)} points`,
    },
    {
      label: 'Regex Golf',
      value: formatNumber(snapshot.regex_solved_count),
      meta: snapshot.best_regex_length ? `Best ${snapshot.best_regex_length} chars` : 'No best yet',
    },
    {
      label: 'Daily Cipher',
      value: formatNumber(snapshot.cipher_solved_count),
      meta: `${formatNumber(snapshot.current_streak)} day streak`,
    },
  ]

  const topicBreakdown = snapshot.category_breakdown.learn.topics.slice(0, 4)
  const strengths = snapshot.strengths.slice(0, 3)
  const gaps = snapshot.weaknesses.slice(0, 3)

  return (
    <section className="card space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-violet-500/10 p-2 text-violet-300">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Skill Analytics
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Unified progress across Learn, CTF, Regex Golf, and Daily Cipher.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <Clock className="h-4 w-4" />
          <span>{formatActivity(snapshot.last_activity_at)}</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {skillCards.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border p-4"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.label}</p>
            <p className="mt-2 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {item.value}
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{item.meta}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            <Sparkles className="h-4 w-4 text-cyan-300" />
            Strengths
          </h3>
          {strengths.length > 0 ? (
            <div className="mt-3 space-y-3">
              {strengths.map((item) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{item.score}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-violet-400 to-cyan-300"
                      style={{ width: `${Math.min(100, Math.max(12, item.score * 12))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              No standout area yet.
            </p>
          )}
        </div>

        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            Next Focus
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {gaps.length > 0 ? gaps.map((item) => (
              <span
                key={item.key}
                className="rounded-lg border px-3 py-2 text-sm"
                style={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-secondary)',
                }}
              >
                {item.label}
              </span>
            )) : (
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Balanced activity across all tracked skills.
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            <Trophy className="h-4 w-4 text-amber-300" />
            Learn Topics
          </div>
          <div className="mt-3 space-y-2">
            {topicBreakdown.length > 0 ? topicBreakdown.map((topic) => (
              <div key={topic.slug} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate" style={{ color: 'var(--text-secondary)' }}>{topic.title}</span>
                <span className="shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {topic.completed} / {topic.xp} XP
                </span>
              </div>
            )) : (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No completed topics yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            <Flame className="h-4 w-4 text-orange-300" />
            Streaks
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt style={{ color: 'var(--text-muted)' }}>Current</dt>
              <dd className="mt-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {snapshot.current_streak}
              </dd>
            </div>
            <div>
              <dt style={{ color: 'var(--text-muted)' }}>Longest</dt>
              <dd className="mt-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {snapshot.longest_streak}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            <Clock className="h-4 w-4 text-cyan-300" />
            Speed
          </div>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt style={{ color: 'var(--text-secondary)' }}>Regex avg</dt>
              <dd style={{ color: 'var(--text-muted)' }}>{formatDuration(snapshot.regex_avg_time_seconds)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt style={{ color: 'var(--text-secondary)' }}>Cipher avg</dt>
              <dd style={{ color: 'var(--text-muted)' }}>{formatDuration(snapshot.cipher_avg_time_seconds)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}
