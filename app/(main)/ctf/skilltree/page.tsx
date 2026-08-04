import { createClient } from '@/lib/supabase/server'
import { getSkillTree, getUserSkillProgress } from '@/app/actions/skilltree'
import SkillTreeClient from './SkillTreeClient'

export default async function SkillTreePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const skillTree = await getSkillTree()
  const userProgress = user ? await getUserSkillProgress() : []

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Skill Tree
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Unlock skills by solving CTF challenges in each category
        </p>
      </div>
      <SkillTreeClient skillTree={skillTree} userProgress={userProgress} />
    </div>
  )
}