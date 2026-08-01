import Skeleton from '@/components/ui/Skeleton'

export default function LeaderboardLoading() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="flex gap-4 mb-8">
        <Skeleton className="h-10 w-20 rounded-lg" />
        <Skeleton className="h-10 w-16 rounded-lg" />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3"
            style={{ borderTop: i > 1 ? '1px solid var(--border-color)' : undefined }}
          >
            <div className="w-10 text-center">
              <Skeleton className="h-5 w-5 mx-auto" />
            </div>
            <div className="flex-1 flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-14 hidden sm:block" />
            <Skeleton className="h-4 w-10 hidden sm:block" />
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
    </div>
  )
}
