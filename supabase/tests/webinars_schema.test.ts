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

describe('phase 5a webinar schema', () => {
  it('creates the required webinar and certification tables with RLS', () => {
    const sql = readMigrations()

    for (const table of [
      'webinars',
      'webinar_registrations',
      'webinar_attendance',
      'webinar_certificates',
    ]) {
      expect(sql).toContain(`create table if not exists public.${table}`)
      expect(sql).toContain(`alter table public.${table} enable row level security`)
    }
  })

  it('models external providers, verification modes, and server-side certificate issuing', () => {
    const sql = readMigrations()

    expect(sql).toContain("provider_type text not null default 'internal'")
    expect(sql).toContain("'dict'")
    expect(sql).toContain("verification_mode text not null default 'internal_attendance'")
    expect(sql).toContain("'external_certificate'")
    expect(sql).toContain("'resource_only'")
    expect(sql).toContain('create or replace function public.issue_webinar_certificate')
    expect(sql).toContain('create or replace function public.is_webinar_staff')
  })
})
