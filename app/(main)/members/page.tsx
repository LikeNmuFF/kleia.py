import { createClient } from '@/lib/supabase/server'
import MemberCard from '@/components/members/MemberCard'
import SearchBar from '@/components/members/SearchBar'

export default async function MembersPage() {
  const supabase = await createClient()

  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .order('username')

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Members</h1>
        <p className="text-gray-400">See who's in the community</p>
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
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No members yet</h3>
            <p className="text-gray-400">Be the first to join the community!</p>
          </div>
        )}
      </div>
    </div>
  )
}
