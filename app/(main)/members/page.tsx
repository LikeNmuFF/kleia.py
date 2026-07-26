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
      <h1 className="text-2xl font-bold mb-6">Members</h1>
      <SearchBar />
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {members?.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  )
}
