export type Project = {
  id: string
  title: string
  kicker: string
  year: string
  status: 'Live' | 'In progress' | 'Live soon'
  emoji: string
  summary: string
  stack: string[]
  liveUrl?: string
  embedUrl?: string
  poster?: string
  video?: string // looping gameplay/preview clip; falls back to poster
  ascii?: string // mono art card instead of an image
  detail: string[]
}

export const projects: Project[] = [
  {
    id: 'misemash',
    title: 'Misemash',
    kicker: 'A kitchen-ops app.',
    year: '2026',
    status: 'Live soon',
    emoji: '🍳',
    summary: 'Every recipe you’ve saved, one plan for the week, one list for the shop.',
    stack: ['Next.js', 'Claude Code', 'Higgsfield', 'Weavy'],
    poster: '/images/projects/misemash-tall.png',
    detail: [
      'Misemash turns your chaos of saved recipes into dinner you’ll actually cook. Save from anywhere, let it build your week, and walk into the shop with one tidy list.',
      'Designed, written and built by orchestrating AI — Claude Code for the product, Higgsfield for the visual pipeline. It’s the missing layer between food you pin and food you make. Mobile-first, live in 2026.',
    ],
  },
  {
    id: 'space-vibes',
    title: 'Space Vibes',
    kicker: 'A browser arcade game.',
    year: '2025',
    status: 'Live',
    emoji: '🚀',
    summary: 'Fly, collect good vibes, convert the bad ones, climb the leaderboard.',
    stack: ['Next.js', 'Claude Code', 'Vercel'],
    liveUrl: 'https://spacevibes.vercel.app/',
    embedUrl: 'https://spacevibes.vercel.app/',
    poster: '/images/projects/spacevibes-thumb.png',
    video: '/videos/space-vibes.mp4',
    detail: [
      'Pilot through space, scoop up good vibes, flip the bad vibers to your side, dodge asteroids, and fight for the top of the live leaderboard.',
      'Vibe-coded for the Good Vibes Club vibeathon via their CLI and debugged to a stable production release. Easy to start, hard to put down. Beat my score.',
    ],
  },
  {
    id: 'sir-leaps-a-lot',
    title: 'Sir Leaps-a-Lot',
    kicker: 'A macOS desktop pet with agency.',
    year: '2026',
    status: 'In progress',
    emoji: '🐈',
    summary: 'A cat that lives on your desktop, watches your windows, and leaps between them.',
    stack: ['Swift', 'AppKit', 'Claude Code'],
    ascii: String.raw`      /\_/\        *leap*
     ( o.o )
      > ^ <
   ______________
  |  window.app  |
  |______________|`,
    detail: [
      'A native macOS desktop pet — a cat that perches on your real windows, auto-jumps between them, and (next) uses the Accessibility API as its eyes.',
      'Written in Swift and AppKit, a stack I’d never touched — shipped anyway by directing Claude Code through architecture, App Nap traps and window-server quirks. That’s the point of the file.',
    ],
  },
]
