import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const migrationsDir = join(process.cwd(), 'supabase', 'migrations')

function readMigrations() {
  return readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .map((file) => readFileSync(join(migrationsDir, file), 'utf8'))
    .join('\n')
}

describe('chat schema migrations', () => {
  it('creates the chat tables and direct conversation helper used by the app', () => {
    const sql = readMigrations().toLowerCase()

    expect(sql).toContain('create table if not exists public.conversations')
    expect(sql).toContain('create table if not exists public.conversation_members')
    expect(sql).toContain('create table if not exists public.messages')
    expect(sql).toContain('create or replace function public.is_conversation_member')
    expect(sql).toContain('create or replace function public.is_conversation_creator')
    expect(sql).toContain('create or replace function public.create_direct_conversation')
    expect(sql).toContain('create or replace function public.create_group_conversation')
    expect(sql).toContain('create or replace function public.prevent_message_update_except_read')
  })
})
