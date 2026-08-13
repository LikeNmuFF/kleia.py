'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { joinSeason, updateSeasonCodename } from '@/app/actions/seasons'
import { Share2, Copy, Check, Trophy, Users, Calendar, Target, Shield, ExternalLink } from 'lucide-react'

interface Season {
  id: string
  name: string
  slug: string
  description: string | null
  theme: string | null
  start_date: string
  end_date: string
  is_active: boolean
}

interface Challenge {
  id: string
  title: string
  category: string
  difficulty: string
  points: number
  bonus_points: number
  solved: boolean
}

interface LeaderboardEntry {
  user_id: string
  total_points: number
  challenges_solved: number
  joined_at: string
  codename: string | null
  username: string
  avatar_url: string | null
}

const DIFFICULTY_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  easy: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', label: 'Easy' },
  medium: { color: '#eab308', bg: 'rgba(234,179,8,0.12)', label: 'Medium' },
  hard: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Hard' },
}

const CATEGORIES: Record<string, string> = {
  web: '🌐',
  crypto: '🔐',
  forensics: '🔍',
  misc: '📌',
}

export default function SeasonDetailClient({
  season,
  challenges,
  leaderboard,
  isParticipant,
  userCodename,
  userId,
  participantCount,
  registrationUrl,
}: {
  season: Season
  challenges: Challenge[]
  leaderboard: LeaderboardEntry[]
  isParticipant: boolean
  userCodename: string | null
  userId?: string
  participantCount: number
  registrationUrl: string
}) {
  const router = useRouter()
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [codename, setCodename] = useState('')
  const [showCodenameForm, setShowCodenameForm] = useState(false)
  const [codenameError, setCodenameError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showShare, setShowShare] = useState(false)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const isSeasonActive = () => {
    const today = new Date().toISOString().split('T')[0]
    return season.is_active && season.start_date <= today && season.end_date >= today
  }

  const isSeasonUpcoming = () => {
    const today = new Date().toISOString().split('T')[0]
    return season.is_active && season.start_date > today
  }

  const canRegister = () => {
    const today = new Date().toISOString().split('T')[0]
    return season.is_active && season.end_date >= today
  }

  const handleJoin = async () => {
    if (!userId) {
      router.push('/login')
      return
    }

    if (!codename.trim() || codename.trim().length < 2) {
      setJoinError('Codename must be at least 2 characters')
      return
    }

    setJoining(true)
    setJoinError(null)

    const result = await joinSeason(season.id, codename.trim())

    if (result.error) {
      setJoinError(result.error)
      setJoining(false)
    } else {
      router.refresh()
    }
  }

  const handleUpdateCodename = async () => {
    if (!codename.trim() || codename.trim().length < 2) {
      setCodenameError('Codename must be at least 2 characters')
      return
    }

    const result = await updateSeasonCodename(season.id, codename.trim())
    if (result.error) {
      setCodenameError(result.error)
    } else {
      setShowCodenameForm(false)
      setCodenameError(null)
      router.refresh()
    }
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(registrationUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`Join ${season.name} on Kleia! Solve CTF challenges and climb the leaderboard 🏆`)
    const url = encodeURIComponent(registrationUrl)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
  }

  const handleShareFacebook = () => {
    const url = encodeURIComponent(registrationUrl)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank')
  }

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(registrationUrl)
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank')
  }

  const totalPoints = challenges.reduce((sum, c) => sum + c.points + c.bonus_points, 0)
  const solvedPoints = challenges.filter(c => c.solved).reduce((sum, c) => sum + c.points + c.bonus_points, 0)

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/ctf/seasons"
          className="text-sm mb-4 inline-flex items-center gap-1 hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          ← Back to Seasons
        </Link>

        {/* Themed Hero Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2), rgba(236, 72, 153, 0.15))',
            border: '1px solid rgba(139, 92, 246, 0.3)',
          }}
        >
          {/* Top Bar */}
          <div className="px-6 py-3 flex items-center justify-between"
            style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <div className="flex items-center gap-3">
              {season.theme && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider"
                  style={{ backgroundColor: 'rgba(139, 92, 246, 0.3)', color: '#c4b5fd' }}>
                  {season.theme}
                </span>
              )}
              {isSeasonActive() && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Live Now
                </span>
              )}
              {isSeasonUpcoming() && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#eab308' }}>
                  Starting {formatDate(season.start_date)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowShare(!showShare)}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)' }}
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {season.name}
                </h1>
                {season.description && (
                  <p className="text-sm max-w-xl" style={{ color: 'var(--text-secondary)' }}>
                    {season.description}
                  </p>
                )}
              </div>
              <Trophy className="w-8 h-8 shrink-0" style={{ color: '#eab308' }} />
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Calendar className="w-4 h-4" />
                <span>{formatDate(season.start_date)} — {formatDate(season.end_date)}</span>
              </div>
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Target className="w-4 h-4" />
                <span>{challenges.length} challenges</span>
              </div>
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Users className="w-4 h-4" />
                <span>{participantCount} registered</span>
              </div>
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Shield className="w-4 h-4" />
                <span>{totalPoints} pts</span>
              </div>
            </div>
          </div>

          {/* Share Panel */}
          {showShare && (
            <div className="px-6 pb-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)' }}>
                  Share registration link
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={registrationUrl}
                    readOnly
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-mono border"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleShareTwitter} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: '#1da1f220', color: '#1da1f2' }}>
                    Twitter
                  </button>
                  <button onClick={handleShareFacebook} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: '#4267b220', color: '#4267b2' }}>
                    Facebook
                  </button>
                  <button onClick={handleShareLinkedIn} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: '#0077b520', color: '#0077b5' }}>
                    LinkedIn
                  </button>
                  <a href={registrationUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1" style={{ backgroundColor: 'var(--hover-bg)', color: 'var(--text-muted)' }}>
                    <ExternalLink className="w-3 h-3" />
                    Open
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Registration / Join Section */}
      {!isParticipant && canRegister() && userId && (
        <div
          className="mb-8 rounded-2xl overflow-hidden"
          style={{ border: '2px dashed rgba(139, 92, 246, 0.4)' }}
        >
          <div className="p-6" style={{ backgroundColor: 'var(--card-bg)' }}>
            <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Register for {season.name}
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Choose a codename to compete anonymously on the leaderboard
            </p>

            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Your Codename *
                </label>
                <input
                  type="text"
                  value={codename}
                  onChange={e => setCodename(e.target.value)}
                  placeholder="e.g. ShadowFox, CryptoNinja..."
                  maxLength={30}
                  className="w-full px-4 py-3 rounded-xl text-sm font-mono border-2 outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: codename.length >= 2 ? 'rgba(139, 92, 246, 0.5)' : 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  2-30 characters. This is how you&apos;ll appear on the leaderboard.
                </p>
              </div>
              <button
                onClick={handleJoin}
                disabled={joining || codename.trim().length < 2}
                className="px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 shrink-0"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', color: 'white' }}
              >
                {joining ? 'Registering...' : 'Register Now'}
              </button>
            </div>

            {joinError && (
              <p className="text-sm mt-3" style={{ color: '#ef4444' }}>{joinError}</p>
            )}
          </div>
        </div>
      )}

      {/* Already Registered */}
      {isParticipant && (
        <div
          className="mb-8 rounded-2xl p-4 flex items-center justify-between"
          style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.3)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}>
              <Check className="w-5 h-5" style={{ color: '#22c55e' }} />
            </div>
            <div>
              <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                Registered as <span className="font-mono font-bold" style={{ color: '#8b5cf6' }}>{userCodename || 'Anonymous'}</span>
              </span>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                You&apos;re competing in this season
              </p>
            </div>
          </div>
          <button
            onClick={() => { setShowCodenameForm(!showCodenameForm); setCodename(userCodename || '') }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ backgroundColor: 'var(--hover-bg)', color: 'var(--text-secondary)' }}
          >
            Change Codename
          </button>
        </div>
      )}

      {/* Change Codename Form */}
      {showCodenameForm && isParticipant && (
        <div className="mb-8 rounded-xl p-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>New Codename</label>
              <input
                type="text"
                value={codename}
                onChange={e => setCodename(e.target.value)}
                maxLength={30}
                className="w-full px-3 py-2 rounded-lg text-sm font-mono border bg-transparent"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <button onClick={handleUpdateCodename} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
              Save
            </button>
            <button onClick={() => setShowCodenameForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Cancel
            </button>
          </div>
          {codenameError && <p className="text-xs mt-2" style={{ color: '#ef4444' }}>{codenameError}</p>}
        </div>
      )}

      {/* Progress */}
      {isParticipant && (
        <div
          className="mb-8 rounded-2xl p-5"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Your Progress
            </span>
            <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
              {solvedPoints} / {totalPoints} points
            </span>
          </div>
          <div className="w-full h-3 rounded-full" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${totalPoints > 0 ? (solvedPoints / totalPoints) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #8b5cf6, #06b6d4, #ec4899)',
              }}
            />
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Challenges */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Challenges
          </h2>

          {challenges.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
            >
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                No Challenges Yet
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Challenges will be added to this season soon.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {challenges.map((challenge) => {
                const diff = DIFFICULTY_STYLES[challenge.difficulty]
                const cat = CATEGORIES[challenge.category] || '📌'

                return (
                  <Link
                    key={challenge.id}
                    href={`/ctf/${challenge.id}`}
                    className="block rounded-xl p-4 transition-all hover:scale-[1.01] hover:shadow-md"
                    style={{
                      backgroundColor: challenge.solved ? 'rgba(34,197,94,0.04)' : 'var(--card-bg)',
                      border: challenge.solved
                        ? '1px solid rgba(34,197,94,0.45)'
                        : '1px solid var(--border-color)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{cat}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {challenge.title}
                            </h3>
                            {challenge.solved && (
                              <span className="text-xs px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                                ✓ Solved
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="text-xs font-medium px-2 py-0.5 rounded"
                              style={{ color: diff.color, backgroundColor: diff.bg }}
                            >
                              {diff.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                          {challenge.points}
                          {challenge.bonus_points > 0 && (
                            <span className="text-xs ml-1" style={{ color: '#22c55e' }}>
                              +{challenge.bonus_points}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                          Pts
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Leaderboard
          </h2>

          {leaderboard.length === 0 ? (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
            >
              <div className="text-3xl mb-3">🏆</div>
              <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                No Participants Yet
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Be the first to register!
              </p>
            </div>
          ) : (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
            >
              {leaderboard.slice(0, 10).map((entry, i) => {
                const isMe = userId === entry.user_id
                const displayName = entry.codename || entry.username || 'Unknown'
                return (
                  <div
                    key={entry.user_id}
                    className="flex items-center gap-3 px-4 py-3 border-t first:border-t-0"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: isMe ? 'rgba(139, 92, 246, 0.08)' : undefined,
                    }}
                  >
                    <div className="w-6 text-center shrink-0">
                      {i === 0 ? (
                        <span className="text-lg">🥇</span>
                      ) : i === 1 ? (
                        <span className="text-lg">🥈</span>
                      ) : i === 2 ? (
                        <span className="text-lg">🥉</span>
                      ) : (
                        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                          {i + 1}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm truncate block" style={{ color: 'var(--text-primary)' }}>
                        {displayName}
                        {isMe && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd' }}>
                            you
                          </span>
                        )}
                      </span>
                      {entry.codename && entry.username && (
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          @{entry.username}
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {entry.total_points}
                      </span>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {entry.challenges_solved} solved
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
