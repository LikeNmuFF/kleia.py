import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import MemberCard from '@/components/members/MemberCard'
import SearchBar from '@/components/members/SearchBar'

export const metadata: Metadata = {
  title: 'Members',
  description: 'Discover and connect with fellow IT and CS students in the Kleia community.',
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const term = q?.trim() ?? ''
  const supabase = await createClient()

  let query = supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, bio, status, last_seen, current_streak, longest_streak')

  if (term) {
    query = query.or(`username.ilike.*${term}*,full_name.ilike.*${term}*,bio.ilike.*${term}*`)
  }

  const { data: members } = await query.order('username')

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Members</h1>
        <p style={{ color: 'var(--text-secondary)' }}>See who&apos;s in the community</p>
      </div>

      <SearchBar initialQ={term} />

      {term && (
        <div className="mt-4 flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span>
            {members?.length ?? 0} result{members?.length === 1 ? '' : 's'} for “{term}”
          </span>
          <Link href="/members" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
            Clear search
          </Link>
        </div>
      )}

      {/* Members Grid */}
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {members && members.length > 0 ? (
          members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))
        ) : (
          <div className="col-span-2 text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--card-bg)' }}>
              <svg className="w-8 h-8" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              {term ? 'No members found' : 'No members yet'}
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              {term ? 'Try a different name or username.' : 'Be the first to join the community!'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
