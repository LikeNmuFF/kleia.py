import Skeleton from '@/components/ui/Skeleton'

export default function ChatLoading() {
  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar skeleton */}
      <div className="w-72 h-full flex flex-col" style={{ borderRight: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="w-9 h-9 rounded-lg" />
        </div>
        <div className="flex-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-3 w-14" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat window skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
              {i % 2 !== 0 && <Skeleton className="w-8 h-8 rounded-full flex-shrink-0 mr-2" />}
              <Skeleton className={`h-12 ${i % 2 === 0 ? 'w-48' : 'w-56'}`} />
            </div>
          ))}
        </div>
        <div className="p-4" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div className="flex gap-3">
            <Skeleton className="h-12 flex-1" />
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
