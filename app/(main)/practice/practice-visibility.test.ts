import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), 'utf8')

describe('private practice discovery', () => {
  it('redirects uninvited users away from the room listing', () => {
    const source = read('app', '(main)', 'practice', 'page.tsx')
    expect(source).toContain("redirect('/learn')")
    expect(source).toContain('<RoomList rooms={rooms} isAdmin={false} />')
  })

  it('only shows the Learn link when practice access is available', () => {
    const source = read('app', '(main)', 'learn', 'page.tsx')
    expect(source).toContain('getPracticeVisibility()')
    expect(source).toContain('{hasAccess &&')
  })

  it('passes the server-derived access signal into desktop and mobile navigation', () => {
    const source = read('app', '(main)', 'layout.tsx')
    expect(source).toContain('getPracticeVisibility()')
    expect(source).toContain('hasPracticeAccess={practiceVisibility.hasAccess}')
  })

  it('refreshes server navigation when a practice invitation arrives live', () => {
    const source = read('components', 'notifications', 'NotificationBell.tsx')
    expect(source).toContain("payload.new.type === 'practice_invite'")
    expect(source).toContain('router.refresh()')
  })
})
