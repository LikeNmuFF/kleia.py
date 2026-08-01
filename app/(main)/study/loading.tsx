import Skeleton from '@/components/ui/Skeleton'

export default function StudyLoading() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Notes skeleton */}
        <div className="card">
          <Skeleton className="h-5 w-24 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>

        {/* Progress skeleton */}
        <div className="card">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>

      <div className="mt-6 card">
        <Skeleton className="h-5 w-28 mb-4" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  )
}
