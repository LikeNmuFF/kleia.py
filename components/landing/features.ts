export interface LandingFeature {
  href: string
  icon: string
  title: string
  description: string
  color: string
}

export const landingFeatures: LandingFeature[] = [
  {
    href: '/feed',
    icon: 'newspaper',
    title: 'Feed',
    description: 'Share updates, resources, and build notes with the community.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    href: '/chat',
    icon: 'messages-square',
    title: 'Real-time Chat',
    description: 'Message friends directly or coordinate in study groups.',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    href: '/learn',
    icon: 'book-open',
    title: 'Learn',
    description: 'Work through Python and Linux lessons with XP-backed quizzes.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    href: '/ctf',
    icon: 'flag',
    title: 'CTF Challenges',
    description: 'Practice web, crypto, forensics, and misc skills in one arena.',
    color: 'from-red-500 to-rose-600',
  },
  {
    href: '/cipher',
    icon: 'key-round',
    title: 'Daily Cipher',
    description: 'Decode a fresh daily puzzle and keep your streak alive.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    href: '/regex-golf',
    icon: 'braces',
    title: 'Regex Golf',
    description: 'Beat pattern puzzles with the shortest working regex.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    href: '/ctf/skilltree',
    icon: 'network',
    title: 'Skill Tree',
    description: 'Unlock category paths as your solves stack up over time.',
    color: 'from-fuchsia-500 to-violet-600',
  },
  {
    href: '/ctf/seasons',
    icon: 'trophy',
    title: 'Monthly Seasons',
    description: 'Join themed competitions with seasonal points and rankings.',
    color: 'from-yellow-500 to-amber-600',
  },
  {
    href: '/ctf',
    icon: 'file-text',
    title: 'Writeups',
    description: 'Publish solved challenge notes and learn from other players.',
    color: 'from-sky-500 to-cyan-600',
  },
  {
    href: '/feedback',
    icon: 'message-circle-heart',
    title: 'Feedback & Reviews',
    description: 'Rate the app, report bugs, and suggest what should come next.',
    color: 'from-pink-500 to-rose-600',
  },
  {
    href: '/leaderboard/achievements',
    icon: 'award',
    title: 'Achievement Leaderboard',
    description: 'Rank overall engagement across XP, badges, solves, and reviews.',
    color: 'from-lime-500 to-emerald-600',
  },
  {
    href: '/ctf',
    icon: 'lightbulb',
    title: 'XP Hints',
    description: 'Spend XP for help when you want a nudge, not a spoiler.',
    color: 'from-indigo-500 to-violet-600',
  },
]
