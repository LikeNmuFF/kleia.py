import type { Metadata } from 'next'
import { Bug, Lightbulb, MessageSquareHeart, TriangleAlert } from 'lucide-react'
import { submitFeedback } from '@/app/actions/feedback'

export const metadata: Metadata = {
  title: 'Feedback',
  description: 'Send app feedback, bug reports, error reports, and feature suggestions to Kleia.',
}

const feedbackTypes = [
  {
    value: 'app_feedback',
    label: 'App feedback',
    description: 'Rate the app and share what is working well.',
    icon: MessageSquareHeart,
  },
  {
    value: 'bug_report',
    label: 'Bug report',
    description: 'Something is broken or behaving strangely.',
    icon: Bug,
  },
  {
    value: 'error_report',
    label: 'Error report',
    description: 'You saw an error message, failed action, or crash.',
    icon: TriangleAlert,
  },
  {
    value: 'feature_suggestion',
    label: 'Feature suggestion',
    description: 'A new idea that would make Kleia better.',
    icon: Lightbulb,
  },
]

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Feedback & Reports
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Tell us what feels good, what broke, and what should exist next.
        </p>
      </div>

      {params.sent && (
        <div
          className="mb-6 rounded-xl border p-4 text-sm"
          style={{
            backgroundColor: 'rgba(34,197,94,0.10)',
            borderColor: 'rgba(34,197,94,0.25)',
            color: '#16a34a',
          }}
        >
          Thanks for sending this in. App feedback marked public can now appear on the landing page.
        </div>
      )}

      {params.error && (
        <div
          className="mb-6 rounded-xl border p-4 text-sm"
          style={{
            backgroundColor: 'rgba(239,68,68,0.10)',
            borderColor: 'rgba(239,68,68,0.25)',
            color: '#ef4444',
          }}
        >
          {params.error}
        </div>
      )}

      <form
        action={submitFeedback}
        className="rounded-2xl border p-5 md:p-6 space-y-6"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        <fieldset>
          <legend className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            What are you sending?
          </legend>
          <div className="grid gap-3 md:grid-cols-2">
            {feedbackTypes.map((type, index) => {
              const Icon = type.icon

              return (
                <label
                  key={type.value}
                  className="group relative cursor-pointer rounded-xl border p-4 transition-all hover:scale-[1.01]"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)' }}
                >
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    defaultChecked={index === 0}
                    className="peer sr-only"
                  />
                  <span className="absolute inset-0 rounded-xl border-2 border-transparent peer-checked:border-violet-500 pointer-events-none" />
                  <span className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ backgroundColor: 'var(--hover-bg)', color: 'var(--accent)' }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block font-medium" style={{ color: 'var(--text-primary)' }}>
                        {type.label}
                      </span>
                      <span className="block text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {type.description}
                      </span>
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            App rating
          </legend>
          <div className="grid gap-2 sm:grid-cols-5">
            {[1, 2, 3, 4, 5].map((rating) => (
              <label
                key={rating}
                className="relative cursor-pointer rounded-xl border px-3 py-2 text-center transition-all hover:scale-[1.02]"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)' }}
              >
                <input
                  type="radio"
                  name="rating"
                  value={rating}
                  defaultChecked={rating === 5}
                  className="peer sr-only"
                />
                <span className="absolute inset-0 rounded-xl border-2 border-transparent peer-checked:border-amber-400 pointer-events-none" />
                <span className="block text-lg text-amber-400" aria-hidden="true">
                  {'★'.repeat(rating)}
                </span>
                <span className="sr-only">
                  {rating} star{rating === 1 ? '' : 's'}
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Ratings are required for app feedback. Bug, error, and feature reports ignore this field.
          </p>
        </fieldset>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Short title
            </label>
            <input
              id="title"
              name="title"
              required
              minLength={3}
              maxLength={120}
              placeholder="What should we know?"
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="pageUrl" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Page or feature
            </label>
            <input
              id="pageUrl"
              name="pageUrl"
              maxLength={500}
              placeholder="/ctf, /chat, mobile nav..."
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Details
          </label>
          <textarea
            id="message"
            name="message"
            required
            minLength={10}
            maxLength={4000}
            rows={7}
            placeholder="Describe what happened, what you expected, or what you want to see next."
            className="input-field resize-y"
          />
        </div>

        <label
          className="flex items-start gap-3 rounded-xl border p-4"
          style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)' }}
        >
          <input
            type="checkbox"
            name="allowPublic"
            defaultChecked
            className="mt-1 h-4 w-4 rounded border-gray-400 text-violet-600 focus:ring-violet-500"
          />
          <span>
            <span className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Show app feedback on the landing page
            </span>
            <span className="block text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Only app feedback with a star rating can appear publicly. Bug reports, error reports, and feature ideas stay private to the team.
            </span>
          </span>
        </label>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full px-6 py-3 font-medium text-white transition-all hover:scale-[1.02]"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Send feedback
          </button>
        </div>
      </form>
    </div>
  )
}
