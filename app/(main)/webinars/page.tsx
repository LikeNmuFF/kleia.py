import WebinarCard from '@/components/webinars/WebinarCard'
import WebinarCreateForm from '@/components/webinars/WebinarCreateForm'
import { getWebinars } from '@/app/actions/webinars'

export const metadata = {
  title: 'Webinars | Kleia',
  description: 'Browse free webinars, DICT certifications, and faculty-posted learning opportunities.',
}

export default async function WebinarsPage() {
  const { webinars, role } = await getWebinars()
  const canCreate = role === 'admin' || role === 'faculty'

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Webinars
          </h1>
          <p className="mt-2 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
            Free webinars, DICT certifications, and faculty-approved learning opportunities.
          </p>
        </div>
        {canCreate && <WebinarCreateForm />}
      </div>

      {webinars.length === 0 ? (
        <div className="border rounded-lg p-8 text-center" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
          No webinars posted yet.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {webinars.map((webinar: any) => (
            <WebinarCard key={webinar.id} webinar={webinar} />
          ))}
        </div>
      )}
    </div>
  )
}
