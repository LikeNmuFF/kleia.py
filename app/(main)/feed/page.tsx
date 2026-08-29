import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getUpcomingRegistration } from '@/app/actions/competition'
import { getAuthorProfiles, getFeedPosts } from '@/lib/feed/queries'
import PostCard from '@/components/feed/PostCard'
import CreatePost from '@/components/feed/CreatePost'
import DailyMissions from '@/components/gamification/DailyMissions'
import CompetitionBanner from '@/components/competition/CompetitionBanner'
import FeedTabs from '@/components/feed/FeedTabs'

export const metadata: Metadata = {
  title: 'Feed',
  description: 'Share updates, ask questions, and connect with the Kleia study community.',
}

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [posts, profileResult, upcomingRegistration] = await Promise.all([
    getFeedPosts(user?.id),
    user
      ? supabase.from('profiles').select('id, role, username, avatar_url').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
    getUpcomingRegistration(),
  ])

  const authorMap = await getAuthorProfiles(posts)
  const isAdmin = profileResult.data?.role === 'admin'

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Competition Banner */}
      {upcomingRegistration && <CompetitionBanner season={upcomingRegistration} />}

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Feed</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Share updates, resources, and discussions</p>
      </div>

      <FeedTabs active="all" />

      {/* Create Post */}
      <CreatePost />

      {/* Daily Missions */}
      {user && (
        <div className="mt-6">
          <DailyMissions />
        </div>
      )}

      {/* Posts List */}
      <div className="mt-6 space-y-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id}
              initialLiked={post.user_reactions.like}
              isAdmin={isAdmin}
              initialProfile={authorMap[post.author_id] || null}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--card-bg)' }}>
              <svg className="w-8 h-8" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No posts yet</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Be the first to share something with the community!</p>
          </div>
        )}
      </div>
    </div>
  )
}
