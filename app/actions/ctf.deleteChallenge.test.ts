import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'

const source = () => readFileSync(join(process.cwd(), 'app', 'actions', 'ctf.ts'), 'utf8')

function deleteChallengeBody() {
  const code = source()
  const start = code.indexOf('export async function deleteChallenge')
  const end = code.indexOf('export async function getChallenges')

  expect(start).toBeGreaterThanOrEqual(0)
  expect(end).toBeGreaterThan(start)

  return code.slice(start, end)
}

describe('deleteChallenge', () => {
  test('removes challenge submissions before deleting the challenge', () => {
    const body = deleteChallengeBody()

    expect(body).toContain('const service = getServiceClient()')
    expect(body).toContain(".from('ctf_submissions')")
    expect(body).toContain(".from('ctf_challenges')")

    expect(body.indexOf(".from('ctf_submissions')")).toBeLessThan(body.indexOf(".from('ctf_challenges')"))
  })
})
