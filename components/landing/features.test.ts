import { describe, expect, it } from 'vitest'
import { landingFeatures } from './features'

describe('landingFeatures', () => {
  it('surfaces the shipped learning, challenge, and feedback features', () => {
    const titles = landingFeatures.map((feature) => feature.title)
    const hrefs = landingFeatures.map((feature) => feature.href)

    expect(titles).toEqual([
      'Feed',
      'Real-time Chat',
      'Learn',
      'CTF Challenges',
      'Daily Cipher',
      'Regex Golf',
      'Skill Tree',
      'Monthly Seasons',
      'Writeups',
      'Feedback & Reviews',
      'Achievement Leaderboard',
      'XP Hints',
    ])

    expect(hrefs).toEqual([
      '/feed',
      '/chat',
      '/learn',
      '/ctf',
      '/cipher',
      '/regex-golf',
      '/ctf/skilltree',
      '/ctf/seasons',
      '/ctf',
      '/feedback',
      '/leaderboard/achievements',
      '/ctf',
    ])
  })
})
