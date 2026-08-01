interface SkeletonProps {
  className?: string
}

export default function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ backgroundColor: 'var(--card-bg)' }}
    />
  )
}
