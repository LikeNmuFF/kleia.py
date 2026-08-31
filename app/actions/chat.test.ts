import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const chatActionSource = readFileSync(join(process.cwd(), 'app', 'actions', 'chat.ts'), 'utf8')

describe('chat actions', () => {
  it('creates group conversations through the database RPC so RLS can add initial members atomically', () => {
    const groupAction = chatActionSource.slice(
      chatActionSource.indexOf('export async function createGroupConversation'),
      chatActionSource.indexOf('export async function sendMessage')
    )

    expect(groupAction).toContain("supabase.rpc('create_group_conversation'")
    expect(groupAction).not.toContain(".from('conversations')")
    expect(groupAction).not.toContain(".from('conversation_members')")
  })
})
