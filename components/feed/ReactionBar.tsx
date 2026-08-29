'use client'

import { BadgeCheck, Heart, ThumbsUp } from 'lucide-react'
import { useState } from 'react'
import { toggleReaction } from '@/app/actions/posts'
import type { ReactionType } from '@/lib/feed/constants'
import type { ReactionCounts, UserReactionState } from '@/lib/feed/types'

interface ReactionBarProps {
  postId: string
  initialCounts: ReactionCounts
  initialUserReactions: UserReactionState
}

const REACTIONS: Array<{
  type: ReactionType
  label: string
  Icon: typeof Heart
  activeColor: string
}> = [
  { type: 'like', label: 'Like', Icon: Heart, activeColor: '#ef4444' },
  { type: 'helpful', label: 'Helpful', Icon: BadgeCheck, activeColor: '#22c55e' },
  { type: 'upvote', label: 'Upvote', Icon: ThumbsUp, activeColor: '#38bdf8' },
]

export default function ReactionBar({ postId, initialCounts, initialUserReactions }: ReactionBarProps) {
  const [counts, setCounts] = useState(initialCounts)
  const [selected, setSelected] = useState(initialUserReactions)

  const onToggle = async (type: ReactionType) => {
    const previousCounts = counts
    const previousSelected = selected
    const nextSelected = !selected[type]

    setSelected({ ...selected, [type]: nextSelected })
    setCounts({
      ...counts,
      [type]: nextSelected ? counts[type] + 1 : Math.max(0, counts[type] - 1),
    })

    const result = await toggleReaction(postId, type)
    if (result.error || !result.counts) {
      setCounts(previousCounts)
      setSelected(previousSelected)
      return
    }

    setSelected({ ...previousSelected, [type]: result.selected ?? nextSelected })
    setCounts(result.counts)
  }

  return (
    <div className="flex items-center gap-3">
      {REACTIONS.map(({ type, label, Icon, activeColor }) => {
        const active = selected[type]
        return (
          <button
            key={type}
            type="button"
            onClick={() => onToggle(type)}
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: active ? activeColor : 'var(--text-muted)' }}
            title={label}
            aria-pressed={active}
          >
            <Icon className="w-5 h-5" fill={active && type === 'like' ? 'currentColor' : 'none'} />
            <span>{counts[type]}</span>
          </button>
        )
      })}
    </div>
  )
}
