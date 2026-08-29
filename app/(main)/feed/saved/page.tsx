import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getAuthorProfiles, getSavedFeedPosts } from '@/lib/feed/queries'
import PostCard from '@/components/feed/PostCard'
import FeedTabs from '@/components/feed/FeedTabs'

export const metadata: Metadata = {
  title: 'Saved Posts',
  description: 'Posts you have saved from the Kleia community feed.',
}

export default async function SavedFeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [posts, profileResult] = await Promise.all([
    user ? getSavedFeedPosts(user.id) : [],
    user
      ? supabase.from('profiles').select('id, role, username, avatar_url').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
  ])
  const authorMap = await getAuthorProfiles(posts)
  const isAdmin = profileResult.data?.role === 'admin'

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Saved Posts</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Posts you have saved from the community</p>
      </div>

      <FeedTabs active="saved" />

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
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No saved posts yet</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Save posts from the feed to find them here later.</p>
          </div>
        )}
      </div>
    </div>
  )
}
