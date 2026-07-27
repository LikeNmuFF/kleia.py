interface Member {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  status: string
}

export default function MemberCard({ member }: { member: Member }) {
  return (
    <div className="card">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt=""
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <span className="text-white font-semibold text-lg">
              {member.username[0].toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white truncate">
            {member.full_name || member.username}
          </p>
          <p className="text-sm text-gray-400 truncate">@{member.username}</p>
        </div>
      </div>

      {member.bio && (
        <p className="mt-3 text-gray-400 text-sm leading-relaxed line-clamp-2">{member.bio}</p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            member.status === 'online' ? 'bg-emerald-400' : 'bg-gray-500'
          }`}
        />
        <span className="text-xs text-gray-500 capitalize">{member.status || 'offline'}</span>
      </div>
    </div>
  )
}
