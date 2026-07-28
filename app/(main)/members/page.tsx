import { createClient } from '@/lib/supabase/server'
import MemberCard from '@/components/members/MemberCard'
import SearchBar from '@/components/members/SearchBar'

export default async function MembersPage() {
  const supabase = await createClient()

  const { data: members } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, bio, status, last_seen, current_streak, longest_streak')
    .order('username')

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Members</h1>
        <p style={{ color: 'var(--text-secondary)' }}>See who&apos;s in the community</p>
      </div>

      <SearchBar />

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
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No members yet</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Be the first to join the community!</p>
          </div>
        )}
      </div>
    </div>
  )
}
