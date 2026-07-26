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
    <div className="w-64 border-r bg-gray-50 h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Messages</h2>
      </div>
      <div className="overflow-y-auto">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`w-full text-left p-4 border-b hover:bg-gray-100 ${
              selectedId === conv.id ? 'bg-blue-50' : ''
            }`}
          >
            <p className="font-medium">{conv.name || 'Direct Message'}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
