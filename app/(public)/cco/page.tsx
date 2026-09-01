import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import CcoInvite from '@/components/clubs/CcoInvite'
import CcoJoinForm from '@/components/clubs/CcoJoinForm'
import CcoLiveCount from '@/components/clubs/CcoLiveCount'

export const metadata = {
  title: 'CCO Sign-up',
  description: 'Sign up for CCO without creating a Kleia account.',
}

export default async function CcoPage() {
  const supabase = await createClient()
  const { data: club } = await (supabase as any)
    .from('clubs')
    .select('is_recruiting')
    .eq('slug', 'cco')
    .maybeSingle()

  const isRecruiting = club?.is_recruiting !== false

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
      <CcoInvite />
      <CcoLiveCount />

      <section className="mt-5 grid gap-5 lg:grid-cols-[0.7fr_1fr] lg:items-start">
        <div className="rounded-lg border p-5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
          <p className="mb-2 text-sm font-semibold" style={{ color: 'var(--accent)' }}>No login needed</p>
          <h2 className="mb-3 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Save your spot</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Tell us your section details and we will include you in the CCO recruitment list.
          </p>
        </div>

        {isRecruiting ? (
          <CcoJoinForm />
        ) : (
          <div className="border rounded-lg p-6" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Sign-up is closed</h2>
            <p style={{ color: 'var(--text-secondary)' }}>CCO is not accepting sign-ups right now.</p>
          </div>
        )}
      </section>

      <footer className="mt-8 pb-2 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        Already part of Kleia?{' '}
        <Link href="/login" className="font-medium hover:text-violet-400 transition-colors" style={{ color: 'var(--text-secondary)' }}>
          Login to join the community
        </Link>
      </footer>
    </div>
  )
}
