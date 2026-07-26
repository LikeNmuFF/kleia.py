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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt=""
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <span className="text-blue-600 font-semibold text-lg">
              {member.username[0].toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <p className="font-semibold">{member.full_name || member.username}</p>
          <p className="text-sm text-gray-500">@{member.username}</p>
        </div>
      </div>
      {member.bio && <p className="mt-3 text-gray-600">{member.bio}</p>}
      <div className="mt-3">
        <span
          className={`text-xs px-2 py-1 rounded ${
            member.status === 'online'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {member.status}
        </span>
      </div>
    </div>
  )
}
