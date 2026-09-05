import Link from 'next/link'
import type { Webinar } from '@/lib/webinars/types'
import { getProxiedImageSrc } from '@/lib/images/image-proxy-url'

const providerLabels: Record<string, string> = {
  internal: 'Kleia',
  dict: 'DICT',
  school: 'School',
  partner: 'Partner',
  other: 'Other',
}

const modeLabels: Record<string, string> = {
  internal_attendance: 'Kleia attendance',
  external_certificate: 'External certification',
  resource_only: 'Resource only',
}

export default function WebinarCard({ webinar }: { webinar: Webinar }) {
  const start = new Date(webinar.starts_at)
  const registered = webinar.my_registration?.status === 'registered' || webinar.my_registration?.status === 'completed'
  const thumbnailSrc = webinar.thumbnail_url ? getProxiedImageSrc(webinar.thumbnail_url) : null

  return (
    <Link href={`/webinars/${webinar.id}`} className="block border rounded-lg overflow-hidden transition hover:-translate-y-0.5 hover:border-violet-500/50" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
      {thumbnailSrc ? (
        <div className="w-full h-40 overflow-hidden" style={{ backgroundColor: 'var(--hover-bg)' }}>
          <img
            src={thumbnailSrc}
            alt={webinar.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : webinar.thumbnail_url ? (
        <div className="w-full h-40 flex items-center justify-center text-sm" style={{ backgroundColor: 'var(--hover-bg)', color: 'var(--text-muted)' }}>
          Thumbnail unavailable
        </div>
      ) : null}

      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: 'var(--hover-bg)', color: 'var(--text-primary)' }}>
            {webinar.provider_name || providerLabels[webinar.provider_type]}
          </span>
          <span className="px-2 py-1 rounded text-xs" style={{ color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
            {modeLabels[webinar.verification_mode]}
          </span>
          {registered && (
            <span className="px-2 py-1 rounded text-xs bg-emerald-500/10 text-emerald-400">
              Registered
            </span>
          )}
        </div>

        <h2 className="text-lg font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>{webinar.title}</h2>
        <p className="mt-2 text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
          {webinar.description || 'No description provided.'}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
          <span>{start.toLocaleString()}</span>
          <span>{webinar.registration_count || 0}{webinar.capacity ? `/${webinar.capacity}` : ''} registered</span>
        </div>
      </div>
    </Link>
  )
}
