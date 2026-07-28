import { createClient } from '@/lib/supabase/server'
import NotesEditor from '@/components/study/NotesEditor'
import ProgressTracker from '@/components/study/ProgressTracker'
import PlaylistManager from '@/components/study/PlaylistManager'

export default async function StudyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: notes } = await supabase
    .from('shared_notes')
    .select('id, title, content, tags, updated_at')
    .order('updated_at', { ascending: false })

  const { data: progress } = await supabase
    .from('progress_tracking')
    .select('id, subject, hours_studied, date')
    .eq('user_id', user?.id || '')
    .order('date', { ascending: false })

  const { data: playlists } = await supabase
    .from('playlists')
    .select('id, title, url, type')
    .order('created_at', { ascending: false })

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
