import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('CCO sign-up admin actions', () => {
  it('exposes PDF export and delete controls without manual status changes', () => {
    const component = readFileSync(join(process.cwd(), 'components', 'admin', 'CcoSignupsTab.tsx'), 'utf8')
    const actions = readFileSync(join(process.cwd(), 'app', 'actions', 'admin.ts'), 'utf8')

    expect(component).toContain('Export PDF')
    expect(component).toContain('exportRegistrationsPdf')
    expect(component).toContain('deleteCcoRegistration')
    expect(component).toContain('Delete CCO sign-up')
    expect(component).not.toContain('updateCcoRegistrationStatus')
    expect(component).not.toContain('<select')
    expect(actions).toContain('export async function deleteCcoRegistration')
    expect(actions).toContain(".eq('club_id', club.id)")
  })
})
