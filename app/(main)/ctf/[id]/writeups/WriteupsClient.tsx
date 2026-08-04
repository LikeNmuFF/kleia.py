'use client'

import WriteupForm from '@/components/ctf/WriteupForm'
import WriteupList from '@/components/ctf/WriteupList'

interface WriteupsClientProps {
  challengeId: string
  solved: boolean
}

export default function WriteupsClient({ challengeId, solved }: WriteupsClientProps) {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <a
        href={`/ctf/${challengeId}`}
        className="inline-flex items-center gap-1 text-sm mb-6 hover:opacity-80"
        style={{ color: 'var(--text-muted)' }}
      >
        ← Back to Challenge
      </a>

      <h1 className="text-xl sm:text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
        Writeups
      </h1>

      {solved && (
        <div className="mb-6">
          <WriteupForm challengeId={challengeId} />
        </div>
      )}

      {!solved && (
        <div className="mb-6 p-4 rounded-lg text-sm" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
          Solve this challenge to write a writeup.
        </div>
      )}

      <div className="pt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <WriteupList challengeId={challengeId} />
      </div>
    </div>
  )
}
