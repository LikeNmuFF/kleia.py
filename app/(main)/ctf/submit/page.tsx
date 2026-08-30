import { submitChallenge } from '@/app/actions/ctf'
import { createClient } from '@/lib/supabase/server'
import LearnLinkPicker from '@/components/ctf/LearnLinkPicker'
import Link from 'next/link'

const CATEGORIES = ['web', 'crypto', 'forensics', 'misc']
const DIFFICULTIES = ['easy', 'medium', 'hard']

export default async function SubmitChallengePage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string }
}) {
  const supabase = await createClient()
  const { data: topics } = await supabase
    .from('learn_topics')
    .select('id, slug, title, icon')
    .order('sort_order', { ascending: true })

  const { data: lessons } = await supabase
    .from('learn_lessons')
    .select('topic_id, slug, title')

  if (searchParams.success) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="rounded-xl p-8 text-center" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Challenge Submitted!
          </h1>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            An admin will review your challenge. It will appear on the CTF dashboard once approved.
          </p>
          <Link
            href="/ctf"
            className="inline-flex px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 to-cyan-600 text-white"
          >
            Back to Challenges
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Link
        href="/ctf"
        className="inline-flex items-center gap-1 text-sm mb-6 hover:opacity-80"
        style={{ color: 'var(--text-muted)' }}
      >
        ← Back to Challenges
      </Link>

      <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Submit a Challenge
        </h1>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
          Create a CTF challenge for the community. An admin will review it before publishing.
        </p>

        {searchParams.error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {searchParams.error}
          </div>
        )}

        <form action={submitChallenge} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Title
              </label>
              <input name="title" required className="input-field w-full" placeholder="Challenge title" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Description
              </label>
              <textarea name="description" required rows={4} className="input-field w-full resize-none" placeholder="Describe the challenge, what participants need to do..." />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Category
              </label>
              <select name="category" required className="input-field w-full">
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Difficulty
              </label>
              <select name="difficulty" required className="input-field w-full">
                <option value="">Select difficulty</option>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Points
              </label>
              <input name="points" type="number" min="1" required className="input-field w-full" placeholder="e.g. 100" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Flag
              </label>
              <input name="flag" type="text" required className="input-field w-full" placeholder="FLAG{...}" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Hint (optional)
              </label>
              <input name="hint" className="input-field w-full" placeholder="A hint to help solvers" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Author (optional)
              </label>
              <input name="author" className="input-field w-full" placeholder="Your name or alias displayed on the challenge" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                External Link URL (optional)
              </label>
              <input name="link_url" className="input-field w-full" placeholder="https://..." />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                File URL (optional)
              </label>
              <input name="file_url" className="input-field w-full" placeholder="Direct download URL for attached files" />
            </div>

            <div className="col-span-2">
              <LearnLinkPicker topics={topics || []} lessons={lessons || []} />
            </div>
          </div>

          <button type="submit" className="w-full py-3 rounded-lg font-medium bg-gradient-to-r from-violet-600 to-cyan-600 text-white">
            Submit for Review
          </button>
        </form>
      </div>
    </div>
  )
}
