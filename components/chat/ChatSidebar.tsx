'use client'

interface Conversation {
  id: string
  name: string | null
  type: string
}

interface ChatSidebarProps {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function ChatSidebar({ conversations, selectedId, onSelect }: ChatSidebarProps) {
  return (
    <div className="w-72 border-r border-white/5 bg-[#0a0a0f] h-full flex flex-col">
      <div className="p-4 border-b border-white/5">
        <h2 className="font-semibold text-white">Messages</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No conversations yet
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`w-full text-left p-4 border-b border-white/5 transition-all ${
                selectedId === conv.id
                  ? 'bg-white/10'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-medium text-sm">
                    {conv.name ? conv.name[0].toUpperCase() : 'DM'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">
                    {conv.name || 'Direct Message'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {conv.type === 'group' ? 'Group chat' : 'Private'}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
