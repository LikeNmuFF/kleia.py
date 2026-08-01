import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import NotesEditor from '@/components/study/NotesEditor'
import ProgressTracker from '@/components/study/ProgressTracker'
import PlaylistManager from '@/components/study/PlaylistManager'

export const metadata: Metadata = {
  title: 'Study',
  description: 'Track your study progress, take notes, and manage your learning playlists.',
}

export default async function StudyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [notesResult, progressResult, playlistsResult] = await Promise.all([
    supabase
      .from('shared_notes')
      .select('id, title, content, tags, updated_at')
      .order('updated_at', { ascending: false }),
    supabase
      .from('progress_tracking')
      .select('id, subject, hours_studied, date')
      .eq('user_id', user?.id || '')
      .order('date', { ascending: false }),
    supabase
      .from('playlists')
      .select('id, title, url, type')
      .order('created_at', { ascending: false }),
  ])

  const notes = notesResult.data
  const progress = progressResult.data
  const playlists = playlistsResult.data

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Study Tools</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Notes, progress tracking, and playlists</p>
      </div>

      {/* Tools Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <NotesEditor notes={notes || []} />
        <ProgressTracker progress={progress || []} />
      </div>

      <div className="mt-6">
        <PlaylistManager playlists={playlists || []} />
      </div>
    </div>
  )
}
