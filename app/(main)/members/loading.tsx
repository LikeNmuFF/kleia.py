import Skeleton from '@/components/ui/Skeleton'

export default function MembersLoading() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <Skeleton className="h-8 w-28 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>

      <Skeleton className="h-10 w-full mb-8" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-3 w-full mt-3" />
            <Skeleton className="h-3 w-2/3 mt-2" />
            <div className="flex items-center justify-between mt-3">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-5 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
