'use server'

import { createClient } from '@/lib/supabase/server'
import { generateCipher } from '@/lib/utils/cipher'

export async function getTodayCipher() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  let { data: cipher } = await supabase
    .from('daily_ciphers')
    .select('*')
    .eq('date', today)
    .single()

  if (!cipher) {
    const generated = generateCipher(today)
    const { data: inserted } = await supabase
      .from('daily_ciphers')
      .insert({
        date: today,
        cipher_type: generated.cipherType,
        ciphertext: generated.ciphertext,
        plaintext_hint: 'KLEIA{...}',
        difficulty: 'easy',
        xp_reward: 25,
      })
      .select()
      .single()
    cipher = inserted
  }

  return cipher
}

export async function solveDailyCipher(cipherId: string, answer: string, timeSeconds: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: cipher } = await supabase
    .from('daily_ciphers')
    .select('*')
    .eq('id', cipherId)
    .single()

  if (!cipher) throw new Error('Cipher not found')

  const isCorrect = answer.trim().toLowerCase() === `kleia{daily_cipher_${cipher.date}}`

  if (!isCorrect) throw new Error('Incorrect answer')

  const { error } = await supabase
    .from('daily_cipher_solves')
    .insert({
      user_id: user.id,
      cipher_id: cipherId,
      time_seconds: timeSeconds,
    })

  if (error?.code === '23505') throw new Error('Already solved today')

  const { addXp } = await import('@/app/actions/gamification')
  await addXp(cipher.xp_reward, 'daily_cipher')

  return { success: true, xp: cipher.xp_reward }
}

export async function getUserCipherSolves() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('daily_cipher_solves')
    .select('cipher_id, time_seconds, created_at')
    .eq('user_id', user.id)

  return data ?? []
}