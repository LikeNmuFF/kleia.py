import Link from 'next/link'
import Countdown from '@/components/competition/Countdown'

export default function CompetitionBanner({ season }: {
  season: { name: string; slug: string; start_date: string; theme?: string | null }
}) {
  return (
    <Link
      href={`/ctf/seasons/${season.slug}`}
      className="block mb-6 rounded-2xl p-4 transition-all hover:scale-[1.01] hover:shadow-md"
      style={{
        border: '1px solid rgba(139, 92, 246, 0.4)',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15))',
      }}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#c4b5fd' }}>
            {season.theme || 'Competition Countdown'}
          </p>
          <p className="font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{season.name}</p>
        </div>
        <Countdown target={season.start_date} compact />
      </div>
    </Link>
  )
}
