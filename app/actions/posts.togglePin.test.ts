import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const postsActionSource = readFileSync(join(process.cwd(), 'app', 'actions', 'posts.ts'), 'utf8')

describe('post pinning', () => {
  it('uses the service client for pin updates so admins can pin any post', () => {
    const togglePinSource = postsActionSource.slice(
      postsActionSource.indexOf('export async function togglePin'),
      postsActionSource.indexOf('export async function deleteComment')
    )

    expect(togglePinSource).toContain('getServiceClient()')
    expect(togglePinSource).toContain("service\n    .from('posts')")
    expect(togglePinSource).not.toContain("supabase\n    .from('posts')\n    .update({ is_pinned: newPinned })")
  })
})
