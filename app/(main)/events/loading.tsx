import Skeleton from '@/components/ui/Skeleton'

export default function EventsLoading() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <Skeleton className="h-8 w-24 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>

      <Skeleton className="h-10 w-32 mb-8" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card">
            <Skeleton className="h-40 w-full rounded-lg mb-4" />
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-2/3 mb-4" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
