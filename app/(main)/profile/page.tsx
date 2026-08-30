import { createClient } from '@/lib/supabase/server'
import ProfileForm from '@/components/profile/ProfileForm'
import BadgeShowcase from '@/components/gamification/BadgeShowcase'
import SkillAnalyticsDashboard from '@/components/profile/SkillAnalyticsDashboard'
import type { SkillSnapshot } from '@/lib/skill-analytics/types'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, full_name, bio, avatar_url')
    .eq('id', user?.id || '')
    .single()

  const { data: badgeRows } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', user?.id || '')

  const { data: skillSnapshot } = await supabase
    .from('skill_snapshots')
    .select('*')
    .maybeSingle()

  const earnedBadgeIds = (badgeRows || []).map((b) => b.badge_id)

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Profile Settings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your public profile and account</p>
      </div>

      <div className="mb-8">
        <SkillAnalyticsDashboard snapshot={(skillSnapshot ?? null) as SkillSnapshot | null} />
      </div>

      {profile ? (
        <ProfileForm profile={profile} />
      ) : (
        <div className="card text-center py-12">
          <p style={{ color: 'var(--text-secondary)' }}>Loading profile...</p>
        </div>
      )}

      <div className="mt-8 card">
        <BadgeShowcase earnedBadgeIds={earnedBadgeIds} />
      </div>
    </div>
  )
}
