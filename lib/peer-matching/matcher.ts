import type { SkillSnapshot } from '@/lib/skill-analytics/types'
import type { PeerMatchCandidate } from './types'

export function findMatches(requester: SkillSnapshot, candidates: SkillSnapshot[], skill: string): PeerMatchCandidate[] {
  return candidates.filter(c=> Array.isArray((c as unknown as { strengths: unknown }).strengths) && ((c.strengths as unknown as unknown[]) as unknown[]).some((s: unknown) => typeof s === 'string' ? s === skill : (s as { key: string }).key === skill) && c.user_id!==requester.user_id)
    .map(c=> {
      const strengths: string[] = (c.strengths as unknown as (string | { key: string })[]).map((s: unknown) => typeof s === 'string' ? s as string : (s as { key: string }).key)
      const weaknesses: string[] = (c.weaknesses as unknown as (string | { key: string })[]).map((s: unknown) => typeof s === 'string' ? s as string : (s as { key: string }).key)
      return { user_id:c.user_id, username:c.username ?? '', avatar_url:c.avatar_url, strengths, weaknesses, score: strengths.indexOf(skill) >=0 ? (4 - strengths.indexOf(skill)) : 0 }
    })
    .sort((a,b)=> b.score-a.score).slice(0,10)
}

export function getWeakestSkill(snapshot: SkillSnapshot): string | null {
  if (Array.isArray(snapshot.weaknesses) && snapshot.weaknesses.length) {
    const w = snapshot.weaknesses[0] as unknown as string | { key: string }
    return typeof w === 'string' ? w : (w as { key: string }).key ?? null
  }
  return null
}
