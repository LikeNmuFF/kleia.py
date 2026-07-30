import KleiaLoader from '@/components/KleiaLoader'

export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <KleiaLoader />
    </div>
  )
}
