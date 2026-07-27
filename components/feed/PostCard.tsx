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
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
          {post.profiles.avatar_url ? (
            <img
              src={post.profiles.avatar_url}
              alt=""
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <span className="text-white font-semibold text-sm">
              {post.profiles.username[0].toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <p className="font-semibold text-white">{post.profiles.username}</p>
          <p className="text-xs text-gray-500">
            {new Date(post.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>
      <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{post.content}</p>
    </div>
  )
}
