// supabase/tests/gamification_schema.test.ts
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const migrationsDir = join(process.cwd(), 'supabase', 'migrations');

function readMigrations() {
  return readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .map((file) => readFileSync(join(migrationsDir, file), 'utf8'))
    .join('\n')
    .toLowerCase();
}

describe('gamification schema', () => {
  it('creates the seasons table', () => {
    const sql = readMigrations();
    expect(sql).toContain('create table if not exists public.seasons');
    expect(sql).toContain('alter table public.seasons enable row level security');
  });

  it('creates the badges table', () => {
    const sql = readMigrations();
    expect(sql).toContain('create table if not exists public.badges');
    expect(sql).toContain('alter table public.badges enable row level security');
  });

  it('creates the earned_badges table', () => {
    const sql = readMigrations();
    expect(sql).toContain('create table if not exists public.earned_badges');
    expect(sql).toContain('alter table public.earned_badges enable row level security');
  });

  it('adds xp and level columns to profiles', () => {
    const sql = readMigrations();
    expect(sql).toContain('alter table public.profiles add column');
    expect(sql).toContain('xp');
    expect(sql).toContain('level');
  });

  it('adds xp and level columns to practice_teams', () => {
    const sql = readMigrations();
    expect(sql).toContain('alter table public.practice_teams add column');
    expect(sql).toContain('xp');
    expect(sql).toContain('level');
  });
});