import Skeleton from '@/components/ui/Skeleton'

export default function CTFLoading() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="flex gap-4 mb-8">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-20 rounded-lg" />
      </div>

      {/* Category filter skeletons */}
      <div className="flex gap-2 mb-6 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full flex-shrink-0" />
        ))}
      </div>

      {/* Challenge grid skeletons */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-10" />
            </div>
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-2/3 mb-4" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-14" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
