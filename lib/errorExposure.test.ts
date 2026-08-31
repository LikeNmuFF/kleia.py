import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const files = {
  cohortsRoute: readFileSync(join(process.cwd(), 'app', 'api', 'cohorts', 'route.ts'), 'utf8'),
  cohortJoinRoute: readFileSync(join(process.cwd(), 'app', 'api', 'cohorts', 'join', 'route.ts'), 'utf8'),
  newChatModal: readFileSync(join(process.cwd(), 'components', 'chat', 'NewChatModal.tsx'), 'utf8'),
  messageButton: readFileSync(join(process.cwd(), 'components', 'members', 'MessageButton.tsx'), 'utf8'),
  ctfActions: readFileSync(join(process.cwd(), 'app', 'actions', 'ctf.ts'), 'utf8'),
  postActions: readFileSync(join(process.cwd(), 'app', 'actions', 'posts.ts'), 'utf8'),
}

describe('production error exposure', () => {
  it('does not return Supabase details from cohort API routes', () => {
    expect(files.cohortsRoute).not.toContain('details:')
    expect(files.cohortsRoute).not.toContain('memErr.message')
    expect(files.cohortJoinRoute).not.toContain('findErr.message')
    expect(files.cohortJoinRoute).not.toContain('insErr.message')
  })

  it('does not show raw client-side RPC messages in chat entry points', () => {
    expect(files.newChatModal).not.toContain('setError(rpcError.message)')
    expect(files.messageButton).not.toContain('setError(rpcError.message)')
  })

  it('does not return raw database errors from server actions', () => {
    expect(files.ctfActions).not.toContain('return { error: insertError.message }')
    expect(files.ctfActions).not.toContain('return { error: linkError.message }')
    expect(files.postActions).not.toContain('return { error: tagError.message }')
    expect(files.postActions).not.toContain('return { error: countsError.message }')
  })
})
