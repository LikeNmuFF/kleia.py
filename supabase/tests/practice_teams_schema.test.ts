import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const migrationsDir = join(process.cwd(), 'supabase', 'migrations')

function readMigrations() {
  return readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .map((file) => readFileSync(join(migrationsDir, file), 'utf8'))
    .join('\n')
    .toLowerCase()
}

describe('practice teams schema', () => {
  it('creates the four tables with the required keys, constraints, and indexes', () => {
    const sql = readMigrations()

    for (const table of [
      'practice_teams',
      'practice_team_members',
      'practice_team_activity',
      'practice_team_api_keys',
    ]) {
      expect(sql).toContain(`create table if not exists public.${table}`)
      expect(sql).toContain(`alter table public.${table} enable row level security`)
    }

    expect(sql).toContain('slug text not null unique')
    expect(sql).toContain('owner_id uuid not null references public.profiles(id) on delete cascade')
    expect(sql).toContain('is_public boolean not null default true check (is_public = true)')
    expect(sql).toContain("role text not null check (role in ('owner', 'member'))")
    expect(sql).toContain("status text not null check (status in ('pending', 'accepted'))")
    expect(sql).toContain('primary key (team_id, user_id)')
    expect(sql).toContain('unique (team_id, activity_date, source)')
    expect(sql).toContain('key_hash text not null unique')
    expect(sql).toContain('create index if not exists practice_teams_owner_id_idx')
    expect(sql).toContain('create index if not exists practice_teams_is_public_idx')
    expect(sql).toContain('create index if not exists practice_team_members_user_id_idx')
    expect(sql).toContain('create index if not exists practice_team_members_team_id_status_idx')
    expect(sql).toContain('create index if not exists practice_team_activity_team_id_activity_date_idx')
    expect(sql).toContain('create index if not exists practice_team_api_keys_team_id_idx')
  })

  it('covers public team reads, owner creation, owner/admin management, member self-reads, and safe api-key metadata access', () => {
    const sql = readMigrations()

    expect(sql).toContain('create policy "anyone can read public practice teams"')
    expect(sql).toContain('to anon, authenticated')
    expect(sql).toContain('is_public = true')
    expect(sql).toContain('create policy "authenticated users can create practice teams"')
    expect(sql).toContain('with check (owner_id = (select auth.uid()))')
    expect(sql).toContain('create policy "owners and admins can update practice teams"')
    expect(sql).toContain('with check (')
    expect(sql).toContain('is_public = true')
    expect(sql).toContain('create policy "members can read own team membership"')
    expect(sql).toContain('create policy "owners and admins can insert team members"')
    expect(sql).toContain('create policy "owners and admins can delete team members"')
    expect(sql).toContain('create policy "owners and admins can read api key metadata"')
    expect(sql).toContain('grant update (name, slug, description, avatar_url) on public.practice_teams to authenticated')
    expect(sql).not.toContain('grant update on public.practice_teams to authenticated')
    expect(sql).not.toContain('grant update (name, slug, description, avatar_url, owner_id)')
    expect(sql).toContain(
      'grant select (id, team_id, key_prefix, created_by, created_at, last_used_at, revoked_at) on public.practice_team_api_keys to authenticated'
    )
    expect(sql).not.toContain('grant select (id, team_id, key_prefix, key_hash')
  })
})
