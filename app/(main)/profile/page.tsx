import { createClient } from '@/lib/supabase/server'
import ProfileForm from '@/components/profile/ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, full_name, bio, avatar_url')
    .eq('id', user?.id || '')
    .single()

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Profile Settings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your public profile and account</p>
      </div>

      {profile ? (
        <ProfileForm profile={profile} />
      ) : (
        <div className="card text-center py-12">
          <p style={{ color: 'var(--text-secondary)' }}>Loading profile...</p>
        </div>
      )}
    </div>
  )
}
