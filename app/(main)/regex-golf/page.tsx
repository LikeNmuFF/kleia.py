import type { Metadata } from 'next'
import { getActivePuzzles, getUserSolves } from '@/app/actions/regex-golf'
import RegexGolfClient from './RegexGolfClient'

export const metadata: Metadata = {
  title: 'Regex Golf',
  description: 'Write the shortest regex to match the green strings and reject the red strings.',
}

export default async function RegexGolfPage() {
  const puzzles = await getActivePuzzles()
  const solves = await getUserSolves()

  return <RegexGolfClient puzzles={puzzles} solves={solves} />
}
