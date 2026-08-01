import Skeleton from '@/components/ui/Skeleton'

export default function FeedLoading() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Create post skeleton */}
      <div className="card mb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </div>

      {/* Post skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="card mb-4">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-4" />
          <div className="flex gap-4 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}
