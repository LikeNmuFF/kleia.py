import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('season participant registration', () => {
  it('defines a private registration queue with public insert access', () => {
    const migration = readFileSync(join(process.cwd(), 'supabase', 'migrations', '20260903010000_season_participant_registrations.sql'), 'utf8')

    expect(migration).toContain('ctf_season_registrations')
    expect(migration).toContain('create unique index')
    expect(migration).toContain('to anon')
    expect(migration).toContain('Admins can manage season registrations')
    expect(migration).toContain('enable row level security')
  })

  it('provisions accounts with a generated password without storing it', () => {
    const source = readFileSync(join(process.cwd(), 'app', 'actions', 'registrations.ts'), 'utf8')

    expect(source).toContain('submitSeasonRegistration')
    expect(source).toContain('createAccountFromRegistration')
    expect(source).toContain('getServiceClient')
    expect(source).toContain('auth.admin.createUser')
    expect(source).toContain('email_confirm: true')
    expect(source).toContain('randomBytes')
    expect(source).toContain('ctf_season_participants')
    expect(source).not.toContain('password: password')
  })

  it('closes public registration when the scheduled season start is reached', () => {
    const source = readFileSync(join(process.cwd(), 'app', 'actions', 'registrations.ts'), 'utf8')

    expect(source).toContain('isSeasonRegistrationOpen')
    expect(source).toContain("select('id, status, start_date, end_date, is_active')")
  })

  it('renders the public season registration form', () => {
    const source = readFileSync(join(process.cwd(), 'components', 'competition', 'SeasonRegistrationForm.tsx'), 'utf8')

    expect(source).toContain('submitSeasonRegistration')
    expect(source).toContain('type="email"')
    expect(source).toContain('name="username"')
    expect(source).toContain('Registration received')
  })

  it('allows unauthenticated visitors through the main layout for season pages', () => {
    const source = readFileSync(join(process.cwd(), 'app', '(main)', 'layout.tsx'), 'utf8')

    expect(source).toContain("pathname.startsWith('/ctf/seasons/')")
    expect(source).toContain('isPublicSeasonPath')
  })
})
