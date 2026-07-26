import { createClient } from '@/lib/supabase/client'

interface PostCardProps {
  post: {
    id: string
    content: string
    type: string
    created_at: string
    profiles: { username: string; avatar_url: string | null }
  }
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          {post.profiles.avatar_url ? (
            <img
              src={post.profiles.avatar_url}
              alt=""
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <span className="text-blue-600 font-semibold">
              {post.profiles.username[0].toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <p className="font-semibold">{post.profiles.username}</p>
          <p className="text-sm text-gray-500">
            {new Date(post.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      <p className="whitespace-pre-wrap">{post.content}</p>
    </div>
  )
}
