import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const chatActionSource = readFileSync(join(process.cwd(), 'app', 'actions', 'chat.ts'), 'utf8')

describe('chat actions', () => {
  it('creates group conversations through the server-side service client so RLS does not block initial members', () => {
    const groupAction = chatActionSource.slice(
      chatActionSource.indexOf('export async function createGroupConversation'),
      chatActionSource.indexOf('export async function sendMessage')
    )

    expect(groupAction).toContain('getServiceClient()')
    expect(groupAction).toContain("svc\n    .from('conversations')")
    expect(groupAction).toContain("svc\n    .from('conversation_members')")
    expect(groupAction).not.toContain("supabase\n    .from('conversations')")
    expect(groupAction).not.toContain("supabase\n    .from('conversation_members')")
  })
})
