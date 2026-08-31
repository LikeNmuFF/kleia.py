import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getWebinarDetails } from '@/app/actions/webinars'
import AttendancePanel from '@/components/webinars/AttendancePanel'
import WebinarActions from '@/components/webinars/WebinarActions'

const providerLabels: Record<string, string> = {
  internal: 'Kleia',
  dict: 'DICT',
  school: 'School',
  partner: 'Partner',
  other: 'Other',
}

const modeLabels: Record<string, string> = {
  internal_attendance: 'Kleia attendance certificate',
  external_certificate: 'External certificate verification',
  resource_only: 'Resource only',
}

export default async function WebinarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getWebinarDetails(id)

  if ('error' in result) notFound()

  const webinar = result.webinar
  const start = new Date(webinar.starts_at)
  const end = webinar.ends_at ? new Date(webinar.ends_at) : null

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/webinars" className="text-sm hover:text-violet-400 transition-colors" style={{ color: 'var(--text-muted)' }}>
        Back to webinars
      </Link>

      <div className="mt-5 border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
        {webinar.thumbnail_url && (
          <div className="w-full h-56 md:h-72 overflow-hidden" style={{ backgroundColor: 'var(--hover-bg)' }}>
            <img
              src={`/api/image-proxy?url=${encodeURIComponent(webinar.thumbnail_url)}`}
              alt={webinar.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        <div className="p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: 'var(--hover-bg)', color: 'var(--text-primary)' }}>
              {providerLabels[webinar.provider_type]}
            </span>
            <span className="px-2 py-1 rounded text-xs" style={{ color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
              {modeLabels[webinar.verification_mode]}
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {webinar.title}
          </h1>
          <p className="mt-3 max-w-3xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {webinar.description || 'No description provided.'}
          </p>

          <dl className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <dt className="text-xs" style={{ color: 'var(--text-muted)' }}>Schedule</dt>
              <dd className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{start.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-xs" style={{ color: 'var(--text-muted)' }}>Ends</dt>
              <dd className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{end ? end.toLocaleString() : 'Not specified'}</dd>
            </div>
            <div>
              <dt className="text-xs" style={{ color: 'var(--text-muted)' }}>Capacity</dt>
              <dd className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{webinar.capacity || 'Open'}</dd>
            </div>
            <div>
              <dt className="text-xs" style={{ color: 'var(--text-muted)' }}>Minimum attendance</dt>
              <dd className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{webinar.min_attendance_minutes} minutes</dd>
            </div>
          </dl>

          <div className="mt-6">
            <WebinarActions webinar={webinar} registration={result.myRegistration} canManage={result.canManage} />
          </div>
        </div>
      </div>

      {result.canManage && (
        <section className="mt-6">
          <div className="mb-3">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Attendance</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Staff controls are server-side. Students cannot self-report attendance.
            </p>
          </div>
          <AttendancePanel webinar={webinar} registrations={result.registrations} attendance={result.attendance} />
        </section>
      )}
    </div>
  )
}
