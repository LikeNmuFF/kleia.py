// Usage: node supabase/tests/run-private-practice.mjs <path-to-pglite-dist/index.js>
// Install @electric-sql/pglite in a temporary directory; no app dependency needed.
import { readFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { resolve, dirname } from 'node:path'

if (!process.argv[2]) throw new Error('Supply a path to the disposable PGlite module.')
const { PGlite } = await import(pathToFileURL(resolve(process.argv[2])).href)
const here = dirname(fileURLToPath(import.meta.url))
const db = new PGlite()
try {
  await db.exec(await readFile(resolve(here, 'private_practice.bootstrap.sql'), 'utf8'))
  await db.exec(await readFile(resolve(here, '../migrations/20260909150022_private_practice.sql'), 'utf8'))
  console.log('Practice migration applied to disposable PostgreSQL runtime.')
  const tests = await readFile(resolve(here, 'private_practice.sql'), 'utf8')
  await db.exec(tests)
  const result = await db.query('select (select count(*) from practice_rooms) as rooms, (select count(*) from notifications) as notifications, (select count(*) from ctf_submissions) as global_submissions')
  if (Object.values(result.rows[0]).some(value => Number(value) !== 0)) throw new Error('Fixtures did not roll back cleanly')
  console.log(`Passed ${tests.split('select pg_temp.assert_true(').length - 1} SQL assertions; fixtures and notifications rolled back.`)
} catch (error) {
  console.error(error.message)
  if (error.where) console.error(error.where)
  if (error.detail) console.error(error.detail)
  process.exitCode = 1
} finally { await db.close() }
