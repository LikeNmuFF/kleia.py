import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getTodayCipher, getUserCipherSolves } from '@/app/actions/cipher'
import CipherClient from './CipherClient'

export const metadata: Metadata = {
  title: 'Daily Cipher',
  description: 'Solve today\'s cipher challenge. Decode the ciphertext and claim your XP reward.',
}

export default async function CipherPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const cipher = await getTodayCipher()
  const solves = user ? await getUserCipherSolves() : []
  const todaySolve = solves.find(s => s.cipher_id === cipher?.id)

  return <CipherClient cipher={cipher} todaySolve={todaySolve} />
}
