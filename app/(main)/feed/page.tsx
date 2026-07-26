import { createClient } from '@/lib/supabase/server'
import PostCard from '@/components/feed/PostCard'
import CreatePost from '@/components/feed/CreatePost'

export default async function FeedPage() {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('posts')
    .select('*, profiles(username, avatar_url)')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Feed</h1>
      <CreatePost />
      <div className="mt-6 space-y-4">
        {posts?.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
