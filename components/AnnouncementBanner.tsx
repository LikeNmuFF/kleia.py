import { Info } from 'lucide-react'

const EXPIRY = Date.UTC(2026, 7, 1) + 96 * 60 * 60 * 1000

export default function AnnouncementBanner() {
  if (Date.now() > EXPIRY) return null

  return (
    <div
      className="flex items-start gap-3 p-4 mb-6 rounded-xl border text-sm leading-relaxed"
      style={{
        backgroundColor: 'rgba(139, 92, 246, 0.08)',
        borderColor: 'rgba(139, 92, 246, 0.25)',
        color: 'var(--text-primary)',
      }}
    >
      <Info className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
      <p>
        We&apos;re sorry — some challenges were removed/deleted accidentally and cannot be recovered. We will return the points that were lost.
      </p>
    </div>
  )
}
